// js/games/spell-word.js
import { byId, playCry } from '../core/animals.js';
import { SPELL_WORDS } from './data/spell-words.js';
import { speak, sfx, warmUp } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { get, set } from '../core/settings.js';
import { onActivate } from '../core/ui.js';
import { confetti } from '../core/confetti.js';
import { mulberry32 } from './logic/round-utils.js';
import { letterBank, pickWord, isSolved } from './logic/spell-logic.js';

export const spellWord = {
  _container: null,
  _timers: [],
  _drag: null,
  _locked: false,
  _done: null,
  _last: null,
  _rng: null,
  _word: null,
  _slots: null,
  _clueArt: null,

  init(container, go) {
    this._container = container;
    this._timers = [];
    this._drag = null;
    this._locked = false;
    this._done = new Set(get('spellDone.en', []));
    this._last = null;
    this._rng = mulberry32((Date.now() & 0xffffffff) >>> 0);
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" aria-label="${t('back')}" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <button class="btn btn-round" id="hear-btn" aria-label="${t('listenAgain')}" style="position:absolute;top:12px;right:12px;z-index:10;">🔊</button>
      <div id="prompt" style="position:absolute;top:16px;width:100%;text-align:center;color:var(--ink-deep);font-size:clamp(20px,3.4vw,32px);font-weight:800;text-shadow:var(--text-halo);pointer-events:none;"></div>
      <div id="clue" style="position:absolute;top:60px;left:0;right:0;height:32vh;display:flex;align-items:center;justify-content:center;"></div>
      <div id="slot-row" style="position:absolute;top:48vh;left:0;right:0;display:flex;justify-content:center;gap:1.5vw;flex-wrap:wrap;"></div>
      <div id="bank-row" style="position:absolute;bottom:4vh;left:0;right:0;display:flex;justify-content:center;gap:1.5vw;flex-wrap:wrap;"></div>
    `);
    onActivate(container.querySelector('#back-btn'), () => go('hub'));
    onActivate(container.querySelector('#hear-btn'), () => this._sayWord());
    this._newRound();
  },

  _sayWord() {
    if (!this._container || !this._word) return;
    speak(this._word.word, 'en');
  },

  _newRound() {
    this._locked = false;
    this._drag = null;
    const c = this._container;
    const entry = pickWord(SPELL_WORDS, this._done, this._last, this._rng);
    this._word = entry;
    this._last = entry;
    const word = entry.word;

    const clue = c.querySelector('#clue');
    clue.innerHTML = '';
    const size = Math.min(window.innerHeight * 0.28, window.innerWidth * 0.4);
    const art = byId(entry.animal).make(size);
    art.classList.add('float');
    clue.appendChild(art);
    this._clueArt = art;

    c.querySelector('#prompt').textContent = t('spellPrompt');

    const slotRow = c.querySelector('#slot-row');
    slotRow.innerHTML = '';
    this._slots = [];
    for (const ch of word) {
      const slot = document.createElement('div');
      slot.className = 'spell-slot';
      slot.dataset.letter = ch;
      const ghost = document.createElement('span');
      ghost.className = 'ghost';
      ghost.textContent = ch;
      slot.appendChild(ghost);
      slotRow.appendChild(slot);
      this._slots.push({ el: slot, letter: ch, filled: false });
    }

    const bankRow = c.querySelector('#bank-row');
    bankRow.innerHTML = '';
    for (const ch of letterBank(word, this._rng)) {
      const tile = document.createElement('button');
      tile.className = 'btn spell-tile';
      tile.dataset.letter = ch;
      tile.textContent = ch;
      tile.style.touchAction = 'none';
      tile.addEventListener('pointerdown', (e) => this._startDrag(e, tile));
      bankRow.appendChild(tile);
    }

    this._sayWord();
  },

  _startDrag(e, tile) {
    if (this._drag || this._locked || tile.dataset.placed) return; // one drag; ignore 2nd finger
    e.preventDefault();
    warmUp();
    try { tile.setPointerCapture(e.pointerId); } catch { /* synthetic events lack a live pointer */ }
    const rect = tile.getBoundingClientRect();
    this._drag = { tile, dx: e.clientX - rect.left, dy: e.clientY - rect.top, homeRect: rect };
    tile.style.zIndex = '20';
    tile.style.position = 'fixed';
    tile.style.left = rect.left + 'px';
    tile.style.top = rect.top + 'px';
    tile.style.transition = 'none';
    sfx.bubble();
    const move = (ev) => this._moveDrag(ev);
    const up = (ev) => {
      tile.removeEventListener('pointermove', move);
      tile.removeEventListener('pointerup', up);
      tile.removeEventListener('pointercancel', up);
      this._endDrag();
    };
    tile.addEventListener('pointermove', move);
    tile.addEventListener('pointerup', up);
    tile.addEventListener('pointercancel', up);
  },

  _moveDrag(e) {
    if (!this._drag) return;
    const { tile, dx, dy, homeRect } = this._drag;
    tile.style.transform = `translate3d(${e.clientX - dx - homeRect.left}px, ${e.clientY - dy - homeRect.top}px, 0)`;
  },

  _endDrag() {
    const drag = this._drag;
    this._drag = null;
    if (!drag) return;
    const { tile } = drag;
    const r = tile.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const slot = this._slots.find((s) => {
      if (s.filled || s.letter !== tile.dataset.letter) return false;
      const b = s.el.getBoundingClientRect();
      return cx > b.left && cx < b.right && cy > b.top && cy < b.bottom;
    });
    if (slot) {
      slot.filled = true;
      slot.el.classList.add('filled');
      tile.remove(); // ghost letter turns solid; tile no longer needed
      sfx.ding();
      if (isSolved(this._slots)) this._win();
    } else {
      tile.style.transition = 'transform .35s ease'; // bounce home, no scolding
      tile.style.transform = 'translate3d(0, 0, 0)';
    }
  },

  _win() {
    this._locked = true;
    this._clueArt.classList.remove('float');
    this._clueArt.classList.add('animal', 'boing');
    sfx.cheer();
    this._timers.push(...confetti(this._container));
    speak(this._word.word, 'en');
    speak(t('great'), getLang(), { interrupt: false });
    playCry(byId(this._word.animal));
    this._done.add(this._word.word);
    set('spellDone.en', [...this._done]);
    this._timers.push(setTimeout(() => { if (this._container) this._newRound(); }, 2600));
  },

  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._container = null;
    this._drag = null;
    try { speechSynthesis.cancel(); } catch {}
  },
};
