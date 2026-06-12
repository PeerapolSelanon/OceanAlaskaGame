import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickVoiceFrom } from '../js/core/audio.js';

const v = (lang, name) => ({ lang, name });

test('finds th-TH voice for th', () => {
  const voices = [v('en-US', 'Zira'), v('th-TH', 'Pattaree')];
  assert.equal(pickVoiceFrom(voices, 'th').name, 'Pattaree');
});

test('matches underscore and case variants', () => {
  assert.equal(pickVoiceFrom([v('th_TH', 'Kanya')], 'th').name, 'Kanya');
  assert.equal(pickVoiceFrom([v('TH-TH', 'Niwat')], 'th').name, 'Niwat');
});

test('returns null when no match or empty', () => {
  assert.equal(pickVoiceFrom([v('en-US', 'Zira')], 'th'), null);
  assert.equal(pickVoiceFrom([], 'en'), null);
});

test('does not false-match languages sharing a prefix letter', () => {
  // 'en' must not match 'es-ES'; 'th' must not match 'tr-TR'
  assert.equal(pickVoiceFrom([v('es-ES', 'Monica')], 'en'), null);
  assert.equal(pickVoiceFrom([v('tr-TR', 'Filiz')], 'th'), null);
});
