# Skill-Shelf Hub + Trace Letters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เปลี่ยน hub เป็นชั้นวางตามทักษะ (เลื่อนได้) และเพิ่มเกมที่ 5 "วาดตามรอย" — ลากนิ้วตามเส้นประตัวอักษร A-Z นำทีละเส้นตามลำดับขีด พร้อมฉลองคำศัพท์สองภาษา

**Architecture:** ตามสเปก `docs/superpowers/specs/2026-06-13-skill-hub-and-trace-letters-design.md` — hub อ่านทะเบียน `SHELVES` + ฟิลด์ `shelf` ต่อเกม; เกมวาดตามรอยแยกเป็น engine ตรวจการลาก (pure, ทดสอบได้), ข้อมูลตัวอักษรต่อชุดภาษา (A-Z ก่อน), และ scene 2 จอ (เลือกตัวอักษร / วาด) ใช้ interface `{init(container, go), destroy()}` เดิม

**Tech Stack:** Vanilla JS ES modules + SVG ใน DOM, Web Speech API + Web Audio (ของเดิม), `node --test`, ไม่มี dependency ใหม่

**กฎที่ห้ามละเมิด (จาก CLAUDE.md/PRODUCT.md เดิม):** Pointer Events เท่านั้น · เป้าแตะเด็ก ≥80px · ไม่มีแพ้/ไม่มีเสียงเชิงลบ · ทุกคำสั่งมีเสียงพูด · timers เข้า `_timers[]` ล้างใน destroy + `speechSynthesis.cancel()` · สี UI ใช้ `var(--token)` ห้าม hex (ยกเว้นงานศิลป์)

---

## File Structure

| ไฟล์ | บทบาท |
|---|---|
| Create `js/games/logic/trace-logic.js` | pure logic ตรวจความคืบหน้าการลาก (advance/isNearStart/isComplete) |
| Create `tests/trace-logic.test.mjs` | เทสต์ logic |
| Create `js/games/data/letters-en.js` | ข้อมูล A-Z: ชื่อ คำศัพท์ TH/EN เส้นขีดเรียงลำดับ art (optional) |
| Create `tests/letters-en.test.mjs` | เทสต์รูปร่างข้อมูล |
| Create `js/games/trace-letters.js` | scene เกม (จอเลือก + จอวาด) |
| Modify `js/core/ui.js` | เพิ่ม `onTap()` (แตะจริง ≠ ลากเลื่อน) |
| Modify `js/core/i18n.js` | key ชื่อชั้น 3 + ข้อความเกมใหม่ |
| Modify `js/hub.js` | SHELVES + เรนเดอร์ชั้นแทน grid 2×2 |
| Modify `css/main.css` | สไตล์ชั้นวาง + จุดเริ่มกะพริบ |
| Modify `js/main.js` | ลงทะเบียน scene `trace-letters` |
| Modify `DESIGN.md` | sun-gold เพิ่มบทบาท accent ของเกมวาดตามรอย |

---

### Task 1: Trace Logic (pure, TDD)

**Files:**
- Create: `js/games/logic/trace-logic.js`
- Test: `tests/trace-logic.test.mjs`

- [ ] **Step 1: เขียนเทสต์ (ต้อง fail ก่อน)**

```js
// tests/trace-logic.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, isNearStart, isComplete } from '../js/games/logic/trace-logic.js';

// เส้นตรงแนวนอน 21 จุด ห่างจุดละ 6: x = 0,6,12,...,120
const line = Array.from({ length: 21 }, (_, i) => ({ x: i * 6, y: 0 }));

test('advance: กินจุดต่อเนื่องที่อยู่ในระยะ tolerance ของนิ้ว', () => {
  // นิ้วที่ x=30 (tol 45) → จุดไกลสุดที่ระยะ ≤45 คือ x=72 (index 12); x=78 ห่าง 48 หยุด
  assert.equal(advance(line, 0, { x: 30, y: 0 }, 45), 12);
});

test('advance: ลากเร็วข้ามหลายจุดใน move เดียวก็คืบหน้า — แต่โดดข้ามช่วงไกลไม่ได้', () => {
  // จาก index 0 นิ้วอยู่ x=100: จุดถัดไป x=6 ห่าง 94 > 45 → ไม่ขยับ (กันการกระโดดข้ามเส้น)
  assert.equal(advance(line, 0, { x: 100, y: 0 }, 45), 0);
  // แต่ถ้าไล่มาถึง index 9 (x=54) แล้วนิ้วพุ่งไป x=100: จุด x=60..120 ห่าง ≤45 ต่อเนื่อง → ไปจุดสุดท้าย
  assert.equal(advance(line, 9, { x: 100, y: 0 }, 45), 20);
});

test('advance: นิ้วออกนอกเส้นเกิน tolerance ไม่คืบหน้า (ไม่มีโทษ)', () => {
  assert.equal(advance(line, 5, { x: 40, y: 60 }, 45), 5);
});

test('advance: ลากย้อนทิศไม่คืบหน้า', () => {
  assert.equal(advance(line, 12, { x: 0, y: 0 }, 45), 12);
});

test('isNearStart: ในรัศมีเริ่มได้ นอกรัศมีไม่ได้', () => {
  assert.equal(isNearStart(line, { x: 20, y: 20 }, 50), true);  // ห่าง ~28
  assert.equal(isNearStart(line, { x: 60, y: 0 }, 50), false);  // ห่าง 60
});

test('isComplete: ยอมขาดปลายตาม endSlack', () => {
  assert.equal(isComplete(line, 18, 2), true);   // 18 ≥ 20-2
  assert.equal(isComplete(line, 17, 2), false);
  assert.equal(isComplete(line, 20, 0), true);
});
```

- [ ] **Step 2: รันให้เห็นว่า fail**

Run: `node --test tests/trace-logic.test.mjs`
Expected: FAIL (Cannot find module '../js/games/logic/trace-logic.js')

- [ ] **Step 3: เขียน implementation**

```js
// js/games/logic/trace-logic.js
// Pure tracing-progress logic. The scene samples each stroke's SVG path into
// {x, y} points (~6 units apart) and feeds finger positions here.

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// Generous circle around the stroke's first point.
export function isNearStart(points, finger, startRadius) {
  return dist(points[0], finger) <= startRadius;
}

// Consume consecutive points within tolerance of the finger. Fast drags eat
// many points per move; off-path or backwards fingers simply don't advance.
// Walking point-by-point (not "nearest point") is what enforces direction.
export function advance(points, currentIndex, finger, tolerance) {
  let i = currentIndex;
  while (i + 1 < points.length && dist(points[i + 1], finger) <= tolerance) i += 1;
  return i;
}

// Kids lift a touch early — allow missing the last endSlack points.
export function isComplete(points, currentIndex, endSlack = 2) {
  return currentIndex >= points.length - 1 - endSlack;
}
```

- [ ] **Step 4: รันเทสต์ให้ผ่าน**

Run: `node --test tests/trace-logic.test.mjs`
Expected: PASS ทั้ง 6 (และ `node --test tests/*.test.mjs` รวมของเดิมต้องผ่านหมด)

- [ ] **Step 5: Commit**

```bash
git add js/games/logic/trace-logic.js tests/trace-logic.test.mjs
git commit -m "feat: trace-logic — pure stroke-progress engine for letter tracing"
```

---

### Task 2: ข้อมูลตัวอักษร A-Z

**Files:**
- Create: `js/games/data/letters-en.js`
- Test: `tests/letters-en.test.mjs`

- [ ] **Step 1: เขียนเทสต์รูปร่างข้อมูล (fail ก่อน)**

```js
// tests/letters-en.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS_EN } from '../js/games/data/letters-en.js';

test('มีครบ 26 ตัวเรียง A-Z', () => {
  assert.equal(LETTERS_EN.length, 26);
  assert.deepEqual(LETTERS_EN.map(l => l.char).join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
});

test('ทุกตัวมี name/word สองภาษา และ strokes เป็น path ที่ขึ้นต้นด้วย M', () => {
  for (const l of LETTERS_EN) {
    assert.ok(l.name.th && l.name.en, l.char);
    assert.ok(l.word.th && l.word.en, l.char);
    assert.ok(l.viewBox, l.char);
    assert.ok(l.strokes.length >= 1, l.char);
    for (const s of l.strokes) assert.match(s, /^M /, `${l.char}: "${s}"`);
    assert.ok(l.art === null || typeof l.art === 'function', l.char);
  }
});
```

หมายเหตุ: ไฟล์ data import `byId` จาก animals.js ซึ่ง import audio.js — ใน Node ไม่มี `speechSynthesis`/`window` แต่ audio.js มี guard `typeof speechSynthesis !== 'undefined'` อยู่แล้ว และ `window` ถูกใช้แค่ใน `ctx()` ตอนเรียกเล่นเสียงเท่านั้น จึง import ได้ (แบบเดียวกับที่ tests/audio-voices.test.mjs ทำอยู่)

- [ ] **Step 2: รันให้ fail** — `node --test tests/letters-en.test.mjs` → Cannot find module

- [ ] **Step 3: เขียนข้อมูลครบ 26 ตัว**

viewBox เดียวกันทุกตัว `0 0 100 120` วาดในกรอบ x:10-90 y:10-110; ลำดับใน `strokes` = ลำดับขีด; ทิศของ path = ทิศการลาก; art ใช้สัตว์เดิม 5 ตัว (C, H, O, P, S) ที่เหลือ `null`

```js
// js/games/data/letters-en.js
// A-Z tracing data. strokes are ordered (stroke order) and directed (path
// direction = drag direction). Words lean ocean/Alaska to match world 1.
import { byId } from '../../core/animals.js';

const VB = '0 0 100 120';
const animalArt = (id) => (w) => byId(id).make(w);

export const LETTERS_EN = [
  { char: 'A', name: { th: 'เอ', en: 'A' }, word: { th: 'สมอเรือ', en: 'Anchor' }, art: null, viewBox: VB,
    strokes: ['M 50 10 L 15 110', 'M 50 10 L 85 110', 'M 28 75 L 72 75'] },
  { char: 'B', name: { th: 'บี', en: 'B' }, word: { th: 'เรือ', en: 'Boat' }, art: null, viewBox: VB,
    strokes: ['M 22 10 L 22 110', 'M 22 10 C 72 10 72 58 22 58', 'M 22 58 C 78 58 78 110 22 110'] },
  { char: 'C', name: { th: 'ซี', en: 'C' }, word: { th: 'ปู', en: 'Crab' }, art: animalArt('crab'), viewBox: VB,
    strokes: ['M 80 32 C 62 2 20 14 20 60 C 20 106 62 118 80 88'] },
  { char: 'D', name: { th: 'ดี', en: 'D' }, word: { th: 'โลมา', en: 'Dolphin' }, art: null, viewBox: VB,
    strokes: ['M 22 10 L 22 110', 'M 22 10 C 86 14 86 106 22 110'] },
  { char: 'E', name: { th: 'อี', en: 'E' }, word: { th: 'ปลาไหล', en: 'Eel' }, art: null, viewBox: VB,
    strokes: ['M 76 10 L 22 10 L 22 110 L 76 110', 'M 22 60 L 66 60'] },
  { char: 'F', name: { th: 'เอฟ', en: 'F' }, word: { th: 'ปลา', en: 'Fish' }, art: null, viewBox: VB,
    strokes: ['M 76 10 L 22 10 L 22 110', 'M 22 60 L 66 60'] },
  { char: 'G', name: { th: 'จี', en: 'G' }, word: { th: 'นกนางนวล', en: 'Gull' }, art: null, viewBox: VB,
    strokes: ['M 80 32 C 62 2 20 14 20 60 C 20 106 60 118 80 86 L 80 66 L 56 66'] },
  { char: 'H', name: { th: 'เอช', en: 'H' }, word: { th: 'วาฬหลังค่อม', en: 'Humpback' }, art: animalArt('humpback'), viewBox: VB,
    strokes: ['M 20 10 L 20 110', 'M 80 10 L 80 110', 'M 20 60 L 80 60'] },
  { char: 'I', name: { th: 'ไอ', en: 'I' }, word: { th: 'น้ำแข็ง', en: 'Ice' }, art: null, viewBox: VB,
    strokes: ['M 32 10 L 68 10', 'M 50 10 L 50 110', 'M 32 110 L 68 110'] },
  { char: 'J', name: { th: 'เจ', en: 'J' }, word: { th: 'แมงกะพรุน', en: 'Jellyfish' }, art: null, viewBox: VB,
    strokes: ['M 70 10 L 70 84 C 70 114 30 114 26 88'] },
  { char: 'K', name: { th: 'เค', en: 'K' }, word: { th: 'สาหร่ายทะเล', en: 'Kelp' }, art: null, viewBox: VB,
    strokes: ['M 22 10 L 22 110', 'M 76 10 L 22 64', 'M 40 52 L 78 110'] },
  { char: 'L', name: { th: 'แอล', en: 'L' }, word: { th: 'กุ้งมังกร', en: 'Lobster' }, art: null, viewBox: VB,
    strokes: ['M 26 10 L 26 110 L 78 110'] },
  { char: 'M', name: { th: 'เอ็ม', en: 'M' }, word: { th: 'ภูเขา', en: 'Mountain' }, art: null, viewBox: VB,
    strokes: ['M 15 110 L 15 10 L 50 72 L 85 10 L 85 110'] },
  { char: 'N', name: { th: 'เอ็น', en: 'N' }, word: { th: 'วาฬนาร์วาล', en: 'Narwhal' }, art: null, viewBox: VB,
    strokes: ['M 22 110 L 22 10 L 78 110 L 78 10'] },
  { char: 'O', name: { th: 'โอ', en: 'O' }, word: { th: 'วาฬเพชฌฆาต', en: 'Orca' }, art: animalArt('orca'), viewBox: VB,
    strokes: ['M 50 10 C 12 10 12 110 50 110 C 88 110 88 10 50 10'] },
  { char: 'P', name: { th: 'พี', en: 'P' }, word: { th: 'นกพัฟฟิน', en: 'Puffin' }, art: animalArt('puffin'), viewBox: VB,
    strokes: ['M 22 110 L 22 10', 'M 22 10 C 80 10 80 62 22 62'] },
  { char: 'Q', name: { th: 'คิว', en: 'Q' }, word: { th: 'นกคุ่ม', en: 'Quail' }, art: null, viewBox: VB,
    strokes: ['M 50 10 C 12 10 12 110 50 110 C 88 110 88 10 50 10', 'M 62 86 L 86 112'] },
  { char: 'R', name: { th: 'อาร์', en: 'R' }, word: { th: 'สายฝน', en: 'Rain' }, art: null, viewBox: VB,
    strokes: ['M 22 110 L 22 10', 'M 22 10 C 76 10 76 60 22 60', 'M 42 60 L 80 110'] },
  { char: 'S', name: { th: 'เอส', en: 'S' }, word: { th: 'ปลาแซลมอน', en: 'Salmon' }, art: animalArt('salmon'), viewBox: VB,
    strokes: ['M 78 28 C 60 2 22 12 25 38 C 28 62 72 58 76 84 C 79 112 35 118 20 94'] },
  { char: 'T', name: { th: 'ที', en: 'T' }, word: { th: 'เต่าทะเล', en: 'Turtle' }, art: null, viewBox: VB,
    strokes: ['M 15 10 L 85 10', 'M 50 10 L 50 110'] },
  { char: 'U', name: { th: 'ยู', en: 'U' }, word: { th: 'เม่นทะเล', en: 'Urchin' }, art: null, viewBox: VB,
    strokes: ['M 20 10 L 20 80 C 20 114 80 114 80 80 L 80 10'] },
  { char: 'V', name: { th: 'วี', en: 'V' }, word: { th: 'ภูเขาไฟ', en: 'Volcano' }, art: null, viewBox: VB,
    strokes: ['M 15 10 L 50 110 L 85 10'] },
  { char: 'W', name: { th: 'ดับเบิลยู', en: 'W' }, word: { th: 'คลื่น', en: 'Wave' }, art: null, viewBox: VB,
    strokes: ['M 10 10 L 32 110 L 50 45 L 68 110 L 90 10'] },
  { char: 'X', name: { th: 'เอกซ์', en: 'X' }, word: { th: 'ปลากระจก', en: 'X-ray fish' }, art: null, viewBox: VB,
    strokes: ['M 20 10 L 80 110', 'M 80 10 L 20 110'] },
  { char: 'Y', name: { th: 'วาย', en: 'Y' }, word: { th: 'จามรี', en: 'Yak' }, art: null, viewBox: VB,
    strokes: ['M 15 10 L 50 60', 'M 85 10 L 50 60', 'M 50 60 L 50 110'] },
  { char: 'Z', name: { th: 'แซด', en: 'Z' }, word: { th: 'แพลงก์ตอน', en: 'Zooplankton' }, art: null, viewBox: VB,
    strokes: ['M 18 10 L 82 10 L 18 110 L 82 110'] },
];
```

- [ ] **Step 4: รันให้ผ่าน** — `node --test tests/letters-en.test.mjs` → PASS

- [ ] **Step 5: Commit**

```bash
git add js/games/data/letters-en.js tests/letters-en.test.mjs
git commit -m "feat: A-Z letter data with stroke order and bilingual ocean words"
```

---

### Task 3: `onTap()` helper + i18n keys

**Files:**
- Modify: `js/core/ui.js` (ต่อท้ายไฟล์)
- Modify: `js/core/i18n.js` (เพิ่ม key ใน STRINGS ก่อนปีกกาปิด)

- [ ] **Step 1: เพิ่ม onTap ใน ui.js**

```js
// Tap = pointerup that ended within 10px of its pointerdown. Pointerups that
// finish a scroll drag don't fire (browsers usually send pointercancel when
// native pan takes over — the distance check is the cross-browser backstop).
// Keyboard Enter/Space still activates via click detail 0.
export function onTap(el, handler) {
  let down = null;
  el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointerup', (e) => {
    const wasTap = down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10;
    down = null;
    if (wasTap) handler(e);
  });
  el.addEventListener('click', (e) => { if (e.detail === 0) handler(e); });
}
```

- [ ] **Step 2: เพิ่ม i18n keys** (แทรกก่อน `};` ของ STRINGS)

```js
  shelfHandEye: ['มือกับตา', 'Hands & Eyes'],
  shelfListenLang: ['ฟังกับภาษา', 'Listening & Language'],
  shelfCountThink: ['นับกับคิด', 'Counting & Thinking'],
  traceLetters: ['วาดตามรอย', 'Trace Letters'],
  age36: ['3-6 ปี', 'Age 3-6'],
  pickLetter: ['เลือกตัวอักษรที่อยากวาดเลย!', 'Pick a letter to trace!'],
  traceFollow: ['ลากนิ้วตามเส้นนะ', 'Follow the line with your finger'],
  watchAgain: ['ดูอีกครั้ง', 'Watch again'],
```

- [ ] **Step 3: รันเทสต์เดิมทั้งหมด** — `node --test tests/*.test.mjs` → PASS (i18n test เดิมไม่พังเพราะแค่เพิ่ม key)

- [ ] **Step 4: Commit**

```bash
git add js/core/ui.js js/core/i18n.js
git commit -m "feat: onTap helper (tap vs scroll-drag) and shelf/tracing strings"
```

---

### Task 4: Hub เป็นชั้นทักษะ

**Files:**
- Modify: `js/hub.js`
- Modify: `css/main.css`

- [ ] **Step 1: CSS ชั้นวาง** — แทรกใน main.css ถัดจาก block ของ `.game-tile` (หลังบรรทัด media query จอเตี้ยของ game-tile)

```css
/* hub shelves: vertical list of skill rows; each row scrolls horizontally.
   Gameplay scenes keep touch-action:none — only the hub may pan. */
#hub-shelves { position: absolute; inset: 84px 0 0; overflow-y: auto; overflow-x: hidden; touch-action: pan-y; padding: 0 4vw 4vh; -webkit-overflow-scrolling: touch; }
.shelf { margin-bottom: 2.5vh; }
.shelf-label { display: inline-flex; align-items: center; gap: 10px; min-height: 56px; padding: 0 18px; border: none; border-radius: 16px; cursor: pointer; background: color-mix(in srgb, var(--abyss) 35%, transparent); color: var(--foam-white); font-family: inherit; font-weight: 800; font-size: clamp(16px, 2.4vw, 22px); text-shadow: 0 1px 3px rgba(0,30,60,.6); margin-bottom: 1.2vh; }
.shelf-label:focus-visible { outline: 4px solid var(--foam-white); outline-offset: 3px; }
.shelf-row { display: flex; gap: 2vw; overflow-x: auto; touch-action: pan-x pan-y; padding: 4px 2px 12px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.shelf-row::-webkit-scrollbar { display: none; }
.shelf-row .game-tile { flex: 0 0 clamp(220px, 26vw, 320px); height: clamp(180px, 30vh, 250px); }
@media (max-height: 520px) {
  .shelf-label { min-height: 44px; font-size: 15px; }
  .shelf-row .game-tile { flex-basis: 200px; height: 140px; }
}
```

- [ ] **Step 2: แก้ hub.js** — เปลี่ยน import, ทะเบียน, และส่วนเรนเดอร์ grid เป็นชั้น

เปลี่ยน import บนสุด (แทนบรรทัด `import { onActivate } ...`):

```js
import { onActivate, onTap } from './core/ui.js';
```

แทนที่ `GAME_BUTTONS` เดิมทั้งก้อนด้วย (เพิ่มฟิลด์ `shelf`; ลำดับในชั้นตามลำดับใน array):

```js
const SHELVES = [
  { id: 'hand-eye', icon: '🖐️', nameKey: 'shelfHandEye' },
  { id: 'listen-lang', icon: '👂', nameKey: 'shelfListenLang' },
  { id: 'count-think', icon: '🔢', nameKey: 'shelfCountThink' },
];

const GAME_BUTTONS = [
  { scene: 'tap-sea', nameKey: 'tapSea', ageKey: 'age12', animal: 'orca', color: 'var(--glacier-blue)', shelf: 'hand-eye' },
  { scene: 'shadow-match', nameKey: 'shadowMatch', ageKey: 'age24', animal: 'seal', color: 'var(--sunset-orange)', shelf: 'hand-eye' },
  { scene: 'trace-letters', nameKey: 'traceLetters', ageKey: 'age36', animal: 'otter', color: 'var(--sun-gold)', shelf: 'hand-eye' },
  { scene: 'listen-find', nameKey: 'listenFind', ageKey: 'age35', animal: 'puffin', color: 'var(--anemone-purple)', shelf: 'listen-lang' },
  { scene: 'count-tap', nameKey: 'countTap', ageKey: 'age35', animal: 'salmon', color: 'var(--kelp-green)', shelf: 'count-think' },
];
```

ใน `init()` เปลี่ยนบรรทัด `<div id="hub-grid" ...></div>` ใน insertAdjacentHTML เป็น:

```html
<div id="hub-shelves"></div>
```

แทนที่ทั้งช่วง `const grid = container.querySelector('#hub-grid'); GAME_BUTTONS.forEach(...)` (ถึง `grid.appendChild(btn); });`) ด้วย:

```js
    const shelves = container.querySelector('#hub-shelves');
    for (const sh of SHELVES) {
      const section = document.createElement('section');
      section.className = 'shelf';
      const label = document.createElement('button');
      label.className = 'shelf-label';
      label.innerHTML = `<span aria-hidden="true">${sh.icon}</span><span data-shelf-name="${sh.nameKey}"></span>`;
      onActivate(label, () => { warmUp(); speak(t(sh.nameKey), getLang()); });
      section.appendChild(label);
      const row = document.createElement('div');
      row.className = 'shelf-row';
      section.appendChild(row);
      shelves.appendChild(section);

      GAME_BUTTONS.filter(g => g.shelf === sh.id).forEach((g, i) => {
        const btn = document.createElement('button');
        btn.className = 'btn game-tile';
        btn.style.borderBottom = `6px solid ${g.color}`;
        const zone = document.createElement('div');
        zone.className = 'animal-zone';
        const svg = byId(g.animal).make(150);
        svg.classList.add('float');
        // each animal swims and blinks on its own beat, like a real tidepool
        svg.style.animationDuration = `${3 + i * 0.35}s`;
        svg.style.animationDelay = `-${i * 0.9}s`;
        svg.style.setProperty('--blink-delay', `${i * 1.1}s`);
        zone.appendChild(svg);
        btn.appendChild(zone);
        btn.insertAdjacentHTML('beforeend', `
          <div class="game-name" data-game-name="${g.nameKey}"></div>
          <div class="game-age" data-game-age="${g.ageKey}"></div>
        `);
        const launch = () => {
          if (hub._nav) return; // already heading into a game
          warmUp();
          playCry(byId(g.animal));
          svg.classList.remove('float');
          svg.style.animationDuration = ''; // stagger values are for float only
          svg.style.animationDelay = '';
          svg.classList.add('boing');
          speak(t(g.nameKey), getLang());
          hub._nav = setTimeout(() => go(g.scene), 650);
        };
        onTap(btn, launch); // tap launches; shelf scroll-drag doesn't
        row.appendChild(btn);
      });
    }
```

ใน `refreshText()` เพิ่มบรรทัด (ถัดจาก data-game-age):

```js
      container.querySelectorAll('[data-shelf-name]').forEach(n => { n.textContent = t(n.dataset.shelfName); });
```

- [ ] **Step 3: ตรวจในเบราว์เซอร์** (ยังไม่มี scene trace-letters — การ์ดจะ launch แล้ว `go()` ฟ้อง unknown scene ใน console ซึ่งถูกต้องตาม guard เดิม; Task 6 จะแก้)

```bash
npx -y http-server -p 8094 -s -c-1
```
เปิด `http://127.0.0.1:8094/` ตรวจ: เห็น 3 ชั้น มีป้าย+ไอคอน, ชั้นแรก 3 การ์ด (แตะทะเล/จับคู่เงา/วาดตามรอย-นาก), เลื่อนแนวตั้งได้, แตะป้ายชั้นพูดชื่อชั้น, แตะการ์ดแตะทะเลเข้าเกมได้+กลับได้, ลากเลื่อนแล้วปล่อยบนการ์ดต้อง**ไม่** launch, Tab+Enter ใช้ได้, ที่ 844×390 การ์ดหดและเลื่อนได้

- [ ] **Step 4: รันเทสต์เดิม** — `node --test tests/*.test.mjs` → PASS

- [ ] **Step 5: Commit**

```bash
git add js/hub.js css/main.css
git commit -m "feat: hub reorganized into scrollable skill shelves"
```

---

### Task 5: Scene วาดตามรอย — จอเลือกตัวอักษร

**Files:**
- Create: `js/games/trace-letters.js` (โครง scene + picker; จอวาดมาใน Task 6)
- Modify: `css/main.css` (สไตล์ picker + จุดเริ่มกะพริบ ใช้ใน Task 6 ด้วย)

- [ ] **Step 1: CSS** — ต่อท้าย block ชั้นวางจาก Task 4

```css
/* trace-letters */
#letter-grid { position: absolute; inset: 84px 4vw 3vh; overflow-y: auto; touch-action: pan-y; display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 12px; align-content: start; padding: 4px; -webkit-overflow-scrolling: touch; }
.letter-cell { min-height: 90px; font-size: 44px; font-weight: 800; color: var(--slate-muted); }
.letter-cell[data-done] { color: var(--ink-deep); background: linear-gradient(180deg, var(--kelp-light), var(--kelp-green)); }
@keyframes pulse { 0%, 100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.3); opacity: 1; } }
.trace-start { animation: pulse 1.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
```

- [ ] **Step 2: เขียน scene (ส่วน picker + โครงที่ Task 6 จะเติม)**

```js
// js/games/trace-letters.js
import { LETTERS_EN } from './data/letters-en.js';
import { speak, sfx, warmUp } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { get, set } from '../core/settings.js';
import { onActivate, onTap } from '../core/ui.js';
import { confetti } from '../core/confetti.js';
import { isNearStart, advance, isComplete } from './logic/trace-logic.js';

const TOLERANCE_PX = 45;   // forgiving corridor around the stroke
const START_RADIUS_PX = 50;
const SAMPLE_STEP = 6;     // viewBox units between sampled points

export const traceLetters = {
  _container: null,
  _go: null,
  _timers: [],
  _done: null,     // Set ของ char ที่วาดสำเร็จ
  _trace: null,    // สถานะจอวาด (Task 6)

  init(container, go) {
    this._container = container;
    this._go = go;
    this._timers = [];
    this._done = new Set(get('traceDone.en', []));
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" aria-label="${t('back')}" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <div id="prompt" style="position:absolute;top:16px;width:100%;text-align:center;color:var(--ink-deep);font-size:clamp(20px,3.4vw,32px);font-weight:800;text-shadow:var(--text-halo);pointer-events:none;"></div>
      <div id="trace-stage" style="position:absolute;inset:0;"></div>
    `);
    onActivate(container.querySelector('#back-btn'), () => {
      if (this._trace) { this._showPicker(); return; } // จากจอวาดกลับจอเลือกก่อน
      go('hub');
    });
    this._showPicker();
  },

  _stage() { return this._container.querySelector('#trace-stage'); },

  _showPicker(skipSpeak = false) {
    this._trace = null;
    const stage = this._stage();
    stage.innerHTML = '';
    this._container.querySelector('#prompt').textContent = t('pickLetter');
    const grid = document.createElement('div');
    grid.id = 'letter-grid';
    for (const letter of LETTERS_EN) {
      const cell = document.createElement('button');
      cell.className = 'btn letter-cell';
      cell.textContent = letter.char;
      cell.setAttribute('aria-label', `${letter.name.th} ${letter.name.en}`);
      if (this._done.has(letter.char)) cell.dataset.done = '1';
      onTap(cell, () => { warmUp(); sfx.pop(); this._showLetter(letter); });
      grid.appendChild(cell);
    }
    stage.appendChild(grid);
    if (!skipSpeak) speak(t('pickLetter'), getLang()); // หลังฉลองไม่พูดทับเสียงคำศัพท์
  },

  _showLetter(letter) {
    // Task 6
  },

  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._container = null;
    this._trace = null;
    try { speechSynthesis.cancel(); } catch {}
  },
};
```

- [ ] **Step 3: ลงทะเบียน scene** — ใน `js/main.js` เพิ่ม import + register (ใต้ listen-find):

```js
import { traceLetters } from './games/trace-letters.js';
```
```js
registerScene('trace-letters', traceLetters);
```

- [ ] **Step 4: ตรวจในเบราว์เซอร์** — เข้าเกมจาก hub: เห็น grid A-Z 26 ปุ่ม ≥90px, เสียงพูด "เลือกตัวอักษร...", เลื่อนแนวตั้งได้บนจอเตี้ย, ปุ่มกลับไป hub ได้, Tab+Enter เลือกได้ (ยังไม่เกิดอะไรเพราะ `_showLetter` ว่าง)

- [ ] **Step 5: รันเทสต์เดิม + Commit**

```bash
node --test tests/*.test.mjs
git add js/games/trace-letters.js js/main.js css/main.css
git commit -m "feat: trace-letters scene with A-Z picker screen"
```

---

### Task 6: จอวาดตามรอย (engine + ฉลอง + บันทึก)

**Files:**
- Modify: `js/games/trace-letters.js` (เติม `_showLetter` และ helpers)

- [ ] **Step 1: เติมโค้ดจอวาด** — แทนที่ `_showLetter(letter) { // Task 6 }` ด้วย:

```js
  _showLetter(letter) {
    const stage = this._stage();
    stage.innerHTML = '';
    this._container.querySelector('#prompt').textContent = `${letter.char} — ${t('traceFollow')}`;

    // การ์ดขาวกลางจอ + svg ตัวอักษร ~70% ของความสูง
    const card = document.createElement('div');
    card.style.cssText = 'position:absolute;inset:76px 0 2vh;display:flex;align-items:center;justify-content:center;';
    const size = Math.min(window.innerHeight * 0.7, window.innerWidth * 0.5);
    const wrap = document.createElement('div');
    wrap.style.cssText = `width:${size * 100 / 120}px;height:${size}px;background:linear-gradient(180deg,var(--foam-white),var(--ice-mist));border-radius:22px;box-shadow:var(--shadow-soft-lift);display:flex;align-items:center;justify-content:center;touch-action:none;`;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', letter.viewBox);
    svg.style.cssText = 'width:88%;height:88%;overflow:visible;';
    wrap.appendChild(svg);
    card.appendChild(wrap);
    stage.appendChild(card);

    // ปุ่มดูสาธิตซ้ำ
    const replay = document.createElement('button');
    replay.className = 'btn btn-round';
    replay.id = 'replay-btn';
    replay.textContent = '🔄';
    replay.setAttribute('aria-label', t('watchAgain'));
    replay.style.cssText = 'position:absolute;top:12px;right:12px;z-index:10;';
    stage.appendChild(replay);

    // วาดเส้นทุกขีด: ฐานเส้นประเทา + เลเยอร์สีสำหรับความคืบหน้า
    const mk = (d, style) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      for (const [k, v] of Object.entries(style)) p.setAttribute(k, v);
      svg.appendChild(p);
      return p;
    };
    const strokes = letter.strokes.map((d) => {
      const base = mk(d, { stroke: 'var(--shallow-water)', 'stroke-width': 10, 'stroke-dasharray': '1 14', opacity: '.9' });
      const fill = mk(d, { stroke: 'var(--sun-gold)', 'stroke-width': 11 });
      const len = fill.getTotalLength();
      fill.setAttribute('stroke-dasharray', String(len));
      fill.setAttribute('stroke-dashoffset', String(len));
      // sample จุดเป็นพิกัด viewBox สำหรับ trace-logic
      const points = [];
      for (let l = 0; l <= len; l += SAMPLE_STEP) { const pt = fill.getPointAtLength(l); points.push({ x: pt.x, y: pt.y }); }
      const end = fill.getPointAtLength(len); points.push({ x: end.x, y: end.y });
      return { base, fill, len, points };
    });

    // จุดเริ่มกะพริบของเส้นปัจจุบัน
    const startDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startDot.setAttribute('r', '9');
    startDot.setAttribute('fill', 'var(--sunset-orange)');
    startDot.setAttribute('class', 'trace-start');
    svg.appendChild(startDot);

    const state = { letter, svg, strokes, cur: 0, idx: 0, active: false };
    this._trace = state;

    // tolerance แปลงจาก px จอ → หน่วย viewBox ตามสเกล render จริง
    const scale = () => svg.getBoundingClientRect().width / 100;
    const toSvg = (e) => {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };
    const cs = () => strokes[state.cur];
    const updateFill = () => {
      const s = cs();
      const frac = state.idx / (s.points.length - 1);
      s.fill.setAttribute('stroke-dashoffset', String(s.len * (1 - frac)));
    };
    const placeDot = () => {
      const p = cs().points[Math.min(state.idx, cs().points.length - 1)];
      startDot.setAttribute('cx', p.x); startDot.setAttribute('cy', p.y);
    };
    const demo = () => { // สาธิตเส้นปัจจุบัน: เส้นสีวิ่ง 1 รอบแล้วถอยกลับตาม progress จริง
      const s = cs();
      s.fill.style.transition = 'stroke-dashoffset 1s ease';
      s.fill.setAttribute('stroke-dashoffset', '0');
      this._timers.push(setTimeout(() => {
        s.fill.style.transition = 'stroke-dashoffset .3s ease';
        updateFill();
        this._timers.push(setTimeout(() => { s.fill.style.transition = ''; }, 350));
      }, 1100));
    };
    const celebrate = () => {
      startDot.remove();
      svg.classList.add('boing');
      sfx.cheer();
      this._timers.push(...confetti(stage));
      const lang = getLang();
      if (lang === 'en') {
        speak(`${letter.name.en}! ${letter.name.en} is for ${letter.word.en}`, 'en');
        speak(letter.word.th, 'th', { interrupt: false });
      } else {
        speak(`${letter.name.th}! ${letter.word.th}`, 'th');
        speak(`${letter.name.en} is for ${letter.word.en}`, 'en', { interrupt: false });
      }
      if (letter.art) { // รูปคำศัพท์ pop-in ข้างการ์ด
        const art = letter.art(Math.min(220, size * 0.45));
        art.classList.add('pop-in');
        art.style.cssText = 'position:absolute;right:4vw;bottom:6vh;';
        stage.appendChild(art);
      }
      this._done.add(letter.char);
      set('traceDone.en', [...this._done]);
      this._timers.push(setTimeout(() => { if (this._container) this._showPicker(true); }, 2600));
    };
    const finishStroke = () => {
      const s = cs();
      s.fill.setAttribute('stroke-dashoffset', '0');
      state.active = false;
      if (state.cur === strokes.length - 1) { celebrate(); return; }
      sfx.ding();
      state.cur += 1; state.idx = 0;
      placeDot(); demo();
    };

    wrap.addEventListener('pointerdown', (e) => {
      if (!this._trace) return;
      warmUp();
      const p = toSvg(e);
      if (isNearStart([cs().points[Math.min(state.idx, cs().points.length - 1)]], p, START_RADIUS_PX / scale())) {
        state.active = true;
        try { wrap.setPointerCapture(e.pointerId); } catch {}
        sfx.bubble();
      }
    });
    wrap.addEventListener('pointermove', (e) => {
      if (!state.active || !this._trace) return;
      const before = state.idx;
      state.idx = advance(cs().points, state.idx, toSvg(e), TOLERANCE_PX / scale());
      if (state.idx !== before) {
        updateFill(); placeDot();
        if (Math.floor(state.idx / 8) !== Math.floor(before / 8)) sfx.bubble();
        if (isComplete(cs().points, state.idx, 2)) finishStroke();
      }
    });
    const lift = () => { state.active = false; if (this._trace) placeDot(); };
    wrap.addEventListener('pointerup', lift);
    wrap.addEventListener('pointercancel', lift);

    onActivate(replay, () => { warmUp(); demo(); speak(t('traceFollow'), getLang()); });

    placeDot();
    speak(`${letter.name[getLang()]} — ${t('traceFollow')}`, getLang());
    demo();
  },
```

หมายเหตุ implementation:
- `isNearStart` ถูกเรียกด้วยจุด resume ปัจจุบัน (ไม่ใช่จุดแรกของเส้นเสมอ) → ยกนิ้วแล้ววางต่อจากที่ค้างได้ตามสเปก
- นิ้วที่สอง: `state.active` ผูกกับ pointer ที่ capture; pointerdown ซ้ำระหว่าง active แค่ทับ state.active=true ที่จุด resume เดิม — ไม่มีผลข้างเคียง (advance ยังไล่จาก idx เดิม)
- หมุนจอ/resize: ผู้เล่นกดปุ่ม 🔄 หรือระบบ re-render เมื่อกลับเข้าจอ (v1 ไม่ auto re-render; บันทึกใน "นอกขอบเขต" ของแผน)
- reduced-motion: blanket rule เดิมทำให้ transition สาธิตเกือบทันที + `.trace-start` หยุดนิ่ง — จุดเริ่มยังเห็นชัด (สีส้มใหญ่)

- [ ] **Step 2: ตรวจในเบราว์เซอร์ (manual)** — เข้าเกม เลือก A: เห็นเส้นประ 3 ขีด สาธิตขีดแรก ลากตามจนครบ 3 ขีด → ฉลอง+พูด "เอ! สมอเรือ / A is for Anchor" → เด้งกลับ picker และ A เป็นสีเขียวเต็ม; รีโหลดหน้า → A ยังเขียว (localStorage); ลอง O (โค้งวงเดียว) และ W (ซิกแซก); ลากออกนอกเส้น → แค่หยุด; ยกนิ้วกลางเส้นแล้ววาดต่อ → progress คงอยู่; ปุ่ม 🔄 สาธิตซ้ำ; ปุ่ม 🏠 จากจอวาด → กลับ picker, จาก picker → กลับ hub

- [ ] **Step 3: รันเทสต์ทั้งหมด** — `node --test tests/*.test.mjs` → PASS ทุกตัว

- [ ] **Step 4: Commit**

```bash
git add js/games/trace-letters.js
git commit -m "feat: tracing screen — guided strokes, celebration, progress persistence"
```

---

### Task 7: อัปเดต DESIGN.md + ตรวจรวม + Playwright

**Files:**
- Modify: `DESIGN.md` (บรรทัด Sun Gold ใน Secondary)

- [ ] **Step 1: DESIGN.md** — แก้บรรทัด Sun Gold เป็น:

```markdown
- **Sun Gold** (#f7d154): สี accent ของเกมวาดตามรอย และสีที่ห้าของชุดคอนเฟตตี
```

- [ ] **Step 2: Playwright ตรวจครบวงจร** (ผ่าน MCP browser กับ server `-c-1`)
  - hub 1180×820: 3 ชั้นแสดงครบ, การ์ด 5 ใบกระจายถูกชั้น, ลากเลื่อนแนวตั้ง/แนวนอนได้, ลากแล้วปล่อยบนการ์ดไม่ launch, console 0 error
  - hub 844×390: ชั้นหดตาม media query, เลื่อนได้
  - trace-letters: เข้าเกม → picker 26 ปุ่ม → เลือก A → จำลอง pointer: เดินจุดตาม `getPointAtLength` ของ path จริง แปลงเป็นพิกัดจอด้วย `getScreenCTM()` แล้ว dispatch pointerdown/move/up ทีละเส้นจนครบ → ตรวจฉลอง (confetti ปรากฏ), กลับ picker, ปุ่ม A มี `data-done`, `localStorage['oceanAlaska.traceDone.en']` มี "A"
  - คีย์บอร์ด: Tab → Enter เข้าเกม/เลือกตัว/กลับ ได้ครบ
  - เกมเดิม 4 เกมยังเข้า-เล่น-ออกได้

- [ ] **Step 3: รันเทสต์ทั้งหมดรอบสุดท้าย** — `node --test tests/*.test.mjs` → PASS

- [ ] **Step 4: Commit**

```bash
git add DESIGN.md
git commit -m "docs: sun-gold doubles as trace-letters accent"
```

---

## นอกขอบเขตของแผนนี้ (จากสเปก + เพิ่มระหว่างเขียนแผน)

- ข้อมูล ก-ฮ (`letters-th.js`) + ปุ่มสลับชุดอักษรใน picker
- ตัวพิมพ์เล็ก a-z, ตัวเลข 0-9
- art คำศัพท์ตัวที่เหลือ (21 ตัว) — โครง `art` รองรับแล้ว
- auto re-render จอวาดเมื่อหมุนจอกลางคัน (v1: ผู้ใช้กด 🔄 หรือเริ่มตัวใหม่)
- โหมดโลกธีมต่อเกม
