import type {
  Acionamento,
  AcionamentoInput,
  IncFilter,
  Iniciativa,
  IniciativaInput,
  Report,
  ReportInput,
  RegistrosTab,
  ShiftConfig,
  StatusOperacional,
  TipoLocalidade,
  ValidationErrors,
} from '../types/acionamento';

const VALID_STATUSES: StatusOperacional[] = [
  'Encerrado',
  'Sem atendimento',
  'Cancelado',
  'Informação',
  'Em andamento',
  'Report',
];

const VALID_LOCALIDADES: TipoLocalidade[] = ['Linha Férrea', 'Pátio', 'Estação'];

const EMPTY_INC_PLACEHOLDERS = new Set(['', '-', '—', 'N/A', 'SEM INC']);

export function hasValidInc(inc: string | null | undefined): boolean {
  const normalized = (inc ?? '').trim().toUpperCase();
  return !EMPTY_INC_PLACEHOLDERS.has(normalized);
}

export function isIncRequiredForStatus(_status: StatusOperacional): boolean {
  return false;
}

export function applyQuemAcionouShortcut(
  currentValue: string,
  shortcut: string,
  knownShortcuts: string[] = []
): string {
  const cleanShortcut = shortcut.trim();
  const trimmed = currentValue.trim();
  if (!trimmed) return cleanShortcut;

  const parenMatch = trimmed.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if (parenMatch) {
    const baseName = parenMatch[1].trim();
    return baseName ? `${baseName} (${cleanShortcut})` : cleanShortcut;
  }

  const isBareKnownShortcut = knownShortcuts.some(
    (s) => s.trim().toUpperCase() === trimmed.toUpperCase()
  );
  if (isBareKnownShortcut) {
    return cleanShortcut;
  }

  return `${trimmed} (${cleanShortcut})`;
}

export type UnidadeFederativa = 'ES' | 'MG';

export function inferUfFromMunicipio(municipio: string): UnidadeFederativa {
  const upper = municipio.trim().toUpperCase();
  if (/\(MG\)$/.test(upper) || /[-/\s]MG$/.test(upper)) {
    return 'MG';
  }
  return 'ES';
}

export function filterMunicipiosByUf(
  municipios: string[],
  uf: UnidadeFederativa
): string[] {
  const targetTag = `(${uf})`;
  const otherTag = uf === 'ES' ? '(MG)' : '(ES)';
  return municipios.filter((mun) => {
    const upper = mun.trim().toUpperCase();
    if (!upper) return false;
    if (upper.includes(targetTag) || new RegExp(`[-/\\s]${uf}$`).test(upper)) {
      return true;
    }
    if (upper.includes(otherTag) || /[-/\s](ES|MG)$/.test(upper)) {
      return false;
    }
    return true;
  });
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function isValidTime24h(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function formatTimeMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function normalizeTime24hOnBlur(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (isValidTime24h(trimmed)) return trimmed;

  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
  if (colonMatch) {
    const h = colonMatch[1].padStart(2, '0');
    const m = colonMatch[2].padStart(2, '0');
    const candidate = `${h}:${m}`;
    return isValidTime24h(candidate) ? candidate : trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 3) {
    const candidate = `0${digits[0]}:${digits.slice(1)}`;
    return isValidTime24h(candidate) ? candidate : trimmed;
  }
  if (digits.length === 4) {
    const candidate = `${digits.slice(0, 2)}:${digits.slice(2)}`;
    return isValidTime24h(candidate) ? candidate : trimmed;
  }
  return trimmed;
}

export function computeElapsedMinutes(startHHmm: string, endHHmm: string): number | null {
  const s = startHHmm.trim();
  const e = endHHmm.trim();
  if (!isValidTime24h(s) || !isValidTime24h(e)) return null;
  const [sh, sm] = s.split(':').map(Number);
  const [eh, em] = e.split(':').map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // overnight shift wrap-around
  return diff;
}

export function computeElapsedMinutesWithDates(
  startDateIso: string,
  startHHmm: string,
  endDateIso: string,
  endHHmm: string
): number | null {
  const s = startHHmm.trim();
  const e = endHHmm.trim();
  if (!isValidTime24h(s) || !isValidTime24h(e)) return null;

  const effectiveEndDate = endDateIso.trim() || startDateIso.trim();
  if (!isValidIsoDate(startDateIso.trim()) || !isValidIsoDate(effectiveEndDate)) {
    return computeElapsedMinutes(s, e);
  }

  const [sy, sm, sd] = startDateIso.trim().split('-').map(Number);
  const [ey, em, ed] = effectiveEndDate.split('-').map(Number);
  const [sh, smin] = s.split(':').map(Number);
  const [eh, emin] = e.split(':').map(Number);

  const startMs = Date.UTC(sy, sm - 1, sd, sh, smin);
  const endMs = Date.UTC(ey, em - 1, ed, eh, emin);

  if (effectiveEndDate === startDateIso.trim() && endMs < startMs) {
    return computeElapsedMinutes(s, e);
  }
  const diffMins = Math.round((endMs - startMs) / 60_000);
  return diffMins >= 0 ? diffMins : null;
}

export function formatDurationPT(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, '0')}min`;
}

export function getRelativeDateRange(
  daysBack: number,
  todayIso = getTodayIsoDate()
): { from: string; to: string } {
  if (!isValidIsoDate(todayIso)) return { from: todayIso, to: todayIso };
  const [y, m, d] = todayIso.split('-').map(Number);
  const fromDt = new Date(Date.UTC(y, m - 1, d - daysBack));
  return {
    from: fromDt.toISOString().slice(0, 10),
    to: todayIso,
  };
}

export function sanitizeAcionamentoInput(raw: Partial<AcionamentoInput>): AcionamentoInput {
  const techUsed = Boolean(raw.tecnologiaEmpregada);
  return {
    dataRegistro: (raw.dataRegistro ?? '').trim(),
    dataFim: (raw.dataFim ?? '').trim(),
    horarioAcionamento: (raw.horarioAcionamento ?? '').trim(),
    horarioEquipeAcionada: (raw.horarioEquipeAcionada ?? '').trim(),
    horarioChegadaCampo: (raw.horarioChegadaCampo ?? '').trim(),
    horarioNormalizacao: (raw.horarioNormalizacao ?? '').trim(),
    quemAcionou: (raw.quemAcionou ?? '').trim(),
    tipoLocalidade: (raw.tipoLocalidade ?? 'Linha Férrea') as TipoLocalidade,
    kmFerroviario: (raw.kmFerroviario ?? '').trim(),
    housingRh: (raw.housingRh ?? '').trim(),
    municipio: (raw.municipio ?? '').trim(),
    analistaResponsavel: (raw.analistaResponsavel ?? '').trim(),
    descricaoCronologia: raw.descricaoCronologia ?? '',
    tecnologiaEmpregada: techUsed,
    tecnologiaUtilizada: techUsed ? (raw.tecnologiaUtilizada ?? '').trim() : '',
    acoesEnvolvidas: Array.isArray(raw.acoesEnvolvidas)
      ? raw.acoesEnvolvidas.map((s) => String(s).trim()).filter(Boolean)
      : [],
    equipeCampo: (raw.equipeCampo ?? '').trim(),
    vigilantes: (raw.vigilantes ?? '').trim(),
    materialAtivos: (raw.materialAtivos ?? '').trim(),
    tipificacao: (raw.tipificacao ?? '').trim(),
    inc: (raw.inc ?? '').trim(),
    statusOperacional: (raw.statusOperacional ?? 'Em andamento') as StatusOperacional,
  };
}

export function validateAcionamentoInput(input: AcionamentoInput): {
  valid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};

  if (!input.quemAcionou.trim()) {
    errors.quemAcionou = 'Informe quem realizou o acionamento.';
  }

  if (!input.dataRegistro.trim()) {
    errors.dataRegistro = 'Informe a data de início.';
  } else if (!isValidIsoDate(input.dataRegistro.trim())) {
    errors.dataRegistro = 'Data inválida. Utilize o formato AAAA-MM-DD.';
  }

  if (input.dataFim.trim()) {
    if (!isValidIsoDate(input.dataFim.trim())) {
      errors.dataFim = 'Data fim inválida. Utilize o formato AAAA-MM-DD.';
    } else if (
      isValidIsoDate(input.dataRegistro.trim()) &&
      input.dataFim.trim() < input.dataRegistro.trim()
    ) {
      errors.dataFim = 'Data fim não pode ser anterior à data início.';
    }
  }

  if (!input.horarioAcionamento.trim()) {
    errors.horarioAcionamento = 'Informe o horário do acionamento.';
  } else if (!isValidTime24h(input.horarioAcionamento.trim())) {
    errors.horarioAcionamento = 'Horário inválido (formato 24h HH:mm).';
  }

  if (input.horarioEquipeAcionada.trim() && !isValidTime24h(input.horarioEquipeAcionada.trim())) {
    errors.horarioEquipeAcionada = 'Horário inválido (HH:mm).';
  }
  if (input.horarioChegadaCampo.trim() && !isValidTime24h(input.horarioChegadaCampo.trim())) {
    errors.horarioChegadaCampo = 'Horário inválido (HH:mm).';
  }
  if (input.horarioNormalizacao.trim() && !isValidTime24h(input.horarioNormalizacao.trim())) {
    errors.horarioNormalizacao = 'Horário inválido (HH:mm).';
  }

  if (!VALID_LOCALIDADES.includes(input.tipoLocalidade)) {
    errors.tipoLocalidade = 'Selecione um tipo de localidade válido.';
  }

  if (!input.descricaoCronologia.trim()) {
    errors.descricaoCronologia = 'Descreva a cronologia do atendimento.';
  }

  if (input.tecnologiaEmpregada && !input.tecnologiaUtilizada.trim()) {
    errors.tecnologiaUtilizada = 'Selecione qual tecnologia foi empregada.';
  }

  if (!input.equipeCampo.trim()) {
    errors.equipeCampo = 'Selecione a equipe de campo ou quem atendeu.';
  }

  if (!VALID_STATUSES.includes(input.statusOperacional)) {
    errors.statusOperacional = 'Selecione um status operacional válido.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getTodayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTime24h(now = new Date()): string {
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateBR(isoDate: string): string {
  if (!isValidIsoDate(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

const WEEKDAYS_PT = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const MONTHS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function formatLongDateBR(isoDate: string): string {
  if (!isValidIsoDate(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = WEEKDAYS_PT[dt.getDay()];
  const monthName = MONTHS_PT[m - 1];
  return `${weekday}, ${d} de ${monthName} de ${y}`;
}

export function formatDateTimeBR(isoDateTime: string): string {
  if (!isoDateTime) return '—';
  const dt = new Date(isoDateTime);
  if (Number.isNaN(dt.getTime())) return isoDateTime;
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, '0');
  const min = String(dt.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function buildAcionamentoTitle(
  item: Pick<Acionamento, 'tipificacao' | 'materialAtivos' | 'descricaoCronologia'>
): string {
  const tip = item.tipificacao.trim();
  const mat = item.materialAtivos.trim();
  if (tip && mat) {
    return `${tip} — ${mat}`;
  }
  if (tip) return tip;
  if (mat) return mat;
  const firstLine = item.descricaoCronologia.split('\n')[0]?.trim() ?? '';
  return firstLine.slice(0, 80) || 'Acionamento Operacional';
}

export function sortAcionamentosDesc(items: Acionamento[]): Acionamento[] {
  return [...items].sort((a, b) => {
    const dateCmp = b.dataRegistro.localeCompare(a.dataRegistro);
    if (dateCmp !== 0) return dateCmp;
    const timeCmp = b.horarioAcionamento.localeCompare(a.horarioAcionamento);
    if (timeCmp !== 0) return timeCmp;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function sortAcionamentosAsc(items: Acionamento[]): Acionamento[] {
  return [...items].sort((a, b) => {
    const dateCmp = a.dataRegistro.localeCompare(b.dataRegistro);
    if (dateCmp !== 0) return dateCmp;
    const timeCmp = a.horarioAcionamento.localeCompare(b.horarioAcionamento);
    if (timeCmp !== 0) return timeCmp;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function groupAcionamentosByDate(
  items: Acionamento[]
): Array<{ dateIso: string; items: Acionamento[] }> {
  const groups: Array<{ dateIso: string; items: Acionamento[] }> = [];
  const byDate = new Map<string, Acionamento[]>();

  for (const item of items) {
    const key = item.dataRegistro || 'Sem data';
    let bucket = byDate.get(key);
    if (!bucket) {
      bucket = [];
      byDate.set(key, bucket);
      groups.push({ dateIso: key, items: bucket });
    }
    bucket.push(item);
  }

  return groups;
}

export function formatShortDayHeaderBR(isoDate: string, todayIso = getTodayIsoDate()): string {
  if (!isValidIsoDate(isoDate)) return isoDate;
  const br = formatDateBR(isoDate);
  if (isoDate === todayIso) {
    return `Hoje · ${br}`;
  }

  const [ty, tm, td] = todayIso.split('-').map(Number);
  const yesterdayDt = new Date(Date.UTC(ty, tm - 1, td - 1));
  const yesterdayIso = yesterdayDt.toISOString().slice(0, 10);
  if (isoDate === yesterdayIso) {
    return `Ontem · ${br}`;
  }

  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = WEEKDAYS_PT[dt.getDay()];
  return `${weekday} · ${br}`;
}

const SHORT_WEEKDAYS_PT = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'];

export function formatDayDividerLabelBR(isoDate: string): string {
  if (!isValidIsoDate(isoDate)) return isoDate || 'Sem data';
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekdayShort = SHORT_WEEKDAYS_PT[dt.getUTCDay()];
  return `${weekdayShort} ${formatDateBR(isoDate)}`;
}

export function getUniqueOperators(items: Pick<Acionamento, 'createdByName'>[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    const name = item.createdByName.trim();
    if (name) seen.add(name);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function getUniqueFieldValues(
  items: Acionamento[],
  field: 'quemAcionou' | 'municipio' | 'tipificacao' | 'analistaResponsavel',
  baseOptions: string[] = []
): string[] {
  const seen = new Set<string>();
  for (const opt of baseOptions) {
    const trimmed = opt.trim();
    if (trimmed) seen.add(trimmed);
  }
  for (const item of items) {
    const trimmed = (item[field] ?? '').trim();
    if (trimmed) seen.add(trimmed);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function filterAcionamentos(
  items: Acionamento[],
  options: {
    tab?: RegistrosTab;
    sortOrder?: 'desc' | 'asc';
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    dateExact?: string | null;
    statusFilter?: StatusOperacional | 'Todos';
    operatorFilter?: string;
    incFilter?: IncFilter;
    quemAcionouFilter?: string;
    tipoLocalidadeFilter?: TipoLocalidade | 'Todas';
    municipioFilter?: string;
    tipificacaoFilter?: string;
    analistaFilter?: string;
    tecnologiaFilter?: 'todas' | 'sim' | 'nao';
    reportFilter?: 'todos' | 'com_report' | 'sem_report';
  }
): Acionamento[] {
  const {
    tab = 'todos',
    sortOrder = 'desc',
    search = '',
    dateFrom = '',
    dateTo = '',
    dateExact = null,
    statusFilter = 'Todos',
    operatorFilter = 'Todos',
    incFilter = 'todos',
    quemAcionouFilter = 'Todos',
    tipoLocalidadeFilter = 'Todas',
    municipioFilter = 'Todos',
    tipificacaoFilter = 'Todos',
    analistaFilter = 'Todos',
    tecnologiaFilter = 'todas',
    reportFilter = 'todos',
  } = options;

  const term = search.trim().toLowerCase();
  const ordered = sortOrder === 'asc' ? sortAcionamentosAsc(items) : sortAcionamentosDesc(items);

  return ordered.filter((item) => {
    if (
      tab === 'aberto' &&
      item.statusOperacional !== 'Report' &&
      item.statusOperacional !== 'Em andamento'
    ) {
      return false;
    }
    if (tab === 'encerrado' && item.statusOperacional !== 'Encerrado') {
      return false;
    }
    if (incFilter === 'com_inc' && !hasValidInc(item.inc)) {
      return false;
    }
    if (incFilter === 'sem_inc' && hasValidInc(item.inc)) {
      return false;
    }
    if (statusFilter !== 'Todos' && item.statusOperacional !== statusFilter) {
      return false;
    }
    if (operatorFilter !== 'Todos' && item.createdByName.trim() !== operatorFilter) {
      return false;
    }
    if (
      quemAcionouFilter !== 'Todos' &&
      item.quemAcionou.trim().toLowerCase() !== quemAcionouFilter.trim().toLowerCase()
    ) {
      return false;
    }
    if (tipoLocalidadeFilter !== 'Todas' && item.tipoLocalidade !== tipoLocalidadeFilter) {
      return false;
    }
    if (municipioFilter !== 'Todos' && item.municipio.trim() !== municipioFilter) {
      return false;
    }
    if (tipificacaoFilter !== 'Todos' && item.tipificacao.trim() !== tipificacaoFilter) {
      return false;
    }
    if (analistaFilter !== 'Todos' && item.analistaResponsavel.trim() !== analistaFilter) {
      return false;
    }
    if (tecnologiaFilter === 'sim' && !item.tecnologiaEmpregada) {
      return false;
    }
    if (tecnologiaFilter === 'nao' && item.tecnologiaEmpregada) {
      return false;
    }
    if (reportFilter === 'com_report' && item.numeroReport === null) {
      return false;
    }
    if (reportFilter === 'sem_report' && item.numeroReport !== null) {
      return false;
    }
    if (dateExact && item.dataRegistro !== dateExact) {
      return false;
    }
    if (dateFrom && item.dataRegistro < dateFrom) {
      return false;
    }
    if (dateTo && item.dataRegistro > dateTo) {
      return false;
    }
    if (!term) return true;

    const haystack = [
      item.tipificacao,
      item.materialAtivos,
      item.municipio,
      item.kmFerroviario,
      hasValidInc(item.inc) ? item.inc : 'sem inc',
      item.housingRh,
      item.quemAcionou,
      item.equipeCampo,
      item.vigilantes,
      item.descricaoCronologia,
      item.statusOperacional,
      item.analistaResponsavel,
      item.tipoLocalidade,
      item.tecnologiaUtilizada,
      item.createdByName,
      item.createdByEmail,
      item.updatedByName,
      item.updatedByEmail,
      item.numeroReport !== null ? `report #${item.numeroReport}` : '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(term);
  });
}

export function isRelevantReportAcionamento(
  item: Pick<Acionamento, 'statusOperacional' | 'numeroReport'>
): boolean {
  return item.statusOperacional === 'Report' || item.numeroReport !== null;
}

export function filterReportAcionamentos(
  items: Acionamento[],
  options: {
    view?: 'todos' | 'pendentes' | 'concluidos';
    incFilter?: IncFilter;
    operatorFilter?: string;
    search?: string;
  } = {}
): Acionamento[] {
  const {
    view = 'todos',
    incFilter = 'todos',
    operatorFilter = 'Todos',
    search = '',
  } = options;

  const relevantOnly = items.filter(isRelevantReportAcionamento);
  const filtered = filterAcionamentos(relevantOnly, {
    tab: 'todos',
    sortOrder: 'desc',
    incFilter,
    operatorFilter,
    search,
  }).filter((item) => {
    if (view === 'pendentes') return item.statusOperacional === 'Report';
    if (view === 'concluidos') return item.statusOperacional !== 'Report';
    return true;
  });

  return [...filtered].sort((a, b) => {
    const aNum = a.numeroReport ?? -1;
    const bNum = b.numeroReport ?? -1;
    if (bNum !== aNum) return bNum - aNum;
    const dateCmp = b.dataRegistro.localeCompare(a.dataRegistro);
    if (dateCmp !== 0) return dateCmp;
    return b.horarioAcionamento.localeCompare(a.horarioAcionamento);
  });
}

export function sanitizeReportInput(raw: Partial<ReportInput>): ReportInput {
  return {
    inc: (raw.inc ?? '').trim(),
    dataRegistro: (raw.dataRegistro ?? '').trim(),
    horario: (raw.horario ?? '').trim(),
    descricao: (raw.descricao ?? '').trim(),
    tipificacao: (raw.tipificacao ?? '').trim(),
    municipio: (raw.municipio ?? '').trim(),
    tipoLocalidade: (raw.tipoLocalidade ?? 'Linha Férrea') as TipoLocalidade,
    kmFerroviario: (raw.kmFerroviario ?? '').trim(),
    analistaResponsavel: (raw.analistaResponsavel ?? '').trim(),
  };
}

export function validateReportInput(input: ReportInput): {
  valid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};
  if (!input.dataRegistro.trim()) {
    errors.dataRegistro = 'Informe a data.';
  } else if (!isValidIsoDate(input.dataRegistro.trim())) {
    errors.dataRegistro = 'Data inválida (AAAA-MM-DD).';
  }
  if (!input.horario.trim()) {
    errors.horario = 'Informe o horário.';
  } else if (!isValidTime24h(input.horario.trim())) {
    errors.horario = 'Horário inválido (HH:mm).';
  }
  if (!input.descricao.trim()) errors.descricao = 'Informe a descrição do Report.';
  if (!input.tipificacao.trim()) errors.tipificacao = 'Selecione a tipificação.';
  if (!input.municipio.trim()) errors.municipio = 'Selecione o município.';
  if (!input.analistaResponsavel.trim()) {
    errors.analistaResponsavel = 'Selecione o analista responsável.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function computeReportSequence(
  items: Array<Pick<Acionamento | Report, 'numeroReport'>>
): {
  lastReportNumber: number;
  nextReportNumber: number;
} {
  let maxNum = 0;
  for (const item of items) {
    if (
      typeof item.numeroReport === 'number' &&
      Number.isFinite(item.numeroReport) &&
      item.numeroReport > maxNum
    ) {
      maxNum = item.numeroReport;
    }
  }
  return {
    lastReportNumber: maxNum,
    nextReportNumber: maxNum + 1,
  };
}

export function getNextAcionamentoReportNumber(
  acionamentos: Pick<Acionamento, 'numeroReport'>[],
  reports: Pick<Report, 'numeroReport'>[]
): number {
  const referencedNumbers = new Set(
    acionamentos.flatMap((item) => (item.numeroReport === null ? [] : [item.numeroReport]))
  );
  const availableReportNumber = reports
    .map((item) => item.numeroReport)
    .filter((number) => !referencedNumbers.has(number))
    .sort((a, b) => a - b)[0];

  if (availableReportNumber !== undefined) return availableReportNumber;
  return computeReportSequence([...acionamentos, ...reports]).nextReportNumber;
}

export function getNextReportRecordNumber(
  acionamentos: Pick<Acionamento, 'numeroReport'>[],
  reports: Pick<Report, 'numeroReport'>[]
): number {
  const reportNumbers = new Set(reports.map((item) => item.numeroReport));
  const unregisteredReferenceNumber = acionamentos
    .flatMap((item) => (item.numeroReport === null ? [] : [item.numeroReport]))
    .filter((number) => !reportNumbers.has(number))
    .sort((a, b) => b - a)[0];

  if (unregisteredReferenceNumber !== undefined) return unregisteredReferenceNumber;
  return computeReportSequence([...acionamentos, ...reports]).nextReportNumber;
}

export function sortReportsDesc(items: Report[]): Report[] {
  return [...items].sort((a, b) => b.numeroReport - a.numeroReport);
}

export function formatShiftLabel(shift: ShiftConfig): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(':');
    return m === '00' ? `${h}h` : `${h}h${m}`;
  };
  return `${fmt(shift.inicio)} às ${fmt(shift.fim)}`;
}

export function computeShiftSummary(
  items: Acionamento[],
  params: {
    dateIso: string;
    shift: ShiftConfig;
  }
): {
  total: number;
  reportsPendentes: number;
  encerrados: number;
  outros: number;
  text: string;
} {
  const total = items.length;
  const reportsPendentes = items.filter((i) => i.statusOperacional === 'Report').length;
  const encerrados = items.filter((i) => i.statusOperacional === 'Encerrado').length;
  const outros = total - reportsPendentes - encerrados;

  const lines = [
    'RESUMO DE PLANTÃO — CMS',
    '',
    `Data: ${formatDateBR(params.dateIso)}`,
    `Turno: ${formatShiftLabel(params.shift)}`,
    `Total de acionamentos: ${total}`,
    `Reports pendentes: ${reportsPendentes}`,
    `Encerrados: ${encerrados}`,
    `Outros: ${outros}`,
  ];

  return {
    total,
    reportsPendentes,
    encerrados,
    outros,
    text: lines.join('\n'),
  };
}

export function formatAcionamentoClipboardText(record: Acionamento): string {
  const title = buildAcionamentoTitle(record);
  const incLabel = hasValidInc(record.inc) ? record.inc : 'Sem INC';
  const lines = [
    `ACIONAMENTO CMS — ${title}`,
    `INC: ${incLabel}${record.numeroReport !== null ? ` · REPORT #${record.numeroReport}` : ''}`,
    `Data início: ${formatDateBR(record.dataRegistro)}${record.dataFim ? ` · Data fim: ${formatDateBR(record.dataFim)}` : ''} · Acionamento: ${record.horarioAcionamento}`,
    `Status: ${record.statusOperacional} · Operador CMS: ${record.createdByName || '—'}`,
    `Quem acionou: ${record.quemAcionou} · Equipe: ${record.equipeCampo}${record.vigilantes ? ` · Vigilante(s): ${record.vigilantes}` : ''}`,
    `Localidade: ${record.tipoLocalidade} · ${record.municipio || '—'} · ${record.kmFerroviario || '—'}${record.housingRh ? ` (${record.housingRh})` : ''}`,
  ];

  if (record.analistaResponsavel) {
    lines.push(`Analista: ${record.analistaResponsavel}`);
  }
  if (record.horarioEquipeAcionada || record.horarioChegadaCampo || record.horarioNormalizacao) {
    lines.push(
      `Marcos: Equipe ${record.horarioEquipeAcionada || '—'} | Chegada ${record.horarioChegadaCampo || '—'} | Saída ${record.horarioNormalizacao || '—'}`
    );
  }
  lines.push('', 'Cronologia:', record.descricaoCronologia.trim());
  return lines.join('\n');
}

const FIELD_LABELS: Record<keyof AcionamentoInput, string> = {
  dataRegistro: 'Data início',
  dataFim: 'Data fim',
  horarioAcionamento: 'Horário do acionamento',
  horarioEquipeAcionada: 'Equipe acionada',
  horarioChegadaCampo: 'Chegada em campo',
  horarioNormalizacao: 'Saída do local',
  quemAcionou: 'Quem acionou',
  tipoLocalidade: 'Tipo de localidade',
  kmFerroviario: 'KM ferroviário',
  housingRh: 'Housing / RH',
  municipio: 'Município',
  analistaResponsavel: 'Analista responsável',
  descricaoCronologia: 'Descrição e cronologia',
  tecnologiaEmpregada: 'Tecnologia empregada',
  tecnologiaUtilizada: 'Tecnologia utilizada',
  acoesEnvolvidas: 'Ações envolvidas',
  equipeCampo: 'Equipe de campo',
  vigilantes: 'Vigilante(s)',
  materialAtivos: 'Material / Ativos',
  tipificacao: 'Tipificação',
  inc: 'INC',
  statusOperacional: 'Status operacional',
};

export function diffAcionamentoFields(before: Acionamento, after: AcionamentoInput): string[] {
  const changed: string[] = [];
  (Object.keys(FIELD_LABELS) as (keyof AcionamentoInput)[]).forEach((key) => {
    const prev = before[key];
    const next = after[key];
    const prevStr = Array.isArray(prev) ? prev.join(', ') : String(prev ?? '');
    const nextStr = Array.isArray(next) ? next.join(', ') : String(next ?? '');
    if (prevStr !== nextStr) {
      changed.push(FIELD_LABELS[key]);
    }
  });
  return changed;
}

export function sanitizeIniciativaInput(raw: Partial<IniciativaInput>): IniciativaInput {
  return {
    dataRegistro: (raw.dataRegistro ?? '').trim(),
    horario: (raw.horario ?? '').trim(),
    municipio: (raw.municipio ?? '').trim(),
    tipoLocalidade: (raw.tipoLocalidade ?? 'Linha Férrea') as TipoLocalidade,
    kmFerroviario: (raw.kmFerroviario ?? '').trim(),
    analistaResponsavel: (raw.analistaResponsavel ?? '').trim(),
    descricao: raw.descricao ?? '',
    tipificacao: (raw.tipificacao ?? '').trim(),
    inc: (raw.inc ?? '').trim(),
  };
}

export function validateIniciativaInput(input: IniciativaInput): {
  valid: boolean;
  errors: ValidationErrors;
} {
  const errors: ValidationErrors = {};
  if (!input.dataRegistro.trim()) {
    errors.dataRegistro = 'Informe a data.';
  } else if (!isValidIsoDate(input.dataRegistro.trim())) {
    errors.dataRegistro = 'Data inválida (AAAA-MM-DD).';
  }
  if (!input.horario.trim()) {
    errors.horario = 'Informe o horário.';
  } else if (!isValidTime24h(input.horario.trim())) {
    errors.horario = 'Horário inválido (HH:mm).';
  }
  if (!input.municipio.trim()) {
    errors.municipio = 'Selecione o município.';
  }
  if (!input.analistaResponsavel.trim()) {
    errors.analistaResponsavel = 'Selecione o analista responsável.';
  }
  if (!input.descricao.trim()) {
    errors.descricao = 'Informe a descrição da iniciativa.';
  }
  if (!input.tipificacao.trim()) {
    errors.tipificacao = 'Selecione a tipificação.';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function computeIniciativaSequence(items: Pick<Iniciativa, 'numeroIniciativa'>[]): {
  lastIniciativaNumber: number;
  nextIniciativaNumber: number;
} {
  let maxNum = 0;
  for (const item of items) {
    if (
      typeof item.numeroIniciativa === 'number' &&
      Number.isFinite(item.numeroIniciativa) &&
      item.numeroIniciativa > maxNum
    ) {
      maxNum = item.numeroIniciativa;
    }
  }
  return {
    lastIniciativaNumber: maxNum,
    nextIniciativaNumber: maxNum + 1,
  };
}

export function sortIniciativasDesc(items: Iniciativa[]): Iniciativa[] {
  return [...items].sort((a, b) => {
    const dateCmp = b.dataRegistro.localeCompare(a.dataRegistro);
    if (dateCmp !== 0) return dateCmp;
    const timeCmp = b.horario.localeCompare(a.horario);
    if (timeCmp !== 0) return timeCmp;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

