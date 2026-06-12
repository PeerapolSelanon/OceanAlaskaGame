import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, shuffle, sample, pickRound, pickQuestion } from '../js/games/logic/round-utils.js';

const IDS = ['orca', 'humpback', 'seal', 'otter', 'sealion', 'puffin', 'salmon', 'crab'];

test('mulberry32 is deterministic', () => {
  const a = mulberry32(42), b = mulberry32(42);
  assert.equal(a(), b());
  assert.ok(a() >= 0 && a() < 1);
});

test('shuffle keeps all elements', () => {
  const rng = mulberry32(1);
  const out = shuffle([1, 2, 3, 4, 5], rng);
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
});

test('sample returns n unique items from pool', () => {
  const rng = mulberry32(7);
  const out = sample(IDS, 4, rng);
  assert.equal(out.length, 4);
  assert.equal(new Set(out).size, 4);
  out.forEach(x => assert.ok(IDS.includes(x)));
});

test('pickRound returns same ids in animals and shadows', () => {
  const rng = mulberry32(3);
  const { animals, shadows } = pickRound(IDS, 3, rng);
  assert.equal(animals.length, 3);
  assert.deepEqual([...animals].sort(), [...shadows].sort());
});

test('pickQuestion target is among choices', () => {
  const rng = mulberry32(9);
  const { target, choices } = pickQuestion(IDS, 4, rng);
  assert.equal(choices.length, 4);
  assert.ok(choices.includes(target));
  assert.equal(new Set(choices).size, 4);
});
