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
    // Task 6
  },

  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._container = null;
    this._trace = null;
    try { speechSynthesis.cancel(); } catch {}
  },
};
