import { test } from 'node:test';
import assert from 'node:assert/strict';
import { get, set } from '../js/core/settings.js';

test('returns default when key missing', () => {
  assert.equal(get('missing-key', 'fallback'), 'fallback');
});

test('round-trips values', () => {
  set('lang', 'en');
  assert.equal(get('lang', 'th'), 'en');
  set('soundOn', false);
  assert.equal(get('soundOn', true), false);
});
