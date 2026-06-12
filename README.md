# ทะเลอลาสก้าของหนู — My Alaska Ocean

เกม HTML5 เพื่อพัฒนาการเด็ก 1-5 ปี ธีมสัตว์ทะเลอลาสก้า สองภาษาไทย/อังกฤษ  
A bilingual (TH/EN) HTML5 developmental game suite for ages 1-5, featuring Alaska sea animals.

**เล่นเลย / Play:** https://peerapolselanon.github.io/OceanAlaskaGame/

## เกม / Games

| เกม | วัย | ทักษะ |
|---|---|---|
| แตะทะเล — Tap the Sea | 1-2 ปี | เหตุและผล |
| จับคู่เงา — Shadow Match | 2-4 ปี | กล้ามเนื้อมัดเล็ก รูปทรง |
| นับสัตว์ทะเล — Count & Tap | 3-5 ปี | ตัวเลข 1-10 |
| เสียงเรียกใคร — Listen & Find | 3-5 ปี | คำศัพท์สองภาษา |

## รันบนเครื่อง / Run locally

```
npx http-server -p 8080
# open http://localhost:8080
# animal art preview: http://localhost:8080/?preview=animals
```

## เสียงพูดภาษาไทยไม่ทำงาน? / Thai speech not working?

เกมใช้เสียงพูดจากระบบ (Web Speech API) — ถ้าเครื่องไม่มีเสียงภาษาไทย เกมจะพูดเฉพาะอังกฤษ

- **Windows (Chrome):** Settings → Time & Language → Speech → Manage voices → **Add voices** → ค้นหา "ไทย / Thai" → ติดตั้ง แล้วปิด-เปิดเบราว์เซอร์ใหม่
- **Windows (Edge):** มีเสียงไทยออนไลน์ในตัว (Premwadee) ใช้ได้ทันที ไม่ต้องติดตั้งอะไร
- **iPad/iPhone:** มีเสียงไทย (Kanya) ในตัว — ถ้าเงียบ ดูที่ Settings → Accessibility → Spoken Content → Voices → Thai

The game uses the system's speech voices. If Thai is silent, install a Thai voice (see above) or use Microsoft Edge / iPad which include one.

## ทดสอบ / Tests

```
node --test tests/audio-voices.test.mjs tests/count-logic.test.mjs tests/round-utils.test.mjs tests/settings.test.mjs tests/i18n.test.mjs
```

Vanilla JS + SVG. No build step, no dependencies.
