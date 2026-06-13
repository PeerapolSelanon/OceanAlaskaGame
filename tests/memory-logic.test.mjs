// tests/memory-logic.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../js/games/logic/round-utils.js';
import { dealBoard, levelPairs, nextLevel, isCleared } from '../js/games/logic/memory-logic.js';

const POOL = ['orca', 'seal', 'crab', 'puffin', 'salmon', 'otter', 'shark', 'jelly'];

test('dealBoard: จำนวนใบ = pairs*2 และแต่ละ id มี 2 ใบพอดี', () => {
  const cards = dealBoard(POOL, 3, mulberry32(1));
  assert.equal(cards.length, 6);
  const counts = {};
  for (const c of cards) counts[c.id] = (counts[c.id] || 0) + 1;
  const ids = Object.keys(counts);
  assert.equal(ids.length, 3);
  for (const id of ids) assert.equal(counts[id], 2, id);
});

test('dealBoard: key ไม่ซ้ำ (อ้างอิงรายใบได้)', () => {
  const cards = dealBoard(POOL, 4, mulberry32(2));
  const keys = cards.map(c => c.key);
  assert.equal(new Set(keys).size, cards.length);
});

test('dealBoard: ทุกใบ matched=false ตอนแจก', () => {
  const cards = dealBoard(POOL, 2, mulberry32(3));
  assert.ok(cards.every(c => c.matched === false));
});

test('levelPairs: 2,3,4,6 และ cap', () => {
  assert.equal(levelPairs(0), 2);
  assert.equal(levelPairs(1), 3);
  assert.equal(levelPairs(2), 4);
  assert.equal(levelPairs(3), 6);
  assert.equal(levelPairs(9), 6); // cap
});

test('nextLevel: ครบ 2 รอบติด → level+1, รีเซ็ต streak', () => {
  let s = { level: 0, streak: 0 };
  s = nextLevel(s, true); // streak 1
  assert.deepEqual(s, { level: 0, streak: 1 });
  s = nextLevel(s, true); // ครบ 2 → level 1
  assert.deepEqual(s, { level: 1, streak: 0 });
});

test('nextLevel: ไม่เลื่อนถ้า cleared=false, ไม่ลดระดับ, cap 3', () => {
  assert.deepEqual(nextLevel({ level: 1, streak: 1 }, false), { level: 1, streak: 1 });
  let s = { level: 3, streak: 1 };
  s = nextLevel(s, true); // ครบ 2 แต่ cap
  assert.equal(s.level, 3);
});

test('isCleared: จริงเมื่อทุกใบ matched', () => {
  assert.equal(isCleared([{ matched: true }, { matched: true }]), true);
  assert.equal(isCleared([{ matched: true }, { matched: false }]), false);
});
