// js/games/logic/spell-logic.js
import { shuffle } from './round-utils.js';

// Shuffled tiles for the letter bank — a permutation of the word's letters
// (duplicates preserved, e.g. PUFFIN keeps both F).
export function letterBank(word, rng) {
  return shuffle(word.split(''), rng);
}

// Next word: avoid the word just played; prefer words not yet completed this
// session (variety) and fall back to the full set once everything is done.
// pool items are { word, animal }; done is a Set of word strings.
export function pickWord(pool, done, lastWord, rng) {
  const lastStr = lastWord && lastWord.word;
  const notLast = pool.filter(w => w.word !== lastStr);
  const candidates = notLast.length ? notLast : pool;
  const fresh = candidates.filter(w => !done.has(w.word));
  const from = fresh.length ? fresh : candidates;
  return from[Math.floor(rng() * from.length)];
}

// slots: array of { filled } — solved when every slot is filled.
export function isSolved(slots) {
  return slots.every(s => s.filled);
}
