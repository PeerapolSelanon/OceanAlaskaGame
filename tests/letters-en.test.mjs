import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS_EN } from '../js/games/data/letters-en.js';
import { byId } from '../js/core/animals.js';

test('มีครบ 26 ตัวเรียง A-Z', () => {
  assert.equal(LETTERS_EN.length, 26);
  assert.deepEqual(LETTERS_EN.map(l => l.char).join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
});

test('ทุกตัวมี name/word สองภาษา และ strokes เป็น path ที่ขึ้นต้นด้วย M', () => {
  for (const l of LETTERS_EN) {
    assert.ok(l.name.th && l.name.en, l.char);
    assert.ok(l.word.th && l.word.en, l.char);
    assert.equal(l.viewBox, '0 0 100 120', `${l.char} viewBox`);
    assert.ok(l.strokes.length >= 1, l.char);
    for (const s of l.strokes) assert.match(s, /^M /, `${l.char}: "${s}"`);
    assert.ok(l.art === null || typeof l.art === 'function', l.char);
  }
});

test('art ใช้สัตว์ที่มีจริงในทะเบียน', () => {
  const withArt = LETTERS_EN.filter(l => l.art);
  assert.equal(withArt.length, 5);
  for (const id of ['crab', 'humpback', 'orca', 'puffin', 'salmon']) assert.ok(byId(id), id);
});
