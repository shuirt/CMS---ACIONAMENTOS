import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_CONFIG_OPTIONS, buildCatalogFromOptions } from './defaultCatalog';

test('a configured list with no active options stays empty instead of reverting to defaults', () => {
  const options = INITIAL_CONFIG_OPTIONS.map((option) =>
    option.grupo === 'analista' ? { ...option, ativo: false } : option
  );

  const catalog = buildCatalogFromOptions(options);

  assert.deepEqual(catalog.analistas, []);
});
