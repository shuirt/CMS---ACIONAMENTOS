import type { Acionamento, StatusOperacional } from '../types/acionamento';

const CSV_URL = '/src/data/CMS%20Acionamento%20-2026%20-%20ACIONAMENTOS%20(1).csv';
const CP850_HIGH_CODES = [
  0x00c7, 0x00fc, 0x00e9, 0x00e2, 0x00e4, 0x00e0, 0x00e5, 0x00e7,
  0x00ea, 0x00eb, 0x00e8, 0x00ef, 0x00ee, 0x00ec, 0x00c4, 0x00c5,
  0x00c9, 0x00e6, 0x00c6, 0x00f4, 0x00f6, 0x00f2, 0x00fb, 0x00f9,
  0x00ff, 0x00d6, 0x00dc, 0x00f8, 0x00a3, 0x00d8, 0x00d7, 0x0192,
  0x00e1, 0x00ed, 0x00f3, 0x00fa, 0x00f1, 0x00d1, 0x00aa, 0x00ba,
  0x00bf, 0x00ae, 0x00ac, 0x00bd, 0x00bc, 0x00a1, 0x00ab, 0x00bb,
  0x2591, 0x2592, 0x2593, 0x2502, 0x2524, 0x00c1, 0x00c2, 0x00c0,
  0x00a9, 0x2563, 0x2551, 0x2557, 0x255d, 0x00a2, 0x00a5, 0x2510,
  0x2514, 0x2534, 0x252c, 0x251c, 0x2500, 0x253c, 0x00e3, 0x00c3,
  0x255a, 0x2554, 0x2569, 0x2566, 0x2560, 0x2550, 0x256c, 0x00a4,
  0x00f0, 0x00d0, 0x00ca, 0x00cb, 0x00c8, 0x0131, 0x00cd, 0x00ce,
  0x00cf, 0x2518, 0x250c, 0x2588, 0x2584, 0x00a6, 0x00cc, 0x2580,
  0x00d3, 0x00df, 0x00d4, 0x00d2, 0x00f5, 0x00d5, 0x00b5, 0x00fe,
  0x00de, 0x00da, 0x00db, 0x00d9, 0x00fd, 0x00dd, 0x00af, 0x00b4,
  0x00ad, 0x00b1, 0x2017, 0x00be, 0x00b6, 0x00a7, 0x00f7, 0x00b8,
  0x00b0, 0x00a8, 0x00b7, 0x00b9, 0x00b3, 0x00b2, 0x25a0, 0x00a0,
];

const MONTHS: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

const STATUS_BY_NORMALIZED_VALUE: Record<string, StatusOperacional> = {
  encerrado: 'Encerrado',
  'sem atendimento': 'Sem atendimento',
  cancelado: 'Cancelado',
  informacao: 'Informação',
  'em andamento': 'Em andamento',
  report: 'Report',
};

function decodeCp850(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const chunkSize = 8192;

  for (let start = 0; start < bytes.length; start += chunkSize) {
    const end = Math.min(start + chunkSize, bytes.length);
    const codePoints = new Array<number>(end - start);
    for (let index = start; index < end; index += 1) {
      const byte = bytes[index];
      codePoints[index - start] = byte < 0x80 ? byte : CP850_HIGH_CODES[byte - 0x80];
    }
    chunks.push(String.fromCharCode(...codePoints));
  }

  return chunks.join('');
}

function parseSemicolonCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (insideQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          insideQuotes = false;
        }
      } else {
        cell += character;
      }
      continue;
    }

    if (character === '"' && cell.length === 0) {
      insideQuotes = true;
    } else if (character === ';') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = '';
    } else if (character !== '\r') {
      cell += character;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  return rows;
}

function normalizeText(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parseSourceDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;

  const sourceMatch = trimmed.match(/^(\d{1,2})-([a-z]{3})-(\d{4})$/i);
  if (!sourceMatch) return '';

  const month = MONTHS[sourceMatch[2].toLowerCase()];
  if (!month) return '';

  return `${sourceMatch[3]}-${month}-${sourceMatch[1].padStart(2, '0')}`;
}

function normalizeTime(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]m)?$/i);
  if (!match) return '';

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();

  if (meridiem) {
    if (hour < 1 || hour > 12) return '';
    hour = (hour % 12) + (meridiem === 'pm' ? 12 : 0);
  }
  if (hour > 23 || minute > 59) return '';

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function isAffirmative(value: string): boolean {
  return ['sim', 'yes', 'true', '1'].includes(normalizeText(value));
}

function parseSourceStatus(value: string, rowNumber: number): StatusOperacional {
  const status = STATUS_BY_NORMALIZED_VALUE[normalizeText(value)];
  if (!status) {
    throw new Error(`Status inválido na linha ${rowNumber} do CSV: "${value.trim()}".`);
  }
  return status;
}

function mapCsvRow(row: string[], recordNumber: number, rowNumber: number): Acionamento | null {
  if (!row.some((value) => value.trim())) return null;

  const dataRegistro = parseSourceDate(row[2] ?? '');
  if (!dataRegistro) {
    throw new Error(`Data de início inválida na linha ${rowNumber} do CSV.`);
  }

  const dataFim = parseSourceDate(row[3] ?? '');
  if ((row[3] ?? '').trim() && !dataFim) {
    throw new Error(`Data de fim inválida na linha ${rowNumber} do CSV.`);
  }

  const technologyValue = (row[16] ?? '').trim();
  const tecnologiaEmpregada =
    technologyValue !== '' &&
    !['nao', 'n/a', 'nao se aplica'].includes(normalizeText(technologyValue));
  const actions: Array<[label: string, value: string]> = [
    ['Apuração de imagens', row[17] ?? ''],
    ['Houve abordagem', row[18] ?? ''],
    ['Envolvimento do analista', row[19] ?? ''],
  ];
  const acoesEnvolvidas = actions.flatMap(([label, value]) => {
    const trimmed = value.trim();
    if (!trimmed || ['nao', 'n/a'].includes(normalizeText(trimmed))) return [];
    return [isAffirmative(trimmed) ? label : `${label}: ${trimmed}`];
  });
  const horarioAcionamento = normalizeTime(row[1] ?? '');

  return {
    id: `csv-demo-${String(recordNumber).padStart(6, '0')}`,
    numeroReport: null,
    dataRegistro,
    dataFim,
    horarioAcionamento,
    horarioEquipeAcionada: normalizeTime(row[8] ?? ''),
    horarioChegadaCampo: normalizeTime(row[9] ?? ''),
    horarioNormalizacao: normalizeTime(row[10] ?? ''),
    quemAcionou: (row[4] ?? '').trim(),
    tipoLocalidade: 'Linha Férrea',
    nomeLocalidade: '',
    kmFerroviario: (row[11] ?? '').trim(),
    housingRh: (row[12] ?? '').trim(),
    municipio: (row[14] ?? '').trim(),
    analistaResponsavel: (row[6] ?? '').trim(),
    descricaoCronologia: row[5] ?? '',
    tecnologiaEmpregada,
    tecnologiaUtilizada: tecnologiaEmpregada ? technologyValue : '',
    acoesEnvolvidas,
    equipeCampo: (row[7] ?? '').trim(),
    vigilantes: '',
    materialAtivos: (row[15] ?? '').trim(),
    tipificacao: (row[20] ?? '').trim(),
    inc: (row[21] ?? '').trim(),
    statusOperacional: parseSourceStatus(row[22] ?? '', rowNumber),
    createdAt: `${dataRegistro}T${horarioAcionamento || '12:00'}:00.000Z`,
    createdByName: (row[0] ?? '').trim() || 'Operador não informado',
    createdByEmail: '',
    updatedAt: `${dataRegistro}T${horarioAcionamento || '12:00'}:00.000Z`,
    updatedByName: (row[0] ?? '').trim() || 'Operador não informado',
    updatedByEmail: '',
  };
}

export function parseCsvDemoAcionamentos(text: string): Acionamento[] {
  const rows = parseSemicolonCsv(text.replace(/^\uFEFF/, ''));
  const records: Acionamento[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const record = mapCsvRow(rows[index], records.length + 1, index + 1);
    if (record) records.push(record);
  }

  return records;
}

export async function loadCsvDemoAcionamentos(): Promise<Acionamento[]> {
  if (!import.meta.env.DEV) {
    throw new Error('O CSV de demonstração só pode ser carregado no ambiente local de desenvolvimento.');
  }

  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(`Não foi possível carregar o arquivo CSV (${response.status}).`);
  }

  const text = decodeCp850(new Uint8Array(await response.arrayBuffer()));
  return parseCsvDemoAcionamentos(text);
}
