import {
  INITIAL_CONFIG_OPTIONS,
  synchronizeEquipeCampoOptions,
} from '../src/config/defaultCatalog';
import type {
  Acionamento,
  AuditoriaEntry,
  ConfigGrupo,
  ConfigOption,
  Report,
  StatusOperacional,
  TipoLocalidade,
} from '../src/types/acionamento';

export const SHEET_TABS = {
  ACIONAMENTOS: 'Acionamentos',
  CONFIG: 'Config',
  AUDITORIA: 'Auditoria',
  REPORTS: 'Reports',
} as const;

export const ACIONAMENTOS_HEADERS = [
  'ID',
  'Número REPORT',
  'Data do registro',
  'Horário do acionamento',
  'Horário do acionamento da equipe',
  'Horário da chegada em campo',
  'Horário de saída do local',
  'Quem acionou',
  'Tipo de localidade',
  'KM ferroviário',
  'Housing / RH',
  'Município',
  'Analista responsável',
  'Descrição e cronologia',
  'Tecnologia empregada',
  'Tecnologia utilizada',
  'Ações envolvidas',
  'Equipe de campo',
  'Material / Ativos envolvidos',
  'Tipificação',
  'INC',
  'Status operacional',
  'Data de criação',
  'Operador que criou',
  'E-mail de quem criou',
  'Data da última atualização',
  'Operador que atualizou',
  'E-mail de quem atualizou',
  'Vigilante(s)',
  'Data fim',
  'Nome do pátio/estação',
];

export const CONFIG_HEADERS = ['Chave', 'Grupo', 'Valor', 'Ativo', 'Ordem de exibição'];

export const AUDITORIA_HEADERS = [
  'ID da auditoria',
  'Data e hora',
  'ID do acionamento',
  'Tipo de operação',
  'Usuário responsável',
  'E-mail do usuário',
  'Campos alterados',
];

export const REPORTS_HEADERS = [
  'ID',
  'Número do Report',
  'INC',
  'Descrição',
  'Tipificação',
  'Município',
  'Tipo de localidade',
  'KM ferroviário',
  'Data de criação',
  'Operador que criou',
  'E-mail de quem criou',
  'Data da última atualização',
  'Operador que atualizou',
  'E-mail de quem atualizou',
  'Data',
  'Horário',
  'Analista responsável',
];

export function serializeAcionamentoRow(item: Acionamento): string[] {
  return [
    item.id,
    item.numeroReport !== null ? String(item.numeroReport) : '',
    item.dataRegistro,
    item.horarioAcionamento,
    item.horarioEquipeAcionada,
    item.horarioChegadaCampo,
    item.horarioNormalizacao,
    item.quemAcionou,
    item.tipoLocalidade,
    item.kmFerroviario,
    item.housingRh,
    item.municipio,
    item.analistaResponsavel,
    item.descricaoCronologia,
    item.tecnologiaEmpregada ? 'SIM' : 'NÃO',
    item.tecnologiaUtilizada,
    item.acoesEnvolvidas.join('; '),
    item.equipeCampo,
    item.materialAtivos,
    item.tipificacao,
    item.inc,
    item.statusOperacional,
    item.createdAt,
    item.createdByName,
    item.createdByEmail,
    item.updatedAt,
    item.updatedByName,
    item.updatedByEmail,
    item.vigilantes,
    item.dataFim,
    item.nomeLocalidade,
  ];
}

export function deserializeAcionamentoRow(row: string[]): Acionamento | null {
  const id = (row[0] ?? '').trim();
  if (!id) return null;

  const reportRaw = (row[1] ?? '').trim();
  const parsedReport = reportRaw ? Number(reportRaw) : null;
  const numeroReport =
    parsedReport !== null && Number.isFinite(parsedReport) && parsedReport > 0
      ? parsedReport
      : null;

  const techRaw = (row[14] ?? '').trim().toUpperCase();
  const tecnologiaEmpregada = techRaw === 'SIM' || techRaw === 'TRUE' || techRaw === '1';

  const acoesRaw = (row[16] ?? '').trim();
  const acoesEnvolvidas = acoesRaw
    ? acoesRaw
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return {
    id,
    numeroReport,
    dataRegistro: (row[2] ?? '').trim(),
    dataFim: (row[29] ?? '').trim(),
    nomeLocalidade: (row[30] ?? '').trim(),
    horarioAcionamento: (row[3] ?? '').trim(),
    horarioEquipeAcionada: (row[4] ?? '').trim(),
    horarioChegadaCampo: (row[5] ?? '').trim(),
    horarioNormalizacao: (row[6] ?? '').trim(),
    quemAcionou: (row[7] ?? '').trim(),
    tipoLocalidade: ((row[8] ?? '').trim() || 'Linha Férrea') as TipoLocalidade,
    kmFerroviario: (row[9] ?? '').trim(),
    housingRh: (row[10] ?? '').trim(),
    municipio: (row[11] ?? '').trim(),
    analistaResponsavel: (row[12] ?? '').trim(),
    descricaoCronologia: row[13] ?? '',
    tecnologiaEmpregada,
    tecnologiaUtilizada: tecnologiaEmpregada ? (row[15] ?? '').trim() : '',
    acoesEnvolvidas,
    equipeCampo: (row[17] ?? '').trim(),
    vigilantes: (row[28] ?? '').trim(),
    materialAtivos: (row[18] ?? '').trim(),
    tipificacao: (row[19] ?? '').trim(),
    inc: (row[20] ?? '').trim(),
    statusOperacional: ((row[21] ?? '').trim() || 'Em andamento') as StatusOperacional,
    createdAt: (row[22] ?? '').trim(),
    createdByName: (row[23] ?? '').trim(),
    createdByEmail: (row[24] ?? '').trim(),
    updatedAt: (row[25] ?? '').trim(),
    updatedByName: (row[26] ?? '').trim(),
    updatedByEmail: (row[27] ?? '').trim(),
  };
}

export function serializeReportRow(item: Report): string[] {
  return [
    item.id,
    String(item.numeroReport),
    item.inc,
    item.descricao,
    item.tipificacao,
    item.municipio,
    item.tipoLocalidade,
    item.kmFerroviario,
    item.createdAt,
    item.createdByName,
    item.createdByEmail,
    item.updatedAt,
    item.updatedByName,
    item.updatedByEmail,
    item.dataRegistro,
    item.horario,
    item.analistaResponsavel,
  ];
}

export function deserializeReportRow(row: string[]): Report | null {
  const id = (row[0] ?? '').trim();
  const numeroReport = Number((row[1] ?? '').trim());
  if (!id || !Number.isInteger(numeroReport) || numeroReport <= 0) return null;

  return {
    id,
    numeroReport,
    inc: (row[2] ?? '').trim(),
    descricao: row[3] ?? '',
    tipificacao: (row[4] ?? '').trim(),
    municipio: (row[5] ?? '').trim(),
    tipoLocalidade: ((row[6] ?? '').trim() || 'Linha Férrea') as TipoLocalidade,
    kmFerroviario: (row[7] ?? '').trim(),
    createdAt: (row[8] ?? '').trim(),
    createdByName: (row[9] ?? '').trim(),
    createdByEmail: (row[10] ?? '').trim(),
    updatedAt: (row[11] ?? '').trim(),
    updatedByName: (row[12] ?? '').trim(),
    updatedByEmail: (row[13] ?? '').trim(),
    dataRegistro: (row[14] ?? '').trim(),
    horario: (row[15] ?? '').trim(),
    analistaResponsavel: (row[16] ?? '').trim(),
  };
}

export function serializeConfigRow(opt: ConfigOption): string[] {
  return [
    opt.chave,
    opt.grupo,
    opt.valor,
    opt.ativo ? 'SIM' : 'NÃO',
    String(opt.ordem),
  ];
}

export function deserializeConfigRow(row: string[]): ConfigOption | null {
  const chave = (row[0] ?? '').trim();
  const grupo = (row[1] ?? '').trim() as ConfigGrupo;
  const valor = (row[2] ?? '').trim();
  if (!grupo || !valor) return null;

  const ativoRaw = (row[3] ?? 'SIM').trim().toUpperCase();
  const ativo = ativoRaw !== 'NÃO' && ativoRaw !== 'NAO' && ativoRaw !== 'FALSE' && ativoRaw !== '0';
  const ordem = Number(row[4] ?? '999');

  return {
    chave: chave || `${grupo}_${valor}`,
    grupo,
    valor,
    ativo,
    ordem: Number.isFinite(ordem) ? ordem : 999,
  };
}

export function serializeAuditoriaRow(entry: AuditoriaEntry): string[] {
  return [
    entry.idAuditoria,
    entry.dataHora,
    entry.idAcionamento,
    entry.tipoOperacao,
    entry.usuarioResponsavel,
    entry.emailUsuario,
    entry.camposAlterados,
  ];
}

export function deserializeAuditoriaRow(row: string[]): AuditoriaEntry | null {
  const idAuditoria = (row[0] ?? '').trim();
  if (!idAuditoria) return null;
  return {
    idAuditoria,
    dataHora: (row[1] ?? '').trim(),
    idAcionamento: (row[2] ?? '').trim(),
    tipoOperacao: ((row[3] ?? '').trim() === 'edição' ? 'edição' : 'criação'),
    usuarioResponsavel: (row[4] ?? '').trim(),
    emailUsuario: (row[5] ?? '').trim(),
    camposAlterados: (row[6] ?? '').trim(),
  };
}

export class SheetsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

async function sheetsFetch<T>(
  url: string,
  accessToken: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let msg = `Erro na API Google Sheets (${res.status})`;
    try {
      const payload = (await res.json()) as { error?: { message?: string } };
      if (payload?.error?.message) {
        msg = payload.error.message;
      }
    } catch {
      // Ignore parse error
    }
    throw new SheetsApiError(msg, res.status);
  }

  return (await res.json()) as T;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  properties: { title: string };
  sheets: Array<{ properties: { sheetId: number; title: string } }>;
}

export async function getSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetMetadata> {
  return sheetsFetch<SpreadsheetMetadata>(
    `${BASE_URL}/${encodeURIComponent(spreadsheetId)}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties(sheetId,title)`,
    accessToken
  );
}

export async function batchGetRanges(
  spreadsheetId: string,
  ranges: string[],
  accessToken: string
): Promise<Record<string, string[][]>> {
  const query = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');
  const data = await sheetsFetch<{
    valueRanges?: Array<{ range: string; values?: string[][] }>;
  }>(`${BASE_URL}/${encodeURIComponent(spreadsheetId)}/values:batchGet?${query}`, accessToken);

  const result: Record<string, string[][]> = {};
  ranges.forEach((reqRange, idx) => {
    const vr = data.valueRanges?.[idx];
    result[reqRange] = vr?.values ?? [];
  });
  return result;
}

export async function appendRow(
  spreadsheetId: string,
  tabName: string,
  row: string[],
  accessToken: string
): Promise<void> {
  const range = `${tabName}!A:AD`;
  await sheetsFetch(
    `${BASE_URL}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ values: [row] }),
    }
  );
}

export async function updateRange(
  spreadsheetId: string,
  range: string,
  values: string[][],
  accessToken: string
): Promise<void> {
  await sheetsFetch(
    `${BASE_URL}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({ values }),
    }
  );
}

export async function createCmsSpreadsheet(
  accessToken: string,
  title = 'Central de Acionamentos — CMS'
): Promise<SpreadsheetMetadata> {
  const created = await sheetsFetch<SpreadsheetMetadata>(BASE_URL, accessToken, {
    method: 'POST',
    body: JSON.stringify({
      properties: { title, locale: 'pt_BR' },
      sheets: [
        { properties: { title: SHEET_TABS.ACIONAMENTOS } },
        { properties: { title: SHEET_TABS.CONFIG } },
        { properties: { title: SHEET_TABS.AUDITORIA } },
        { properties: { title: SHEET_TABS.REPORTS } },
      ],
    }),
  });

  await seedMissingHeadersAndConfig(created.spreadsheetId, accessToken);
  return created;
}

export async function ensureCmsSpreadsheetStructure(
  spreadsheetId: string,
  accessToken: string
): Promise<{
  title: string;
  spreadsheetUrl: string;
  createdTabs: string[];
  seededConfig: boolean;
}> {
  const meta = await getSpreadsheetMetadata(spreadsheetId, accessToken);
  const existingTitles = new Set(meta.sheets.map((s) => s.properties.title));
  const requiredTabs = [
    SHEET_TABS.ACIONAMENTOS,
    SHEET_TABS.CONFIG,
    SHEET_TABS.AUDITORIA,
    SHEET_TABS.REPORTS,
  ];
  const missingTabs = requiredTabs.filter((t) => !existingTitles.has(t));

  if (missingTabs.length > 0) {
    await sheetsFetch(`${BASE_URL}/${encodeURIComponent(spreadsheetId)}:batchUpdate`, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        requests: missingTabs.map((title) => ({
          addSheet: { properties: { title } },
        })),
      }),
    });
  }

  const seededConfig = await seedMissingHeadersAndConfig(spreadsheetId, accessToken);
  return {
    title: meta.properties.title,
    spreadsheetUrl: meta.spreadsheetUrl,
    createdTabs: missingTabs,
    seededConfig,
  };
}

async function seedMissingHeadersAndConfig(
  spreadsheetId: string,
  accessToken: string
): Promise<boolean> {
  const ranges = [
    `${SHEET_TABS.ACIONAMENTOS}!A1:AE1`,
    `${SHEET_TABS.CONFIG}!A1:E`,
    `${SHEET_TABS.AUDITORIA}!A1:G1`,
    `${SHEET_TABS.REPORTS}!A1:Q1`,
  ];
  const existing = await batchGetRanges(spreadsheetId, ranges, accessToken);

  const existingHeaderRow = existing[ranges[0]]?.[0] ?? [];
  if (existingHeaderRow.length === 0) {
    await updateRange(spreadsheetId, `${SHEET_TABS.ACIONAMENTOS}!A1:AE1`, [ACIONAMENTOS_HEADERS], accessToken);
  } else if (existingHeaderRow.length === 28) {
    await updateRange(spreadsheetId, `${SHEET_TABS.ACIONAMENTOS}!AC1:AD1`, [['Vigilante(s)', 'Data fim']], accessToken);
  } else if (existingHeaderRow.length === 29 && !(existingHeaderRow[29] ?? '').trim()) {
    await updateRange(spreadsheetId, `${SHEET_TABS.ACIONAMENTOS}!AD1:AD1`, [['Data fim']], accessToken);
  }
  if (existingHeaderRow.length > 0 && existingHeaderRow.length <= 30) {
    await updateRange(
      spreadsheetId,
      `${SHEET_TABS.ACIONAMENTOS}!AE1:AE1`,
      [['Nome do pátio/estação']],
      accessToken
    );
  }

  let seededConfig = false;
  const configRows = existing[ranges[1]] ?? [];
  if (configRows.length === 0) {
    const allConfigRows = [
      CONFIG_HEADERS,
      ...INITIAL_CONFIG_OPTIONS.map(serializeConfigRow),
    ];
    await updateRange(
      spreadsheetId,
      `${SHEET_TABS.CONFIG}!A1:E${allConfigRows.length}`,
      allConfigRows,
      accessToken
    );
    seededConfig = true;
  } else if (configRows.length === 1) {
    const dataRows = INITIAL_CONFIG_OPTIONS.map(serializeConfigRow);
    await updateRange(
      spreadsheetId,
      `${SHEET_TABS.CONFIG}!A2:E${dataRows.length + 1}`,
      dataRows,
      accessToken
    );
    seededConfig = true;
  } else {
    const configOptions = configRows
      .slice(1)
      .map(deserializeConfigRow)
      .filter((option): option is ConfigOption => option !== null);
    const synchronizedOptions = synchronizeEquipeCampoOptions(configOptions);
    if (
      JSON.stringify(configOptions.map(serializeConfigRow)) !==
      JSON.stringify(synchronizedOptions.map(serializeConfigRow))
    ) {
      const dataRows = synchronizedOptions.map(serializeConfigRow);
      await updateRange(
        spreadsheetId,
        `${SHEET_TABS.CONFIG}!A2:E${dataRows.length + 1}`,
        dataRows,
        accessToken
      );
    }
  }

  if ((existing[ranges[2]]?.length ?? 0) === 0) {
    await updateRange(spreadsheetId, `${SHEET_TABS.AUDITORIA}!A1:G1`, [AUDITORIA_HEADERS], accessToken);
  }

  const existingReportsHeader = existing[ranges[3]]?.[0] ?? [];
  if (JSON.stringify(existingReportsHeader) !== JSON.stringify(REPORTS_HEADERS)) {
    await updateRange(spreadsheetId, `${SHEET_TABS.REPORTS}!A1:Q1`, [REPORTS_HEADERS], accessToken);
  }

  return seededConfig;
}
