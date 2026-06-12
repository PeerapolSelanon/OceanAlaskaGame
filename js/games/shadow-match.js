import { byId, ANIMALS, playCry } from '../core/animals.js';
import { speak, speakName, sfx } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { pickRound } from './logic/round-utils.js';
import { confetti } from '../core/confetti.js';

const ROUND_SIZE = 3;

export const shadowMatch = {
  _container: null,
  _drag: null,
  _remaining: 0,
  _timers: [],

  init(container, go) {
    this._container = container;
    this._drag = null;
    this._remaining = 0;
    this._timers = [];
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
    if (this._drag) return; // one drag at a time — second finger ignored
    if (piece.dataset.done) return;
    e.preventDefault();
    try { piece.setPointerCapture(e.pointerId); } catch { /* synthetic events in tests lack active pointer */ }
    const rect = piece.getBoundingClientRect();
    this._drag = { piece, dx: e.clientX - rect.left, dy: e.clientY - rect.top, homeRect: rect };
    piece.style.zIndex = '20';
    piece.style.position = 'fixed';
    piece.style.left = rect.left + 'px';
    piece.style.top = rect.top + 'px';
    sfx.bubble();
    const move = (ev) => this._moveDrag(ev);
    const up = (ev) => {
      piece.removeEventListener('pointermove', move);
      piece.removeEventListener('pointerup', up);
      piece.removeEventListener('pointercancel', up);
      this._endDrag(ev);
    };
    piece.addEventListener('pointermove', move);
    piece.addEventListener('pointerup', up);
    piece.addEventListener('pointercancel', up);
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
        this._timers.push(...confetti(this._container));
        this._timers.push(setTimeout(() => this._newRound(), 2200));
      }
    } else {
      // gentle bounce back, no negative feedback
      piece.style.transition = 'left .35s ease, top .35s ease';
      piece.style.left = homeRect.left + 'px';
      piece.style.top = homeRect.top + 'px';
      this._timers.push(setTimeout(() => {
        piece.style.cssText = 'touch-action:none;cursor:grab;position:relative;';
      }, 380));
    }
  },

  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._container = null;
    this._drag = null;
  },
};
