import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeQuestion, nextDifficulty } from '../js/games/logic/count-logic.js';
import { mulberry32 } from '../js/games/logic/round-utils.js';

test('makeQuestion: count within [1, maxN], 3 unique positive choices including count', () => {
  for (let seed = 0; seed < 50; seed++) {
    const rng = mulberry32(seed);
    const q = makeQuestion(5, rng);
    assert.ok(q.count >= 1 && q.count <= 5);
    assert.equal(q.choices.length, 3);
    assert.ok(q.choices.includes(q.count));
    assert.equal(new Set(q.choices).size, 3);
    q.choices.forEach(c => assert.ok(c >= 1, `choice ${c} must be >= 1`));
  }
});

test('nextDifficulty: 3 correct in a row raises maxN up to 10', () => {
  let s = { maxN: 3, streak: 0, misses: 0 };
  s = nextDifficulty(s, true); s = nextDifficulty(s, true);
  assert.equal(s.maxN, 3);
  s = nextDifficulty(s, true);
  assert.equal(s.maxN, 4);
  assert.equal(s.streak, 0);
  for (let i = 0; i < 30; i++) s = nextDifficulty(s, true);
  assert.equal(s.maxN, 10);
});

test('nextDifficulty: 2 misses in a row lowers maxN but never below 3', () => {
  let s = { maxN: 4, streak: 2, misses: 0 };
  s = nextDifficulty(s, false);
  assert.equal(s.streak, 0);
  assert.equal(s.maxN, 4);
  s = nextDifficulty(s, false);
  assert.equal(s.maxN, 3);
  s = nextDifficulty(s, false); s = nextDifficulty(s, false);
  assert.equal(s.maxN, 3);
});
