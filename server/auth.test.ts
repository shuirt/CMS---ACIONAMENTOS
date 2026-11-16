import test from 'node:test';
import assert from 'node:assert/strict';
import { isEmailAllowed, parseAllowedEmails } from './auth';

test('parseAllowedEmails splits comma, semicolon and whitespace cleanly', () => {
  const parsed = parseAllowedEmails(' Operador1@CMS.com, operador2@cms.com; SUPERVISOR@cms.com ');
  assert.deepEqual(parsed, [
    'operador1@cms.com',
    'operador2@cms.com',
    'supervisor@cms.com',
  ]);
  assert.deepEqual(parseAllowedEmails(undefined), []);
  assert.deepEqual(parseAllowedEmails('   '), []);
});

test('isEmailAllowed enforces case-insensitive allowlist and denies empty lists', () => {
  const list = parseAllowedEmails('alice@empresa.com,bob@empresa.com');
  assert.equal(isEmailAllowed('ALICE@EMPRESA.COM', list), true);
  assert.equal(isEmailAllowed('eve@empresa.com', list), false);
  assert.equal(isEmailAllowed('alice@empresa.com', []), false);
});
