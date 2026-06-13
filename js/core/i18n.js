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
  switchLang: ['เปลี่ยนภาษา (กดค้างไว้)', 'Switch language (press and hold)'],
  muteSound: ['ปิดเสียง', 'Mute sound'],
  listenAgain: ['ฟังอีกครั้ง', 'Listen again'],
  shelfHandEye: ['มือกับตา', 'Hands & Eyes'],
  shelfListenLang: ['ฟังกับภาษา', 'Listening & Language'],
  shelfCountThink: ['นับกับคิด', 'Counting & Thinking'],
  traceLetters: ['วาดตามรอย', 'Trace Letters'],
  age36: ['3-6 ปี', 'Age 3-6'],
  pickLetter: ['เลือกตัวอักษรที่อยากวาดเลย!', 'Pick a letter to trace!'],
  traceFollow: ['ลากนิ้วตามเส้นนะ', 'Follow the line with your finger'],
  watchAgain: ['ดูอีกครั้ง', 'Watch again'],
  unmuteSound: ['เปิดเสียง', 'Turn sound on'],
  spellWord: ['สะกดคำ', 'Spell the Word'],
  age47: ['4-7 ปี', 'Age 4-7'],
  spellPrompt: ['ลากตัวอักษรมาสะกดคำนะ', 'Drag the letters to spell the word'],
  memoryMatch: ['ความจำจับคู่', 'Memory Match'],
  age37: ['3-7 ปี', 'Age 3-7'],
  memoryPrompt: ['พลิกการ์ดหาคู่ที่เหมือนกันนะ', 'Flip the cards to find matching pairs'],
};

let lang = get('lang', 'th');

export function t(key) {
  const pair = STRINGS[key];
  return pair ? pair[lang === 'th' ? 0 : 1] : key;
}
export function getLang() { return lang; }
export function setLang(value) { lang = value; set('lang', lang); }
export function toggleLang() { setLang(lang === 'th' ? 'en' : 'th'); return lang; }
