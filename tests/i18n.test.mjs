import { test } from 'node:test';
import assert from 'node:assert/strict';
import { t, getLang, setLang, toggleLang } from '../js/core/i18n.js';

test('t() returns Thai by default and English after toggle', () => {
  setLang('th');
  assert.equal(t('appTitle'), 'ทะเลอลาสก้าของหนู');
  toggleLang();
  assert.equal(getLang(), 'en');
  assert.equal(t('appTitle'), 'My Alaska Ocean');
  setLang('th');
});

test('t() falls back to key when string missing', () => {
  assert.equal(t('no-such-key'), 'no-such-key');
});
