// Deterministic PRNG so logic is unit-testable.
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rng = Math.random) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Note: returns fewer than n items if n > pool.length — callers must size n to the pool.
export function sample(pool, n, rng = Math.random) {
  return shuffle(pool, rng).slice(0, n);
}

// Shadow Match: n animals + the same ids shuffled separately for shadow slots.
export function pickRound(pool, n, rng = Math.random) {
  const animals = sample(pool, n, rng);
  return { animals, shadows: shuffle(animals, rng) };
}

// Listen & Find: n choices, one of which is the spoken target.
export function pickQuestion(pool, n, rng = Math.random) {
  const choices = sample(pool, n, rng);
  const target = choices[Math.floor(rng() * choices.length)];
  return { target, choices };
}
