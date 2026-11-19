import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyQuemAcionouShortcut,
  buildAcionamentoTitle,
  computeElapsedMinutes,
  computeElapsedMinutesWithDates,
  computeReportSequence,
  computeShiftSummary,
  diffAcionamentoFields,
  filterAcionamentos,
  filterMunicipiosByUf,
  filterReportAcionamentos,
  formatAcionamentoClipboardText,
  formatDateBR,
  formatDayDividerLabelBR,
  formatDurationPT,
  formatLongDateBR,
  formatShortDayHeaderBR,
  getNextAcionamentoReportNumber,
  getNextReportRecordNumber,
  getRelativeDateRange,
  getUniqueFieldValues,
  getUniqueOperators,
  groupAcionamentosByDate,
  hasValidInc,
  inferUfFromMunicipio,
  isIncRequiredForStatus,
  isRelevantReportAcionamento,
  normalizeTime24hOnBlur,
  sanitizeAcionamentoInput,
  sortAcionamentosAsc,
  sortAcionamentosDesc,
  sanitizeReportInput,
  validateAcionamentoInput,
  validateReportInput,
} from './validation';
import type { Acionamento, AcionamentoInput } from '../types/acionamento';

function makeInput(overrides: Partial<AcionamentoInput> = {}): AcionamentoInput {
  return {
    dataRegistro: '2026-11-15',
    dataFim: '2026-11-15',
    horarioAcionamento: '08:30',
    horarioEquipeAcionada: '',
    horarioChegadaCampo: '',
    horarioNormalizacao: '',
    quemAcionou: 'CCE',
    tipoLocalidade: 'Linha Férrea',
    nomeLocalidade: '',
    kmFerroviario: 'KM 45+200',
    housingRh: 'EH01/03',
    municipio: 'Cariacica (ES)',
    analistaResponsavel: 'Anderson Pilon',
    descricaoCronologia: '08:30 - Solicitação de apoio para verificação perimetral.',
    tecnologiaEmpregada: false,
    tecnologiaUtilizada: '',
    acoesEnvolvidas: ['Apuração de imagens'],
    equipeCampo: 'Ronda RH07',
    vigilantes: 'Carlos Lima, Rafael Costa',
    materialAtivos: 'PN inoperante',
    tipificacao: 'Atendimento de Segurança',
    inc: 'INC2026000101',
    statusOperacional: 'Em andamento',
    ...overrides,
  };
}

function makeRecord(overrides: Partial<Acionamento> = {}): Acionamento {
  return {
    ...makeInput(),
    id: 'uuid-1',
    numeroReport: null,
    createdAt: '2026-11-15T08:31:00.000Z',
    createdByName: 'Operador Teste',
    createdByEmail: 'op@empresa.com',
    updatedAt: '2026-11-15T08:31:00.000Z',
    updatedByName: 'Operador Teste',
    updatedByEmail: 'op@empresa.com',
    ...overrides,
  };
}

test('validateAcionamentoInput allows deferred INC on all statuses including Encerrado/Report and validates dataFim ordering', () => {
  const validResult = validateAcionamentoInput(makeInput());
  assert.equal(validResult.valid, true);
  assert.deepEqual(validResult.errors, {});

  // INC is optional on all statuses, but only some statuses should be flagged as missing it.
  for (const status of [
    'Em andamento',
    'Sem atendimento',
    'Cancelado',
    'Informação',
    'Encerrado',
    'Report',
  ] as const) {
    assert.equal(
      isIncRequiredForStatus(status),
      !['Sem atendimento', 'Cancelado', 'Informação'].includes(status)
    );
    const res = validateAcionamentoInput(makeInput({ statusOperacional: status, inc: '' }));
    assert.equal(res.valid, true);

    const placeholderRes = validateAcionamentoInput(
      makeInput({ statusOperacional: status, inc: 'N/A' })
    );
    assert.equal(placeholderRes.valid, true);
  }

  // dataFim before dataRegistro is rejected
  const reversedDates = validateAcionamentoInput(
    makeInput({ dataRegistro: '2026-11-16', dataFim: '2026-11-15' })
  );
  assert.equal(reversedDates.valid, false);
  assert.ok(reversedDates.errors.dataFim);

  const invalidResult = validateAcionamentoInput(
    makeInput({
      quemAcionou: '  ',
      equipeCampo: '',
      horarioAcionamento: '25:99',
      tecnologiaEmpregada: true,
      tecnologiaUtilizada: '',
    })
  );
  assert.equal(invalidResult.valid, false);
  assert.ok(invalidResult.errors.quemAcionou);
  assert.ok(invalidResult.errors.equipeCampo);
  assert.equal(invalidResult.errors.inc, undefined);
  assert.ok(invalidResult.errors.horarioAcionamento);
  assert.ok(invalidResult.errors.tecnologiaUtilizada);
});

test('applyQuemAcionouShortcut composes Nome (Atalho) and filterMunicipiosByUf filters ES vs MG', () => {
  const shortcuts = ['CCE', 'CCS VLI', 'CPT'];
  assert.equal(applyQuemAcionouShortcut('', 'CCE', shortcuts), 'CCE');
  assert.equal(applyQuemAcionouShortcut('Jocimar', 'CCE', shortcuts), 'Jocimar (CCE)');
  assert.equal(applyQuemAcionouShortcut('Jocimar (CCE)', 'CPT', shortcuts), 'Jocimar (CPT)');
  assert.equal(applyQuemAcionouShortcut('CCE', 'CCS VLI', shortcuts), 'CCS VLI');

  const allCities = ['Vitória (ES)', 'Serra (ES)', 'Belo Horizonte (MG)', 'Conselheiro Pena (MG)'];
  assert.deepEqual(filterMunicipiosByUf(allCities, 'ES'), ['Vitória (ES)', 'Serra (ES)']);
  assert.deepEqual(filterMunicipiosByUf(allCities, 'MG'), [
    'Belo Horizonte (MG)',
    'Conselheiro Pena (MG)',
  ]);
  assert.equal(inferUfFromMunicipio('Conselheiro Pena (MG)'), 'MG');
  assert.equal(inferUfFromMunicipio('Serra (ES)'), 'ES');

  assert.equal(
    computeElapsedMinutesWithDates('2026-11-15', '23:30', '2026-11-16', '01:15'),
    105
  );
  assert.equal(
    computeElapsedMinutesWithDates('2026-11-15', '08:00', '2026-11-16', '09:00'),
    25 * 60
  );
});

test('hasValidInc distinguishes real INC codes from blank or placeholder values', () => {
  assert.equal(hasValidInc('INC2026000101'), true);
  assert.equal(hasValidInc(''), false);
  assert.equal(hasValidInc('   '), false);
  assert.equal(hasValidInc('—'), false);
  assert.equal(hasValidInc('N/A'), false);
  assert.equal(hasValidInc('Sem INC'), false);
});

test('sanitizeAcionamentoInput clears tecnologiaUtilizada when tecnologiaEmpregada is false', () => {
  const sanitized = sanitizeAcionamentoInput(
    makeInput({
      tecnologiaEmpregada: false,
      tecnologiaUtilizada: 'Câmera (TA)',
    })
  );
  assert.equal(sanitized.tecnologiaEmpregada, false);
  assert.equal(sanitized.tecnologiaUtilizada, '');
});

test('sanitizeAcionamentoInput retains locality names only for Pátio and Estação', () => {
  const patio = sanitizeAcionamentoInput(
    makeInput({ tipoLocalidade: 'Pátio', nomeLocalidade: '  Pátio Central  ' })
  );
  const station = sanitizeAcionamentoInput(
    makeInput({ tipoLocalidade: 'Estação', nomeLocalidade: 'Estação Central' })
  );
  const railway = sanitizeAcionamentoInput(
    makeInput({ tipoLocalidade: 'Linha Férrea', nomeLocalidade: 'Nome ignorado' })
  );

  assert.equal(patio.nomeLocalidade, 'Pátio Central');
  assert.equal(station.nomeLocalidade, 'Estação Central');
  assert.equal(railway.nomeLocalidade, '');
});

test('date formatting converts ISO to Brazilian formats', () => {
  assert.equal(formatDateBR('2026-11-15'), '15/11/2026');
  assert.equal(formatLongDateBR('2026-11-15'), 'Domingo, 15 de novembro de 2026');
  assert.equal(formatDayDividerLabelBR('2026-11-16'), 'Seg. 16/11/2026');
  assert.equal(formatDayDividerLabelBR('2026-11-15'), 'Dom. 15/11/2026');
  assert.equal(formatDayDividerLabelBR('2026-11-14'), 'Sáb. 14/11/2026');
});

test('computeReportSequence never reuses used numbers and increments monotonically', () => {
  assert.deepEqual(computeReportSequence([]), {
    lastReportNumber: 0,
    nextReportNumber: 1,
  });

  const records = [
    makeRecord({ id: '1', numeroReport: 101, statusOperacional: 'Report' }),
    makeRecord({ id: '2', numeroReport: null, statusOperacional: 'Encerrado' }),
    makeRecord({ id: '3', numeroReport: 104, statusOperacional: 'Encerrado' }),
  ];
  assert.deepEqual(computeReportSequence(records), {
    lastReportNumber: 104,
    nextReportNumber: 105,
  });
});

test('Report records and Acionamentos share numbers by linking the next unmatched reference', () => {
  const acionamentos = [{ numeroReport: 412 }, { numeroReport: 411 }, { numeroReport: null }];
  const reports = [{ numeroReport: 412 }];

  assert.equal(getNextReportRecordNumber(acionamentos, reports), 411);
  assert.equal(getNextAcionamentoReportNumber(acionamentos, reports), 413);
  assert.equal(getNextAcionamentoReportNumber([], [{ numeroReport: 27 }]), 27);
  assert.equal(getNextReportRecordNumber([{ numeroReport: 28 }], []), 28);
});

test('Report input trims values and requires description, tipification, and municipality but allows missing INC', () => {
  const input = sanitizeReportInput({
    inc: ' INC2026910000 ',
    dataRegistro: '2026-11-15',
    horario: '17:20',
    descricao: '  Acompanhamento do evento.  ',
    tipificacao: ' Ação Preventiva ',
    municipio: ' Vitória (ES) ',
    tipoLocalidade: 'Estação',
    kmFerroviario: ' KM 01+200 ',
    analistaResponsavel: ' Analista A ',
  });
  assert.deepEqual(input, {
    inc: 'INC2026910000',
    dataRegistro: '2026-11-15',
    horario: '17:20',
    descricao: 'Acompanhamento do evento.',
    tipificacao: 'Ação Preventiva',
    municipio: 'Vitória (ES)',
    tipoLocalidade: 'Estação',
    kmFerroviario: 'KM 01+200',
    analistaResponsavel: 'Analista A',
  });
  assert.deepEqual(validateReportInput({ ...input, inc: '' }), { valid: true, errors: {} });
  assert.deepEqual(validateReportInput({
    inc: '',
    dataRegistro: '',
    horario: '',
    descricao: '',
    tipificacao: '',
    municipio: '',
    tipoLocalidade: 'Linha Férrea',
    kmFerroviario: '',
    analistaResponsavel: '',
  }), {
    valid: false,
    errors: {
      dataRegistro: 'Informe a data.',
      horario: 'Informe o horário.',
      descricao: 'Informe a descrição do Report.',
      tipificacao: 'Selecione a tipificação.',
      municipio: 'Selecione o município.',
      analistaResponsavel: 'Selecione o analista responsável.',
    },
  });
});

test('filterAcionamentos handles Em aberto, Encerrado, Todos, INC presence and full Historico filters', () => {
  const records = [
    makeRecord({
      id: '1',
      dataRegistro: '2026-11-15',
      horarioAcionamento: '09:00',
      statusOperacional: 'Report',
      numeroReport: 12,
      inc: 'INC999111',
      housingRh: 'EH02/01',
      quemAcionou: 'CCS VLI',
      tipoLocalidade: 'Pátio',
      municipio: 'Serra (ES)',
      tecnologiaEmpregada: true,
      tecnologiaUtilizada: 'Câmera (TA)',
    }),
    makeRecord({
      id: '2',
      dataRegistro: '2026-11-15',
      horarioAcionamento: '10:00',
      statusOperacional: 'Encerrado',
      municipio: 'Vitória (ES)',
      quemAcionou: 'CPT',
      tipoLocalidade: 'Estação',
      inc: '',
      tipificacao: 'Falha Operacional',
      tecnologiaEmpregada: false,
    }),
    makeRecord({
      id: '3',
      dataRegistro: '2026-11-14',
      horarioAcionamento: '22:00',
      statusOperacional: 'Em andamento',
      analistaResponsavel: 'Mariana Duarte',
      inc: '',
      tipoLocalidade: 'Linha Férrea',
    }),
  ];

  const aberto = filterAcionamentos(records, { tab: 'aberto' });
  assert.deepEqual(aberto.map((r) => r.id), ['3']);

  const encerrado = filterAcionamentos(records, { tab: 'encerrado' });
  assert.deepEqual(encerrado.map((r) => r.id), ['2']);

  const todos = filterAcionamentos(records, { tab: 'todos' });
  assert.deepEqual(todos.map((r) => r.id), ['2', '1', '3']);

  const comInc = filterAcionamentos(records, { tab: 'todos', incFilter: 'com_inc' });
  assert.deepEqual(comInc.map((r) => r.id), ['1']);

  const semInc = filterAcionamentos(records, { tab: 'todos', incFilter: 'sem_inc' });
  assert.deepEqual(semInc.map((r) => r.id), ['2', '3']);

  const byInc = filterAcionamentos(records, { tab: 'todos', search: 'INC999111' });
  assert.deepEqual(byInc.map((r) => r.id), ['1']);

  const byAnalyst = filterAcionamentos(records, { tab: 'todos', analistaFilter: 'Mariana Duarte' });
  assert.deepEqual(byAnalyst.map((r) => r.id), ['3']);

  const byQuem = filterAcionamentos(records, { tab: 'todos', quemAcionouFilter: 'CCS VLI' });
  assert.deepEqual(byQuem.map((r) => r.id), ['1']);

  const byLocalidade = filterAcionamentos(records, { tab: 'todos', tipoLocalidadeFilter: 'Estação' });
  assert.deepEqual(byLocalidade.map((r) => r.id), ['2']);

  const byTech = filterAcionamentos(records, { tab: 'todos', tecnologiaFilter: 'sim' });
  assert.deepEqual(byTech.map((r) => r.id), ['1']);

  const byReport = filterAcionamentos(records, { tab: 'todos', reportFilter: 'com_report' });
  assert.deepEqual(byReport.map((r) => r.id), ['1']);

  assert.deepEqual(getUniqueFieldValues(records, 'quemAcionou'), ['CCE', 'CCS VLI', 'CPT']);
});

test('INC gaps are not flagged for Sem atendimento, Cancelado, or Informação', () => {
  const records = (['Sem atendimento', 'Cancelado', 'Informação'] as const).map(
    (statusOperacional, index) =>
      makeRecord({ id: String(index), statusOperacional, inc: '' })
  );

  assert.deepEqual(filterAcionamentos(records, { incFilter: 'sem_inc' }), []);
  for (const record of records) {
    assert.equal(isIncRequiredForStatus(record.statusOperacional), false);
    const clipboard = formatAcionamentoClipboardText(record);
    assert.equal(clipboard.includes('Sem INC'), false);
    assert.equal(clipboard.includes('INC:'), false);
  }
});

test('isRelevantReportAcionamento and filterReportAcionamentos isolate Report occurrences cleanly', () => {
  const records = [
    makeRecord({ id: 'r1', statusOperacional: 'Report', numeroReport: 412, inc: 'INC412' }),
    makeRecord({ id: 'r2', statusOperacional: 'Encerrado', numeroReport: 410, inc: '' }),
    makeRecord({ id: 'r3', statusOperacional: 'Report', numeroReport: 411, inc: 'INC411' }),
    makeRecord({ id: 'normal', statusOperacional: 'Em andamento', numeroReport: null, inc: 'INC100' }),
  ];

  assert.equal(isRelevantReportAcionamento(records[0]), true);
  assert.equal(isRelevantReportAcionamento(records[1]), true);
  assert.equal(isRelevantReportAcionamento(records[3]), false);

  assert.deepEqual(
    filterReportAcionamentos(records, { view: 'todos' }).map((r) => r.id),
    ['r1', 'r3', 'r2']
  );
  assert.deepEqual(
    filterReportAcionamentos(records, { view: 'pendentes' }).map((r) => r.id),
    ['r1', 'r3']
  );
  assert.deepEqual(
    filterReportAcionamentos(records, { view: 'concluidos' }).map((r) => r.id),
    ['r2']
  );
  assert.deepEqual(
    filterReportAcionamentos(records, { incFilter: 'sem_inc' }).map((r) => r.id),
    ['r2']
  );
});

test('getUniqueOperators and operatorFilter filter and search by CMS shift operator', () => {
  const records = [
    makeRecord({ id: '1', createdByName: 'Patrícia Nogueira', createdByEmail: 'patricia@cms.local' }),
    makeRecord({ id: '2', createdByName: 'Rafael Siqueira', createdByEmail: 'rafael@cms.local' }),
    makeRecord({ id: '3', createdByName: 'Patrícia Nogueira', createdByEmail: 'patricia@cms.local' }),
  ];

  assert.deepEqual(getUniqueOperators(records), ['Patrícia Nogueira', 'Rafael Siqueira']);

  const byOperatorSelect = filterAcionamentos(records, {
    tab: 'todos',
    operatorFilter: 'Rafael Siqueira',
  });
  assert.deepEqual(byOperatorSelect.map((r) => r.id), ['2']);

  const byOperatorSearch = filterAcionamentos(records, {
    tab: 'todos',
    search: 'patrícia',
  });
  assert.deepEqual(byOperatorSearch.map((r) => r.id), ['1', '3']);
});

test('sortAcionamentosDesc orders by date and time descending', () => {
  const sorted = sortAcionamentosDesc([
    makeRecord({ id: 'a', dataRegistro: '2026-11-14', horarioAcionamento: '23:50' }),
    makeRecord({ id: 'b', dataRegistro: '2026-11-15', horarioAcionamento: '07:00' }),
    makeRecord({ id: 'c', dataRegistro: '2026-11-15', horarioAcionamento: '14:15' }),
  ]);
  assert.deepEqual(sorted.map((r) => r.id), ['c', 'b', 'a']);
});

test('sortAcionamentosAsc and groupAcionamentosByDate order past-to-present chronologically', () => {
  const records = [
    makeRecord({ id: 'c', dataRegistro: '2026-11-15', horarioAcionamento: '14:15', createdByName: 'Rafael Siqueira' }),
    makeRecord({ id: 'a', dataRegistro: '2026-11-14', horarioAcionamento: '23:50', createdByName: 'Patrícia Nogueira' }),
    makeRecord({ id: 'b', dataRegistro: '2026-11-15', horarioAcionamento: '07:00', createdByName: 'Rafael Siqueira' }),
  ];

  const asc = sortAcionamentosAsc(records);
  assert.deepEqual(asc.map((r) => r.id), ['a', 'b', 'c']);

  const continua = filterAcionamentos(records, {
    tab: 'todos',
    sortOrder: 'asc',
  });
  assert.deepEqual(continua.map((r) => r.id), ['a', 'b', 'c']);

  const grouped = groupAcionamentosByDate(continua);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].dateIso, '2026-11-14');
  assert.deepEqual(grouped[0].items.map((r) => r.id), ['a']);
  assert.equal(grouped[1].dateIso, '2026-11-15');
  assert.deepEqual(grouped[1].items.map((r) => r.id), ['b', 'c']);

  assert.equal(formatShortDayHeaderBR('2026-11-15', '2026-11-15'), 'Hoje · 15/11/2026');
  assert.equal(formatShortDayHeaderBR('2026-11-14', '2026-11-15'), 'Ontem · 14/11/2026');
});

test('computeShiftSummary produces dynamic CMS shift summary text', () => {
  const records = [
    makeRecord({ id: '1', statusOperacional: 'Report' }),
    makeRecord({ id: '2', statusOperacional: 'Encerrado' }),
    makeRecord({ id: '3', statusOperacional: 'Encerrado' }),
    makeRecord({ id: '4', statusOperacional: 'Informação' }),
  ];

  const summary = computeShiftSummary(records, {
    dateIso: '2026-11-15',
    shift: { inicio: '07:00', fim: '19:00' },
  });

  assert.equal(summary.total, 4);
  assert.equal(summary.reportsPendentes, 1);
  assert.equal(summary.encerrados, 2);
  assert.equal(summary.outros, 1);
  assert.ok(summary.text.includes('RESUMO DE PLANTÃO — CMS'));
  assert.ok(summary.text.includes('Data: 15/11/2026'));
  assert.ok(summary.text.includes('Turno: 07h às 19h'));
  assert.ok(summary.text.includes('Total de acionamentos: 4'));
});

test('buildAcionamentoTitle and diffAcionamentoFields work as expected', () => {
  const rec = makeRecord();
  assert.equal(buildAcionamentoTitle(rec), 'Atendimento de Segurança — PN inoperante');

  const changed = diffAcionamentoFields(
    rec,
    makeInput({
      statusOperacional: 'Encerrado',
      horarioNormalizacao: '09:15',
      vigilantes: 'Bruno Alves',
    })
  );
  assert.deepEqual(changed, ['Saída do local', 'Vigilante(s)', 'Status operacional']);
});

test('normalizeTime24hOnBlur, overnight computeElapsedMinutes, getRelativeDateRange and clipboard formatting work cleanly', () => {
  assert.equal(normalizeTime24hOnBlur('930'), '09:30');
  assert.equal(normalizeTime24hOnBlur('9:5'), '09:05');
  assert.equal(normalizeTime24hOnBlur('25:00'), '25:00');

  assert.equal(computeElapsedMinutes('09:40', '09:56'), 16);
  assert.equal(computeElapsedMinutes('23:50', '00:15'), 25);
  assert.equal(computeElapsedMinutes('invalid', '09:00'), null);

  assert.equal(formatDurationPT(45), '45 min');
  assert.equal(formatDurationPT(75), '1h 15min');

  assert.deepEqual(getRelativeDateRange(6, '2026-11-16'), {
    from: '2026-11-10',
    to: '2026-11-16',
  });

  const clip = formatAcionamentoClipboardText(
    makeRecord({
      numeroReport: 412,
      createdByName: 'Patrícia Nogueira',
      horarioNormalizacao: '09:15',
    })
  );
  assert.ok(clip.includes('REPORT #412'));
  assert.ok(clip.includes('Operador CMS: Patrícia Nogueira'));
  assert.ok(clip.includes('INC2026000101'));
  assert.ok(clip.includes('Vigilante(s): Carlos Lima, Rafael Costa'));
  assert.ok(clip.includes('Saída 09:15'));

  const byVigilanteSearch = filterAcionamentos(
    [
      makeRecord({ id: 'v1', vigilantes: 'João Pedro' }),
      makeRecord({ id: 'v2', vigilantes: 'Lucas Andrade' }),
    ],
    { tab: 'todos', search: 'joão pedro' }
  );
  assert.deepEqual(byVigilanteSearch.map((r) => r.id), ['v1']);

  const clipNoInc = formatAcionamentoClipboardText(makeRecord({ inc: '' }));
  assert.ok(clipNoInc.includes('INC: Sem INC'));
});

test('filterAcionamentos supports dateExact with chronological ascending order (oldest on top, newest at bottom)', () => {
  const today = '2026-11-16';
  const yesterday = '2026-11-15';

  const mixedRecords = [
    makeRecord({ id: 'y1', dataRegistro: yesterday, horarioAcionamento: '21:45' }),
    makeRecord({ id: 't3', dataRegistro: today, horarioAcionamento: '09:40' }),
    makeRecord({ id: 't1', dataRegistro: today, horarioAcionamento: '06:10' }),
    makeRecord({ id: 'y0', dataRegistro: yesterday, horarioAcionamento: '14:20' }),
    makeRecord({ id: 't2', dataRegistro: today, horarioAcionamento: '08:15' }),
  ];

  // Today's records in asc order: oldest (06:10) at index 0 (top), newest (09:40) at last index (bottom)
  const todayAsc = filterAcionamentos(mixedRecords, {
    dateExact: today,
    sortOrder: 'asc',
  });
  assert.equal(todayAsc.length, 3);
  assert.deepEqual(todayAsc.map((r) => r.id), ['t1', 't2', 't3']);
  assert.equal(todayAsc[0].horarioAcionamento, '06:10'); // oldest at top
  assert.equal(todayAsc[todayAsc.length - 1].horarioAcionamento, '09:40'); // newest at bottom

  // Yesterday's records in asc order: oldest (14:20) at top, newest (21:45) at bottom
  const yesterdayAsc = filterAcionamentos(mixedRecords, {
    dateExact: yesterday,
    sortOrder: 'asc',
  });
  assert.equal(yesterdayAsc.length, 2);
  assert.deepEqual(yesterdayAsc.map((r) => r.id), ['y0', 'y1']);
  assert.equal(yesterdayAsc[0].horarioAcionamento, '14:20');
  assert.equal(yesterdayAsc[yesterdayAsc.length - 1].horarioAcionamento, '21:45');
});
