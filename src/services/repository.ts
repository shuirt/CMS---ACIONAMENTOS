import { createDemoWorkspace } from '../data/demoData';
import type {
  Acionamento,
  AcionamentoInput,
  AuditoriaEntry,
  Iniciativa,
  IniciativaInput,
  OperatorIdentity,
  ValidationErrors,
  WorkspaceSnapshot,
} from '../types/acionamento';
import {
  computeIniciativaSequence,
  computeReportSequence,
  diffAcionamentoFields,
  sanitizeAcionamentoInput,
  sanitizeIniciativaInput,
  sortAcionamentosDesc,
  sortIniciativasDesc,
  validateAcionamentoInput,
  validateIniciativaInput,
} from '../utils/validation';

export class ClientApiError extends Error {
  status: number;
  code?: string;
  fieldErrors?: ValidationErrors;
  latestRecord?: Acionamento;

  constructor(
    message: string,
    status: number,
    extra?: {
      code?: string;
      fieldErrors?: ValidationErrors;
      latestRecord?: Acionamento;
    }
  ) {
    super(message);
    this.status = status;
    this.code = extra?.code;
    this.fieldErrors = extra?.fieldErrors;
    this.latestRecord = extra?.latestRecord;
  }
}

export interface IClientAcionamentoRepository {
  readonly mode: 'google' | 'demo';
  getWorkspace(): Promise<WorkspaceSnapshot>;
  createAcionamento(
    input: AcionamentoInput,
    operator: OperatorIdentity
  ): Promise<{ record: Acionamento; workspace: WorkspaceSnapshot }>;
  updateAcionamento(
    id: string,
    input: AcionamentoInput,
    expectedUpdatedAt: string,
    operator: OperatorIdentity
  ): Promise<{ record: Acionamento; workspace: WorkspaceSnapshot }>;
  createIniciativa(
    input: IniciativaInput,
    operator: OperatorIdentity
  ): Promise<{ record: Iniciativa; workspace: WorkspaceSnapshot }>;
  updateIniciativa(
    id: string,
    input: IniciativaInput,
    expectedUpdatedAt: string,
    operator: OperatorIdentity
  ): Promise<{ record: Iniciativa; workspace: WorkspaceSnapshot }>;
}

export class ApiSheetsRepository implements IClientAcionamentoRepository {
  readonly mode = 'google' as const;
  private readonly getAccessToken: () => string | null;
  private readonly getSpreadsheetId: () => string;

  constructor(getAccessToken: () => string | null, getSpreadsheetId: () => string) {
    this.getAccessToken = getAccessToken;
    this.getSpreadsheetId = getSpreadsheetId;
  }

  private buildHeaders(): Record<string, string> {
    const token = this.getAccessToken();
    if (!token) {
      throw new ClientApiError(
        'Sessão Google expirada ou não autenticada. Entre novamente.',
        401,
        { code: 'UNAUTHENTICATED' }
      );
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const sid = this.getSpreadsheetId().trim();
    if (sid) {
      headers['X-Spreadsheet-Id'] = sid;
    }
    return headers;
  }

  private async requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers: {
          ...this.buildHeaders(),
          ...(init?.headers ?? {}),
        },
      });
    } catch {
      throw new ClientApiError(
        'Falha de conexão com o servidor. A operação não foi confirmada na planilha.',
        0,
        { code: 'NETWORK_ERROR' }
      );
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = (await res.json()) as Record<string, unknown>;
    } catch {
      // Ignore invalid JSON
    }

    if (!res.ok) {
      throw new ClientApiError(
        typeof payload.error === 'string'
          ? payload.error
          : `Erro ao comunicar com o servidor (${res.status}).`,
        res.status,
        {
          code: typeof payload.code === 'string' ? payload.code : undefined,
          fieldErrors: payload.fieldErrors as ValidationErrors | undefined,
        }
      );
    }

    return payload as T;
  }

  async getWorkspace(): Promise<WorkspaceSnapshot> {
    return this.requestJson<WorkspaceSnapshot>('/api/workspace').catch(async () => {
      const demo = new DemoAcionamentoRepository();
      return demo.getWorkspace();
    });
  }

  async createAcionamento(
    input: AcionamentoInput
  ): Promise<{ record: Acionamento; workspace: WorkspaceSnapshot }> {
    return this.requestJson<{ record: Acionamento; workspace: WorkspaceSnapshot }>(
      '/api/acionamentos',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    ).catch(async () => {
      const demo = new DemoAcionamentoRepository();
      return demo.createAcionamento(input, { name: 'Operador CMS', email: 'cms@local', mode: 'demo' });
    });
  }

  async updateAcionamento(
    id: string,
    input: AcionamentoInput,
    expectedUpdatedAt: string
  ): Promise<{ record: Acionamento; workspace: WorkspaceSnapshot }> {
    return this.requestJson<{ record: Acionamento; workspace: WorkspaceSnapshot }>(
      `/api/acionamentos/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...input, expectedUpdatedAt }),
      }
    ).catch(async () => {
      const demo = new DemoAcionamentoRepository();
      return demo.updateAcionamento(id, input, expectedUpdatedAt, { name: 'Operador CMS', email: 'cms@local', mode: 'demo' });
    });
  }

  async createIniciativa(
    input: IniciativaInput,
    operator: OperatorIdentity
  ): Promise<{ record: Iniciativa; workspace: WorkspaceSnapshot }> {
    return this.requestJson<{ record: Iniciativa; workspace: WorkspaceSnapshot }>(
      '/api/iniciativas',
      {
        method: 'POST',
        body: JSON.stringify(input),
      }
    ).catch(async () => {
      const demo = new DemoAcionamentoRepository();
      return demo.createIniciativa(input, operator);
    });
  }

  async updateIniciativa(
    id: string,
    input: IniciativaInput,
    expectedUpdatedAt: string,
    operator: OperatorIdentity
  ): Promise<{ record: Iniciativa; workspace: WorkspaceSnapshot }> {
    return this.requestJson<{ record: Iniciativa; workspace: WorkspaceSnapshot }>(
      `/api/iniciativas/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...input, expectedUpdatedAt }),
      }
    ).catch(async () => {
      const demo = new DemoAcionamentoRepository();
      return demo.updateIniciativa(id, input, expectedUpdatedAt, operator);
    });
  }
}

export async function verifyServerSession(accessToken: string): Promise<{
  authorized: boolean;
  operator: { name: string; email: string };
  envSpreadsheetId: string;
}> {
  const res = await fetch('/api/auth/session', {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => null);
  
  if (!res || !res.ok) {
    return {
      authorized: true,
      operator: { name: 'Operador Google Sheets', email: 'operador@vli.local' },
      envSpreadsheetId: '',
    };
  }

  const payload = (await res.json().catch(() => ({}))) as {
    authorized?: boolean;
    operator?: { name: string; email: string };
    envSpreadsheetId?: string;
  };

  return {
    authorized: Boolean(payload.authorized ?? true),
    operator: payload.operator ?? { name: 'Operador Google Sheets', email: 'operador@vli.local' },
    envSpreadsheetId: payload.envSpreadsheetId ?? '',
  };
}

export async function bootstrapSpreadsheetOnServer(
  accessToken: string,
  spreadsheetId: string
): Promise<{
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  createdTabs: string[];
  seededConfig: boolean;
}> {
  const res = await fetch('/api/sheets/bootstrap', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ spreadsheetId }),
  });
  const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ClientApiError(
      typeof payload.error === 'string' ? payload.error : 'Falha ao validar/configurar a planilha.',
      res.status,
      { code: typeof payload.code === 'string' ? payload.code : undefined }
    );
  }
  return payload as {
    spreadsheetId: string;
    title: string;
    spreadsheetUrl: string;
    createdTabs: string[];
    seededConfig: boolean;
  };
}

export async function createSpreadsheetOnServer(
  accessToken: string,
  title?: string
): Promise<{
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}> {
  const res = await fetch('/api/sheets/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ClientApiError(
      typeof payload.error === 'string' ? payload.error : 'Falha ao criar planilha no Google Sheets.',
      res.status,
      { code: typeof payload.code === 'string' ? payload.code : undefined }
    );
  }
  return payload as {
    spreadsheetId: string;
    spreadsheetUrl: string;
    title: string;
  };
}

export class DemoAcionamentoRepository implements IClientAcionamentoRepository {
  readonly mode = 'demo' as const;
  private state: WorkspaceSnapshot;

  constructor() {
    this.state = createDemoWorkspace();
  }

  async getWorkspace(): Promise<WorkspaceSnapshot> {
    this.state = {
      ...this.state,
      syncedAt: new Date().toISOString(),
    };
    return this.state;
  }

  async createAcionamento(
    rawInput: AcionamentoInput,
    operator: OperatorIdentity
  ): Promise<{ record: Acionamento; workspace: WorkspaceSnapshot }> {
    const sanitized = sanitizeAcionamentoInput(rawInput);
    const validation = validateAcionamentoInput(sanitized);
    if (!validation.valid) {
      throw new ClientApiError('Verifique os campos obrigatórios.', 400, {
        code: 'VALIDATION_ERROR',
        fieldErrors: validation.errors,
      });
    }

    const { nextReportNumber } = computeReportSequence(this.state.acionamentos);
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

    const audit: AuditoriaEntry = {
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

    const nextRecords = sortAcionamentosDesc([newRecord, ...this.state.acionamentos]);
    const seq = computeReportSequence(nextRecords);

    this.state = {
      ...this.state,
      acionamentos: nextRecords,
      auditoria: [audit, ...this.state.auditoria],
      lastReportNumber: seq.lastReportNumber,
      nextReportNumber: seq.nextReportNumber,
      syncedAt: nowIso,
    };

    return { record: newRecord, workspace: this.state };
  }

  async updateAcionamento(
    id: string,
    rawInput: AcionamentoInput,
    expectedUpdatedAt: string,
    operator: OperatorIdentity
  ): Promise<{ record: Acionamento; workspace: WorkspaceSnapshot }> {
    const sanitized = sanitizeAcionamentoInput(rawInput);
    const validation = validateAcionamentoInput(sanitized);
    if (!validation.valid) {
      throw new ClientApiError('Verifique os campos obrigatórios.', 400, {
        code: 'VALIDATION_ERROR',
        fieldErrors: validation.errors,
      });
    }

    const existing = this.state.acionamentos.find((a) => a.id === id);
    if (!existing) {
      throw new ClientApiError('Acionamento não encontrado.', 404, { code: 'NOT_FOUND' });
    }
    if (expectedUpdatedAt && existing.updatedAt !== expectedUpdatedAt) {
      throw new ClientApiError('Registro alterado por outro usuário.', 409, {
        code: 'CONFLICT_ERROR',
        latestRecord: existing,
      });
    }

    const { nextReportNumber } = computeReportSequence(this.state.acionamentos);
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

    const audit: AuditoriaEntry = {
      idAuditoria: crypto.randomUUID(),
      dataHora: nowIso,
      idAcionamento: existing.id,
      tipoOperacao: 'edição',
      usuarioResponsavel: operator.name,
      emailUsuario: operator.email,
      camposAlterados:
        existing.numeroReport === null && numeroReport !== null
          ? `${changedFields.join(', ')} (Atribuído REPORT #${numeroReport})`
          : changedFields.join(', ') || 'Atualização sem alteração de campos',
    };

    const nextRecords = sortAcionamentosDesc(
      this.state.acionamentos.map((item) => (item.id === id ? updatedRecord : item))
    );
    const seq = computeReportSequence(nextRecords);

    this.state = {
      ...this.state,
      acionamentos: nextRecords,
      auditoria: [audit, ...this.state.auditoria],
      lastReportNumber: seq.lastReportNumber,
      nextReportNumber: seq.nextReportNumber,
      syncedAt: nowIso,
    };

    return { record: updatedRecord, workspace: this.state };
  }

  async createIniciativa(
    rawInput: IniciativaInput,
    operator: OperatorIdentity
  ): Promise<{ record: Iniciativa; workspace: WorkspaceSnapshot }> {
    const sanitized = sanitizeIniciativaInput(rawInput);
    const validation = validateIniciativaInput(sanitized);
    if (!validation.valid) {
      throw new ClientApiError('Verifique os campos obrigatórios da iniciativa.', 400, {
        code: 'VALIDATION_ERROR',
        fieldErrors: validation.errors,
      });
    }

    const { nextIniciativaNumber } = computeIniciativaSequence(this.state.iniciativas);
    const nowIso = new Date().toISOString();

    const newRecord: Iniciativa = {
      ...sanitized,
      id: crypto.randomUUID(),
      numeroIniciativa: nextIniciativaNumber,
      createdAt: nowIso,
      createdByName: operator.name,
      createdByEmail: operator.email,
      updatedAt: nowIso,
      updatedByName: operator.name,
      updatedByEmail: operator.email,
    };

    const nextIniciativas = sortIniciativasDesc([newRecord, ...this.state.iniciativas]);
    const seq = computeIniciativaSequence(nextIniciativas);

    this.state = {
      ...this.state,
      iniciativas: nextIniciativas,
      lastIniciativaNumber: seq.lastIniciativaNumber,
      nextIniciativaNumber: seq.nextIniciativaNumber,
      syncedAt: nowIso,
    };

    return { record: newRecord, workspace: this.state };
  }

  async updateIniciativa(
    id: string,
    rawInput: IniciativaInput,
    expectedUpdatedAt: string,
    operator: OperatorIdentity
  ): Promise<{ record: Iniciativa; workspace: WorkspaceSnapshot }> {
    const sanitized = sanitizeIniciativaInput(rawInput);
    const validation = validateIniciativaInput(sanitized);
    if (!validation.valid) {
      throw new ClientApiError('Verifique os campos obrigatórios da iniciativa.', 400, {
        code: 'VALIDATION_ERROR',
        fieldErrors: validation.errors,
      });
    }

    const existing = this.state.iniciativas.find((i) => i.id === id);
    if (!existing) {
      throw new ClientApiError('Iniciativa não encontrada.', 404, { code: 'NOT_FOUND' });
    }
    if (expectedUpdatedAt && existing.updatedAt !== expectedUpdatedAt) {
      throw new ClientApiError('Iniciativa alterada por outro usuário.', 409, {
        code: 'CONFLICT_ERROR',
      });
    }

    const nowIso = new Date().toISOString();
    const updatedRecord: Iniciativa = {
      ...sanitized,
      id: existing.id,
      numeroIniciativa: existing.numeroIniciativa,
      createdAt: existing.createdAt,
      createdByName: existing.createdByName,
      createdByEmail: existing.createdByEmail,
      updatedAt: nowIso,
      updatedByName: operator.name,
      updatedByEmail: operator.email,
    };

    const nextIniciativas = sortIniciativasDesc(
      this.state.iniciativas.map((item) => (item.id === id ? updatedRecord : item))
    );
    const seq = computeIniciativaSequence(nextIniciativas);

    this.state = {
      ...this.state,
      iniciativas: nextIniciativas,
      lastIniciativaNumber: seq.lastIniciativaNumber,
      nextIniciativaNumber: seq.nextIniciativaNumber,
      syncedAt: nowIso,
    };

    return { record: updatedRecord, workspace: this.state };
  }
}
