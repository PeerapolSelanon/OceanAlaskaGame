// js/games/memory-match.js
import { byId, ANIMALS } from '../core/animals.js';
import { speak, speakName, sfx, warmUp } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { get, set } from '../core/settings.js';
import { onActivate } from '../core/ui.js';
import { confetti } from '../core/confetti.js';
import { mulberry32 } from './logic/round-utils.js';
import { dealBoard, levelPairs, nextLevel, isCleared } from './logic/memory-logic.js';

const POOL = ANIMALS.map(a => a.id);
// columns per card-count so cards stay chunky: 4→2col, 6→3, 8→4, 12→4
const COLS = { 4: 2, 6: 3, 8: 4, 12: 4 };

export const memoryMatch = {
  _container: null,
  _timers: [],
  _cards: null,
  _flipped: null,   // cards face-up awaiting match (max 2)
  _locked: false,
  _state: null,
  _rng: null,

  init(container, go) {
    this._container = container;
    this._timers = [];
    this._rng = mulberry32((Date.now() & 0xffffffff) >>> 0);
    this._state = { level: get('memoryLevel', 0), streak: 0 };
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" aria-label="${t('back')}" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <div id="prompt" style="position:absolute;top:16px;width:100%;text-align:center;color:var(--ink-deep);font-size:clamp(18px,3vw,28px);font-weight:800;text-shadow:var(--text-halo);pointer-events:none;"></div>
      <div id="memory-grid"></div>
    `);
    onActivate(container.querySelector('#back-btn'), () => go('hub'));
    this._newRound();
  },

  _newRound() {
    this._locked = false;
    this._flipped = [];
    const pairs = levelPairs(this._state.level);
    this._cards = dealBoard(POOL, pairs, this._rng);

    this._container.querySelector('#prompt').textContent = t('memoryPrompt');
    speak(t('memoryPrompt'), getLang());

    const grid = this._container.querySelector('#memory-grid');
    grid.innerHTML = '';
    const cols = COLS[this._cards.length] || 4;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.maxWidth = `${cols * 170}px`;
    grid.style.marginInline = 'auto';

    for (const card of this._cards) {
      const btn = document.createElement('button');
      btn.className = 'mem-card';
      btn.setAttribute('aria-label', t('memoryMatch'));
      const inner = document.createElement('div');
      inner.className = 'mem-inner';
      const back = document.createElement('div');
      back.className = 'mem-face mem-back';
      for (let i = 0; i < 3; i++) {
        const b = document.createElement('span');
        b.className = 'bub';
        const sz = 10 + Math.random() * 22;
        b.style.cssText = `width:${sz}px;height:${sz}px;left:${10 + Math.random() * 70}%;top:${10 + Math.random() * 70}%;`;
        back.appendChild(b);
      }
      const front = document.createElement('div');
      front.className = 'mem-face mem-front';
      front.appendChild(byId(card.id).make(140));
      inner.appendChild(back);
      inner.appendChild(front);
      btn.appendChild(inner);
      onActivate(btn, () => this._flip(card, btn));
      card.el = btn;
      grid.appendChild(btn);
    }
  },

  _flip(card, btn) {
    if (this._locked || card.matched || btn.classList.contains('up')) return;
    warmUp();
    btn.classList.add('up');
    sfx.pop();
    speak(byId(card.id)[getLang() === 'th' ? 'th' : 'en'], getLang());
    this._flipped.push({ card, el: btn });
    if (this._flipped.length === 2) this._resolve();
  },

  _resolve() {
    this._locked = true;
    const [a, b] = this._flipped;
    if (a.card.id === b.card.id) {
      // match — keep them up
      a.card.matched = b.card.matched = true;
      a.el.classList.add('matched');
      b.el.classList.add('matched');
      sfx.ding();
      speakName(byId(a.card.id), getLang());
      this._flipped = [];
      this._locked = false;
      if (isCleared(this._cards)) this._win();
    } else {
      // no scolding — just flip both back after a beat
      this._timers.push(setTimeout(() => {
        a.el.classList.remove('up');
        b.el.classList.remove('up');
        this._flipped = [];
        this._locked = false;
      }, 900));
    }
  },

  _win() {
    this._locked = true;
    sfx.cheer();
    speak(t('great'), getLang());
    this._timers.push(...confetti(this._container));
    this._state = nextLevel(this._state, true);
    set('memoryLevel', this._state.level);
    this._timers.push(setTimeout(() => { if (this._container) this._newRound(); }, 2000));
  },

  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._container = null;
    this._flipped = null;
    try { speechSynthesis.cancel(); } catch {}
  },
};
