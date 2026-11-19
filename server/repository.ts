import crypto from 'node:crypto';
import { buildCatalogFromOptions } from '../src/config/defaultCatalog';
import type {
  Acionamento,
  AcionamentoInput,
  AuditoriaEntry,
  ConfigGrupo,
  ConfigOptionInput,
  ConfigOptionUpdate,
  ConfigOption,
  Iniciativa,
  IniciativaInput,
  Report,
  ReportInput,
  WorkspaceSnapshot,
} from '../src/types/acionamento';
import {
  computeIniciativaSequence,
  computeReportSequence,
  diffAcionamentoFields,
  getNextAcionamentoReportNumber,
  getNextReportRecordNumber,
  sanitizeAcionamentoInput,
  sanitizeIniciativaInput,
  sanitizeReportInput,
  sortAcionamentosDesc,
  sortIniciativasDesc,
  sortReportsDesc,
  validateAcionamentoInput,
  validateIniciativaInput,
  validateReportInput,
} from '../src/utils/validation';
import type { AuthenticatedOperator } from './auth';
import {
  appendRow,
  batchGetRanges,
  deserializeAcionamentoRow,
  deserializeAuditoriaRow,
  deserializeConfigRow,
  deserializeIniciativaRow,
  deserializeReportRow,
  ensureCmsSpreadsheetStructure,
  serializeAcionamentoRow,
  serializeAuditoriaRow,
  serializeIniciativaRow,
  serializeReportRow,
  SHEET_TABS,
  updateRange,
} from './sheetsClient';

export class ValidationError extends Error {
  errors: Record<string, string>;
  constructor(message: string, errors: Record<string, string>) {
    super(message);
    this.errors = errors;
  }
}

export class ConflictError extends Error {
  latestRecord: Acionamento;
  constructor(message: string, latestRecord: Acionamento) {
    super(message);
    this.latestRecord = latestRecord;
  }
}

export class ReportConflictError extends Error {
  latestReport: Report;
  constructor(message: string, latestReport: Report) {
    super(message);
    this.latestReport = latestReport;
  }
}

export class NotFoundError extends Error {}

export class IniciativaConflictError extends Error {}

export interface AcionamentoRepository {
  getWorkspace(): Promise<WorkspaceSnapshot>;
  createAcionamento(
    input: AcionamentoInput,
    operator: AuthenticatedOperator
  ): Promise<{ record: Acionamento; workspace: WorkspaceSnapshot }>;
  updateAcionamento(
    id: string,
    input: AcionamentoInput,
    expectedUpdatedAt: string,
    operator: AuthenticatedOperator
  ): Promise<{ record: Acionamento; workspace: WorkspaceSnapshot }>;
  createReport(
    input: ReportInput,
    operator: AuthenticatedOperator
  ): Promise<{ record: Report; workspace: WorkspaceSnapshot }>;
  updateReport(
    id: string,
    input: ReportInput,
    expectedUpdatedAt: string,
    operator: AuthenticatedOperator
  ): Promise<{ record: Report; workspace: WorkspaceSnapshot }>;
  createIniciativa(
    input: IniciativaInput,
    operator: AuthenticatedOperator
  ): Promise<{ record: Iniciativa; workspace: WorkspaceSnapshot }>;
  updateIniciativa(
    id: string,
    input: IniciativaInput,
    expectedUpdatedAt: string,
    operator: AuthenticatedOperator
  ): Promise<{ record: Iniciativa; workspace: WorkspaceSnapshot }>;
  createConfigOption(input: ConfigOptionInput): Promise<{ workspace: WorkspaceSnapshot }>;
  updateConfigOption(
    chave: string,
    input: ConfigOptionUpdate
  ): Promise<{ workspace: WorkspaceSnapshot }>;
}

// Per-spreadsheet mutex to serialize write operations and guarantee unique REPORT numbering
const spreadsheetLocks = new Map<string, Promise<unknown>>();
const spreadsheetStructureChecks = new Map<string, Promise<void>>();
const CONFIG_GROUPS: ConfigGrupo[] = [
  'quem_acionou',
  'tipo_localidade',
  'housing_rh',
  'municipio',
  'analista',
  'tecnologia',
  'acoes_envolvidas',
  'equipe_campo',
  'material_ativos',
  'tipificacao',
];

function withSpreadsheetLock<T>(spreadsheetId: string, fn: () => Promise<T>): Promise<T> {
  const prev = spreadsheetLocks.get(spreadsheetId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  const tracked = next.catch(() => {});
  spreadsheetLocks.set(spreadsheetId, tracked);
  return next;
}

function ensureSpreadsheetStructure(spreadsheetId: string, accessToken: string): Promise<void> {
  const existingCheck = spreadsheetStructureChecks.get(spreadsheetId);
  if (existingCheck) return existingCheck;

  const check = ensureCmsSpreadsheetStructure(spreadsheetId, accessToken)
    .then(() => undefined)
    .catch((error: unknown) => {
      spreadsheetStructureChecks.delete(spreadsheetId);
      throw error;
    });
  spreadsheetStructureChecks.set(spreadsheetId, check);
  return check;
}

function validateConfigValue(
  grupo: ConfigGrupo | undefined,
  rawValue: string | undefined,
  options: ConfigOption[],
  excludeKey?: string
): string {
  if (!grupo || !CONFIG_GROUPS.includes(grupo)) {
    throw new ValidationError('Lista suspensa inválida.', { grupo: 'Selecione uma lista válida.' });
  }
  const value = (rawValue ?? '').trim();
  if (!value) {
    throw new ValidationError('Informe o valor da opção.', { valor: 'Informe um valor.' });
  }
  if (
    options.some(
      (option) =>
        option.chave !== excludeKey &&
        option.grupo === grupo &&
        option.valor.toLocaleLowerCase('pt-BR') === value.toLocaleLowerCase('pt-BR')
    )
  ) {
    throw new ValidationError('Essa opção já existe nessa lista.', {
      valor: 'Esse valor já existe nessa lista.',
    });
  }
  return value;
}

export class GoogleSheetsAcionamentoRepository implements AcionamentoRepository {
  private readonly spreadsheetId: string;
  private readonly accessToken: string;

  constructor(spreadsheetId: string, accessToken: string) {
    this.spreadsheetId = spreadsheetId;
    this.accessToken = accessToken;
  }

  private async loadRawState(): Promise<{
    rowsWithLineNumber: Array<{ rowNumber: number; record: Acionamento }>;
    reportsWithLineNumber: Array<{ rowNumber: number; record: Report }>;
    iniciativasWithLineNumber: Array<{ rowNumber: number; record: Iniciativa }>;
    configOptions: ConfigOption[];
    configOptionsWithRowNumber: Array<{ rowNumber: number; option: ConfigOption }>;
    auditoria: AuditoriaEntry[];
  }> {
    await ensureSpreadsheetStructure(this.spreadsheetId, this.accessToken);
    const ranges = [
      `${SHEET_TABS.ACIONAMENTOS}!A2:AE`,
      `${SHEET_TABS.CONFIG}!A2:E`,
      `${SHEET_TABS.AUDITORIA}!A2:G`,
      `${SHEET_TABS.REPORTS}!A2:Q`,
      `${SHEET_TABS.INICIATIVAS}!A2:Q`,
    ];
    const data = await batchGetRanges(this.spreadsheetId, ranges, this.accessToken);

    const acionamentosRows = data[ranges[0]] ?? [];
    const configRows = data[ranges[1]] ?? [];
    const auditoriaRows = data[ranges[2]] ?? [];
    const reportsRows = data[ranges[3]] ?? [];
    const iniciativasRows = data[ranges[4]] ?? [];

    const rowsWithLineNumber: Array<{ rowNumber: number; record: Acionamento }> = [];
    const reportsWithLineNumber: Array<{ rowNumber: number; record: Report }> = [];
    const iniciativasWithLineNumber: Array<{ rowNumber: number; record: Iniciativa }> = [];
    acionamentosRows.forEach((row, index) => {
      const parsed = deserializeAcionamentoRow(row);
      if (parsed) {
        rowsWithLineNumber.push({
          rowNumber: index + 2, // A2 is row 2
          record: parsed,
        });
      }
    });

    reportsRows.forEach((row, index) => {
      const parsed = deserializeReportRow(row);
      if (parsed) {
        reportsWithLineNumber.push({
          rowNumber: index + 2,
          record: parsed,
        });

        iniciativasRows.forEach((row, index) => {
          const parsed = deserializeIniciativaRow(row);
          if (parsed) {
            iniciativasWithLineNumber.push({
              rowNumber: index + 2,
              record: parsed,
            });
          }
        });
      }
    });

    const configOptions: ConfigOption[] = [];
    const configOptionsWithRowNumber: Array<{ rowNumber: number; option: ConfigOption }> = [];
    configRows.forEach((row, index) => {
      const parsed = deserializeConfigRow(row);
      if (parsed) {
        configOptions.push(parsed);
        configOptionsWithRowNumber.push({ rowNumber: index + 2, option: parsed });
      }
    });

    const auditoria: AuditoriaEntry[] = [];
    auditoriaRows.forEach((row) => {
      const parsed = deserializeAuditoriaRow(row);
      if (parsed) auditoria.push(parsed);
    });

    return {
      rowsWithLineNumber,
      reportsWithLineNumber,
      iniciativasWithLineNumber,
      configOptions,
      configOptionsWithRowNumber,
      auditoria,
    };
  }

  async getWorkspace(): Promise<WorkspaceSnapshot> {
    const { rowsWithLineNumber, reportsWithLineNumber, iniciativasWithLineNumber, configOptions, auditoria } =
      await this.loadRawState();
    const records = sortAcionamentosDesc(rowsWithLineNumber.map((r) => r.record));
    const reports = sortReportsDesc(reportsWithLineNumber.map((r) => r.record));
    const iniciativas = sortIniciativasDesc(iniciativasWithLineNumber.map((r) => r.record));
    const iniciativaSequence = computeIniciativaSequence(iniciativas);
    const { lastReportNumber } = computeReportSequence([...records, ...reports]);
    const nextReportNumber = getNextAcionamentoReportNumber(records, reports);
    const nextReportRecordNumber = getNextReportRecordNumber(records, reports);

    return {
      acionamentos: records,
      iniciativas,
      reports,
      configOptions,
      catalog: buildCatalogFromOptions(configOptions),
      auditoria: [...auditoria].sort((a, b) => b.dataHora.localeCompare(a.dataHora)),
      lastReportNumber,
      nextReportNumber,
      nextReportRecordNumber,
      lastIniciativaNumber: iniciativaSequence.lastIniciativaNumber,
      nextIniciativaNumber: iniciativaSequence.nextIniciativaNumber,
      syncedAt: new Date().toISOString(),
    };
  }

  async createAcionamento(
    rawInput: AcionamentoInput,
    operator: AuthenticatedOperator
  ): Promise<{ record: Acionamento; workspace: WorkspaceSnapshot }> {
    const sanitized = sanitizeAcionamentoInput(rawInput);
    const validation = validateAcionamentoInput(sanitized);
    if (!validation.valid) {
      throw new ValidationError('Dados inválidos no formulário de acionamento.', validation.errors);
    }

    return withSpreadsheetLock(this.spreadsheetId, async () => {
      const { rowsWithLineNumber, reportsWithLineNumber } = await this.loadRawState();
      const existingRecords = rowsWithLineNumber.map((r) => r.record);
      const existingReports = reportsWithLineNumber.map((r) => r.record);
      const nextReportNumber = getNextAcionamentoReportNumber(existingRecords, existingReports);

      const nowIso = new Date().toISOString();
      const numeroReport = sanitized.statusOperacional === 'Report' ? nextReportNumber : null;

      const newRecord: Acionamento = {
        ...sanitized,
        id: crypto.randomUUID(),
        numeroReport,
        createdAt: nowIso,
        createdByName: operator.name,
        createdByEmail: operator.email,
        updatedAt: nowIso,
        updatedByName: operator.name,
        updatedByEmail: operator.email,
      };

      const auditEntry: AuditoriaEntry = {
        idAuditoria: crypto.randomUUID(),
        dataHora: nowIso,
        idAcionamento: newRecord.id,
        tipoOperacao: 'criação',
        usuarioResponsavel: operator.name,
        emailUsuario: operator.email,
        camposAlterados:
          numeroReport !== null
            ? `Registro criado (REPORT #${numeroReport})`
            : 'Registro criado',
      };

      await appendRow(
        this.spreadsheetId,
        SHEET_TABS.ACIONAMENTOS,
        serializeAcionamentoRow(newRecord),
        this.accessToken
      );

      await appendRow(
        this.spreadsheetId,
        SHEET_TABS.AUDITORIA,
        serializeAuditoriaRow(auditEntry),
        this.accessToken
      );

      const workspace = await this.getWorkspace();
      return { record: newRecord, workspace };
    });
  }

  async updateAcionamento(
    id: string,
    rawInput: AcionamentoInput,
    expectedUpdatedAt: string,
    operator: AuthenticatedOperator
  ): Promise<{ record: Acionamento; workspace: WorkspaceSnapshot }> {
    const sanitized = sanitizeAcionamentoInput(rawInput);
    const validation = validateAcionamentoInput(sanitized);
    if (!validation.valid) {
      throw new ValidationError('Dados inválidos na edição do acionamento.', validation.errors);
    }

    return withSpreadsheetLock(this.spreadsheetId, async () => {
      const { rowsWithLineNumber, reportsWithLineNumber } = await this.loadRawState();
      const target = rowsWithLineNumber.find((r) => r.record.id === id);

      if (!target) {
        throw new NotFoundError('Acionamento não encontrado na planilha.');
      }

      const existing = target.record;
      if (expectedUpdatedAt && existing.updatedAt !== expectedUpdatedAt) {
        throw new ConflictError(
          `Este acionamento foi alterado por ${existing.updatedByName || existing.updatedByEmail} em ${existing.updatedAt}. Atualize os dados antes de salvar novamente.`,
          existing
        );
      }

      const existingRecords = rowsWithLineNumber.map((r) => r.record);
      const existingReports = reportsWithLineNumber.map((r) => r.record);
      const nextReportNumber = getNextAcionamentoReportNumber(existingRecords, existingReports);

      let numeroReport = existing.numeroReport;
      if (sanitized.statusOperacional === 'Report' && numeroReport === null) {
        numeroReport = nextReportNumber;
      }

      const changedFields = diffAcionamentoFields(existing, sanitized);
      const nowIso = new Date().toISOString();

      const updatedRecord: Acionamento = {
        ...sanitized,
        id: existing.id,
        numeroReport,
        createdAt: existing.createdAt,
        createdByName: existing.createdByName,
        createdByEmail: existing.createdByEmail,
        updatedAt: nowIso,
        updatedByName: operator.name,
        updatedByEmail: operator.email,
      };

      const rowRange = `${SHEET_TABS.ACIONAMENTOS}!A${target.rowNumber}:AD${target.rowNumber}`;
      await updateRange(
        this.spreadsheetId,
        rowRange,
        [serializeAcionamentoRow(updatedRecord)],
        this.accessToken
      );

      const auditDescription =
        changedFields.length > 0
          ? changedFields.join(', ')
          : 'Atualização sem alteração de campos';

      const auditEntry: AuditoriaEntry = {
        idAuditoria: crypto.randomUUID(),
        dataHora: nowIso,
        idAcionamento: existing.id,
        tipoOperacao: 'edição',
        usuarioResponsavel: operator.name,
        emailUsuario: operator.email,
        camposAlterados:
          existing.numeroReport === null && numeroReport !== null
            ? `${auditDescription} (Atribuído REPORT #${numeroReport})`
            : auditDescription,
      };

      await appendRow(
        this.spreadsheetId,
        SHEET_TABS.AUDITORIA,
        serializeAuditoriaRow(auditEntry),
        this.accessToken
      );

      const workspace = await this.getWorkspace();
      return { record: updatedRecord, workspace };
    });
  }

  async createReport(
    rawInput: ReportInput,
    operator: AuthenticatedOperator
  ): Promise<{ record: Report; workspace: WorkspaceSnapshot }> {
    const sanitized = sanitizeReportInput(rawInput);
    const validation = validateReportInput(sanitized);
    if (!validation.valid) {
      throw new ValidationError('Dados inválidos no formulário de Report.', validation.errors);
    }
    return withSpreadsheetLock(this.spreadsheetId, async () => {
      const { rowsWithLineNumber, reportsWithLineNumber } = await this.loadRawState();
      const existingRecords = rowsWithLineNumber.map((r) => r.record);
      const existingReports = reportsWithLineNumber.map((r) => r.record);
      const numeroReport = getNextReportRecordNumber(existingRecords, existingReports);
      const nowIso = new Date().toISOString();
      const newReport: Report = {
        ...sanitized,
        id: crypto.randomUUID(),
        numeroReport,
        createdAt: nowIso,
        createdByName: operator.name,
        createdByEmail: operator.email,
        updatedAt: nowIso,
        updatedByName: operator.name,
        updatedByEmail: operator.email,
      };

      await appendRow(
        this.spreadsheetId,
        SHEET_TABS.REPORTS,
        serializeReportRow(newReport),
        this.accessToken
      );

      const workspace = await this.getWorkspace();
      return { record: newReport, workspace };
    });
  }

  async updateReport(
    id: string,
    rawInput: ReportInput,
    expectedUpdatedAt: string,
    operator: AuthenticatedOperator
  ): Promise<{ record: Report; workspace: WorkspaceSnapshot }> {
    const sanitized = sanitizeReportInput(rawInput);
    const validation = validateReportInput(sanitized);
    if (!validation.valid) {
      throw new ValidationError('Dados inválidos na edição do Report.', validation.errors);
    }
    return withSpreadsheetLock(this.spreadsheetId, async () => {
      const { reportsWithLineNumber } = await this.loadRawState();
      const target = reportsWithLineNumber.find((r) => r.record.id === id);
      if (!target) {
        throw new NotFoundError('Report não encontrado na planilha.');
      }

      const existing = target.record;
      if (expectedUpdatedAt && existing.updatedAt !== expectedUpdatedAt) {
        throw new ReportConflictError(
          `Este Report foi alterado por ${existing.updatedByName || existing.updatedByEmail} em ${existing.updatedAt}. Atualize os dados antes de salvar novamente.`,
          existing
        );
      }

      const nowIso = new Date().toISOString();
      const updatedReport: Report = {
        ...sanitized,
        id: existing.id,
        numeroReport: existing.numeroReport,
        createdAt: existing.createdAt,
        createdByName: existing.createdByName,
        createdByEmail: existing.createdByEmail,
        updatedAt: nowIso,
        updatedByName: operator.name,
        updatedByEmail: operator.email,
      };
      await updateRange(
        this.spreadsheetId,
        `${SHEET_TABS.REPORTS}!A${target.rowNumber}:Q${target.rowNumber}`,
        [serializeReportRow(updatedReport)],
        this.accessToken
      );

      const workspace = await this.getWorkspace();
      return { record: updatedReport, workspace };
    });
  }

  async createIniciativa(
    rawInput: IniciativaInput,
    operator: AuthenticatedOperator
  ): Promise<{ record: Iniciativa; workspace: WorkspaceSnapshot }> {
    const sanitized = sanitizeIniciativaInput(rawInput);
    const validation = validateIniciativaInput(sanitized);
    if (!validation.valid) {
      throw new ValidationError('Dados inválidos no formulário de iniciativa.', validation.errors);
    }
    return withSpreadsheetLock(this.spreadsheetId, async () => {
      const { iniciativasWithLineNumber } = await this.loadRawState();
      const existing = iniciativasWithLineNumber.map((item) => item.record);
      const sequence = computeIniciativaSequence(existing);
      const nowIso = new Date().toISOString();
      const record: Iniciativa = {
        ...sanitized,
        id: crypto.randomUUID(),
        numeroIniciativa: sequence.nextIniciativaNumber,
        createdAt: nowIso,
        createdByName: operator.name,
        createdByEmail: operator.email,
        updatedAt: nowIso,
        updatedByName: operator.name,
        updatedByEmail: operator.email,
      };
      await appendRow(
        this.spreadsheetId,
        SHEET_TABS.INICIATIVAS,
        serializeIniciativaRow(record),
        this.accessToken
      );
      return { record, workspace: await this.getWorkspace() };
    });
  }

  async updateIniciativa(
    id: string,
    rawInput: IniciativaInput,
    expectedUpdatedAt: string,
    operator: AuthenticatedOperator
  ): Promise<{ record: Iniciativa; workspace: WorkspaceSnapshot }> {
    const sanitized = sanitizeIniciativaInput(rawInput);
    const validation = validateIniciativaInput(sanitized);
    if (!validation.valid) {
      throw new ValidationError('Dados inválidos na edição da iniciativa.', validation.errors);
    }
    return withSpreadsheetLock(this.spreadsheetId, async () => {
      const { iniciativasWithLineNumber } = await this.loadRawState();
      const target = iniciativasWithLineNumber.find((item) => item.record.id === id);
      if (!target) {
        throw new NotFoundError('Iniciativa não encontrada na planilha.');
      }
      if (expectedUpdatedAt && target.record.updatedAt !== expectedUpdatedAt) {
        throw new IniciativaConflictError(
          'Esta iniciativa foi alterada por outro usuário. Atualize os dados antes de salvar novamente.'
        );
      }
      const nowIso = new Date().toISOString();
      const record: Iniciativa = {
        ...sanitized,
        id: target.record.id,
        numeroIniciativa: target.record.numeroIniciativa,
        createdAt: target.record.createdAt,
        createdByName: target.record.createdByName,
        createdByEmail: target.record.createdByEmail,
        updatedAt: nowIso,
        updatedByName: operator.name,
        updatedByEmail: operator.email,
      };
      await updateRange(
        this.spreadsheetId,
        `${SHEET_TABS.INICIATIVAS}!A${target.rowNumber}:Q${target.rowNumber}`,
        [serializeIniciativaRow(record)],
        this.accessToken
      );
      return { record, workspace: await this.getWorkspace() };
    });
  }

  async createConfigOption(input: ConfigOptionInput): Promise<{ workspace: WorkspaceSnapshot }> {
    return withSpreadsheetLock(this.spreadsheetId, async () => {
      if (!input) {
        throw new ValidationError('Informe os dados da opção.', { valor: 'Informe um valor.' });
      }
      const { configOptions } = await this.loadRawState();
      const value = validateConfigValue(input.grupo, input.valor, configOptions);
      const order =
        Math.max(0, ...configOptions.filter((option) => option.grupo === input.grupo).map((option) => option.ordem)) +
        1;
      const option: ConfigOption = {
        chave: crypto.randomUUID(),
        grupo: input.grupo,
        valor: value,
        ativo: true,
        ordem: order,
      };

      await appendRow(
        this.spreadsheetId,
        SHEET_TABS.CONFIG,
        [option.chave, option.grupo, option.valor, 'SIM', String(option.ordem)],
        this.accessToken
      );
      return { workspace: await this.getWorkspace() };
    });
  }

  async updateConfigOption(
    chave: string,
    input: ConfigOptionUpdate
  ): Promise<{ workspace: WorkspaceSnapshot }> {
    return withSpreadsheetLock(this.spreadsheetId, async () => {
      const { configOptions, configOptionsWithRowNumber } = await this.loadRawState();
      const target = configOptionsWithRowNumber.find((item) => item.option.chave === chave);
      if (!target) {
        throw new NotFoundError('Opção não encontrada na planilha.');
      }

      const current = target.option;
      const value = validateConfigValue(current.grupo, input?.valor, configOptions, chave);
      if (typeof input?.ativo !== 'boolean') {
        throw new ValidationError('Estado da opção inválido.', {
          ativo: 'Informe se a opção está ativa.',
        });
      }
      if (!Number.isInteger(input?.ordem) || input.ordem < 1) {
        throw new ValidationError('Ordem da opção inválida.', {
          ordem: 'A ordem deve ser um número inteiro maior que zero.',
        });
      }

      const updated: ConfigOption = {
        ...current,
        valor: value,
        ativo: input.ativo,
        ordem: input.ordem,
      };
      await updateRange(
        this.spreadsheetId,
        `${SHEET_TABS.CONFIG}!A${target.rowNumber}:E${target.rowNumber}`,
        [[updated.chave, updated.grupo, updated.valor, updated.ativo ? 'SIM' : 'NÃO', String(updated.ordem)]],
        this.accessToken
      );
      return { workspace: await this.getWorkspace() };
    });
  }
}
