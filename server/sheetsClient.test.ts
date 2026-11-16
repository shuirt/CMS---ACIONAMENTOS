import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACIONAMENTOS_HEADERS,
  AUDITORIA_HEADERS,
  CONFIG_HEADERS,
  deserializeAcionamentoRow,
  deserializeAuditoriaRow,
  deserializeConfigRow,
  serializeAcionamentoRow,
  serializeAuditoriaRow,
  serializeConfigRow,
} from './sheetsClient';
import type { Acionamento, AuditoriaEntry, ConfigOption } from '../src/types/acionamento';

test('Acionamento row serialization and deserialization round-trips losslessly', () => {
  const original: Acionamento = {
    id: 'a7b9f8c2-1111-4444-8888-999999999999',
    numeroReport: 42,
    dataRegistro: '2026-11-15',
    dataFim: '2026-11-16',
    horarioAcionamento: '14:20',
    horarioEquipeAcionada: '14:23',
    horarioChegadaCampo: '14:35',
    horarioNormalizacao: '',
    quemAcionou: 'Jocimar (CCS VLI)',
    tipoLocalidade: 'Pátio',
    kmFerroviario: 'KM 12+400',
    housingRh: 'EH01/04',
    municipio: 'Vitória (ES)',
    analistaResponsavel: 'Carlos Mendes',
    descricaoCronologia: '14:20 - Alarme no pátio.\n14:23 - Equipe despachada.',
    tecnologiaEmpregada: true,
    tecnologiaUtilizada: 'Drone Vigilância',
    acoesEnvolvidas: ['Houve abordagem', 'Apuração de imagens'],
    equipeCampo: 'Motorizado BH',
    vigilantes: 'Bruno Alves, Marcos Souza',
    materialAtivos: 'Semáforo apagado',
    tipificacao: 'Falha Operacional',
    inc: 'INC2026998877',
    statusOperacional: 'Report',
    createdAt: '2026-11-15T17:20:00.000Z',
    createdByName: 'Operador A',
    createdByEmail: 'a@cms.com',
    updatedAt: '2026-11-15T17:35:00.000Z',
    updatedByName: 'Operador B',
    updatedByEmail: 'b@cms.com',
  };

  const row = serializeAcionamentoRow(original);
  assert.equal(row.length, ACIONAMENTOS_HEADERS.length);
  const decoded = deserializeAcionamentoRow(row);
  assert.deepEqual(decoded, original);

  // Backwards-compatibility with legacy 28-column and 29-column rows
  const legacy28 = deserializeAcionamentoRow(row.slice(0, 28));
  assert.equal(legacy28?.equipeCampo, 'Motorizado BH');
  assert.equal(legacy28?.vigilantes, '');
  assert.equal(legacy28?.dataFim, '');

  const legacy29 = deserializeAcionamentoRow(row.slice(0, 29));
  assert.equal(legacy29?.vigilantes, 'Bruno Alves, Marcos Souza');
  assert.equal(legacy29?.dataFim, '');
});

test('Config and Auditoria row serialization round-trip properly', () => {
  const opt: ConfigOption = {
    chave: 'mun_serra',
    grupo: 'municipio',
    valor: 'Serra (ES)',
    ativo: true,
    ordem: 4,
  };
  const optRow = serializeConfigRow(opt);
  assert.equal(optRow.length, CONFIG_HEADERS.length);
  assert.deepEqual(deserializeConfigRow(optRow), opt);

  const audit: AuditoriaEntry = {
    idAuditoria: 'aud-1',
    dataHora: '2026-11-15T18:00:00.000Z',
    idAcionamento: 'uuid-1',
    tipoOperacao: 'edição',
    usuarioResponsavel: 'Operador A',
    emailUsuario: 'a@cms.com',
    camposAlterados: 'Status operacional, Normalização',
  };
  const auditRow = serializeAuditoriaRow(audit);
  assert.equal(auditRow.length, AUDITORIA_HEADERS.length);
  assert.deepEqual(deserializeAuditoriaRow(auditRow), audit);
});
