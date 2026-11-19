import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoWorkspace } from './demoData';
import { parseCsvDemoAcionamentos } from './csvDemoSeed';
import { DemoAcionamentoRepository } from '../services/repository';
import { getTechnologyStats } from '../utils/technologyStats';

test('demo workspace starts without sample records', () => {
  const workspace = createDemoWorkspace();

  assert.deepEqual(workspace.acionamentos, []);
  assert.deepEqual(workspace.iniciativas, []);
  assert.deepEqual(workspace.reports, []);
  assert.deepEqual(workspace.auditoria, []);
  assert.equal(workspace.nextReportNumber, 1);
  assert.equal(workspace.nextIniciativaNumber, 1);
});

test('CSV rows become detailed demo acionamentos while default demo data stays empty', () => {
  const headers = Array.from({ length: 23 }, (_, index) => `Campo ${index}`);
  const firstRow = Array.from({ length: 23 }, () => '');
  firstRow[0] = 'Operador Teste';
  firstRow[1] = '08:30';
  firstRow[2] = '17-Nov-2026';
  firstRow[3] = '18-Nov-2026';
  firstRow[4] = 'CCS VLI';
  firstRow[5] = 'Descrição da ocorrência;\ncontinuação';
  firstRow[6] = 'Analista Teste';
  firstRow[7] = 'Equipe Teste';
  firstRow[8] = '08:45';
  firstRow[9] = '09:00';
  firstRow[10] = '10:15';
  firstRow[11] = 'KM 20';
  firstRow[12] = 'RH01';
  firstRow[14] = 'Itabira';
  firstRow[15] = 'Material teste';
  firstRow[16] = 'Câmera (TA)';
  firstRow[17] = 'Sim';
  firstRow[18] = 'Não';
  firstRow[19] = 'Sim';
  firstRow[20] = 'Tipificação teste';
  firstRow[21] = 'INC123456';
  firstRow[22] = 'Encerrado';

  const secondRow = Array.from({ length: 23 }, () => '');
  secondRow[0] = 'Outro Operador';
  secondRow[1] = '09:15';
  secondRow[2] = '18-Nov-2026';
  secondRow[4] = 'CCE';
  secondRow[16] = 'Não';
  secondRow[22] = 'Sem Atendimento';

  const quoteCsvCell = (value: string) =>
    value.includes(';') || value.includes('"') || value.includes('\n')
      ? `"${value.replace(/"/g, '""')}"`
      : value;
  const csv = [headers, firstRow, secondRow]
    .map((row) => row.map(quoteCsvCell).join(';'))
    .join('\r\n');
  const acionamentos = parseCsvDemoAcionamentos(csv);
  const stats = getTechnologyStats(
    acionamentos,
    'last30days',
    new Date(2026, 10, 18, 12)
  );

  assert.equal(acionamentos.length, 2);
  assert.equal(acionamentos[0].quemAcionou, 'CCS VLI');
  assert.equal(acionamentos[0].descricaoCronologia, 'Descrição da ocorrência;\ncontinuação');
  assert.equal(acionamentos[0].tipificacao, 'Tipificação teste');
  assert.deepEqual(acionamentos[0].acoesEnvolvidas, [
    'Apuração de imagens',
    'Envolvimento do analista',
  ]);
  assert.equal(acionamentos[1].statusOperacional, 'Sem atendimento');
  assert.deepEqual(stats.data, [{ label: 'Câmera (TA)', total: 1 }]);
  assert.equal(createDemoWorkspace().acionamentos.length, 0);
});

test('demo configuration changes update the dropdown catalog', async () => {
  const repository = new DemoAcionamentoRepository();
  const created = await repository.createConfigOption({
    grupo: 'analista',
    valor: 'Analista de teste',
  });
  const option = created.workspace.configOptions.find((item) => item.valor === 'Analista de teste');

  assert.ok(option);
  assert.ok(created.workspace.catalog.analistas.includes('Analista de teste'));

  const updated = await repository.updateConfigOption(option.chave, {
    valor: option.valor,
    ativo: false,
    ordem: option.ordem,
  });
  assert.ok(!updated.workspace.catalog.analistas.includes('Analista de teste'));
});
