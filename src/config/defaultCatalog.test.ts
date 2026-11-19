import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INITIAL_CONFIG_OPTIONS,
  buildCatalogFromOptions,
  synchronizeEquipeCampoOptions,
} from './defaultCatalog';

test('a configured list with no active options stays empty instead of reverting to defaults', () => {
  const options = INITIAL_CONFIG_OPTIONS.map((option) =>
    option.grupo === 'analista' ? { ...option, ativo: false } : option
  );

  const catalog = buildCatalogFromOptions(options);

  assert.deepEqual(catalog.analistas, []);
});

test('equipe de campo synchronization activates only the requested options and preserves history', () => {
  const legacyOption = {
    chave: 'eq_legacy',
    grupo: 'equipe_campo' as const,
    valor: 'Equipe antiga',
    ativo: true,
    ordem: 1,
  };
  const requestedOption = INITIAL_CONFIG_OPTIONS.find(
    (option) => option.grupo === 'equipe_campo' && option.valor === 'Ronda RH07'
  );
  const unrelatedOption = INITIAL_CONFIG_OPTIONS.find((option) => option.grupo === 'analista');
  assert.ok(requestedOption);
  assert.ok(unrelatedOption);
  const disabledRequestedOption = { ...requestedOption, ativo: false, ordem: 99 };
  const synchronized = synchronizeEquipeCampoOptions([
    legacyOption,
    disabledRequestedOption,
    unrelatedOption,
  ]);
  const requestedEquipeOptions = [
    'Monitoramento Remoto (CMS)',
    'Ronda RH03',
    'Ronda RH07',
    'Ronda João Neiva',
    'Mot. Colatina',
    'Mot. Aimorés',
    'Mot. Conselheiro Pena',
    'Mot. Gov. Valadares 51/52',
    'Mot. Gov. Valadares',
    'Mot. Cachoeira Escura',
    'Mot. Ipatinga',
    'Mot. Nova Era',
    'Mot. Itabira',
    'Mot. Santa Barbara',
    'PN Gongo Soco',
    'Fixo Mariana',
    'Fixo Est. Ouro Preto',
    'Mot. BH',
    'Fixo Pátio Dois',
    'Fixo Mário Carvalho',
    'Fixo EBH',
    'Fixo Pátio Funil',
  ];
  const actualDefaultEquipeOptions = INITIAL_CONFIG_OPTIONS.filter(
    (option) => option.grupo === 'equipe_campo'
  ).map((option) => option.valor);

  assert.deepEqual(actualDefaultEquipeOptions, requestedEquipeOptions);
  assert.deepEqual(buildCatalogFromOptions(synchronized).equipesCampo, requestedEquipeOptions);
  assert.equal(synchronized.find((option) => option.chave === 'eq_legacy')?.ativo, false);
  assert.equal(synchronized.find((option) => option.chave === unrelatedOption.chave)?.ativo, true);
  assert.deepEqual(synchronizeEquipeCampoOptions(synchronized), synchronized);
});
