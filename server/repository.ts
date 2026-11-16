import crypto from 'node:crypto';
import { buildCatalogFromOptions } from '../src/config/defaultCatalog';
import type {
  Acionamento,
  AcionamentoInput,
  AuditoriaEntry,
  ConfigOption,
  WorkspaceSnapshot,
} from '../src/types/acionamento';
import {
  computeReportSequence,
  diffAcionamentoFields,
  sanitizeAcionamentoInput,
  sortAcionamentosDesc,
  validateAcionamentoInput,
} from '../src/utils/validation';
import type { AuthenticatedOperator } from './auth';
import {
  appendRow,
  batchGetRanges,
  deserializeAcionamentoRow,
  deserializeAuditoriaRow,
  deserializeConfigRow,
  serializeAcionamentoRow,
  serializeAuditoriaRow,
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

export class NotFoundError extends Error {}

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
}

// Per-spreadsheet mutex to serialize write operations and guarantee unique REPORT numbering
const spreadsheetLocks = new Map<string, Promise<unknown>>();

function withSpreadsheetLock<T>(spreadsheetId: string, fn: () => Promise<T>): Promise<T> {
  const prev = spreadsheetLocks.get(spreadsheetId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  const tracked = next.catch(() => {});
  spreadsheetLocks.set(spreadsheetId, tracked);
  return next;
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
    configOptions: ConfigOption[];
    auditoria: AuditoriaEntry[];
  }> {
    const ranges = [
      `${SHEET_TABS.ACIONAMENTOS}!A2:AD`,
      `${SHEET_TABS.CONFIG}!A2:E`,
      `${SHEET_TABS.AUDITORIA}!A2:G`,
    ];
    const data = await batchGetRanges(this.spreadsheetId, ranges, this.accessToken);

    const acionamentosRows = data[ranges[0]] ?? [];
    const configRows = data[ranges[1]] ?? [];
    const auditoriaRows = data[ranges[2]] ?? [];

    const rowsWithLineNumber: Array<{ rowNumber: number; record: Acionamento }> = [];
    acionamentosRows.forEach((row, index) => {
      const parsed = deserializeAcionamentoRow(row);
      if (parsed) {
        rowsWithLineNumber.push({
          rowNumber: index + 2, // A2 is row 2
          record: parsed,
        });
      }
    });

    const configOptions: ConfigOption[] = [];
    configRows.forEach((row) => {
      const parsed = deserializeConfigRow(row);
      if (parsed) configOptions.push(parsed);
    });

    const auditoria: AuditoriaEntry[] = [];
    auditoriaRows.forEach((row) => {
      const parsed = deserializeAuditoriaRow(row);
      if (parsed) auditoria.push(parsed);
    });

    return { rowsWithLineNumber, configOptions, auditoria };
  }

  async getWorkspace(): Promise<WorkspaceSnapshot> {
    const { rowsWithLineNumber, configOptions, auditoria } = await this.loadRawState();
    const records = sortAcionamentosDesc(rowsWithLineNumber.map((r) => r.record));
    const { lastReportNumber, nextReportNumber } = computeReportSequence(records);

    return {
      acionamentos: records,
      iniciativas: [],
      catalog: buildCatalogFromOptions(configOptions),
      auditoria: [...auditoria].sort((a, b) => b.dataHora.localeCompare(a.dataHora)),
      lastReportNumber,
      nextReportNumber,
      lastIniciativaNumber: 0,
      nextIniciativaNumber: 1,
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
      const { rowsWithLineNumber } = await this.loadRawState();
      const existingRecords = rowsWithLineNumber.map((r) => r.record);
      const { nextReportNumber } = computeReportSequence(existingRecords);

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
      const { rowsWithLineNumber } = await this.loadRawState();
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
      const { nextReportNumber } = computeReportSequence(existingRecords);

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
}
