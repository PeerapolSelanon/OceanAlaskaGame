# Spell the Word Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มเกมที่ 6 "สะกดคำ" — เด็กลากตัวอักษร (สับลำดับ) มาวางในช่องที่มีตัวหริปจางจนเรียงเป็นชื่อสัตว์อังกฤษ มีรูปสัตว์เป็นคำใบ้ ครบคำแล้วฉลอง

**Architecture:** ตามสเปก `docs/superpowers/specs/2026-06-13-spell-word-design.md` — ตรรกะ pure (letterBank/pickWord/isSolved) แยกทดสอบ, ข้อมูลคำ+สัตว์แยกไฟล์, scene `{init, destroy}` ใช้กลไกลากแบบ shadow-match (transform translate3d, setPointerCapture, กันนิ้วที่สอง) วางถูกช่อง→ลบไทล์+เติมช่องทึบ, รอบต่อรอบ

**Tech Stack:** Vanilla JS ES modules + SVG, Web Speech/Web Audio เดิม, `node --test`, ไม่มี dependency ใหม่

**กฎที่ห้ามละเมิด:** Pointer Events เท่านั้น · ไม่มีแพ้/ไม่มีเสียงเชิงลบ · timers เข้า `_timers[]` ล้างใน destroy + `speechSynthesis.cancel()` · สี UI ใช้ `var(--token)` · กันนิ้วที่สองตอนลาก

---

## File Structure

| ไฟล์ | บทบาท |
|---|---|
| Create `js/games/logic/spell-logic.js` + `tests/spell-logic.test.mjs` | letterBank / pickWord / isSolved (pure) |
| Create `js/games/data/spell-words.js` + `tests/spell-words.test.mjs` | รายการ {word, animal} |
| Modify `css/main.css` | `--coral` token + `.spell-slot`/`.spell-tile` |
| Modify `js/core/i18n.js` | spellWord / age47 / spellPrompt |
| Create `js/games/spell-word.js` | scene |
| Modify `js/main.js` | register scene |
| Modify `js/hub.js` | เพิ่มการ์ดในชั้น listen-lang |
| Modify `js/core/game-art.js` | คำใบ้บนการ์ด hub |
| Modify `DESIGN.md` + `.impeccable/design.json` | Coral = สีเกมที่ 6 |

---

### Task 1: spell-logic (pure, TDD)

**Files:**
- Create: `js/games/logic/spell-logic.js`
- Test: `tests/spell-logic.test.mjs`

- [ ] **Step 1: เขียนเทสต์ (fail ก่อน)**

```js
// tests/spell-logic.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../js/games/logic/round-utils.js';
import { letterBank, pickWord, isSolved } from '../js/games/logic/spell-logic.js';

const sorted = s => [...s].sort().join('');

test('letterBank: เป็น permutation ของตัวอักษรในคำ (รวมตัวซ้ำ)', () => {
  const bank = letterBank('PUFFIN', mulberry32(1));
  assert.equal(bank.length, 6);
  assert.equal(sorted(bank), sorted('PUFFIN')); // FFINPU — ตัว F สองตัวครบ
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
  const done = new Set(['CRAB', 'SEAL']); // เหลือ ORCA ที่ยังไม่ทำ
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
```

- [ ] **Step 2: รันให้ fail** — `node --test tests/spell-logic.test.mjs` → Cannot find module

- [ ] **Step 3: เขียน implementation**

```js
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
```

- [ ] **Step 4: รันให้ผ่าน** — `node --test tests/spell-logic.test.mjs` → PASS (6) และ `node --test tests/*.test.mjs` ผ่านทั้งหมด

- [ ] **Step 5: Commit**

```bash
git add js/games/logic/spell-logic.js tests/spell-logic.test.mjs
git commit -m "feat: spell-logic — letter bank, word picker, solved check"
```

---

### Task 2: spell-words data

**Files:**
- Create: `js/games/data/spell-words.js`
- Test: `tests/spell-words.test.mjs`

- [ ] **Step 1: เขียนเทสต์ (fail ก่อน)**

```js
// tests/spell-words.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPELL_WORDS } from '../js/games/data/spell-words.js';
import { byId } from '../js/core/animals.js';

test('ทุกคำเป็นตัวพิมพ์ใหญ่ A-Z ยาว >= 3 และสัตว์ resolve ได้', () => {
  assert.ok(SPELL_WORDS.length >= 5);
  for (const e of SPELL_WORDS) {
    assert.match(e.word, /^[A-Z]+$/, e.word);
    assert.ok(e.word.length >= 3, e.word);
    assert.ok(byId(e.animal), `animal ${e.animal} (word ${e.word})`);
  }
});

test('เรียงตามความยาวไม่ลดลง (สั้น→ยาว)', () => {
  for (let i = 1; i < SPELL_WORDS.length; i++) {
    assert.ok(SPELL_WORDS[i].word.length >= SPELL_WORDS[i - 1].word.length,
      `${SPELL_WORDS[i - 1].word} -> ${SPELL_WORDS[i].word}`);
  }
});
```

- [ ] **Step 2: รันให้ fail** — `node --test tests/spell-words.test.mjs` → Cannot find module

- [ ] **Step 3: เขียนข้อมูล**

```js
// js/games/data/spell-words.js
// Animal-name spelling words, shortest first. Each word reuses an existing
// animal's art (picture clue), cry, and spoken name via byId(animal).
export const SPELL_WORDS = [
  { word: 'CRAB', animal: 'crab' },
  { word: 'ORCA', animal: 'orca' },
  { word: 'SEAL', animal: 'seal' },
  { word: 'OTTER', animal: 'otter' },
  { word: 'WHALE', animal: 'humpback' },
  { word: 'PUFFIN', animal: 'puffin' },
  { word: 'SALMON', animal: 'salmon' },
];
```

- [ ] **Step 4: รันให้ผ่าน** — `node --test tests/spell-words.test.mjs` → PASS; `node --test tests/*.test.mjs` ผ่านหมด

- [ ] **Step 5: Commit**

```bash
git add js/games/data/spell-words.js tests/spell-words.test.mjs
git commit -m "feat: spell-words data — 7 animal names shortest-first"
```

---

### Task 3: token + i18n + CSS (รากฐาน scene)

**Files:**
- Modify: `css/main.css` (เพิ่ม `--coral` ใน `:root`; เพิ่มบล็อก spell หลังบล็อก trace-letters)
- Modify: `js/core/i18n.js` (เพิ่ม 3 key)

- [ ] **Step 1: เพิ่ม token** — ใน `:root` ของ `css/main.css` เพิ่มบรรทัดถัดจาก `--sun-gold: #f7d154;`:

```css
  --coral: #ef7d6e;
```

- [ ] **Step 2: เพิ่มสไตล์ spell** — ต่อจากบล็อก `/* trace-letters */` (ก่อน `/* top bar shared by all scenes */`):

```css
/* spell-word: letter tiles dragged into ghosted slots */
.spell-slot { width: clamp(60px, 11vw, 82px); height: clamp(70px, 13vw, 92px); border-radius: 16px; border: 3px dashed color-mix(in srgb, var(--ink-deep) 35%, transparent); display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.45); }
.spell-slot .ghost { font: 800 clamp(32px, 7vw, 54px) system-ui, sans-serif; color: var(--ink-deep); opacity: .18; }
.spell-slot.filled { border-style: solid; border-color: var(--coral); background: linear-gradient(180deg, var(--foam-white), var(--ice-mist)); }
.spell-slot.filled .ghost { opacity: 1; color: var(--coral); }
.spell-tile { width: clamp(60px, 11vw, 82px); height: clamp(70px, 13vw, 92px); min-width: 0; min-height: 0; padding: 0; font: 800 clamp(32px, 7vw, 54px) system-ui, sans-serif; color: var(--ink-deep); cursor: grab; }
```

- [ ] **Step 3: เพิ่ม i18n keys** — แทรกก่อน `};` ของ STRINGS ใน `js/core/i18n.js`:

```js
  spellWord: ['สะกดคำ', 'Spell the Word'],
  age47: ['4-7 ปี', 'Age 4-7'],
  spellPrompt: ['ลากตัวอักษรมาสะกดคำนะ', 'Drag the letters to spell the word'],
```

- [ ] **Step 4: ตรวจ** — `node --test tests/*.test.mjs` ผ่านหมด (i18n test เดิมไม่พังเพราะแค่เพิ่ม key) และ `node --check js/core/i18n.js`

- [ ] **Step 5: Commit**

```bash
git add css/main.css js/core/i18n.js
git commit -m "feat: coral token, spell slot/tile styles, spell strings"
```

---

### Task 4: spell-word scene

**Files:**
- Create: `js/games/spell-word.js`

- [ ] **Step 1: เขียน scene ทั้งไฟล์**

```js
// js/games/spell-word.js
import { byId, playCry } from '../core/animals.js';
import { SPELL_WORDS } from './data/spell-words.js';
import { speak, sfx, warmUp } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { get, set } from '../core/settings.js';
import { onActivate } from '../core/ui.js';
import { confetti } from '../core/confetti.js';
import { mulberry32 } from './logic/round-utils.js';
import { letterBank, pickWord, isSolved } from './logic/spell-logic.js';

export const spellWord = {
  _container: null,
  _timers: [],
  _drag: null,
  _locked: false,
  _done: null,
  _last: null,
  _rng: null,
  _word: null,
  _slots: null,
  _clueArt: null,

  init(container, go) {
    this._container = container;
    this._timers = [];
    this._drag = null;
    this._locked = false;
    this._done = new Set(get('spellDone.en', []));
    this._last = null;
    this._rng = mulberry32((Date.now() & 0xffffffff) >>> 0);
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" aria-label="${t('back')}" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <button class="btn btn-round" id="hear-btn" aria-label="${t('listenAgain')}" style="position:absolute;top:12px;right:12px;z-index:10;">🔊</button>
      <div id="prompt" style="position:absolute;top:16px;width:100%;text-align:center;color:var(--ink-deep);font-size:clamp(20px,3.4vw,32px);font-weight:800;text-shadow:var(--text-halo);pointer-events:none;"></div>
      <div id="clue" style="position:absolute;top:60px;left:0;right:0;height:32vh;display:flex;align-items:center;justify-content:center;"></div>
      <div id="slot-row" style="position:absolute;top:48vh;left:0;right:0;display:flex;justify-content:center;gap:1.5vw;flex-wrap:wrap;"></div>
      <div id="bank-row" style="position:absolute;bottom:4vh;left:0;right:0;display:flex;justify-content:center;gap:1.5vw;flex-wrap:wrap;"></div>
    `);
    onActivate(container.querySelector('#back-btn'), () => go('hub'));
    onActivate(container.querySelector('#hear-btn'), () => this._sayWord());
    this._newRound();
  },

  _sayWord() {
    if (!this._container || !this._word) return;
    speak(this._word.word, 'en');
  },

  _newRound() {
    this._locked = false;
    this._drag = null;
    const c = this._container;
    const entry = pickWord(SPELL_WORDS, this._done, this._last, this._rng);
    this._word = entry;
    this._last = entry;
    const word = entry.word;

    const clue = c.querySelector('#clue');
    clue.innerHTML = '';
    const size = Math.min(window.innerHeight * 0.28, window.innerWidth * 0.4);
    const art = byId(entry.animal).make(size);
    art.classList.add('float');
    clue.appendChild(art);
    this._clueArt = art;

    c.querySelector('#prompt').textContent = t('spellPrompt');

    const slotRow = c.querySelector('#slot-row');
    slotRow.innerHTML = '';
    this._slots = [];
    for (const ch of word) {
      const slot = document.createElement('div');
      slot.className = 'spell-slot';
      slot.dataset.letter = ch;
      const ghost = document.createElement('span');
      ghost.className = 'ghost';
      ghost.textContent = ch;
      slot.appendChild(ghost);
      slotRow.appendChild(slot);
      this._slots.push({ el: slot, letter: ch, filled: false });
    }

    const bankRow = c.querySelector('#bank-row');
    bankRow.innerHTML = '';
    for (const ch of letterBank(word, this._rng)) {
      const tile = document.createElement('button');
      tile.className = 'btn spell-tile';
      tile.dataset.letter = ch;
      tile.textContent = ch;
      tile.style.touchAction = 'none';
      tile.addEventListener('pointerdown', (e) => this._startDrag(e, tile));
      bankRow.appendChild(tile);
    }

    this._sayWord();
  },

  _startDrag(e, tile) {
    if (this._drag || this._locked || tile.dataset.placed) return; // one drag; ignore 2nd finger
    e.preventDefault();
    warmUp();
    try { tile.setPointerCapture(e.pointerId); } catch { /* synthetic events lack a live pointer */ }
    const rect = tile.getBoundingClientRect();
    this._drag = { tile, dx: e.clientX - rect.left, dy: e.clientY - rect.top, homeRect: rect };
    tile.style.zIndex = '20';
    tile.style.position = 'fixed';
    tile.style.left = rect.left + 'px';
    tile.style.top = rect.top + 'px';
    tile.style.transition = 'none';
    sfx.bubble();
    const move = (ev) => this._moveDrag(ev);
    const up = (ev) => {
      tile.removeEventListener('pointermove', move);
      tile.removeEventListener('pointerup', up);
      tile.removeEventListener('pointercancel', up);
      this._endDrag();
    };
    tile.addEventListener('pointermove', move);
    tile.addEventListener('pointerup', up);
    tile.addEventListener('pointercancel', up);
  },

  _moveDrag(e) {
    if (!this._drag) return;
    const { tile, dx, dy, homeRect } = this._drag;
    tile.style.transform = `translate3d(${e.clientX - dx - homeRect.left}px, ${e.clientY - dy - homeRect.top}px, 0)`;
  },

  _endDrag() {
    const drag = this._drag;
    this._drag = null;
    if (!drag) return;
    const { tile } = drag;
    const r = tile.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const slot = this._slots.find((s) => {
      if (s.filled || s.letter !== tile.dataset.letter) return false;
      const b = s.el.getBoundingClientRect();
      return cx > b.left && cx < b.right && cy > b.top && cy < b.bottom;
    });
    if (slot) {
      slot.filled = true;
      slot.el.classList.add('filled');
      tile.remove(); // ghost letter turns solid; tile no longer needed
      sfx.ding();
      if (isSolved(this._slots)) this._win();
    } else {
      tile.style.transition = 'transform .35s ease'; // bounce home, no scolding
      tile.style.transform = 'translate3d(0, 0, 0)';
    }
  },

  _win() {
    this._locked = true;
    this._clueArt.classList.remove('float');
    this._clueArt.classList.add('animal', 'boing');
    sfx.cheer();
    this._timers.push(...confetti(this._container));
    speak(this._word.word, 'en');
    speak(t('great'), getLang(), { interrupt: false });
    playCry(byId(this._word.animal));
    this._done.add(this._word.word);
    set('spellDone.en', [...this._done]);
    this._timers.push(setTimeout(() => { if (this._container) this._newRound(); }, 2600));
  },

  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._container = null;
    this._drag = null;
    try { speechSynthesis.cancel(); } catch {}
  },
};
```

หมายเหตุ:
- `_clueArt.classList.add('animal', 'boing')` — `make()` คืน svg ที่มี class `animal` อยู่แล้ว เพิ่ม `boing` พอ; เพิ่ม `'animal'` ซ้ำไม่เสียหาย (กันพลาดถ้า art เป็น composite ในอนาคต)
- ลบไทล์เมื่อวางถูก แล้วช่อง ghost กลายเป็นทึบ (`.filled`) — ไม่ต้อง snap transform ให้ยุ่ง
- กันนิ้วที่สอง: `if (this._drag ...) return` ที่ต้น `_startDrag`

- [ ] **Step 2: ตรวจ** — `node --check js/games/spell-word.js` ผ่าน; `node --test tests/*.test.mjs` ผ่านหมด

- [ ] **Step 3: Commit**

```bash
git add js/games/spell-word.js
git commit -m "feat: spell-word scene — drag letters into ghosted slots, celebrate"
```

---

### Task 5: เชื่อม hub + register + ภาพการ์ด

**Files:**
- Modify: `js/main.js`
- Modify: `js/hub.js`
- Modify: `js/core/game-art.js`

- [ ] **Step 1: register scene** — ใน `js/main.js` เพิ่ม import หลัง traceLetters:

```js
import { spellWord } from './games/spell-word.js';
```
และเพิ่มหลัง `registerScene('trace-letters', traceLetters);`:

```js
registerScene('spell-word', spellWord);
```

- [ ] **Step 2: เพิ่มการ์ดใน hub** — ใน `js/hub.js` ใน `GAME_BUTTONS` เพิ่มรายการต่อจาก `listen-find` (ให้อยู่ก่อน count-tap; ชั้น listen-lang จะมี 2 เกม):

```js
  { scene: 'spell-word', nameKey: 'spellWord', ageKey: 'age47', animal: 'crab', color: 'var(--coral)', shelf: 'listen-lang' },
```

(วางบรรทัดนี้ระหว่างรายการ `listen-find` กับ `count-tap` ใน array)

- [ ] **Step 3: เพิ่มคำใบ้บนการ์ด hub** — ใน `js/core/game-art.js` ใน object `SCENES` เพิ่ม method (ก่อน `'count-tap'`):

```js
  // สะกดคำ: ปู+ ไทล์ตัวอักษรเรียง มีช่องว่างหนึ่งช่อง
  'spell-word'(s, color) {
    placeAnimal(s, 'crab', 62, 2, 76);
    [['C', 16], ['R', 62], ['A', 108]].forEach(([ch, x]) => {
      const r = el('rect', { x, y: 98, width: 40, height: 44, rx: 8 }, s);
      r.style.cssText = `fill:var(--foam-white);stroke:${color};stroke-width:3`;
      const tx = el('text', { x: x + 20, y: 130, 'text-anchor': 'middle' }, s);
      tx.textContent = ch;
      tx.style.cssText = 'font:800 26px system-ui,sans-serif;fill:var(--ink-deep)';
    });
    const slot = el('rect', { x: 154, y: 98, width: 40, height: 44, rx: 8 }, s);
    slot.style.cssText = `fill:none;stroke:${color};stroke-width:3;stroke-dasharray:4 5`;
  },
```

- [ ] **Step 4: ตรวจ** — `node --check js/main.js js/hub.js js/core/game-art.js`; `node --test tests/*.test.mjs` ผ่านหมด

- [ ] **Step 5: Commit**

```bash
git add js/main.js js/hub.js js/core/game-art.js
git commit -m "feat: spell-word on the listen-lang shelf with letter-tile tile art"
```

---

### Task 6: DESIGN.md + ตรวจครบวงจร

**Files:**
- Modify: `DESIGN.md`
- Modify: `.impeccable/design.json`

- [ ] **Step 1: DESIGN.md** — ใน frontmatter `colors:` เพิ่มหลัง `sun-gold:` บรรทัด:

```yaml
  coral: "#ef7d6e"
```
และในหัวข้อ Secondary เพิ่มบรรทัดหลัง Sun Gold:

```markdown
- **Coral** (#ef7d6e): สี accent ของเกมสะกดคำ
```

- [ ] **Step 2: sidecar** — ใน `.impeccable/design.json` ใน `extensions.colorMeta` เพิ่มหลัง `"sun-gold"`:

```json
      ,"coral": { "role": "secondary", "displayName": "Coral — เกมสะกดคำ", "canonical": "oklch(70% 0.14 30)", "tonalRamp": ["oklch(15% 0.14 30)", "oklch(26% 0.14 30)", "oklch(37% 0.14 30)", "oklch(48% 0.14 30)", "oklch(60% 0.14 30)", "oklch(70% 0.14 30)", "oklch(83% 0.10 30)", "oklch(95% 0.05 30)"] }
```
(ตรวจว่า JSON ยัง valid: `node -e "JSON.parse(require('fs').readFileSync('.impeccable/design.json','utf8'))"` ไม่ throw)

- [ ] **Step 3: Playwright ตรวจครบวงจร** (server `-c-1`, ทดสอบบนเบราว์เซอร์จริง)
  - hub 1180×820: ชั้น "ฟังกับภาษา" มี 2 การ์ด (เสียงเรียกใคร + สะกดคำ), การ์ดสะกดคำมีปู+ไทล์ตัวอักษร, ขอบสี coral
  - เข้าเกมสะกดคำ → เห็นรูปสัตว์ + แถวช่อง ghost + แถบไทล์; พูดคำ
  - จำลอง pointer drag: ลากไทล์แต่ละตัวลงช่อง ghost ที่ตรงกัน (คำนวณ center ช่องจาก getBoundingClientRect แล้ว dispatch pointerdown→move→up) จนครบคำ → ตรวจ confetti + รอบใหม่ + `localStorage['oceanAlaska.spellDone.en']` มีคำนั้น
  - ลากไทล์ไปช่องผิด → เด้งกลับ ไม่ filled
  - ปุ่ม 🔊 พูดซ้ำ, 🏠 กลับ hub; คีย์บอร์ดกดปุ่ม 🏠 ได้
  - จอ 844×390: ช่อง+ไทล์ wrap ได้ ไม่ล้นจอ
  - เกมเดิม 5 เกม regression เข้า-ออกได้; console 0 error

- [ ] **Step 4: รันเทสต์รอบสุดท้าย** — `node --test tests/*.test.mjs` ผ่านหมด

- [ ] **Step 5: Commit**

```bash
git add DESIGN.md .impeccable/design.json
git commit -m "docs: coral as the spell-word accent color"
```

---

## นอกขอบเขตของแผนนี้

- คำยาว/ตัวลวง/โหมด recall (ไม่มี ghost)
- สะกดคำไทย
- ปรับทุกเกมพร้อมกันหลังเพิ่มสัตว์ชุดใหม่ (เกมนี้รับคำเพิ่มอัตโนมัติถ้าเติม `spell-words.js`)
