import assert from 'node:assert/strict';
import test from 'node:test';
import { createDemoWorkspace } from './demoData';
import { DemoAcionamentoRepository } from '../services/repository';

test('demo workspace starts without sample records', () => {
  const workspace = createDemoWorkspace();

  assert.deepEqual(workspace.acionamentos, []);
  assert.deepEqual(workspace.iniciativas, []);
  assert.deepEqual(workspace.reports, []);
  assert.deepEqual(workspace.auditoria, []);
  assert.equal(workspace.nextReportNumber, 1);
  assert.equal(workspace.nextIniciativaNumber, 1);
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
