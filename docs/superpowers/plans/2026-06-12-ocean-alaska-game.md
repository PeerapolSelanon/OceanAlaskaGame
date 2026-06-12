# My Alaska Ocean (ทะเลอลาสก้าของหนู) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bilingual (TH/EN) HTML5 toddler game suite — hub + 4 mini-games with 8 hand-drawn SVG Alaska sea animals — and deploy to GitHub Pages.

**Architecture:** Vanilla ES modules, no build step. `js/main.js` is a scene manager swapping scenes (hub + 4 games) that all implement `{ init(container, go), destroy() }`. Core modules (settings/i18n/audio/animals) are imported directly by scenes. Game logic that needs tests is pure and DOM-free under `js/games/logic/`.

**Tech Stack:** HTML/CSS/JS (ES modules), SVG art generated in JS, Web Speech API (TTS), Web Audio API (synth SFX), `node --test` for logic tests, Playwright (via Claude tooling) for visual verification, GitHub Pages for hosting.

**Spec:** `docs/superpowers/specs/2026-06-12-ocean-alaska-game-design.md`

**Dev server (needed for ES modules):** `npx -y http-server -p 8080 -c-1` (run in background from repo root), then open `http://localhost:8080`.

---

## File Structure

```
index.html                       — shell, viewport/iPad meta, loads js/main.js
css/main.css                     — layout, ocean theme, keyframe animations, rotate hint
js/main.js                       — scene registry + go(), boots into hub
js/core/settings.js              — get/set persisted settings (localStorage, in-memory fallback)
js/core/i18n.js                  — bilingual strings, t(), getLang(), toggleLang()
js/core/audio.js                 — speak()/speakName() TTS + pop/ding/cheer/bubble synth SFX
js/core/svg.js                   — el() SVG element helper
js/core/animals.js               — ANIMALS registry: 8 × {id, th, en, make(w)}
js/hub.js                        — hub scene
js/games/logic/round-utils.js    — mulberry32 rng, shuffle, sample, pickRound, pickQuestion
js/games/logic/count-logic.js    — makeQuestion, nextDifficulty
js/games/tap-sea.js              — game 1 (1-2 yo)
js/games/shadow-match.js         — game 2 (2-4 yo)
js/games/count-tap.js            — game 3 (3-5 yo)
js/games/listen-find.js          — game 4 (3-5 yo)
tests/round-utils.test.mjs
tests/count-logic.test.mjs
tests/i18n.test.mjs
README.md
```

---

### Task 1: Skeleton — index.html, CSS theme, scene manager

**Files:**
- Create: `index.html`, `css/main.css`, `js/main.js`, `js/core/svg.js`
- Modify: git branch `master` → `main`

- [ ] **Step 1: Rename branch to main**

```bash
git branch -m master main
```

- [ ] **Step 2: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>ทะเลอลาสก้าของหนู — My Alaska Ocean</title>
<link rel="stylesheet" href="css/main.css">
</head>
<body>
<div id="app"></div>
<div id="rotate-hint"><div class="rotate-icon">⟳</div><p>หมุนจอเป็นแนวนอนนะ<br>Please rotate to landscape</p></div>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: Write `css/main.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body { height: 100%; overflow: hidden; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
body { touch-action: none; user-select: none; -webkit-user-select: none; }

#app { position: fixed; inset: 0; background: linear-gradient(180deg, #bfe6f2 0%, #6db7d8 12%, #2f86b8 45%, #155e8d 78%, #0d3f63 100%); overflow: hidden; }

/* rotate hint: only shown in portrait */
#rotate-hint { display: none; position: fixed; inset: 0; z-index: 99; background: #0d3f63; color: #fff; text-align: center; flex-direction: column; align-items: center; justify-content: center; gap: 16px; font-size: 22px; line-height: 1.6; }
#rotate-hint .rotate-icon { font-size: 64px; animation: spin 2.5s linear infinite; }
@media (orientation: portrait) { #rotate-hint { display: flex; } }
@keyframes spin { to { transform: rotate(360deg); } }

/* big tappable buttons */
.btn { min-width: 80px; min-height: 80px; border: none; cursor: pointer; border-radius: 22px; background: linear-gradient(180deg, #ffffff, #e8f2f8); box-shadow: 0 6px 16px rgba(0,20,40,.3); font-family: inherit; transition: transform .12s ease; }
.btn:active { transform: scale(.93); }
.btn-round { width: 56px; height: 56px; min-width: 56px; min-height: 56px; border-radius: 50%; font-size: 26px; }

/* top bar shared by all scenes */
.topbar { position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; z-index: 10; pointer-events: none; }
.topbar > * { pointer-events: auto; }
.topbar .title { font-size: clamp(18px, 3.5vw, 30px); font-weight: 800; color: #fff; text-shadow: 0 2px 6px rgba(0,30,60,.45); }
.topbar .controls { display: flex; gap: 10px; }

/* animal animations */
.animal { transform-origin: center; }
.animal.float { animation: float 3.2s ease-in-out infinite alternate; }
@keyframes float { from { transform: translateY(-8px) rotate(-1.5deg); } to { transform: translateY(8px) rotate(1.5deg); } }
.animal.boing { animation: boing .55s ease; }
@keyframes boing { 0% { transform: scale(1); } 35% { transform: scale(1.25, .8); } 65% { transform: scale(.85, 1.15); } 100% { transform: scale(1); } }
.animal.shake { animation: shake .5s ease; }
@keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-10px) rotate(-4deg); } 75% { transform: translateX(10px) rotate(4deg); } }
.animal .eye-blink { animation: blink 4s infinite; transform-box: fill-box; transform-origin: center; }
@keyframes blink { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.08); } }
.pop-in { animation: popin .45s cubic-bezier(.18,1.4,.4,1); }
@keyframes popin { from { transform: scale(0); } to { transform: scale(1); } }
.fade-out { animation: fadeout .8s ease forwards; }
@keyframes fadeout { to { opacity: 0; transform: scale(.6); } }

/* celebration confetti */
.confetti { position: absolute; width: 14px; height: 14px; border-radius: 3px; pointer-events: none; animation: confetti-fall 1.6s ease-in forwards; }
@keyframes confetti-fall { 0% { transform: translateY(-20px) rotate(0); opacity: 1; } 100% { transform: translateY(70vh) rotate(540deg); opacity: 0; } }

/* decorative bubbles */
.bubble { position: absolute; border: 2px solid rgba(255,255,255,.4); border-radius: 50%; pointer-events: none; animation: bubble-rise linear infinite; }
@keyframes bubble-rise { from { transform: translateY(0); opacity: .7; } to { transform: translateY(-110vh); opacity: 0; } }
```

- [ ] **Step 4: Write `js/core/svg.js`**

```js
const NS = 'http://www.w3.org/2000/svg';
export function el(tag, attrs = {}, parent = null) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}
```

- [ ] **Step 5: Write `js/main.js` (scene manager + temporary placeholder hub)**

```js
const scenes = {};
let current = null;

export function registerScene(name, scene) { scenes[name] = scene; }

export function go(name) {
  const app = document.getElementById('app');
  if (current && current.destroy) current.destroy();
  app.innerHTML = '';
  current = scenes[name];
  current.init(app, go);
}

// Placeholder hub (replaced in Task 6)
registerScene('hub', {
  init(container) {
    const h = document.createElement('h1');
    h.textContent = 'ทะเลอลาสก้าของหนู 🌊';
    h.style.cssText = 'color:#fff;text-align:center;padding-top:40vh;';
    container.appendChild(h);
  },
  destroy() {},
});

go('hub');
```

- [ ] **Step 6: Verify in browser**

Run in background: `npx -y http-server -p 8080 -c-1`
Open `http://localhost:8080` with Playwright, screenshot. Expected: ocean gradient background + Thai title centered, no console errors (ignore favicon 404).

- [ ] **Step 7: Commit**

```bash
git add index.html css/ js/
git commit -m "feat: project skeleton with scene manager and ocean theme"
```

---

### Task 2: settings.js with tests

**Files:**
- Create: `js/core/settings.js`, `tests/settings.test.mjs`

- [ ] **Step 1: Write failing test `tests/settings.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { get, set } from '../js/core/settings.js';

test('returns default when key missing', () => {
  assert.equal(get('missing-key', 'fallback'), 'fallback');
});

test('round-trips values', () => {
  set('lang', 'en');
  assert.equal(get('lang', 'th'), 'en');
  set('soundOn', false);
  assert.equal(get('soundOn', true), false);
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `node --test tests/settings.test.mjs`
Expected: FAIL (cannot find module settings.js)

- [ ] **Step 3: Write `js/core/settings.js`**

```js
// Persisted settings. Falls back to in-memory map when localStorage
// is unavailable (node tests, private browsing).
const mem = new Map();
const PREFIX = 'oceanAlaska.';

function store() {
  try { if (typeof localStorage !== 'undefined') return localStorage; } catch { /* blocked */ }
  return null;
}

export function get(key, def) {
  const ls = store();
  const raw = ls ? ls.getItem(PREFIX + key) : mem.get(key);
  if (raw == null) return def;
  try { return JSON.parse(raw); } catch { return def; }
}

export function set(key, value) {
  const raw = JSON.stringify(value);
  const ls = store();
  if (ls) ls.setItem(PREFIX + key, raw); else mem.set(key, raw);
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `node --test tests/settings.test.mjs` — Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add js/core/settings.js tests/settings.test.mjs
git commit -m "feat: persisted settings module"
```

---

### Task 3: i18n.js with tests

**Files:**
- Create: `js/core/i18n.js`, `tests/i18n.test.mjs`

- [ ] **Step 1: Write failing test `tests/i18n.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { t, getLang, setLang, toggleLang } from '../js/core/i18n.js';

test('t() returns Thai by default and English after toggle', () => {
  setLang('th');
  assert.equal(t('appTitle'), 'ทะเลอลาสก้าของหนู');
  toggleLang();
  assert.equal(getLang(), 'en');
  assert.equal(t('appTitle'), 'My Alaska Ocean');
  setLang('th');
});

test('t() falls back to key when string missing', () => {
  assert.equal(t('no-such-key'), 'no-such-key');
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `node --test tests/i18n.test.mjs` — Expected: FAIL

- [ ] **Step 3: Write `js/core/i18n.js`**

```js
import { get, set } from './settings.js';

// [thai, english]
const STRINGS = {
  appTitle: ['ทะเลอลาสก้าของหนู', 'My Alaska Ocean'],
  tapSea: ['แตะทะเล', 'Tap the Sea'],
  shadowMatch: ['จับคู่เงา', 'Shadow Match'],
  countTap: ['นับสัตว์ทะเล', 'Count & Tap'],
  listenFind: ['เสียงเรียกใคร', 'Listen & Find'],
  age12: ['1-2 ปี', 'Age 1-2'],
  age24: ['2-4 ปี', 'Age 2-4'],
  age35: ['3-5 ปี', 'Age 3-5'],
  back: ['กลับ', 'Back'],
  great: ['เก่งมาก!', 'Great job!'],
  tryAgain: ['ลองอีกครั้งนะ', 'Try again'],
  howMany: ['มีกี่ตัวนะ?', 'How many?'],
  whereIs: ['ตัวไหนคือ', 'Where is the'],
  dragToShadow: ['ลากสัตว์ไปหาเงาของมันนะ', 'Drag each animal to its shadow'],
  tapAnywhere: ['แตะที่ทะเลเลย!', 'Tap the sea!'],
};

let lang = get('lang', 'th');

export function t(key) {
  const pair = STRINGS[key];
  return pair ? pair[lang === 'th' ? 0 : 1] : key;
}
export function getLang() { return lang; }
export function setLang(value) { lang = value; set('lang', lang); }
export function toggleLang() { setLang(lang === 'th' ? 'en' : 'th'); return lang; }
```

- [ ] **Step 4: Run test, verify it passes**

Run: `node --test tests/i18n.test.mjs` — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/core/i18n.js tests/i18n.test.mjs
git commit -m "feat: bilingual i18n module"
```

---

### Task 4: audio.js — TTS + synth SFX

**Files:**
- Create: `js/core/audio.js`

No unit tests (browser-only APIs); verified in browser in later tasks.

- [ ] **Step 1: Write `js/core/audio.js`**

```js
import { get, set } from './settings.js';

let audioCtx = null;
let soundOn = get('soundOn', true);

export function isSoundOn() { return soundOn; }
export function setSoundOn(v) { soundOn = v; set('soundOn', v); if (!v) try { speechSynthesis.cancel(); } catch {} }

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// --- synthesized effects ---
function tone(freq, dur, { type = 'sine', vol = 0.25, when = 0, slide = 0 } = {}) {
  if (!soundOn) return;
  const c = ctx();
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  pop()    { tone(520, 0.12, { type: 'square', vol: 0.12, slide: 300 }); },
  ding()   { tone(880, 0.35, { vol: 0.2 }); tone(1320, 0.4, { vol: 0.1, when: 0.05 }); },
  bubble() { tone(300, 0.18, { vol: 0.15, slide: 500 }); },
  boing()  { tone(180, 0.25, { type: 'triangle', vol: 0.25, slide: 240 }); },
  cheer()  { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { vol: 0.2, when: i * 0.12 })); },
  wrongSoft() { tone(330, 0.2, { type: 'triangle', vol: 0.1, slide: -60 }); }, // gentle, not scary
};

// --- speech ---
function pickVoice(langCode) {
  const voices = speechSynthesis.getVoices();
  return voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langCode)) || null;
}

export function speak(text, lang = 'th', { interrupt = true } = {}) {
  if (!soundOn || typeof speechSynthesis === 'undefined') return;
  if (interrupt) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'th' ? 'th-TH' : 'en-US';
  const voice = pickVoice(lang === 'th' ? 'th' : 'en');
  if (voice) u.voice = voice;
  u.rate = 0.85;
  u.pitch = 1.1;
  speechSynthesis.speak(u);
}

// Speak an animal name in both languages, current language first.
export function speakName(animal, currentLang) {
  const order = currentLang === 'th' ? [['th', animal.th], ['en', animal.en]] : [['en', animal.en], ['th', animal.th]];
  speak(order[0][1], order[0][0]);
  speak(order[1][1], order[1][0], { interrupt: false });
}

// iOS requires voices to load after a user gesture; warm them up.
export function warmUp() {
  try { speechSynthesis.getVoices(); ctx(); } catch {}
}
```

- [ ] **Step 2: Commit**

```bash
git add js/core/audio.js
git commit -m "feat: audio module with TTS and synth sound effects"
```

---

### Task 5: animals.js — 8 SVG animals + preview route

**Files:**
- Create: `js/core/animals.js`
- Modify: `js/main.js` (add `?preview=animals` debug route)

Style D per spec: realistic proportions, flat colors + 1-2 shade layers, big readable eyes. Each `make(width)` returns an `<svg>` element with class `animal`; eyes carry class `eye-blink`. Approved reference art (path data to adapt): `.superpowers/brainstorm/1605-1781235708/content/art-style-a-vs-c.html` (orca C-shape, seal C-shape) and `art-style-svg-showcase.html` (puffin, salmon).

- [ ] **Step 1: Write `js/core/animals.js`**

Full registry. The first four reuse approved path data (simplified fills per style D); the last four are drawn to the same conventions. Visual refinement loop happens in Step 3.

```js
import { el } from './svg.js';

function svgRoot(vbW, vbH, width) {
  const svg = el('svg', { viewBox: `0 0 ${vbW} ${vbH}`, width, height: Math.round(width * vbH / vbW), class: 'animal' });
  return svg;
}

function eye(svg, cx, cy, r, { pupil = '#0c0f13', highlight = true } = {}) {
  const g = el('g', { class: 'eye-blink' }, svg);
  el('circle', { cx, cy, r, fill: pupil }, g);
  if (highlight) el('circle', { cx: cx + r * 0.35, cy: cy - r * 0.35, r: r * 0.35, fill: '#fff' }, g);
  return g;
}

const ORCA = {
  id: 'orca', th: 'วาฬเพชฌฆาต', en: 'Orca',
  make(w) {
    const s = svgRoot(320, 180, w);
    el('path', { d: 'M 128 104 C 142 114, 148 130, 142 144 C 130 136, 122 120, 122 106 Z', fill: '#0a0d12', opacity: '.75' }, s);
    el('path', { d: 'M 24 96 C 30 74, 52 60, 88 54 C 130 47, 178 50, 214 64 C 232 71, 246 80, 252 90 C 258 96, 256 102, 248 105 C 220 114, 170 124, 120 124 C 76 124, 40 114, 28 104 C 22 100, 21 98, 24 96 Z', fill: '#1d242e' }, s);
    el('path', { d: 'M 246 94 C 260 78, 276 68, 294 63 C 285 76, 282 87, 286 94 C 282 101, 284 112, 294 125 C 277 119, 259 107, 248 102 Z', fill: '#141a22' }, s);
    el('path', { d: 'M 138 52 C 137 26, 146 8, 161 1 C 158 20, 162 38, 172 53 Z', fill: '#141a22' }, s);
    el('path', { d: 'M 26 98 C 44 84, 70 79, 96 85 C 118 90, 132 99, 136 109 C 138 114, 134 118, 124 119 C 92 122, 54 116, 34 106 C 26 102, 24 100, 26 98 Z', fill: '#eef3f7' }, s);
    el('path', { d: 'M 184 110 C 196 101, 212 98, 224 102 C 218 112, 202 119, 188 117 C 184 115, 182 112, 184 110 Z', fill: '#eef3f7' }, s);
    el('path', { d: 'M 171 59 C 185 55, 200 58, 209 66 C 200 73, 185 75, 173 70 C 169 66, 169 61, 171 59 Z', fill: '#a8b7c4', opacity: '.8' }, s);
    el('ellipse', { cx: 82, cy: 73, rx: 17, ry: 5.5, fill: '#f2f7fa', transform: 'rotate(-17 82 73)' }, s);
    el('path', { d: 'M 27 99 Q 58 108 94 101', stroke: '#0a0d12', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 106 108 C 120 122, 122 144, 104 158 C 92 144, 92 122, 99 106 Z', fill: '#141a22' }, s);
    eye(s, 72, 87, 4.5);
    return s;
  },
  cry() { return [['boing'], ['ding']]; },
};

const HUMPBACK = {
  id: 'humpback', th: 'วาฬหลังค่อม', en: 'Humpback Whale',
  make(w) {
    const s = svgRoot(320, 180, w);
    el('path', { d: 'M 20 100 C 30 70, 70 52, 120 50 C 180 48, 240 64, 268 84 C 280 92, 278 100, 266 104 C 220 118, 140 126, 80 118 C 45 113, 18 110, 20 100 Z', fill: '#4a6275' }, s);
    el('path', { d: 'M 262 92 C 274 76, 288 66, 304 60 C 297 74, 295 84, 298 92 C 295 99, 297 110, 305 122 C 289 116, 272 104, 263 100 Z', fill: '#3c5163' }, s);
    el('path', { d: 'M 182 56 C 188 46, 198 41, 206 41 C 202 49, 200 55, 200 59 Z', fill: '#3c5163' }, s);
    // throat grooves
    el('path', { d: 'M 24 104 C 60 118, 110 122, 150 118', stroke: '#5d7689', 'stroke-width': 2, fill: 'none', opacity: '.8' }, s);
    el('path', { d: 'M 28 110 C 64 122, 110 126, 146 122', stroke: '#5d7689', 'stroke-width': 2, fill: 'none', opacity: '.6' }, s);
    // long white pectoral fin
    el('path', { d: 'M 120 110 C 142 122, 168 130, 192 128 C 178 140, 146 144, 124 132 C 116 126, 114 116, 120 110 Z', fill: '#dde7ee' }, s);
    // head tubercles
    [[36, 84], [48, 76], [62, 70], [78, 65]].forEach(([cx, cy]) => el('circle', { cx, cy, r: 2.2, fill: '#3c5163' }, s));
    eye(s, 58, 94, 4.5);
    el('path', { d: 'M 22 102 Q 50 112 84 108', stroke: '#33485a', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }, s);
    return s;
  },
  cry() { return [['boing'], ['bubble']]; },
};

const SEAL = {
  id: 'seal', th: 'แมวน้ำ', en: 'Harbor Seal',
  make(w) {
    const s = svgRoot(300, 160, w);
    el('path', { d: 'M 232 86 C 248 72, 264 64, 280 62 C 272 74, 268 84, 270 92 C 268 99, 271 110, 280 122 C 264 118, 247 106, 236 96 Z', fill: '#7d8b98' }, s);
    el('path', { d: 'M 34 88 C 32 64, 54 46, 92 42 C 138 38, 192 52, 226 74 C 242 84, 248 94, 240 100 C 216 114, 158 122, 108 118 C 66 114, 38 104, 34 88 Z', fill: '#97a5b2' }, s);
    el('path', { d: 'M 50 100 C 100 112, 170 110, 220 96 C 200 108, 140 116, 90 112 C 66 110, 54 106, 50 100 Z', fill: '#dde4ea' }, s);
    [[110, 56, -14], [132, 50, 8], [152, 60, -6], [176, 68, 12], [122, 70, -10], [144, 78, 6], [96, 64, -18], [168, 86, 0]]
      .forEach(([cx, cy, rot]) => el('ellipse', { cx, cy, rx: 4.5, ry: 2.8, fill: '#5b6873', opacity: '.75', transform: `rotate(${rot} ${cx} ${cy})` }, s));
    el('path', { d: 'M 112 104 C 122 114, 124 128, 112 138 C 102 130, 100 114, 104 102 Z', fill: '#76838f' }, s);
    eye(s, 64, 68, 8, { pupil: '#1d1611' });
    el('path', { d: 'M 40 76 C 42 73, 46 73, 48 76 C 47 80, 41 80, 40 76 Z', fill: '#26201b' }, s);
    el('path', { d: 'M 44 79 Q 44 86 36 88 M 44 79 Q 47 86 55 88', stroke: '#525f6b', 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 36 80 Q 22 77 10 79 M 36 83 Q 22 83 11 87 M 37 86 Q 25 89 15 95 M 51 80 Q 62 78 71 80 M 51 83 Q 63 84 72 88', stroke: '#f2f4f0', 'stroke-width': 1, fill: 'none', 'stroke-linecap': 'round', opacity: '.85' }, s);
    return s;
  },
  cry() { return [['boing'], ['pop']]; },
};

const OTTER = {
  id: 'otter', th: 'นากทะเล', en: 'Sea Otter',
  make(w) {
    const s = svgRoot(280, 160, w);
    // floating on its back
    el('path', { d: 'M 40 104 C 50 84, 90 76, 140 78 C 190 80, 226 88, 242 100 C 250 106, 246 114, 232 116 C 186 124, 90 126, 54 118 C 42 114, 36 110, 40 104 Z', fill: '#6b4a32' }, s);
    el('path', { d: 'M 70 92 C 110 84, 175 86, 215 96 C 200 102, 120 104, 84 100 C 76 98, 70 95, 70 92 Z', fill: '#8a6244' }, s);
    // tail
    el('path', { d: 'M 238 104 C 254 98, 266 100, 272 106 C 264 112, 250 114, 240 112 Z', fill: '#5a3d28' }, s);
    // paws resting on belly
    el('ellipse', { cx: 128, cy: 84, rx: 9, ry: 6, fill: '#5a3d28' }, s);
    el('ellipse', { cx: 154, cy: 82, rx: 9, ry: 6, fill: '#5a3d28' }, s);
    // head (lighter face)
    el('ellipse', { cx: 52, cy: 66, rx: 27, ry: 23, fill: '#6b4a32' }, s);
    el('circle', { cx: 32, cy: 50, r: 7, fill: '#5a3d28' }, s);
    el('circle', { cx: 72, cy: 48, r: 7, fill: '#5a3d28' }, s);
    el('ellipse', { cx: 50, cy: 72, rx: 19, ry: 15, fill: '#d9c4a8' }, s);
    el('path', { d: 'M 44 70 C 46 67, 52 67, 54 70 C 53 74, 45 74, 44 70 Z', fill: '#332518' }, s);
    el('path', { d: 'M 49 73 Q 49 79 42 80 M 49 73 Q 52 79 58 80', stroke: '#7a6248', 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 38 74 Q 26 72 16 74 M 38 77 Q 27 79 18 83 M 60 74 Q 70 72 79 74', stroke: '#f2ead9', 'stroke-width': 1.1, fill: 'none', 'stroke-linecap': 'round', opacity: '.9' }, s);
    eye(s, 40, 62, 4.5, { pupil: '#241a10' });
    eye(s, 62, 61, 4.5, { pupil: '#241a10' });
    return s;
  },
  cry() { return [['pop'], ['bubble']]; },
};

const SEALION = {
  id: 'sealion', th: 'สิงโตทะเล', en: 'Sea Lion',
  make(w) {
    const s = svgRoot(280, 170, w);
    el('path', { d: 'M 236 96 C 250 84, 264 78, 276 78 C 268 88, 266 96, 268 102 C 266 108, 268 118, 276 128 C 262 124, 248 114, 240 106 Z', fill: '#7d5a38' }, s);
    el('path', { d: 'M 30 90 C 40 60, 80 44, 120 46 C 170 48, 215 70, 240 92 C 250 101, 248 108, 236 110 C 200 118, 120 122, 70 112 C 45 107, 26 100, 30 90 Z', fill: '#9c7148' }, s);
    el('path', { d: 'M 46 100 C 90 112, 160 112, 210 100 C 190 110, 120 116, 76 110 C 58 107, 48 104, 46 100 Z', fill: '#c9a273' }, s);
    el('path', { d: 'M 110 104 C 124 120, 124 142, 104 154 C 94 138, 96 118, 102 102 Z', fill: '#7d5a38' }, s);
    // ear flap (distinguishes sea lion from seal)
    el('path', { d: 'M 76 54 C 80 48, 86 46, 90 48 C 87 53, 83 57, 79 58 Z', fill: '#6b4a2c' }, s);
    el('ellipse', { cx: 42, cy: 78, rx: 14, ry: 10, fill: '#c9a273' }, s);
    el('path', { d: 'M 32 72 C 34 69, 39 69, 41 72 C 40 76, 33 76, 32 72 Z', fill: '#33271a' }, s);
    el('path', { d: 'M 37 76 Q 37 83 30 84 M 37 76 Q 40 83 47 84', stroke: '#6b573e', 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 28 78 Q 16 76 8 78 M 29 82 Q 17 84 10 88 M 52 78 Q 62 76 70 78', stroke: '#f2ead9', 'stroke-width': 1.1, fill: 'none', 'stroke-linecap': 'round', opacity: '.9' }, s);
    eye(s, 60, 66, 6.5, { pupil: '#241a10' });
    return s;
  },
  cry() { return [['boing'], ['cheer']]; },
};

const PUFFIN = {
  id: 'puffin', th: 'นกพัฟฟิน', en: 'Puffin',
  make(w) {
    const s = svgRoot(150, 170, w);
    el('path', { d: 'M 75 18 C 105 18, 122 44, 122 84 C 122 120, 104 146, 75 146 C 46 146, 28 120, 28 84 C 28 44, 45 18, 75 18 Z', fill: '#15191f' }, s);
    el('path', { d: 'M 75 62 C 94 62, 105 82, 105 104 C 105 126, 92 142, 75 142 C 58 142, 45 126, 45 104 C 45 82, 56 62, 75 62 Z', fill: '#f2f5f7' }, s);
    el('ellipse', { cx: 60, cy: 48, rx: 26, ry: 23, fill: '#e8edf1' }, s);
    el('path', { d: 'M 38 42 C 24 44, 10 52, 4 62 C 12 68, 26 70, 36 66 C 42 62, 44 50, 38 42 Z', fill: '#f07f1d' }, s);
    el('path', { d: 'M 38 42 C 32 43, 24 46, 18 50 L 14 47 C 21 43, 30 41, 37 41 Z', fill: '#8a97a3' }, s);
    el('path', { d: 'M 35 45 C 28 47, 18 52, 12 58', stroke: '#c93f12', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 112 76 C 124 86, 128 104, 122 122 C 110 116, 102 100, 102 86 Z', fill: '#0d1116' }, s);
    el('path', { d: 'M 58 144 L 52 162 L 60 158 L 64 164 L 68 158 L 74 162 L 66 144 Z', fill: '#f07f1d' }, s);
    el('path', { d: 'M 84 144 L 80 162 L 87 157 L 91 163 L 95 157 L 100 160 L 92 144 Z', fill: '#f07f1d' }, s);
    el('circle', { cx: 64, cy: 44, r: 8.5, fill: 'none', stroke: '#e8541f', 'stroke-width': 1.8 }, s);
    eye(s, 64, 44, 6);
    return s;
  },
  cry() { return [['pop'], ['ding']]; },
};

const SALMON = {
  id: 'salmon', th: 'ปลาแซลมอน', en: 'Salmon',
  make(w) {
    const s = svgRoot(240, 120, w);
    el('path', { d: 'M 14 58 C 32 32, 74 20, 114 24 C 154 28, 184 40, 200 56 C 186 70, 154 82, 114 84 C 74 86, 32 80, 14 58 Z', fill: '#9cb2c2' }, s);
    el('path', { d: 'M 18 62 C 40 76, 80 82, 120 80 C 90 86, 45 82, 18 62 Z', fill: '#dfe8ee' }, s);
    el('path', { d: 'M 198 56 C 210 44, 222 36, 232 32 C 227 42, 226 52, 228 58 C 226 64, 227 72, 232 82 C 221 78, 209 68, 198 60 Z', fill: '#5d7990' }, s);
    el('path', { d: 'M 96 26 C 102 14, 116 8, 128 8 C 124 18, 122 24, 122 28 Z', fill: '#5d7990' }, s);
    el('path', { d: 'M 70 76 C 72 86, 68 96, 58 102 C 56 92, 60 82, 64 75 Z', fill: '#7d96aa' }, s);
    el('ellipse', { cx: 120, cy: 60, rx: 60, ry: 9, fill: '#e08a8a', opacity: '.4' }, s);
    el('path', { d: 'M 54 34 C 64 44, 66 62, 58 76', stroke: '#54707f', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, s);
    [[84, 34], [104, 30], [126, 32], [148, 36], [94, 42], [138, 42]].forEach(([cx, cy]) => el('circle', { cx, cy, r: 1.7, fill: '#33485c' }, s));
    el('path', { d: 'M 14 58 Q 24 62 34 62', stroke: '#54707f', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, s);
    eye(s, 38, 48, 5, { pupil: '#10151a' });
    return s;
  },
  cry() { return [['bubble'], ['pop']]; },
};

const CRAB = {
  id: 'crab', th: 'ปูอลาสก้า', en: 'King Crab',
  make(w) {
    const s = svgRoot(240, 180, w);
    const leg = (d) => el('path', { d, stroke: '#c14a24', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
    leg('M 80 95 L 45 78 L 22 92');
    leg('M 78 105 L 40 105 L 18 122');
    leg('M 82 115 L 50 132 L 32 154');
    leg('M 160 95 L 195 78 L 218 92');
    leg('M 162 105 L 200 105 L 222 122');
    leg('M 158 115 L 190 132 L 208 154');
    // claw arms
    el('path', { d: 'M 98 72 L 74 48', stroke: '#c14a24', 'stroke-width': 8, 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 142 72 L 166 48', stroke: '#c14a24', 'stroke-width': 8, 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 74 48 C 62 36, 62 24, 72 16 C 76 26, 82 32, 90 34 C 84 42, 78 46, 74 48 Z', fill: '#d9542b' }, s);
    el('path', { d: 'M 166 48 C 178 36, 178 24, 168 16 C 164 26, 158 32, 150 34 C 156 42, 162 46, 166 48 Z', fill: '#d9542b' }, s);
    // carapace with spiky edge
    el('path', { d: 'M 120 58 C 146 58, 166 74, 169 98 C 166 122, 146 136, 120 136 C 94 136, 74 122, 71 98 C 74 74, 94 58, 120 58 Z', fill: '#d9542b' }, s);
    el('path', { d: 'M 88 64 L 92 54 L 98 62 M 110 58 L 116 48 L 122 58 M 134 60 L 142 52 L 146 62', stroke: '#d9542b', 'stroke-width': 5, fill: 'none', 'stroke-linejoin': 'round' }, s);
    el('ellipse', { cx: 120, cy: 112, rx: 34, ry: 14, fill: '#e8744a', opacity: '.7' }, s);
    // eye stalks
    el('path', { d: 'M 108 62 L 103 46 M 132 62 L 137 46', stroke: '#c14a24', 'stroke-width': 4, 'stroke-linecap': 'round' }, s);
    eye(s, 103, 44, 6);
    eye(s, 137, 44, 6);
    el('path', { d: 'M 110 84 Q 120 92 130 84', stroke: '#8f3417', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }, s);
    return s;
  },
  cry() { return [['pop'], ['pop']]; },
};

export const ANIMALS = [ORCA, HUMPBACK, SEAL, OTTER, SEALION, PUFFIN, SALMON, CRAB];
export function byId(id) { return ANIMALS.find(a => a.id === id); }
```

Note: `cry()` returns a list of sfx names played in sequence by callers — keep it; games call `playCry(animal)` helper below. Add to the bottom of `animals.js`:

```js
import { sfx } from './audio.js';
export function playCry(animal) {
  const steps = animal.cry();
  steps.forEach(([name], i) => setTimeout(() => sfx[name] && sfx[name](), i * 180));
}
```

(Put both imports at the top of the file in practice.)

- [ ] **Step 2: Add preview route to `js/main.js`** (before `go('hub')`)

```js
import { ANIMALS } from './core/animals.js';

registerScene('preview', {
  init(container) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:24px;justify-content:center;align-items:center;padding:40px;height:100%;overflow:auto;';
    for (const a of ANIMALS) {
      const cell = document.createElement('div');
      cell.style.cssText = 'text-align:center;color:#fff;font-weight:700;';
      const svg = a.make(220);
      svg.classList.add('float');
      cell.appendChild(svg);
      const label = document.createElement('div');
      label.textContent = `${a.th} · ${a.en}`;
      cell.appendChild(label);
      wrap.appendChild(cell);
    }
    container.appendChild(wrap);
  },
  destroy() {},
});

go(new URLSearchParams(location.search).get('preview') === 'animals' ? 'preview' : 'hub');
```

- [ ] **Step 3: Visual verification loop (REQUIRED, iterate until on-model)**

Open `http://localhost:8080/?preview=animals` with Playwright, screenshot, inspect each animal:
- Orca: white chin + eye patch + saddle visible, dorsal fin tall
- Humpback: long white pectoral fin, throat grooves, knobby head
- Seal: spotted, whiskers, big round eye
- Otter: floating on back, light face, paws on belly
- Sea lion: tan, visible ear flap, lighter muzzle
- Puffin: tri-color beak, eye ring, orange feet
- Salmon: silver + pink lateral hint + spots
- Crab: 6 legs + 2 claws + eye stalks, spiky carapace

Fix any path that renders broken/off-model, re-screenshot. Repeat until all 8 pass.

- [ ] **Step 4: Commit**

```bash
git add js/core/animals.js js/main.js
git commit -m "feat: 8 SVG Alaska animals with blink/float animations"
```

---

### Task 6: Hub scene

**Files:**
- Create: `js/hub.js`
- Modify: `js/main.js` (replace placeholder hub, register games as stubs)

- [ ] **Step 1: Write `js/hub.js`**

```js
import { t, getLang, toggleLang } from './core/i18n.js';
import { speak, sfx, isSoundOn, setSoundOn, warmUp } from './core/audio.js';
import { byId } from './core/animals.js';

const GAME_BUTTONS = [
  { scene: 'tap-sea', nameKey: 'tapSea', ageKey: 'age12', animal: 'orca', color: '#79b8d6' },
  { scene: 'shadow-match', nameKey: 'shadowMatch', ageKey: 'age24', animal: 'seal', color: '#f2a25c' },
  { scene: 'count-tap', nameKey: 'countTap', ageKey: 'age35', animal: 'salmon', color: '#6ec99a' },
  { scene: 'listen-find', nameKey: 'listenFind', ageKey: 'age35', animal: 'puffin', color: '#c98ad9' },
];

export const hub = {
  init(container, go) {
    container.insertAdjacentHTML('beforeend', `
      <div class="topbar">
        <div class="title">🌊 <span data-i18n="appTitle"></span></div>
        <div class="controls">
          <button class="btn" id="lang-btn" style="padding:0 20px;font-weight:800;color:#155e8d;font-size:18px;min-height:56px;"></button>
          <button class="btn btn-round" id="sound-btn"></button>
        </div>
      </div>
      <div id="hub-grid" style="position:absolute;inset:84px 4vw 3vh;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:2.5vh 2.5vw;"></div>
    `);
    const refreshText = () => {
      container.querySelector('[data-i18n="appTitle"]').textContent = t('appTitle');
      container.querySelector('#lang-btn').textContent = getLang() === 'th' ? 'ไทย → EN' : 'EN → ไทย';
      container.querySelector('#sound-btn').textContent = isSoundOn() ? '🔊' : '🔇';
      container.querySelectorAll('[data-game-name]').forEach(n => { n.textContent = t(n.dataset.gameName); });
      container.querySelectorAll('[data-game-age]').forEach(n => { n.textContent = t(n.dataset.gameAge); });
    };

    const grid = container.querySelector('#hub-grid');
    for (const g of GAME_BUTTONS) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.style.cssText = `display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-bottom:6px solid ${g.color};overflow:hidden;`;
      const svg = byId(g.animal).make(150);
      svg.classList.add('float');
      btn.appendChild(svg);
      btn.insertAdjacentHTML('beforeend', `
        <div data-game-name="${g.nameKey}" style="font-weight:800;font-size:clamp(16px,2.6vw,24px);color:#13496e;"></div>
        <div data-game-age="${g.ageKey}" style="font-size:clamp(11px,1.6vw,15px);color:#5b87a3;"></div>
      `);
      btn.addEventListener('pointerup', () => {
        warmUp(); sfx.pop();
        speak(t(g.nameKey), getLang());
        setTimeout(() => go(g.scene), 350);
      });
      grid.appendChild(btn);
    }

    container.querySelector('#lang-btn').addEventListener('pointerup', () => {
      toggleLang(); refreshText();
      speak(t('appTitle'), getLang());
    });
    container.querySelector('#sound-btn').addEventListener('pointerup', () => {
      setSoundOn(!isSoundOn()); refreshText();
      if (isSoundOn()) sfx.ding();
    });
    refreshText();
  },
  destroy() {},
};
```

- [ ] **Step 2: Wire into `js/main.js`**

Replace the placeholder hub registration with:

```js
import { hub } from './hub.js';
registerScene('hub', hub);
```

Register temporary stubs for the four game scenes (each replaced in its own task):

```js
function stubScene(label) {
  return {
    init(container, go) {
      const d = document.createElement('div');
      d.style.cssText = 'color:#fff;text-align:center;padding-top:40vh;font-size:24px;';
      d.textContent = label + ' — coming soon';
      const back = document.createElement('button');
      back.className = 'btn btn-round';
      back.textContent = '🏠';
      back.style.cssText += 'position:absolute;top:12px;left:12px;';
      back.addEventListener('pointerup', () => go('hub'));
      container.append(d, back);
    },
    destroy() {},
  };
}
registerScene('tap-sea', stubScene('แตะทะเล'));
registerScene('shadow-match', stubScene('จับคู่เงา'));
registerScene('count-tap', stubScene('นับสัตว์ทะเล'));
registerScene('listen-find', stubScene('เสียงเรียกใคร'));
```

- [ ] **Step 3: Verify with Playwright**

Open `http://localhost:8080`. Expected: hub matches approved mockup (4 animated buttons, lang + sound controls). Click each button → stub scene with working 🏠 back button. Click lang toggle → all labels switch TH↔EN. Screenshot hub for record.

- [ ] **Step 4: Commit**

```bash
git add js/hub.js js/main.js
git commit -m "feat: hub scene with game buttons, language and sound toggles"
```

---

### Task 7: round-utils (shared game logic) with tests

**Files:**
- Create: `js/games/logic/round-utils.js`, `tests/round-utils.test.mjs`

- [ ] **Step 1: Write failing tests `tests/round-utils.test.mjs`**

```js
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
```

- [ ] **Step 2: Run tests, verify FAIL**

Run: `node --test tests/round-utils.test.mjs` — Expected: FAIL (module not found)

- [ ] **Step 3: Write `js/games/logic/round-utils.js`**

```js
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
```

- [ ] **Step 4: Run tests, verify PASS**

Run: `node --test tests/round-utils.test.mjs` — Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add js/games/logic/round-utils.js tests/round-utils.test.mjs
git commit -m "feat: shared deterministic round logic with tests"
```

---

### Task 8: Game 1 — Tap the Sea (แตะทะเล)

**Files:**
- Create: `js/games/tap-sea.js`
- Modify: `js/main.js` (replace stub)

- [ ] **Step 1: Write `js/games/tap-sea.js`**

```js
import { ANIMALS, playCry } from '../core/animals.js';
import { speakName, sfx } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';

const MAX_ON_SCREEN = 6;

export const tapSea = {
  _container: null,
  init(container, go) {
    this._container = container;
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <div id="sea" style="position:absolute;inset:0;"></div>
      <div id="hint" style="position:absolute;bottom:4vh;width:100%;text-align:center;color:#fff;font-size:clamp(18px,3vw,28px);font-weight:700;text-shadow:0 2px 6px rgba(0,30,60,.5);pointer-events:none;">${t('tapAnywhere')}</div>
    `);
    // ambient bubbles
    for (let i = 0; i < 8; i++) {
      const b = document.createElement('div');
      const size = 6 + Math.random() * 14;
      b.className = 'bubble';
      b.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;bottom:-20px;animation-duration:${6 + Math.random() * 8}s;animation-delay:${Math.random() * 6}s;`;
      container.querySelector('#sea').appendChild(b);
    }
    container.querySelector('#back-btn').addEventListener('pointerup', e => { e.stopPropagation(); go('hub'); });
    container.querySelector('#sea').addEventListener('pointerdown', (e) => this._onTap(e));
  },
  _onTap(e) {
    const sea = this._container.querySelector('#sea');
    const hint = this._container.querySelector('#hint');
    if (hint) hint.remove();
    const hitAnimal = e.target.closest('.animal-spot');
    if (hitAnimal) {
      const animal = ANIMALS.find(a => a.id === hitAnimal.dataset.id);
      const svg = hitAnimal.querySelector('svg');
      svg.classList.remove('boing'); void svg.getBoundingClientRect(); // restart animation
      svg.classList.add('boing');
      playCry(animal);
      speakName(animal, getLang());
      return;
    }
    // spawn a random animal at the tap point
    sfx.pop();
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const spot = document.createElement('div');
    spot.className = 'animal-spot';
    spot.dataset.id = animal.id;
    const size = Math.min(220, Math.max(140, window.innerWidth * 0.16));
    spot.style.cssText = `position:absolute;left:${e.clientX - size / 2}px;top:${e.clientY - size / 2}px;cursor:pointer;`;
    const svg = animal.make(size);
    svg.classList.add('pop-in');
    setTimeout(() => { svg.classList.remove('pop-in'); svg.classList.add('float'); }, 500);
    spot.appendChild(svg);
    sea.appendChild(spot);
    speakName(animal, getLang());
    // keep at most MAX_ON_SCREEN: fade out the oldest
    const spots = sea.querySelectorAll('.animal-spot');
    if (spots.length > MAX_ON_SCREEN) {
      const oldest = spots[0];
      oldest.querySelector('svg').classList.add('fade-out');
      setTimeout(() => oldest.remove(), 800);
    }
  },
  destroy() { this._container = null; },
};
```

- [ ] **Step 2: Replace stub in `js/main.js`**

```js
import { tapSea } from './games/tap-sea.js';
registerScene('tap-sea', tapSea);
```
(Remove the `tap-sea` stub registration.)

- [ ] **Step 3: Verify with Playwright**

Open hub → click แตะทะเล. Click sea 8 times at different points: animal appears at each point with pop-in; oldest fades when >6. Click an existing animal: boing animation. No console errors. Screenshot.

- [ ] **Step 4: Commit**

```bash
git add js/games/tap-sea.js js/main.js
git commit -m "feat: Tap the Sea game for ages 1-2"
```

---

### Task 9: count-logic with tests, then Game 3 — Count & Tap (นับสัตว์ทะเล)

**Files:**
- Create: `js/games/logic/count-logic.js`, `tests/count-logic.test.mjs`, `js/games/count-tap.js`
- Modify: `js/main.js`

- [ ] **Step 1: Write failing tests `tests/count-logic.test.mjs`**

```js
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
```

- [ ] **Step 2: Run tests, verify FAIL**

Run: `node --test tests/count-logic.test.mjs` — Expected: FAIL

- [ ] **Step 3: Write `js/games/logic/count-logic.js`**

```js
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
```

- [ ] **Step 4: Run tests, verify PASS**

Run: `node --test tests/count-logic.test.mjs` — Expected: PASS (3 tests)

- [ ] **Step 5: Commit logic**

```bash
git add js/games/logic/count-logic.js tests/count-logic.test.mjs
git commit -m "feat: count game question and difficulty logic with tests"
```

- [ ] **Step 6: Write `js/games/count-tap.js`**

```js
import { ANIMALS } from '../core/animals.js';
import { speak, sfx } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { makeQuestion } from './logic/count-logic.js';
import { nextDifficulty } from './logic/count-logic.js';

export const countTap = {
  _container: null,
  _state: { maxN: 3, streak: 0, misses: 0 },
  _question: null,
  _locked: false,

  init(container, go) {
    this._container = container;
    this._state = { maxN: 3, streak: 0, misses: 0 };
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <div id="prompt" style="position:absolute;top:14px;width:100%;text-align:center;color:#fff;font-size:clamp(20px,3.4vw,32px);font-weight:800;text-shadow:0 2px 6px rgba(0,30,60,.5);pointer-events:none;"></div>
      <div id="field" style="position:absolute;inset:70px 2vw 130px;"></div>
      <div id="choices" style="position:absolute;bottom:2vh;width:100%;display:flex;justify-content:center;gap:4vw;"></div>
    `);
    container.querySelector('#back-btn').addEventListener('pointerup', () => go('hub'));
    this._newRound();
  },

  _newRound() {
    const c = this._container;
    this._locked = false;
    this._question = makeQuestion(this._state.maxN);
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    this._question.animal = animal;

    const promptText = getLang() === 'th'
      ? `มี${animal.th}กี่ตัวนะ?` : `How many ${animal.en.toLowerCase()}s?`;
    c.querySelector('#prompt').textContent = promptText;
    speak(promptText, getLang());

    const field = c.querySelector('#field');
    field.innerHTML = '';
    const size = Math.min(170, Math.max(110, window.innerWidth * 0.11));
    // scatter without overlap: grid cells shuffled, place count animals
    const cols = 4, rows = 2;
    const cells = [];
    for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) cells.push([col, r]);
    cells.sort(() => Math.random() - 0.5);
    for (let i = 0; i < this._question.count; i++) {
      const [col, row] = cells[i];
      const spot = document.createElement('div');
      spot.style.cssText = `position:absolute;left:${col * 25 + 4 + Math.random() * 6}%;top:${row * 50 + 5 + Math.random() * 12}%;`;
      const svg = animal.make(size);
      svg.classList.add('float');
      svg.style.animationDelay = `${Math.random() * 2}s`;
      spot.appendChild(svg);
      field.appendChild(spot);
    }

    const choicesBox = c.querySelector('#choices');
    choicesBox.innerHTML = '';
    for (const n of this._question.choices) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = n;
      btn.style.cssText = 'width:110px;height:90px;font-size:44px;font-weight:800;color:#13496e;';
      btn.addEventListener('pointerup', () => this._answer(n, btn));
      choicesBox.appendChild(btn);
    }
  },

  _answer(n, btn) {
    if (this._locked) return;
    const correct = n === this._question.count;
    this._state = nextDifficulty(this._state, correct);
    if (correct) {
      this._locked = true;
      sfx.cheer();
      speak(t('great'), getLang());
      btn.style.background = 'linear-gradient(180deg,#a8e6c4,#6ec99a)';
      this._confetti();
      setTimeout(() => this._newRound(), 1800);
    } else {
      sfx.wrongSoft();
      speak(t('tryAgain'), getLang());
      btn.classList.add('shake');
      setTimeout(() => btn.classList.remove('shake'), 600);
    }
  },

  _confetti() {
    const colors = ['#f2a25c', '#6ec99a', '#79b8d6', '#c98ad9', '#f7d154'];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'confetti';
      p.style.cssText += `left:${10 + Math.random() * 80}%;top:0;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.4}s;`;
      this._container.appendChild(p);
      setTimeout(() => p.remove(), 2200);
    }
  },

  destroy() { this._container = null; },
};
```

- [ ] **Step 7: Replace stub in `js/main.js`**

```js
import { countTap } from './games/count-tap.js';
registerScene('count-tap', countTap);
```

- [ ] **Step 8: Verify with Playwright**

Open game. Count animals on screen, click correct number → cheer + confetti + new round. Click wrong number → button shakes, round stays. Play 4 rounds (3 correct in a row) and confirm larger counts appear. Screenshot.

- [ ] **Step 9: Commit**

```bash
git add js/games/count-tap.js js/main.js
git commit -m "feat: Count & Tap game with adaptive difficulty"
```

---

### Task 10: Game 2 — Shadow Match (จับคู่เงา) with pointer drag

**Files:**
- Create: `js/games/shadow-match.js`
- Modify: `js/main.js`

- [ ] **Step 1: Write `js/games/shadow-match.js`**

```js
import { byId, playCry } from '../core/animals.js';
import { ANIMALS } from '../core/animals.js';
import { speak, speakName, sfx } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { pickRound } from './logic/round-utils.js';

const ROUND_SIZE = 3;

export const shadowMatch = {
  _container: null,
  _drag: null,
  _remaining: 0,

  init(container, go) {
    this._container = container;
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <div id="shadow-row" style="position:absolute;top:8vh;width:100%;display:flex;justify-content:center;gap:6vw;"></div>
      <div id="animal-row" style="position:absolute;bottom:6vh;width:100%;display:flex;justify-content:center;gap:6vw;"></div>
    `);
    container.querySelector('#back-btn').addEventListener('pointerup', () => go('hub'));
    speak(t('dragToShadow'), getLang());
    this._newRound();
  },

  _newRound() {
    const c = this._container;
    const { animals, shadows } = pickRound(ANIMALS.map(a => a.id), ROUND_SIZE);
    this._remaining = ROUND_SIZE;
    const size = Math.min(190, Math.max(130, window.innerWidth * 0.14));

    const shadowRow = c.querySelector('#shadow-row');
    shadowRow.innerHTML = '';
    for (const id of shadows) {
      const slot = document.createElement('div');
      slot.className = 'shadow-slot';
      slot.dataset.id = id;
      const svg = byId(id).make(size);
      svg.style.filter = 'brightness(0)';
      svg.style.opacity = '.45';
      slot.appendChild(svg);
      shadowRow.appendChild(slot);
    }

    const animalRow = c.querySelector('#animal-row');
    animalRow.innerHTML = '';
    for (const id of animals) {
      const piece = document.createElement('div');
      piece.className = 'drag-piece';
      piece.dataset.id = id;
      piece.style.cssText = 'touch-action:none;cursor:grab;position:relative;';
      piece.appendChild(byId(id).make(size));
      piece.addEventListener('pointerdown', (e) => this._startDrag(e, piece));
      animalRow.appendChild(piece);
    }
  },

  _startDrag(e, piece) {
    if (piece.dataset.done) return;
    e.preventDefault();
    piece.setPointerCapture(e.pointerId);
    const rect = piece.getBoundingClientRect();
    this._drag = { piece, dx: e.clientX - rect.left, dy: e.clientY - rect.top, homeRect: rect };
    piece.style.zIndex = '20';
    piece.style.position = 'fixed';
    piece.style.left = rect.left + 'px';
    piece.style.top = rect.top + 'px';
    sfx.bubble();
    const move = (ev) => this._moveDrag(ev);
    const up = (ev) => { piece.removeEventListener('pointermove', move); piece.removeEventListener('pointerup', up); this._endDrag(ev); };
    piece.addEventListener('pointermove', move);
    piece.addEventListener('pointerup', up);
  },

  _moveDrag(e) {
    if (!this._drag) return;
    this._drag.piece.style.left = (e.clientX - this._drag.dx) + 'px';
    this._drag.piece.style.top = (e.clientY - this._drag.dy) + 'px';
  },

  _endDrag() {
    const { piece, homeRect } = this._drag || {};
    this._drag = null;
    if (!piece) return;
    const pieceRect = piece.getBoundingClientRect();
    const cx = pieceRect.left + pieceRect.width / 2;
    const cy = pieceRect.top + pieceRect.height / 2;
    const slot = [...this._container.querySelectorAll('.shadow-slot')].find(sl => {
      if (sl.dataset.filled) return false;
      const r = sl.getBoundingClientRect();
      return cx > r.left && cx < r.right && cy > r.top && cy < r.bottom;
    });
    if (slot && slot.dataset.id === piece.dataset.id) {
      // snap into the shadow
      const r = slot.getBoundingClientRect();
      piece.style.transition = 'left .2s, top .2s';
      piece.style.left = r.left + 'px';
      piece.style.top = r.top + 'px';
      piece.dataset.done = '1';
      slot.dataset.filled = '1';
      sfx.ding();
      const animal = byId(piece.dataset.id);
      playCry(animal);
      speakName(animal, getLang());
      this._remaining -= 1;
      if (this._remaining === 0) {
        sfx.cheer();
        speak(t('great'), getLang());
        this._confetti();
        setTimeout(() => this._newRound(), 2200);
      }
    } else {
      // gentle bounce back, no negative feedback
      piece.style.transition = 'left .35s ease, top .35s ease';
      piece.style.left = homeRect.left + 'px';
      piece.style.top = homeRect.top + 'px';
      setTimeout(() => {
        piece.style.cssText = 'touch-action:none;cursor:grab;position:relative;';
      }, 380);
    }
  },

  _confetti() {
    const colors = ['#f2a25c', '#6ec99a', '#79b8d6', '#c98ad9', '#f7d154'];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'confetti';
      p.style.cssText += `left:${10 + Math.random() * 80}%;top:0;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.4}s;`;
      this._container.appendChild(p);
      setTimeout(() => p.remove(), 2200);
    }
  },

  destroy() { this._container = null; this._drag = null; },
};
```

- [ ] **Step 2: Replace stub in `js/main.js`**

```js
import { shadowMatch } from './games/shadow-match.js';
registerScene('shadow-match', shadowMatch);
```

- [ ] **Step 3: Verify with Playwright**

Open game. Use mouse drag (`browser_drag` or manual down/move/up): drag correct animal onto its shadow → snaps + ding; drag wrong animal → bounces home silently except soft bubble. Complete all 3 → confetti + new round. Screenshot mid-drag and after completion.

- [ ] **Step 4: Commit**

```bash
git add js/games/shadow-match.js js/main.js
git commit -m "feat: Shadow Match drag-and-drop game"
```

---

### Task 11: Game 4 — Listen & Find (เสียงเรียกใคร)

**Files:**
- Create: `js/games/listen-find.js`
- Modify: `js/main.js`

- [ ] **Step 1: Write `js/games/listen-find.js`**

```js
import { ANIMALS, byId, playCry } from '../core/animals.js';
import { speak, speakName, sfx } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { pickQuestion } from './logic/round-utils.js';

const CHOICES = 4;

export const listenFind = {
  _container: null,
  _target: null,
  _locked: false,

  init(container, go) {
    this._container = container;
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <button class="btn btn-round" id="repeat-btn" style="position:absolute;top:12px;right:12px;z-index:10;">🔊</button>
      <div id="prompt" style="position:absolute;top:16px;width:100%;text-align:center;color:#fff;font-size:clamp(20px,3.4vw,32px);font-weight:800;text-shadow:0 2px 6px rgba(0,30,60,.5);pointer-events:none;"></div>
      <div id="grid" style="position:absolute;inset:90px 6vw 6vh;display:grid;grid-template-columns:1fr 1fr;gap:3vh 4vw;justify-items:center;align-items:center;"></div>
    `);
    container.querySelector('#back-btn').addEventListener('pointerup', () => go('hub'));
    container.querySelector('#repeat-btn').addEventListener('pointerup', () => this._sayPrompt());
    this._newRound();
  },

  _sayPrompt() {
    const lang = getLang();
    const name = lang === 'th' ? this._target.th : this._target.en;
    const text = lang === 'th' ? `${t('whereIs')} ${name}?` : `${t('whereIs')} ${name}?`;
    this._container.querySelector('#prompt').textContent = text;
    speak(text, lang);
  },

  _newRound() {
    this._locked = false;
    const { target, choices } = pickQuestion(ANIMALS.map(a => a.id), CHOICES);
    this._target = byId(target);
    const grid = this._container.querySelector('#grid');
    grid.innerHTML = '';
    const size = Math.min(210, Math.max(140, window.innerWidth * 0.15));
    for (const id of choices) {
      const card = document.createElement('button');
      card.className = 'btn';
      card.dataset.id = id;
      card.style.cssText = 'padding:12px 20px;background:rgba(255,255,255,.92);';
      const svg = byId(id).make(size);
      svg.classList.add('float');
      svg.style.animationDelay = `${Math.random() * 2}s`;
      card.appendChild(svg);
      card.addEventListener('pointerup', () => this._answer(card));
      grid.appendChild(card);
    }
    this._sayPrompt();
  },

  _answer(card) {
    if (this._locked) return;
    const animal = byId(card.dataset.id);
    const svg = card.querySelector('svg');
    if (animal.id === this._target.id) {
      this._locked = true;
      sfx.cheer();
      svg.classList.add('boing');
      playCry(animal);
      speakName(animal, getLang());
      card.style.background = 'linear-gradient(180deg,#a8e6c4,#6ec99a)';
      this._confetti();
      setTimeout(() => this._newRound(), 2400);
    } else {
      sfx.wrongSoft();
      svg.classList.remove('shake'); void svg.getBoundingClientRect();
      svg.classList.add('shake');
      setTimeout(() => this._sayPrompt(), 700);
    }
  },

  _confetti() {
    const colors = ['#f2a25c', '#6ec99a', '#79b8d6', '#c98ad9', '#f7d154'];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'confetti';
      p.style.cssText += `left:${10 + Math.random() * 80}%;top:0;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.4}s;`;
      this._container.appendChild(p);
      setTimeout(() => p.remove(), 2200);
    }
  },

  destroy() { this._container = null; },
};
```

Refactor note: confetti is now duplicated in three games. Extract it during this task into `js/core/confetti.js`:

```js
export function confetti(container, count = 30) {
  const colors = ['#f2a25c', '#6ec99a', '#79b8d6', '#c98ad9', '#f7d154'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.cssText += `left:${10 + Math.random() * 80}%;top:0;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.4}s;`;
    container.appendChild(p);
    setTimeout(() => p.remove(), 2200);
  }
}
```

Then replace `_confetti()` bodies in `count-tap.js`, `shadow-match.js`, `listen-find.js` with `confetti(this._container)` (import from `../core/confetti.js`) and delete the private methods.

- [ ] **Step 2: Replace stub in `js/main.js`**

```js
import { listenFind } from './games/listen-find.js';
registerScene('listen-find', listenFind);
```

- [ ] **Step 3: Run all tests**

Run: `node --test tests/` — Expected: ALL PASS

- [ ] **Step 4: Verify with Playwright**

Open game. Prompt text shows target name. Click wrong animal → shake + prompt repeats. Click right animal → boing + green card + confetti + new round. 🔊 button repeats prompt. Screenshot.

- [ ] **Step 5: Commit**

```bash
git add js/games/listen-find.js js/core/confetti.js js/games/count-tap.js js/games/shadow-match.js js/main.js
git commit -m "feat: Listen & Find game; extract shared confetti helper"
```

---

### Task 12: Full pass, README, cleanup

**Files:**
- Create: `README.md`
- Modify: `js/main.js` (remove unused stubScene if no stubs remain)

- [ ] **Step 1: Remove dead code**

In `js/main.js`: delete `stubScene()` and any remaining stub registrations. Keep the `?preview=animals` route (useful for adding animals later).

- [ ] **Step 2: Write `README.md`**

```markdown
# ทะเลอลาสก้าของหนู — My Alaska Ocean

เกม HTML5 เพื่อพัฒนาการเด็ก 1-5 ปี ธีมสัตว์ทะเลอลาสก้า สองภาษาไทย/อังกฤษ
A bilingual (TH/EN) HTML5 developmental game suite for ages 1-5, featuring Alaska sea animals.

**เล่นเลย / Play:** https://peerapolselanon.github.io/OceanAlaskaGame/

## เกม / Games
| เกม | วัย | ทักษะ |
|---|---|---|
| แตะทะเล Tap the Sea | 1-2 ปี | เหตุและผล |
| จับคู่เงา Shadow Match | 2-4 ปี | กล้ามเนื้อมัดเล็ก รูปทรง |
| นับสัตว์ทะเล Count & Tap | 3-5 ปี | ตัวเลข 1-10 |
| เสียงเรียกใคร Listen & Find | 3-5 ปี | คำศัพท์สองภาษา |

## รันบนเครื่อง / Run locally
```
npx http-server -p 8080
# open http://localhost:8080
# animal art preview: http://localhost:8080/?preview=animals
```

## ทดสอบ / Tests
```
node --test tests/
```

Vanilla JS + SVG. No build step, no dependencies.
```

- [ ] **Step 3: Full Playwright pass**

Visit hub → each of 4 games → play one round each → back to hub each time. Toggle language on hub, enter a game, confirm prompts are English. Toggle sound off, confirm no errors. Resize viewport to 1024×768 (iPad landscape) and screenshot every scene. Expected: no console errors anywhere.

- [ ] **Step 4: Run all tests one final time**

Run: `node --test tests/` — Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add README.md js/main.js
git commit -m "docs: README; remove dead stub code"
```

---

### Task 13: GitHub repo + Pages deploy

**Files:** none (operations)

- [ ] **Step 1: Create GitHub repo and push**

```bash
gh repo create OceanAlaskaGame --public --source . --push
```
Expected: repo created at `PeerapolSelanon/OceanAlaskaGame`, branch `main` pushed.

- [ ] **Step 2: Enable GitHub Pages from main branch root**

```bash
gh api repos/PeerapolSelanon/OceanAlaskaGame/pages -X POST -f "source[branch]=main" -f "source[path]=/"
```
If already enabled, this 409s — then verify with `gh api repos/PeerapolSelanon/OceanAlaskaGame/pages`.

- [ ] **Step 3: Wait for deploy and verify live**

Poll until 200:
```bash
curl -s -o /dev/null -w "%{http_code}" https://peerapolselanon.github.io/OceanAlaskaGame/
```
Then open the live URL with Playwright, click into one game, screenshot. Expected: identical to local.

- [ ] **Step 4: Final commit if anything changed, and report**

Report the live URL to the user with instructions: open on iPad Safari → Share → Add to Home Screen.

---

## Self-Review Notes

- Spec coverage: hub (T6), 4 games (T8-T11), 8 animals + style D + animations (T5), bilingual TTS + synth SFX + fallback-by-default (audio never throws when TTS missing; names also appear as text prompts) (T4), toddler rules (big buttons in CSS `.btn` 80px min, no fail states, soft wrong sound), Pointer Events only (all handlers use pointer*), portrait rotate hint + iPad meta (T1), localStorage settings (T2), tests (T2/3/7/9), GitHub Pages (T13). Future-proofing: new games = new module + `registerScene` (verified by stub pattern in T6).
- Types consistent: scenes implement `{init(container, go), destroy()}`; animals `{id, th, en, make(w), cry()}`; logic functions match test signatures.
- No placeholders: all code complete; art refinement is an explicit verification loop (T5 Step 3), not a TODO.
```
