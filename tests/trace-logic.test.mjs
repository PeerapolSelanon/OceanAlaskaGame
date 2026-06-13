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
