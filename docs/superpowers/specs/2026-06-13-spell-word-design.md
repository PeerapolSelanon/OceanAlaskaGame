# สะกดคำ (Spell the Word) — Design Spec

วันที่: 2026-06-13
สถานะ: อนุมัติแนวคิดแล้ว รอเขียนแผนพัฒนา
ต่อยอดจาก: เกมวาดตามรอย A-Z (`2026-06-13-skill-hub-and-trace-letters-design.md`) และทะเบียนสัตว์เดิม

## เป้าหมาย

เกมที่ 6 ในชั้น 👂 **ฟังกับภาษา** (ที่ยังมีแค่เกมเดียว) — เด็กลากตัวอักษรมาเรียงเป็นชื่อสัตว์ภาษาอังกฤษ โดยมีรูปสัตว์เป็นคำใบ้ ต่อยอดจากเกมวาดตามรอยที่เพิ่งฝึกรู้จักตัวอักษร A-Z

**วัยแนะนำ:** 4-7 ปี · **scene id:** `spell-word`

## คำที่สะกด (7 คำ เรียงสั้น→ยาว ทุกคำมีรูป+เสียงจากทะเบียนสัตว์เดิม)

| คำ | สัตว์ (art + cry + เสียงชื่อ) |
|---|---|
| CRAB | crab |
| ORCA | orca |
| SEAL | seal |
| OTTER | otter |
| WHALE | humpback |
| PUFFIN | puffin |
| SALMON | salmon |

- เก็บใน `js/games/data/spell-words.js` เป็น `[{ word: 'CRAB', animal: 'crab' }, ...]` เรียงตามความยาว
- รูปคำใบ้ = `byId(animal).make(w)` (ใช้ art เดิม) · เสียงชื่อ = พูด word · เสียงร้อง = `playCry(byId(animal))`
- สัตว์ที่ชื่ออังกฤษเป็นหลายคำ (Sea Lion) ไม่อยู่ในชุดนี้ — เพิ่มได้ภายหลังถ้าหาคำเดี่ยวที่เหมาะ

## การเล่น (รอบต่อรอบ ไม่มีหน้าเลือก — แบบ count-tap/listen-find)

1. โชว์รูปสัตว์ใหญ่กลางบนเป็นคำใบ้ + พูด "Crab! สะกดคำว่า crab" (ภาษาปัจจุบันนำ)
2. **แถวช่อง** จำนวนเท่าตัวอักษรของคำ แต่ละช่องแสดง **ตัวอักษรเป้าหมายแบบหริปจาง** (ghost) ให้เด็กจับคู่
3. **แถบตัวอักษร** = ตัวอักษรของคำนั้นพอดี สับลำดับ (shuffle) เป็นไทล์ลากได้ ≥80px
4. ลากไทล์ลงช่อง:
   - ตรงช่องที่ ghost = ตัวอักษรไทล์ และช่องยังว่าง → snap เข้าช่อง ล็อก (ghost เปลี่ยนเป็นตัวทึบสี accent) + เสียง ding
   - ผิดช่อง/ไม่โดนช่อง → เด้งกลับที่เดิมเงียบ ๆ ไม่มีเสียงตำหนิ (no-fail)
5. ครบทุกช่อง → ฉลอง: คอนเฟตตี + cheer + พูดคำซ้ำ (สองภาษา) + `playCry` + รูปสัตว์ boing → รอ ~2.6s → คำถัดไป
6. ปุ่ม 🔊 (บนขวา) ฟังชื่อคำซ้ำ; ปุ่มกลับ 🏠 (บนซ้าย) → hub

## โมเดลข้อมูล + ตรรกะ (pure, ทดสอบได้)

`js/games/logic/spell-logic.js` (ใช้ `mulberry32` + `shuffle` จาก `logic/round-utils.js` ที่มีอยู่):

- `letterBank(word, rng)` → array ตัวอักษรของ word ที่สับลำดับแล้ว (เป็น permutation, length เท่าเดิม รองรับตัวซ้ำเช่น OTTER/PUFFIN)
- `pickWord(pool, done, lastWord, rng)` → เลือกคำถัดไป: เลี่ยงคำล่าสุด, เลือกจากคำที่ยังไม่อยู่ใน `done` ก่อน (เพื่อความหลากหลายข้ามรอบ); ถ้าทำครบทุกคำแล้วถือว่าเลือกได้จากทั้งหมด (ยังเลี่ยงคำล่าสุด)
- `isSolved(slots)` → true เมื่อทุกช่อง `filled === true`

`tests/spell-logic.test.mjs`: permutation+length+ตัวซ้ำของ letterBank, pickWord (เลี่ยงซ้ำ/เลือก undone ก่อน/all-done fallback/pool เดียว), isSolved
`tests/spell-words.test.mjs`: ทุก word เป็น A-Z ตัวพิมพ์ใหญ่ ยาว ≥3, `byId(animal)` resolve ได้ครบ, เรียงตามความยาวไม่ลด

## บันทึกความคืบหน้า

- localStorage `spellDone.en` (array ของคำที่สะกดสำเร็จ) ผ่าน `settings.js` — ใช้ให้ `pickWord` ชอบคำที่ยังไม่เคยทำก่อน เพื่อให้เด็กได้เห็นครบทุกคำก่อนวนซ้ำ (ไม่มีหน้าเลือกให้โชว์เหมือน trace แต่ช่วยเรื่องความหลากหลาย)

## สถาปัตยกรรมและไฟล์

| ไฟล์ | บทบาท |
|---|---|
| Create `js/games/logic/spell-logic.js` + test | ตรรกะ pure |
| Create `js/games/data/spell-words.js` + test | รายการคำ+สัตว์ |
| Create `js/games/spell-word.js` | scene `{init(container, go), destroy()}` |
| Modify `js/hub.js` | เพิ่มในชั้น listen-lang (mascot=crab, color=var(--coral)) |
| Modify `js/main.js` | `registerScene('spell-word', spellWord)` |
| Modify `css/main.css` | `:root` เพิ่ม `--coral`; สไตล์ช่อง/ไทล์ |
| Modify `js/core/i18n.js` | keys: spellWord, age47, spellPrompt |
| Modify `js/core/game-art.js` | คำใบ้บนการ์ด hub: ปู + ไทล์ตัวอักษร |
| Modify `DESIGN.md` + `.impeccable/design.json` | เพิ่ม Coral เป็นสีประจำเกมที่ 6 |

**สี accent ใหม่:** `--coral: #ef7d6e` (ส้มปะการัง — แยกจาก Sunset Orange ชัดเจน, ตาม One-Game-One-Color)

## การลาก (ใช้รูปแบบเดียวกับ shadow-match)

- Pointer Events เท่านั้น + `setPointerCapture` (try/catch) + `pointercancel` = คืนไทล์
- ขยับด้วย `transform: translate3d` (ไม่เขียน left/top ต่อเฟรม — บทเรียนจาก optimize shadow-match)
- กันนิ้วที่สอง: `if (this._drag) return;` ที่ต้น pointerdown
- ตรวจช่องที่วาง: หา `.spell-slot` ที่จุดกึ่งกลางไทล์ทับอยู่ ยังไม่ filled และ ghost ตรงกับตัวอักษรไทล์ → snap; ไม่งั้นเด้งกลับ
- ปุ่ม 🏠/🔊 ใช้ `onActivate` + aria-label (รองรับคีย์บอร์ด); ไทล์ลากไม่ต้องรองรับคีย์บอร์ด (กลไก fine-motor เหมือน shadow-match)

## ความคงทน (ตามแบบแผนโปรเจกต์)

- timers ทุกตัวเข้า `_timers[]` ล้างใน `destroy()` + `speechSynthesis.cancel()`
- guard `_locked` ระหว่างฉลอง กันลากต่อ
- resize/หมุนจอกลางรอบ: v1 ไม่ auto re-layout (รอบใหม่จัดใหม่เอง) — เหมือน trace
- `prefers-reduced-motion`: กฎ global เดิมครอบ (snap/bounce กลายเป็นทันที)
- ไทล์และช่อง ≥80px; ตัวอักษร ghost คอนทราสต์พอให้เห็นแต่จางกว่าตัวทึบ

## การทดสอบ

- `node --test` สำหรับ spell-logic + spell-words (เพิ่มจาก 25 เป็น ~30 เทสต์)
- Playwright: เข้าเกมจาก hub → สะกด CRAB ครบ (จำลอง pointer drag ทีละไทล์ลงช่องถูก) → ตรวจฉลอง + คำถัดไป; ลากผิดช่องเด้งกลับ; ปุ่ม 🔊/🏠; ตรวจจอ 1180×820 และ 844×390; เกมเดิม 5 เกม regression ผ่าน; console 0 error

## นอกขอบเขตรอบนี้ (บันทึกไว้)

- คำหลายคำ/ยาวขึ้น, ตัวลวง (decoy letters), โหมดไม่มี ghost (recall)
- สะกดคำไทย (ก-ฮ มีสระ/วรรณยุกต์ ต้องออกแบบกลไกต่างหาก)
- **ปรับทุกเกมพร้อมกันหลังเพิ่มสัตว์ชุดใหม่** (ผู้ใช้ระบุไว้ 2026-06-13): เมื่อเพิ่มสัตว์เกิน 8 ตัว จะกลับมาทบทวนทุกเกม — เกมนี้จะมีคำให้สะกดมากขึ้นอัตโนมัติถ้าเพิ่มลง `spell-words.js`
