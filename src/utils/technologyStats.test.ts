import assert from 'node:assert/strict';
import test from 'node:test';
import type { Acionamento } from '../types/acionamento';
import { getTechnologyStats } from './technologyStats';

function makeAcionamento(
  id: string,
  dataRegistro: string,
  tecnologiaUtilizada: string,
  tecnologiaEmpregada = true
): Acionamento {
  return {
    id,
    numeroReport: null,
    dataRegistro,
    dataFim: '',
    horarioAcionamento: '10:00',
    horarioEquipeAcionada: '',
    horarioChegadaCampo: '',
    horarioNormalizacao: '',
    quemAcionou: '',
    tipoLocalidade: 'Estação',
    nomeLocalidade: '',
    kmFerroviario: '',
    housingRh: '',
    municipio: '',
    analistaResponsavel: '',
    descricaoCronologia: '',
    tecnologiaEmpregada,
    tecnologiaUtilizada,
    acoesEnvolvidas: [],
    equipeCampo: '',
    vigilantes: '',
    materialAtivos: '',
    tipificacao: '',
    inc: '',
    statusOperacional: 'Encerrado',
    createdAt: '',
    createdByName: '',
    createdByEmail: '',
    updatedAt: '',
    updatedByName: '',
    updatedByEmail: '',
  };
}

test('last 30 days includes the start and current dates and ignores records without technology', () => {
  const stats = getTechnologyStats(
    [
      makeAcionamento('before', '2025-01-11', 'Drone'),
      makeAcionamento('start', '2025-01-12', 'Drone'),
      makeAcionamento('today', '2025-02-10', 'Câmera'),
      makeAcionamento('no-tech', '2025-02-10', '', true),
      makeAcionamento('not-used', '2025-02-10', 'Tags', false),
    ],
    'last30days',
    new Date(2025, 1, 10, 12)
  );

  assert.deepEqual(stats.data, [
    { label: 'Câmera', total: 1 },
    { label: 'Drone', total: 1 },
  ]);
  assert.equal(stats.total, 2);
});

test('monthly stats group technology counts across the latest 12 months', () => {
  const stats = getTechnologyStats(
    [
      makeAcionamento('old', '2024-03-31', 'Tags'),
      makeAcionamento('first-month', '2024-04-01', 'Tags'),
      makeAcionamento('current-a', '2025-03-01', 'Drone'),
      makeAcionamento('current-b', '2025-03-10', 'Drone'),
    ],
    'monthly',
    new Date(2025, 2, 15, 12)
  );

  assert.equal(stats.data.length, 12);
  assert.equal(stats.data[0].label, 'abr/24');
  assert.equal(stats.data[11].label, 'mar/25');
  assert.equal(stats.data[0].Tags, 1);
  assert.equal(stats.data[11].Drone, 2);
  assert.equal(stats.total, 3);
});
