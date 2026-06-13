# Memory Match Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มเกมที่ 7 "ความจำจับคู่" — พลิกการ์ดหาคู่สัตว์ที่เหมือนกัน ปรับยากอัตโนมัติ 2→3→4→6 คู่ ไม่มีแพ้

**Architecture:** ตามสเปก `docs/superpowers/specs/2026-06-13-memory-match-design.md` — ตรรกะ pure (dealBoard/levelPairs/nextLevel/isCleared) แยกทดสอบ, scene `{init, destroy}` ใช้ CSS 3D flip + `onActivate` (รองรับคีย์บอร์ด), เปิดทีละ 2 ใบ ตรงคู่ค้างเปิด ไม่ตรงคว่ำกลับเงียบ ๆ

**Tech Stack:** Vanilla JS ES modules + SVG, `node --test`, Playwright

**กฎ:** Pointer Events เท่านั้น (ผ่าน onActivate) · ไม่มีแพ้/ไม่มีเสียงเชิงลบ · timers เข้า `_timers[]` ล้างใน destroy + `speechSynthesis.cancel()` · การ์ด ≥80px · สี UI ใช้ `var(--token)`

---

## File Structure

| ไฟล์ | บทบาท |
|---|---|
| Create `js/games/logic/memory-logic.js` + `tests/memory-logic.test.mjs` | dealBoard/levelPairs/nextLevel/isCleared (pure) |
| Modify `css/main.css` | `--teal-mem` + สไตล์ flip card/grid |
| Modify `js/core/i18n.js` | memoryMatch, age37, memoryPrompt |
| Create `js/games/memory-match.js` | scene |
| Modify `js/main.js` | register scene |
| Modify `js/hub.js` | เพิ่มการ์ดในชั้น count-think |
| Modify `js/core/game-art.js` | คำใบ้การ์ด hub |
| Modify `DESIGN.md` + `.impeccable/design.json` | Teal = สีเกมที่ 7 |

---

### Task 1: memory-logic (pure, TDD)

**Files:**
- Create: `js/games/logic/memory-logic.js`
- Test: `tests/memory-logic.test.mjs`

- [ ] **Step 1: เขียนเทสต์ (fail ก่อน)**

```js
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
```

- [ ] **Step 2: รันให้ fail** — `node --test tests/memory-logic.test.mjs` → Cannot find module

- [ ] **Step 3: เขียน implementation**

```js
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
```

- [ ] **Step 4: รันให้ผ่าน** — `node --test tests/memory-logic.test.mjs` → PASS (7); `node --test tests/*.test.mjs` → ทั้งหมดผ่าน
- [ ] **Step 5: Commit**

```bash
git add js/games/logic/memory-logic.js tests/memory-logic.test.mjs
git commit -m "feat: memory-logic — board dealer, level curve, cleared check"
```

---

### Task 2: token + i18n + CSS flip card

**Files:**
- Modify: `css/main.css` (token + บล็อก memory หลังบล็อก spell-word)
- Modify: `js/core/i18n.js` (3 keys)

- [ ] **Step 1: token** — ใน `:root` ของ `css/main.css` เพิ่มหลังบรรทัด `--coral: #ef7d6e;`:

```css
  --teal-mem: #2fb6a8;
```

- [ ] **Step 2: สไตล์การ์ด** — เพิ่มต่อจากบล็อก `/* spell-word: ... */` (ก่อน `/* top bar shared by all scenes */`):

```css
/* memory-match: flip cards in a responsive grid */
#memory-grid { position: absolute; inset: 72px 4vw 3vh; display: grid; gap: 2vmin; align-content: center; justify-items: center; }
.mem-card { width: 100%; height: 100%; max-width: 150px; max-height: 150px; min-width: 80px; min-height: 80px; aspect-ratio: 1; border: none; background: none; padding: 0; cursor: pointer; perspective: 600px; }
.mem-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform .35s ease; border-radius: 18px; }
.mem-card.up .mem-inner { transform: rotateY(180deg); }
.mem-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 18px; box-shadow: var(--shadow-soft-lift); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.mem-back { background: linear-gradient(180deg, var(--mid-water), var(--deep-water)); }
.mem-back .bub { position: absolute; border: 2px solid rgba(255,255,255,.4); border-radius: 50%; }
.mem-front { background: linear-gradient(180deg, var(--foam-white), var(--ice-mist)); transform: rotateY(180deg); }
.mem-front svg { width: 86%; height: 86%; }
.mem-card.matched .mem-inner { animation: boing .55s ease; }
.mem-card.matched .mem-front { box-shadow: 0 0 0 4px var(--teal-mem), var(--shadow-soft-lift); }
.mem-card:focus-visible { outline: 4px solid var(--foam-white); outline-offset: 3px; border-radius: 18px; }
@media (prefers-reduced-motion: reduce) {
  .mem-inner { transition: none; }
}
```

- [ ] **Step 3: i18n** — แทรกก่อน `};` ของ STRINGS ใน `js/core/i18n.js`:

```js
  memoryMatch: ['ความจำจับคู่', 'Memory Match'],
  age37: ['3-7 ปี', 'Age 3-7'],
  memoryPrompt: ['พลิกการ์ดหาคู่ที่เหมือนกันนะ', 'Flip the cards to find matching pairs'],
```

- [ ] **Step 4: ตรวจ** — `node --check js/core/i18n.js`; `node --test tests/*.test.mjs` → ทั้งหมดผ่าน
- [ ] **Step 5: Commit**

```bash
git add css/main.css js/core/i18n.js
git commit -m "feat: teal token, memory flip-card styles, memory strings"
```

---

### Task 3: memory-match scene

**Files:**
- Create: `js/games/memory-match.js`

- [ ] **Step 1: เขียน scene ทั้งไฟล์**

```js
// js/games/memory-match.js
import { byId, ANIMALS } from '../core/animals.js';
import { speak, speakName, sfx, warmUp } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { get, set } from '../core/settings.js';
import { onActivate } from '../core/ui.js';
import { confetti } from '../core/confetti.js';
import { mulberry32 } from './logic/round-utils.js';
import { dealBoard, levelPairs, nextLevel, isCleared } from './logic/memory-logic.js';

const POOL = ANIMALS.map(a => a.id);
// columns per pair-count so cards stay chunky: 2→2col, 3→3, 4→4, 6→4
const COLS = { 4: 2, 6: 3, 8: 4, 12: 4 };

export const memoryMatch = {
  _container: null,
  _timers: [],
  _cards: null,
  _flipped: null,   // array of {card, el} currently face-up awaiting match (max 2)
  _locked: false,
  _state: null,
  _rng: null,

  init(container, go) {
    this._container = container;
    this._timers = [];
    this._rng = mulberry32((Date.now() & 0xffffffff) >>> 0);
    this._state = { level: get('memoryLevel', 0), streak: 0 };
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" aria-label="${t('back')}" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <div id="prompt" style="position:absolute;top:16px;width:100%;text-align:center;color:var(--ink-deep);font-size:clamp(18px,3vw,28px);font-weight:800;text-shadow:var(--text-halo);pointer-events:none;"></div>
      <div id="memory-grid"></div>
    `);
    onActivate(container.querySelector('#back-btn'), () => go('hub'));
    this._newRound();
  },

  _newRound() {
    this._locked = false;
    this._flipped = [];
    const pairs = levelPairs(this._state.level);
    this._cards = dealBoard(POOL, pairs, this._rng);

    this._container.querySelector('#prompt').textContent = t('memoryPrompt');
    speak(t('memoryPrompt'), getLang());

    const grid = this._container.querySelector('#memory-grid');
    grid.innerHTML = '';
    const cols = COLS[this._cards.length] || 4;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    // cap grid width so cards don't stretch huge at 2 cols on a wide screen
    grid.style.maxWidth = `${cols * 170}px`;
    grid.style.marginInline = 'auto';

    for (const card of this._cards) {
      const btn = document.createElement('button');
      btn.className = 'mem-card';
      btn.setAttribute('aria-label', t('memoryMatch'));
      const inner = document.createElement('div');
      inner.className = 'mem-inner';
      const back = document.createElement('div');
      back.className = 'mem-face mem-back';
      for (let i = 0; i < 3; i++) {
        const b = document.createElement('span');
        b.className = 'bub';
        const sz = 10 + Math.random() * 22;
        b.style.cssText = `width:${sz}px;height:${sz}px;left:${10 + Math.random() * 70}%;top:${10 + Math.random() * 70}%;`;
        back.appendChild(b);
      }
      const front = document.createElement('div');
      front.className = 'mem-face mem-front';
      front.appendChild(byId(card.id).make(140));
      inner.appendChild(back);
      inner.appendChild(front);
      btn.appendChild(inner);
      onActivate(btn, () => this._flip(card, btn));
      card.el = btn;
      grid.appendChild(btn);
    }
  },

  _flip(card, btn) {
    if (this._locked || card.matched || btn.classList.contains('up')) return;
    warmUp();
    btn.classList.add('up');
    sfx.pop();
    speak(byId(card.id)[getLang() === 'th' ? 'th' : 'en'], getLang());
    this._flipped.push({ card, el: btn });
    if (this._flipped.length === 2) this._resolve();
  },

  _resolve() {
    this._locked = true;
    const [a, b] = this._flipped;
    if (a.card.id === b.card.id) {
      // match — keep them up
      a.card.matched = b.card.matched = true;
      a.el.classList.add('matched');
      b.el.classList.add('matched');
      sfx.ding();
      speakName(byId(a.card.id), getLang());
      this._flipped = [];
      this._locked = false;
      if (isCleared(this._cards)) this._win();
    } else {
      // no scolding — just flip both back after a beat
      this._timers.push(setTimeout(() => {
        a.el.classList.remove('up');
        b.el.classList.remove('up');
        this._flipped = [];
        this._locked = false;
      }, 900));
    }
  },

  _win() {
    this._locked = true;
    sfx.cheer();
    speak(t('great'), getLang());
    this._timers.push(...confetti(this._container));
    this._state = nextLevel(this._state, true);
    set('memoryLevel', this._state.level);
    this._timers.push(setTimeout(() => { if (this._container) this._newRound(); }, 2000));
  },

  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._container = null;
    this._flipped = null;
    try { speechSynthesis.cancel(); } catch {}
  },
};
```

หมายเหตุ:
- `_flip` กันแตะซ้ำ: locked / matched / เปิดอยู่แล้ว
- ตรงคู่ปลดล็อกทันที (เล่นต่อได้ลื่น), ไม่ตรงล็อก 900ms กันแตะรัวระหว่างรอคว่ำ
- `set('memoryLevel')` เฉพาะตอนชนะ → ครั้งหน้าเริ่มระดับเดิม
- `speak(byId(card.id)[...])` พูดชื่อสัตว์ตอนพลิก (ใช้ field th/en ของ object สัตว์)

- [ ] **Step 2: ตรวจ** — `node --check js/games/memory-match.js`; `node --test tests/*.test.mjs` → ทั้งหมดผ่าน
- [ ] **Step 3: Commit**

```bash
git add js/games/memory-match.js
git commit -m "feat: memory-match scene — flip pairs, auto-level, celebrate"
```

---

### Task 4: เชื่อม hub + register + ภาพการ์ด

**Files:**
- Modify: `js/main.js`
- Modify: `js/hub.js`
- Modify: `js/core/game-art.js`

- [ ] **Step 1: register** — ใน `js/main.js` เพิ่ม import หลัง spellWord:

```js
import { memoryMatch } from './games/memory-match.js';
```
และหลัง `registerScene('spell-word', spellWord);`:

```js
registerScene('memory-match', memoryMatch);
```

- [ ] **Step 2: hub card** — ใน `js/hub.js` ใน `GAME_BUTTONS` เพิ่มต่อจากรายการ `count-tap` (ให้อยู่ชั้น count-think เหมือนกัน):

```js
  { scene: 'memory-match', nameKey: 'memoryMatch', ageKey: 'age37', animal: 'octopus', color: 'var(--teal-mem)', shelf: 'count-think' },
```

- [ ] **Step 3: ภาพการ์ด hub** — ใน `js/core/game-art.js` ใน object `SCENES` เพิ่ม method (หลัง `'count-tap'`):

```js
  // ความจำจับคู่: การ์ดคว่ำสองใบ มีเครื่องหมาย ?
  'memory-match'(s, color) {
    placeAnimal(s, 'octopus', 70, 0, 84);
    [[28, -6], [110, 6]].forEach(([x, rot], i) => {
      const card = el('rect', { x, y: 96, width: 54, height: 64, rx: 9, transform: `rotate(${rot} ${x + 27} 128)` }, s);
      card.style.cssText = `fill:var(--foam-white);stroke:${color};stroke-width:3`;
      const q = el('text', { x: x + 27, y: 140, 'text-anchor': 'middle', transform: `rotate(${rot} ${x + 27} 128)` }, s);
      q.textContent = '?';
      q.style.cssText = `font:800 34px system-ui,sans-serif;fill:${color}`;
    });
  },
```

- [ ] **Step 4: ตรวจ** — `node --check js/main.js js/hub.js js/core/game-art.js`; `node --test tests/*.test.mjs` → ผ่าน
- [ ] **Step 5: Commit**

```bash
git add js/main.js js/hub.js js/core/game-art.js
git commit -m "feat: memory-match on the count-think shelf with flip-card tile art"
```

---

### Task 5: DESIGN.md + sidecar + ตรวจครบวงจร

**Files:**
- Modify: `DESIGN.md`
- Modify: `.impeccable/design.json`

- [ ] **Step 1: DESIGN.md** — ใน frontmatter `colors:` เพิ่มหลัง `coral:`:

```yaml
  teal-mem: "#2fb6a8"
```
และในหัวข้อ Secondary เพิ่มหลังบรรทัด Coral:

```markdown
- **Teal** (#2fb6a8): สี accent ของเกมความจำจับคู่
```

- [ ] **Step 2: sidecar** — ใน `.impeccable/design.json` `extensions.colorMeta` เพิ่มหลังรายการ `"coral"` (ใส่ comma ให้ JSON valid):

```json
,"teal-mem": { "role": "secondary", "displayName": "Teal — เกมความจำจับคู่", "canonical": "oklch(70% 0.11 185)", "tonalRamp": ["oklch(15% 0.11 185)", "oklch(26% 0.11 185)", "oklch(37% 0.11 185)", "oklch(48% 0.11 185)", "oklch(60% 0.11 185)", "oklch(70% 0.11 185)", "oklch(83% 0.08 185)", "oklch(95% 0.04 185)"] }
```
ตรวจ valid: `node -e "JSON.parse(require('fs').readFileSync('.impeccable/design.json','utf8')); console.log('valid')"` ต้องพิมพ์ `valid`

- [ ] **Step 3: Playwright ตรวจครบวงจร** (server `-c-1`)
  - hub 1180×820: ชั้น "นับกับคิด" มี 2 การ์ด (นับสัตว์ทะเล + ความจำจับคู่), การ์ดความจำมีปลาหมึก + การ์ดคว่ำ ?, ขอบสี teal
  - เข้าเกม: 4 การ์ด (ระดับเริ่ม 0); พลิกใบหนึ่ง → เผยสัตว์ + พูดชื่อ; พลิกใบที่ตรงคู่ → ค้างเปิด + matched; พลิกสองใบไม่ตรง → คว่ำกลับหลัง ~0.9 วิ
  - จับครบทุกคู่ → confetti; ตรวจ `localStorage['oceanAlaska.memoryLevel']` หลังชนะ
  - คีย์บอร์ด: Tab → Enter พลิกการ์ดได้, ปุ่มกลับได้
  - จอ 844×390: การ์ด ≥80px ไม่ล้น
  - เกมเดิม 6 เกม regression เข้า-ออกได้; console 0 error
  - (ถ้าการ์ด flip ไม่ขึ้นรูป/เพี้ยน controller แก้ CSS แล้ว commit เพิ่ม)

- [ ] **Step 4: รันเทสต์รอบสุดท้าย** — `node --test tests/*.test.mjs` → ผ่านหมด

- [ ] **Step 5: Commit**

```bash
git add DESIGN.md .impeccable/design.json
git commit -m "docs: teal as the memory-match accent color"
```

---

## นอกขอบเขต
- โหมดจับเวลา/นับครั้งพลิก (ขัดกฎ no-pressure)
- การ์ดธีมอื่นนอกจากสัตว์
- ทบทวนสมดุลเกมรวม (รอบแยก)
