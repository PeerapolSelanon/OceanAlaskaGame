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
