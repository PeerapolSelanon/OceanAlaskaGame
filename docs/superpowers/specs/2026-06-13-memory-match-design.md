# ความจำจับคู่ (Memory Match) — Design Spec

วันที่: 2026-06-13
สถานะ: อนุมัติแนวคิดแล้ว รอเขียนแผนพัฒนา
ต่อยอดจาก: ทะเบียนสัตว์ 12 ตัว + รูปแบบ scene/logic ของเกมเดิม

## เป้าหมาย

เกมที่ 7 ในชั้น 🔢 **นับกับคิด** (ที่ยังมีแค่เกมเดียว) — เด็กพลิกการ์ดหาคู่สัตว์ที่เหมือนกัน ฝึกความจำ/สมาธิ ใช้สัตว์ 12 ตัวในทะเบียนเป็นหน้าการ์ด เล่นซ้ำได้เยอะ ปรับยากตามวัยอัตโนมัติ

**วัยแนะนำ:** 3-7 ปี · **scene id:** `memory-match` · **mascot บน hub:** ปลาหมึกยักษ์ (octopus) · **สี accent:** `--teal-mem`

## การเล่น (ปรับยากอัตโนมัติ แบบ count-tap)

1. เริ่ม **2 คู่ (4 การ์ด)** วางเป็น grid responsive — หลังการ์ดทุกใบเป็นลายฟองอากาศทะเลเหมือนกัน
2. แตะการ์ด → พลิก (CSS 3D rotateY) เผยสัตว์ + พูดชื่อสัตว์ (ภาษาปัจจุบัน)
3. พลิกใบที่สอง:
   - **ตรงคู่** (สัตว์เดียวกัน): ทั้งคู่เด้ง `boing` + เสียง `ding` + ค้างเปิดถาวร (จับได้แล้ว) + พูดชื่อซ้ำสองภาษา (`speakName`)
   - **ไม่ตรง**: ค้างให้เห็น ~0.9 วินาที แล้วคว่ำกลับเงียบ ๆ — ไม่มีถูก/ผิด ไม่มีเสียงตำหนิ (กฎ no-fail)
4. ครบทุกคู่ → ฉลอง (คอนเฟตตี + `cheer` + พูดชม) → รอ ~2 วิ → รอบใหม่ที่อาจเลื่อนระดับ
5. **เลื่อนระดับ:** 2 → 3 → 4 → 6 คู่ (จับครบติดกัน 2 รอบ → +1 ระดับ, เพดาน 6 คู่ = 12 การ์ด); ไม่มีการลดระดับ (ไม่มีแพ้)

## กลไก/สถาปัตยกรรม

### Pure logic — `js/games/logic/memory-logic.js` (ทดสอบด้วย `node --test`)

ใช้ `shuffle`/`sample` จาก `round-utils.js` ที่มีอยู่:

- `dealBoard(pool, pairs, rng)` → สุ่มสัตว์ `pairs` ตัวจาก pool, ทำสำเนาเป็นคู่ (2 ใบต่อตัว), สับลำดับทั้งหมด, คืน array ของ `{ id, key }` โดย `key` = ดัชนีเอกลักษณ์ต่อใบ (กันสองใบที่ id เดียวกันชนกันเวลาอ้างอิง). ความยาว = `pairs * 2`
- `levelPairs(level)` → จำนวนคู่ตามระดับ: ลำดับ `[2, 3, 4, 6]`, index = `Math.min(level, 3)` (level 0-based)
- `nextLevel(state, cleared)` → state ใหม่ `{ level, streak }`: ถ้า `cleared` true เพิ่ม streak; ครบ 2 streak → level+1 (cap 3) แล้วรีเซ็ต streak; ไม่มีลดระดับ
- `isCleared(cards)` → true เมื่อทุกใบ `matched === true`

### Scene — `js/games/memory-match.js` `{ init(container, go), destroy() }`

- สถานะ: `_cards` (จาก dealBoard), `_flipped` (ใบที่เปิดค้างรอจับคู่, สูงสุด 2), `_locked` (ระหว่างรอคว่ำกลับ/ฉลอง), `_state` `{level, streak}`, `_timers[]`
- แตะการ์ด: ถ้า `_locked` หรือใบนั้น matched/เปิดอยู่แล้ว → ไม่มีผล; ไม่งั้นเปิด + พูดชื่อ + push เข้า `_flipped`
- เปิดครบ 2 ใบ → `_locked = true`; ถ้า id ตรงกัน → mark matched ทั้งคู่ + boing + ding + speakName, เคลียร์ `_flipped`, ปลดล็อก, เช็ค `isCleared`; ถ้าไม่ตรง → timer ~0.9 วิ คว่ำกลับทั้งคู่ + ปลดล็อก
- grid: `repeat(auto-fit/columns)` ปรับตามจำนวนการ์ด (4/6/8/12) ให้การ์ด ≥80px ทั้งบน iPad และมือถือแนวนอน
- ปุ่มกลับ 🏠 ผ่าน `onActivate` + aria-label

### หน้า/หลังการ์ด

- **หลัง (คว่ำ):** ลายฟองอากาศทะเล — พื้นไล่เฉดน้ำ (`--mid-water`→`--deep-water`) + วงฟองขาวโปร่ง เหมือนกันทุกใบ
- **หน้า:** พื้นขาว (`--foam-white`) + `byId(id).make(w)` ของสัตว์
- พลิกด้วย CSS 3D (`transform: rotateY(180deg)`, `transform-style: preserve-3d`, `backface-visibility: hidden`) — `prefers-reduced-motion` ตัดเป็นสลับ display ทันที

## ความคงทน (ตามแบบแผนโปรเจกต์)

- Pointer Events เท่านั้น (แตะผ่าน `onActivate` รองรับคีย์บอร์ด)
- การ์ด ≥80px ทุกระดับ
- timers ทุกตัวเข้า `_timers[]` ล้างใน `destroy()` + `speechSynthesis.cancel()`
- `_locked` กันแตะรัวระหว่างรอคว่ำกลับ/ฉลอง
- resize/หมุนจอกลางรอบ: grid เป็น responsive อยู่แล้ว (ใบปรับขนาดตาม); ไม่ re-deal กลางรอบ
- บันทึกระดับสูงสุด: localStorage `memoryLevel` (optional) — เปิดเกมครั้งหน้าเริ่มที่ระดับเดิม
- สี UI ใช้ `var(--token)`; เพิ่ม `--teal-mem` ใน `:root`

## ไฟล์

| ไฟล์ | บทบาท |
|---|---|
| Create `js/games/logic/memory-logic.js` + test | dealBoard / levelPairs / nextLevel / isCleared |
| Create `js/games/memory-match.js` | scene |
| Modify `css/main.css` | `--teal-mem` + สไตล์การ์ด/grid/flip 3D |
| Modify `js/core/i18n.js` | memoryMatch, age37, memoryPrompt |
| Modify `js/hub.js` | เพิ่มในชั้น count-think (mascot=octopus, color=var(--teal-mem)) |
| Modify `js/main.js` | register scene |
| Modify `js/core/game-art.js` | คำใบ้การ์ด hub: การ์ดคว่ำ 2 ใบ + ? |
| Modify `DESIGN.md` + `.impeccable/design.json` | Teal เป็นสีเกมที่ 7 |

## การทดสอบ

- `tests/memory-logic.test.mjs`: dealBoard (จำนวนใบ = pairs*2, แต่ละ id มี 2 ใบพอดี, key ไม่ซ้ำ), levelPairs (2/3/4/6 + cap), nextLevel (streak 2 → level+1, cap 3, ไม่ลด), isCleared
- Playwright: เข้าเกมจาก hub → ระดับแรก 4 การ์ด; พลิกคู่ตรง → ค้างเปิด+ฉลองเมื่อครบ; พลิกไม่ตรง → คว่ำกลับ; ครบคู่เลื่อนระดับ; ปุ่มกลับ; จอ 1180×820 + 844×390; เกมเดิม 6 เกม regression; console 0 error
- เทสต์เดิม 36 ตัวต้องผ่าน

## นอกขอบเขต

- โหมดจับเวลา/นับครั้งพลิก (ขัดกฎ no-pressure — ไม่ทำ)
- การ์ดธีมอื่นนอกจากสัตว์
- ทบทวนสมดุลเกมรวมหลังเพิ่มเกม (รอบแยก)
