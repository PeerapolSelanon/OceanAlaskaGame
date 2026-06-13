// js/games/trace-letters.js
import { LETTERS_EN } from './data/letters-en.js';
import { speak, sfx, warmUp } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { get, set } from '../core/settings.js';
import { onActivate, onTap } from '../core/ui.js';
import { confetti } from '../core/confetti.js';
import { isNearStart, advance, isComplete } from './logic/trace-logic.js';

const TOLERANCE_PX = 45;   // forgiving corridor around the stroke
const START_RADIUS_PX = 50;
const SAMPLE_STEP = 6;     // viewBox units between sampled points

export const traceLetters = {
  _container: null,
  _go: null,
  _timers: [],
  _done: null,     // Set ของ char ที่วาดสำเร็จ
  _trace: null,    // สถานะจอวาด (Task 6)

  init(container, go) {
    this._container = container;
    this._go = go;
    this._timers = [];
    this._done = new Set(get('traceDone.en', []));
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" aria-label="${t('back')}" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <div id="prompt" style="position:absolute;top:16px;width:100%;text-align:center;color:var(--ink-deep);font-size:clamp(20px,3.4vw,32px);font-weight:800;text-shadow:var(--text-halo);pointer-events:none;"></div>
      <div id="trace-stage" style="position:absolute;inset:0;"></div>
    `);
    onActivate(container.querySelector('#back-btn'), () => {
      if (this._trace) { this._showPicker(); return; } // จากจอวาดกลับจอเลือกก่อน
      go('hub');
    });
    this._showPicker();
  },

  _stage() { return this._container.querySelector('#trace-stage'); },

  _showPicker(skipSpeak = false) {
    if (!this._container) return; // a late timer must never render into a destroyed scene
    this._trace = null;
    const stage = this._stage();
    stage.innerHTML = '';
    this._container.querySelector('#prompt').textContent = t('pickLetter');
    const grid = document.createElement('div');
    grid.id = 'letter-grid';
    for (const letter of LETTERS_EN) {
      const cell = document.createElement('button');
      cell.className = 'btn letter-cell';
      cell.textContent = letter.char;
      cell.setAttribute('aria-label', `${letter.name.th} ${letter.name.en}`);
      if (this._done.has(letter.char)) cell.dataset.done = '1';
      onTap(cell, () => { warmUp(); sfx.pop(); this._showLetter(letter); });
      grid.appendChild(cell);
    }
    stage.appendChild(grid);
    if (!skipSpeak) speak(t('pickLetter'), getLang()); // หลังฉลองไม่พูดทับเสียงคำศัพท์
  },

  _showLetter(letter) {
    const stage = this._stage();
    stage.innerHTML = '';
    this._container.querySelector('#prompt').textContent = `${letter.char} — ${t('traceFollow')}`;

    // การ์ดขาวกลางจอ + svg ตัวอักษร ~70% ของความสูงจอ
    const card = document.createElement('div');
    card.style.cssText = 'position:absolute;inset:76px 0 2vh;display:flex;align-items:center;justify-content:center;';
    const size = Math.min(window.innerHeight * 0.7, window.innerWidth * 0.5);
    const wrap = document.createElement('div');
    wrap.style.cssText = `width:${size * 100 / 120}px;height:${size}px;background:linear-gradient(180deg,var(--foam-white),var(--ice-mist));border-radius:22px;box-shadow:var(--shadow-soft-lift);display:flex;align-items:center;justify-content:center;touch-action:none;`;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', letter.viewBox);
    svg.style.cssText = 'width:88%;height:88%;overflow:visible;';
    wrap.appendChild(svg);
    card.appendChild(wrap);
    stage.appendChild(card);

    // ปุ่มดูสาธิตซ้ำ
    const replay = document.createElement('button');
    replay.className = 'btn btn-round';
    replay.id = 'replay-btn';
    replay.textContent = '🔄';
    replay.setAttribute('aria-label', t('watchAgain'));
    replay.style.cssText = 'position:absolute;top:12px;right:12px;z-index:10;';
    stage.appendChild(replay);

    // วาดเส้นทุกขีด: ฐานเส้นประเทา + เลเยอร์สีสำหรับความคืบหน้า
    const mk = (d, style) => {
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      for (const [k, v] of Object.entries(style)) p.setAttribute(k, v);
      svg.appendChild(p);
      return p;
    };
    const strokes = letter.strokes.map((d) => {
      const base = mk(d, { stroke: 'var(--shallow-water)', 'stroke-width': 7, 'stroke-dasharray': '1 9', opacity: '.9' });
      const fill = mk(d, { stroke: 'var(--sun-gold)', 'stroke-width': 11 });
      const len = fill.getTotalLength();
      fill.setAttribute('stroke-dasharray', String(len));
      fill.setAttribute('stroke-dashoffset', String(len));
      // sample จุดเป็นพิกัด viewBox สำหรับ trace-logic
      const points = [];
      for (let l = 0; l <= len; l += SAMPLE_STEP) { const pt = fill.getPointAtLength(l); points.push({ x: pt.x, y: pt.y }); }
      const end = fill.getPointAtLength(len); points.push({ x: end.x, y: end.y });
      return { base, fill, len, points };
    });

    // จุดเริ่มกะพริบของเส้นปัจจุบัน
    const startDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startDot.setAttribute('r', '9');
    startDot.setAttribute('fill', 'var(--sunset-orange)');
    startDot.setAttribute('class', 'trace-start');
    svg.appendChild(startDot);

    const state = { letter, svg, strokes, cur: 0, idx: 0, active: false };
    this._trace = state;

    // tolerance แปลงจาก px จอ → หน่วย viewBox ตามสเกล render จริง
    const scale = () => svg.getBoundingClientRect().width / 100;
    const toSvg = (e) => {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    };
    const cs = () => strokes[state.cur];
    const updateFill = () => {
      const s = cs();
      const frac = state.idx / (s.points.length - 1);
      s.fill.setAttribute('stroke-dashoffset', String(s.len * (1 - frac)));
    };
    const placeDot = () => {
      const p = cs().points[Math.min(state.idx, cs().points.length - 1)];
      startDot.setAttribute('cx', p.x); startDot.setAttribute('cy', p.y);
    };
    const demo = () => { // สาธิตเส้นปัจจุบัน: เส้นสีวิ่ง 1 รอบแล้วถอยกลับตาม progress จริง
      const s = cs();
      s.fill.style.transition = 'stroke-dashoffset 1s ease';
      s.fill.setAttribute('stroke-dashoffset', '0');
      this._timers.push(setTimeout(() => {
        s.fill.style.transition = 'stroke-dashoffset .3s ease';
        updateFill();
        this._timers.push(setTimeout(() => { s.fill.style.transition = ''; }, 350));
      }, 1100));
    };
    const celebrate = () => {
      startDot.remove();
      svg.classList.add('animal', 'boing'); // .animal.boing is the squash-pop rule
      sfx.cheer();
      this._timers.push(...confetti(stage));
      const lang = getLang();
      if (lang === 'en') {
        speak(`${letter.name.en}! ${letter.name.en} is for ${letter.word.en}`, 'en');
        speak(letter.word.th, 'th', { interrupt: false });
      } else {
        speak(`${letter.name.th}! ${letter.word.th}`, 'th');
        speak(`${letter.name.en} is for ${letter.word.en}`, 'en', { interrupt: false });
      }
      if (letter.art) { // รูปคำศัพท์ pop-in ข้างการ์ด
        const art = letter.art(Math.min(220, size * 0.45));
        art.classList.add('pop-in');
        art.style.cssText = 'position:absolute;right:4vw;bottom:6vh;';
        stage.appendChild(art);
      }
      this._done.add(letter.char);
      set('traceDone.en', [...this._done]);
      this._timers.push(setTimeout(() => { if (this._container) this._showPicker(true); }, 2600));
    };
    const finishStroke = () => {
      const s = cs();
      s.fill.setAttribute('stroke-dashoffset', '0');
      state.active = false;
      if (state.cur === strokes.length - 1) { celebrate(); return; }
      sfx.ding();
      state.cur += 1; state.idx = 0;
      placeDot(); demo();
    };

    wrap.addEventListener('pointerdown', (e) => {
      if (!this._trace || state.active) return; // ignore a second finger mid-stroke
      warmUp();
      const p = toSvg(e);
      if (isNearStart([cs().points[Math.min(state.idx, cs().points.length - 1)]], p, START_RADIUS_PX / scale())) {
        state.active = true;
        try { wrap.setPointerCapture(e.pointerId); } catch {}
        sfx.bubble();
      }
    });
    wrap.addEventListener('pointermove', (e) => {
      if (!state.active || !this._trace) return;
      const before = state.idx;
      state.idx = advance(cs().points, state.idx, toSvg(e), TOLERANCE_PX / scale());
      if (state.idx !== before) {
        updateFill(); placeDot();
        if (Math.floor(state.idx / 8) !== Math.floor(before / 8)) sfx.bubble();
        if (isComplete(cs().points, state.idx, 2)) finishStroke();
      }
    });
    const lift = () => { state.active = false; if (this._trace) placeDot(); };
    wrap.addEventListener('pointerup', lift);
    wrap.addEventListener('pointercancel', lift);

    onActivate(replay, () => { warmUp(); demo(); speak(t('traceFollow'), getLang()); });

    placeDot();
    speak(`${letter.name[getLang()]} — ${t('traceFollow')}`, getLang());
    demo();
  },

  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._container = null;
    this._trace = null;
    try { speechSynthesis.cancel(); } catch {}
  },
};
