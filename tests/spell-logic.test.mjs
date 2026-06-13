// tests/spell-logic.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../js/games/logic/round-utils.js';
import { letterBank, pickWord, isSolved } from '../js/games/logic/spell-logic.js';

const sorted = s => [...s].sort().join('');

test('letterBank: เป็น permutation ของตัวอักษรในคำ (รวมตัวซ้ำ)', () => {
  const bank = letterBank('PUFFIN', mulberry32(1));
  assert.equal(bank.length, 6);
  assert.equal(sorted(bank), sorted('PUFFIN'));
});

test('pickWord: เลี่ยงคำล่าสุด', () => {
  const pool = [{ word: 'CRAB' }, { word: 'ORCA' }, { word: 'SEAL' }];
  const last = pool[0];
  for (let seed = 1; seed <= 20; seed++) {
    const w = pickWord(pool, new Set(), last, mulberry32(seed));
    assert.notEqual(w.word, 'CRAB', `seed ${seed}`);
  }
});

test('pickWord: เลือกคำที่ยังไม่ done ก่อน', () => {
  const pool = [{ word: 'CRAB' }, { word: 'ORCA' }, { word: 'SEAL' }];
  const done = new Set(['CRAB', 'SEAL']);
  const w = pickWord(pool, done, null, mulberry32(3));
  assert.equal(w.word, 'ORCA');
});

test('pickWord: ทำครบทุกคำแล้ว fallback เลือกได้จากทั้งหมด (ยังเลี่ยงคำล่าสุด)', () => {
  const pool = [{ word: 'CRAB' }, { word: 'ORCA' }];
  const done = new Set(['CRAB', 'ORCA']);
  const w = pickWord(pool, done, pool[0], mulberry32(2));
  assert.equal(w.word, 'ORCA');
});

test('pickWord: pool เดียวคืนตัวนั้นแม้เท่าคำล่าสุด', () => {
  const pool = [{ word: 'CRAB' }];
  assert.equal(pickWord(pool, new Set(), pool[0], mulberry32(1)).word, 'CRAB');
});

test('isSolved: จริงเมื่อทุกช่อง filled', () => {
  assert.equal(isSolved([{ filled: true }, { filled: true }]), true);
  assert.equal(isSolved([{ filled: true }, { filled: false }]), false);
});
