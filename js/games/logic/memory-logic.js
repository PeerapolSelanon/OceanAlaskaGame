// js/games/logic/memory-logic.js
import { shuffle, sample } from './round-utils.js';

const PAIRS_BY_LEVEL = [2, 3, 4, 6];

// คู่ตามระดับ (0-based), cap ที่ระดับสูงสุด
export function levelPairs(level) {
  return PAIRS_BY_LEVEL[Math.min(level, PAIRS_BY_LEVEL.length - 1)];
}

// แจกกระดาน: สุ่ม `pairs` สัตว์จาก pool, สำเนาเป็นคู่, สับลำดับ.
// แต่ละใบมี key เอกลักษณ์เพื่ออ้างอิงรายใบ (สองใบ id เดียวกันไม่ชนกัน).
export function dealBoard(pool, pairs, rng) {
  const ids = sample(pool, pairs, rng);
  const deck = [];
  ids.forEach((id, i) => {
    deck.push({ id, key: i * 2, matched: false });
    deck.push({ id, key: i * 2 + 1, matched: false });
  });
  return shuffle(deck, rng);
}

// เลื่อนระดับเมื่อจับครบ (cleared) ติดกัน 2 รอบ; ไม่ลดระดับ; cap.
export function nextLevel(state, cleared) {
  if (!cleared) return state;
  const streak = state.streak + 1;
  if (streak >= 2) {
    return { level: Math.min(state.level + 1, PAIRS_BY_LEVEL.length - 1), streak: 0 };
  }
  return { level: state.level, streak };
}

export function isCleared(cards) {
  return cards.every(c => c.matched);
}
