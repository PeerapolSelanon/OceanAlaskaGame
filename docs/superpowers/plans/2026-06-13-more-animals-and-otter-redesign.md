# More Animals + Otter Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มสัตว์ 4 ตัว (ปลาหมึกยักษ์/แมงกะพรุน/ดาวทะเล/ฉลาม) เข้าทะเบียน `ANIMALS` และวาดนากทะเล (otter) ใหม่ให้อ่านออกชัด — กระจายเข้าเกมที่สุ่มสัตว์โดยอัตโนมัติ

**Architecture:** แต่ละสัตว์เป็น object `{ id, th, en, make(w), cry() }` ใน `js/core/animals.js` วาดด้วย helper เดิม (`svgRoot`, `el`, `eye`) สไตล์ "D" (สีเรียบ + ตาโต + กะพริบตา). โค้ด SVG ในแผนนี้เป็น draft ที่ใช้ได้จริง — ขั้นตรวจในเบราว์เซอร์จะขัดเกลาพิกัดให้สวยขึ้นถ้าจำเป็น

**Tech Stack:** Vanilla JS ES modules + SVG, `node --test`, Playwright (ตรวจภาพผ่าน `?preview=animals`)

**กฎ:** SVG ล้วน ไม่มีไฟล์ภาพ · ฉลามต้องดูเป็นมิตร ไม่มีฟันแหลมน่ากลัว · สีงานศิลป์ฝัง hex ได้ (ข้อยกเว้นจาก token) · ตาใช้ `eye()` ให้กะพริบได้

---

## File Structure

| ไฟล์ | บทบาท |
|---|---|
| Modify `js/core/animals.js` | เพิ่ม 4 const ใหม่ + ต่อใน `ANIMALS`; เขียน `OTTER.make()` ใหม่ |
| Create `tests/animals.test.mjs` | guard ทะเบียน (12 ตัว, id ไม่ซ้ำ, shape) |
| (อาจ) Modify `js/core/game-art.js` | ปรับตำแหน่ง otter ในการ์ด trace-letters ถ้าสัดส่วนใหม่เพี้ยน |

**Helper ที่มีอยู่ใน animals.js (ใช้ซ้ำ):**
- `svgRoot(vbW, vbH, width)` → `<svg class="animal" viewBox="0 0 vbW vbH">`
- `el(tag, attrs, parent)` → สร้าง element
- `eye(svg, cx, cy, r, { pupil, highlight })` → ตา + กะพริบ (`.eye-blink`)

ANIMALS export ปัจจุบัน: `export const ANIMALS = [ORCA, HUMPBACK, SEAL, OTTER, SEALION, PUFFIN, SALMON, CRAB];`

---

### Task 1: ปลาหมึกยักษ์ (Octopus)

**Files:** Modify `js/core/animals.js`

- [ ] **Step 1: เพิ่ม const ใหม่** — แทรกหลัง const `CRAB` (ก่อนบรรทัด `export const ANIMALS = [...]`):

```js
const OCTOPUS = {
  id: 'octopus', th: 'ปลาหมึกยักษ์', en: 'Octopus',
  make(w) {
    const s = svgRoot(220, 200, w);
    const arm = (d) => el('path', { d, stroke: '#b3618a', 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round' }, s);
    arm('M 96 122 C 60 142 40 170 22 186');
    arm('M 102 126 C 78 152 62 180 52 196');
    arm('M 110 128 C 102 160 98 184 95 198');
    arm('M 122 128 C 132 160 138 184 150 198');
    arm('M 130 126 C 152 152 170 178 188 192');
    arm('M 136 122 C 168 142 190 166 206 182');
    // suckers along the front arms
    [[64, 176], [88, 188], [126, 188], [150, 176]].forEach(([cx, cy]) => el('circle', { cx, cy, r: 2.6, fill: '#e0a3c2', opacity: '.8' }, s));
    // mantle / head
    el('path', { d: 'M 110 26 C 158 26 180 70 173 110 C 167 140 140 152 110 152 C 80 152 53 140 47 110 C 40 70 62 26 110 26 Z', fill: '#b3618a' }, s);
    el('ellipse', { cx: 110, cy: 60, rx: 34, ry: 22, fill: '#c47ba0', opacity: '.6' }, s);
    eye(s, 92, 94, 11, { pupil: '#1a0f16' });
    eye(s, 128, 94, 11, { pupil: '#1a0f16' });
    el('path', { d: 'M 98 120 Q 110 128 122 120', stroke: '#7a3553', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, s);
    return s;
  },
  cry() { return [['bubble'], ['pop']]; },
};
```

- [ ] **Step 2: ต่อใน ANIMALS** — เปลี่ยนบรรทัด export เป็น:

```js
export const ANIMALS = [ORCA, HUMPBACK, SEAL, OTTER, SEALION, PUFFIN, SALMON, CRAB, OCTOPUS];
```

- [ ] **Step 3: ตรวจ** — `node --check js/core/animals.js`; `node --test tests/*.test.mjs` → 33 ผ่าน (import ได้, ไม่เรียก make ใน Node)

- [ ] **Step 4: Commit**

```bash
git add js/core/animals.js
git commit -m "feat: add octopus to the animal registry"
```

> หลัง commit: controller จะเปิด `?preview=animals` ดูปลาหมึกในเบราว์เซอร์และขอแก้พิกัดถ้ายังไม่สวย

---

### Task 2: แมงกะพรุน (Jellyfish)

**Files:** Modify `js/core/animals.js`

- [ ] **Step 1: เพิ่ม const** — แทรกหลัง const `OCTOPUS`:

```js
const JELLY = {
  id: 'jelly', th: 'แมงกะพรุน', en: 'Jellyfish',
  make(w) {
    const s = svgRoot(180, 210, w);
    const tent = (d) => el('path', { d, stroke: '#c98ad9', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', opacity: '.75' }, s);
    tent('M 60 108 C 54 140 68 166 58 202');
    tent('M 80 112 C 78 150 86 176 80 206');
    tent('M 100 112 C 102 150 96 178 104 206');
    tent('M 120 108 C 126 140 116 168 124 202');
    // oral arms (frilly, shorter)
    el('path', { d: 'M 74 106 C 68 134 80 150 74 170 C 90 150 94 130 92 106 Z', fill: '#d7a3e3', opacity: '.85' }, s);
    el('path', { d: 'M 106 106 C 112 134 100 150 106 170 C 90 150 86 130 88 106 Z', fill: '#d7a3e3', opacity: '.85' }, s);
    // bell (translucent dome)
    el('path', { d: 'M 90 22 C 140 22 158 64 152 100 C 150 110 138 112 128 108 C 116 104 100 104 90 104 C 80 104 64 104 52 108 C 42 112 30 110 28 100 C 22 64 40 22 90 22 Z', fill: '#e3c2ec', opacity: '.85' }, s);
    el('path', { d: 'M 34 102 q 14 11 28 1 q 14 11 28 1 q 14 11 28 1', stroke: '#cda6da', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, s);
    el('ellipse', { cx: 76, cy: 54, rx: 20, ry: 14, fill: '#f1e2f6', opacity: '.7' }, s);
    eye(s, 78, 72, 7, { pupil: '#3a2540' });
    eye(s, 104, 72, 7, { pupil: '#3a2540' });
    el('path', { d: 'M 84 88 Q 91 94 98 88', stroke: '#9a6aa8', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, s);
    return s;
  },
  cry() { return [['bubble'], ['ding']]; },
};
```

- [ ] **Step 2: ต่อใน ANIMALS:**

```js
export const ANIMALS = [ORCA, HUMPBACK, SEAL, OTTER, SEALION, PUFFIN, SALMON, CRAB, OCTOPUS, JELLY];
```

- [ ] **Step 3: ตรวจ** — `node --check js/core/animals.js`; `node --test tests/*.test.mjs` → 33 ผ่าน
- [ ] **Step 4: Commit**

```bash
git add js/core/animals.js
git commit -m "feat: add jellyfish to the animal registry"
```

---

### Task 3: ดาวทะเล (Sea Star)

**Files:** Modify `js/core/animals.js`

- [ ] **Step 1: เพิ่ม const** — แทรกหลัง const `JELLY`:

```js
const SEASTAR = {
  id: 'seastar', th: 'ดาวทะเล', en: 'Sea Star',
  make(w) {
    const s = svgRoot(200, 200, w);
    // chunky 5-arm star
    el('path', { d: 'M 100 16 C 112 60 120 64 150 60 C 176 58 180 70 156 92 C 134 112 134 122 148 152 C 160 178 148 186 122 168 C 104 156 96 156 78 168 C 52 186 40 178 52 152 C 66 122 66 112 44 92 C 20 70 24 58 50 60 C 80 64 88 60 100 16 Z', fill: '#e8894a' }, s);
    el('path', { d: 'M 100 52 C 106 76 112 80 128 78 C 119 94 119 102 127 120 C 110 112 90 112 73 120 C 81 102 81 94 72 78 C 88 80 94 76 100 52 Z', fill: '#f2a86e', opacity: '.7' }, s);
    [[100, 40], [140, 76], [126, 128], [74, 128], [60, 76], [100, 98]].forEach(([cx, cy]) => el('circle', { cx, cy, r: 3.5, fill: '#cf6f33', opacity: '.8' }, s));
    eye(s, 90, 92, 7, { pupil: '#5a2d12' });
    eye(s, 112, 92, 7, { pupil: '#5a2d12' });
    el('path', { d: 'M 94 108 Q 101 114 108 108', stroke: '#b85e28', 'stroke-width': 2.6, fill: 'none', 'stroke-linecap': 'round' }, s);
    return s;
  },
  cry() { return [['pop'], ['ding']]; },
};
```

- [ ] **Step 2: ต่อใน ANIMALS:**

```js
export const ANIMALS = [ORCA, HUMPBACK, SEAL, OTTER, SEALION, PUFFIN, SALMON, CRAB, OCTOPUS, JELLY, SEASTAR];
```

- [ ] **Step 3: ตรวจ** — `node --check js/core/animals.js`; `node --test tests/*.test.mjs` → 33 ผ่าน
- [ ] **Step 4: Commit**

```bash
git add js/core/animals.js
git commit -m "feat: add sea star to the animal registry"
```

---

### Task 4: ฉลาม (Shark)

**Files:** Modify `js/core/animals.js`

- [ ] **Step 1: เพิ่ม const** — แทรกหลัง const `SEASTAR`:

```js
const SHARK = {
  id: 'shark', th: 'ฉลาม', en: 'Shark',
  make(w) {
    const s = svgRoot(300, 170, w);
    // crescent tail (right)
    el('path', { d: 'M 248 86 C 268 70 282 56 292 42 C 288 64 288 82 296 98 C 280 96 262 96 248 92 Z', fill: '#5f7585' }, s);
    // body: pointed snout (left) tapering to tail
    el('path', { d: 'M 22 90 C 60 60 130 56 200 66 C 230 70 250 80 256 90 C 250 100 230 110 200 114 C 130 124 60 120 22 90 Z', fill: '#7d93a3' }, s);
    // white belly
    el('path', { d: 'M 42 98 C 100 116 180 116 234 100 C 200 112 120 118 70 110 C 56 107 46 103 42 98 Z', fill: '#dfe7ec' }, s);
    // tall dorsal fin
    el('path', { d: 'M 120 62 C 132 28 150 22 162 20 C 157 38 159 56 169 70 C 150 66 134 64 120 62 Z', fill: '#6a8090' }, s);
    // pectoral fin
    el('path', { d: 'M 110 108 C 120 130 138 140 156 140 C 144 124 140 112 138 102 Z', fill: '#6a8090' }, s);
    // gills
    el('path', { d: 'M 70 80 Q 72 92 70 102 M 80 78 Q 82 90 80 102 M 90 78 Q 92 90 90 102', stroke: '#5f7585', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, s);
    // gentle mouth — no sharp teeth (must not look scary)
    el('path', { d: 'M 26 96 Q 44 104 64 100', stroke: '#41525e', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, s);
    eye(s, 58, 84, 6, { pupil: '#101a1f' });
    return s;
  },
  cry() { return [['boing'], ['bubble']]; },
};
```

- [ ] **Step 2: ต่อใน ANIMALS:**

```js
export const ANIMALS = [ORCA, HUMPBACK, SEAL, OTTER, SEALION, PUFFIN, SALMON, CRAB, OCTOPUS, JELLY, SEASTAR, SHARK];
```

- [ ] **Step 3: ตรวจ** — `node --check js/core/animals.js`; `node --test tests/*.test.mjs` → 33 ผ่าน
- [ ] **Step 4: Commit**

```bash
git add js/core/animals.js
git commit -m "feat: add a friendly shark to the animal registry"
```

---

### Task 5: วาดนากทะเล (otter) ใหม่

**Files:** Modify `js/core/animals.js`

- [ ] **Step 1: แทนที่ `OTTER.make()` ทั้งฟังก์ชัน** — เปลี่ยน body ของ `make(w)` ใน const `OTTER` (id/th/en/cry คงเดิม) เป็น:

```js
  make(w) {
    const s = svgRoot(180, 210, w);
    // upright floating body
    el('path', { d: 'M 90 60 C 130 60 146 100 144 140 C 142 178 120 198 90 198 C 60 198 38 178 36 140 C 34 100 50 60 90 60 Z', fill: '#6b4a32' }, s);
    el('ellipse', { cx: 90, cy: 144, rx: 34, ry: 46, fill: '#8a6244' }, s);
    // feet
    el('ellipse', { cx: 70, cy: 192, rx: 12, ry: 8, fill: '#5a3d28' }, s);
    el('ellipse', { cx: 110, cy: 192, rx: 12, ry: 8, fill: '#5a3d28' }, s);
    // a clam held on the belly (otter's classic pose)
    el('path', { d: 'M 72 134 C 80 120 100 120 108 134 C 100 140 80 140 72 134 Z', fill: '#e8d6c0' }, s);
    el('path', { d: 'M 90 123 L 90 134 M 81 126 L 85 134 M 99 126 L 95 134', stroke: '#c9b49a', 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, s);
    // paws cupping the clam
    el('ellipse', { cx: 66, cy: 140, rx: 9, ry: 6, fill: '#5a3d28' }, s);
    el('ellipse', { cx: 114, cy: 140, rx: 9, ry: 6, fill: '#5a3d28' }, s);
    // head
    el('circle', { cx: 90, cy: 54, r: 38, fill: '#6b4a32' }, s);
    el('circle', { cx: 64, cy: 30, r: 9, fill: '#5a3d28' }, s);
    el('circle', { cx: 116, cy: 30, r: 9, fill: '#5a3d28' }, s);
    el('ellipse', { cx: 90, cy: 66, rx: 24, ry: 18, fill: '#d9c4a8' }, s);
    el('path', { d: 'M 82 60 C 85 56 95 56 98 60 C 96 65 84 65 82 60 Z', fill: '#332518' }, s);
    el('path', { d: 'M 90 64 Q 90 72 82 75 M 90 64 Q 90 72 98 75', stroke: '#7a6248', 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 78 67 Q 64 65 54 67 M 78 71 Q 64 73 56 79 M 102 67 Q 116 65 126 67 M 102 71 Q 116 73 124 79', stroke: '#f2ead9', 'stroke-width': 1.2, fill: 'none', 'stroke-linecap': 'round', opacity: '.9' }, s);
    eye(s, 76, 48, 6.5, { pupil: '#241a10' });
    eye(s, 104, 48, 6.5, { pupil: '#241a10' });
    return s;
  },
```

- [ ] **Step 2: ตรวจ** — `node --check js/core/animals.js`; `node --test tests/*.test.mjs` → 33 ผ่าน

- [ ] **Step 3: Commit**

```bash
git add js/core/animals.js
git commit -m "feat: redesign otter — upright floating pose holding a clam"
```

> หลัง commit: controller ตรวจในเบราว์เซอร์ว่า (ก) นากดูเป็นนากชัด, (ข) การ์ด "วาดตามรอย" บน hub ที่วาง otter (`game-art.js` `'trace-letters'`: `placeAnimal(s, 'otter', 4, 92, 80)`) ยังสวย — ถ้านากแนวตั้งทำให้ล้น/เล็กไป ปรับ x/y/w ใน game-art.js แล้ว commit เพิ่ม `fix: reposition otter in trace-letters tile art`

---

### Task 6: เทสต์ guard + ตรวจครบวงจร

**Files:** Create `tests/animals.test.mjs`

- [ ] **Step 1: เขียนเทสต์**

```js
// tests/animals.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ANIMALS, byId } from '../js/core/animals.js';

test('มีสัตว์ 12 ตัว และ id ไม่ซ้ำ', () => {
  assert.equal(ANIMALS.length, 12);
  const ids = ANIMALS.map(a => a.id);
  assert.equal(new Set(ids).size, 12);
});

test('ทุกตัวมี th/en และ make/cry เป็น function, cry() คืน array', () => {
  for (const a of ANIMALS) {
    assert.ok(a.th && a.en, a.id);
    assert.equal(typeof a.make, 'function', `${a.id}.make`);
    assert.equal(typeof a.cry, 'function', `${a.id}.cry`);
    assert.ok(Array.isArray(a.cry()), `${a.id}.cry()`);
  }
});

test('สัตว์ใหม่ 4 ตัวอยู่ในทะเบียน', () => {
  for (const id of ['octopus', 'jelly', 'seastar', 'shark']) assert.ok(byId(id), id);
});
```

- [ ] **Step 2: รัน** — `node --test tests/animals.test.mjs` → PASS (3); `node --test tests/*.test.mjs` → ทั้งหมดผ่าน (36)

- [ ] **Step 3: Commit**

```bash
git add tests/animals.test.mjs
git commit -m "test: guard the 12-animal registry shape"
```

- [ ] **Step 4: Playwright ตรวจครบวงจร** (server `-c-1`)
  - `?preview=animals` ที่ 1180×820: เห็น 12 ตัว, สี่ตัวใหม่ (octopus/jelly/seastar/shark) อ่านออก สไตล์กลมกลืน, นากตัวใหม่ดูเป็นนากชัด — screenshot ตรวจด้วยตา; ถ้าตัวไหนเพี้ยน ปรับพิกัดแล้ว commit เพิ่ม
  - hub: การ์ด "วาดตามรอย" (mascot นาก) ยังสวยทั้ง 1180×820 และ 844×390
  - เล่นเกมที่สุ่มสัตว์ (จับคู่เงา / นับสัตว์ทะเล / เสียงเรียกใคร) หลาย ๆ รอบ ดูว่าสัตว์ใหม่โผล่ได้ + ไม่มี error; console 0 error
  - เกมเดิมทั้งหมดเข้า-ออกได้

---

## นอกขอบเขต
- เพิ่มคำสะกด (SHARK, STAR…) ใน spell-words.js และคำในเกมวาดตามรอย
- ทบทวนสมดุลเกมหลังสัตว์เพิ่ม (รอบแยก)
