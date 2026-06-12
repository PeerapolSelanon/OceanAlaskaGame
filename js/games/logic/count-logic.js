// Pure difficulty + question generation for Count & Tap.

export function makeQuestion(maxN, rng = Math.random) {
  const count = 1 + Math.floor(rng() * maxN);
  const choices = new Set([count]);
  while (choices.size < 3) {
    const offset = 1 + Math.floor(rng() * 2); // 1 or 2
    const sign = rng() < 0.5 ? -1 : 1;
    const candidate = count + sign * offset;
    if (candidate >= 1 && candidate <= 12) choices.add(candidate);
  }
  // shuffle the three choices deterministically with rng
  const arr = [...choices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return { count, choices: arr };
}

export function nextDifficulty(state, correct) {
  let { maxN, streak, misses } = state;
  if (correct) {
    streak += 1; misses = 0;
    if (streak >= 3) { maxN = Math.min(10, maxN + 1); streak = 0; }
  } else {
    streak = 0; misses += 1;
    if (misses >= 2) { maxN = Math.max(3, maxN - 1); misses = 0; }
  }
  return { maxN, streak, misses };
}
