// tests/spell-words.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPELL_WORDS } from '../js/games/data/spell-words.js';
import { byId } from '../js/core/animals.js';

test('ทุกคำเป็นตัวพิมพ์ใหญ่ A-Z ยาว >= 3 และสัตว์ resolve ได้', () => {
  assert.ok(SPELL_WORDS.length >= 5);
  for (const e of SPELL_WORDS) {
    assert.match(e.word, /^[A-Z]+$/, e.word);
    assert.ok(e.word.length >= 3, e.word);
    assert.ok(byId(e.animal), `animal ${e.animal} (word ${e.word})`);
  }
});

test('เรียงตามความยาวไม่ลดลง (สั้น→ยาว)', () => {
  for (let i = 1; i < SPELL_WORDS.length; i++) {
    assert.ok(SPELL_WORDS[i].word.length >= SPELL_WORDS[i - 1].word.length,
      `${SPELL_WORDS[i - 1].word} -> ${SPELL_WORDS[i].word}`);
  }
});
