import { ANIMALS } from '../core/animals.js';
import { speak, sfx } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { makeQuestion, nextDifficulty } from './logic/count-logic.js';
import { confetti } from '../core/confetti.js';
import { onActivate } from '../core/ui.js';

export const countTap = {
  _container: null,
  _state: { maxN: 3, streak: 0, misses: 0 },
  _question: null,
  _locked: false,
  _timers: [],

  init(container, go) {
    this._container = container;
    this._state = { maxN: 3, streak: 0, misses: 0 };
    this._timers = [];
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" aria-label="${t('back')}" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <div id="prompt" style="position:absolute;top:14px;width:100%;text-align:center;color:#13496e;font-size:clamp(20px,3.4vw,32px);font-weight:800;text-shadow:0 1px 0 rgba(255,255,255,.35);pointer-events:none;"></div>
      <div id="field" style="position:absolute;inset:70px 2vw 130px;"></div>
      <div id="choices" style="position:absolute;bottom:2vh;width:100%;display:flex;justify-content:center;gap:4vw;"></div>
    `);
    onActivate(container.querySelector('#back-btn'), () => go('hub'));
    this._newRound();
  },

  _newRound() {
    const c = this._container;
    this._locked = false;
    this._question = makeQuestion(this._state.maxN);
    this._animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const animal = this._animal;

    const promptText = getLang() === 'th'
      ? `มี${animal.th}กี่ตัวนะ?` : `How many ${animal.en.toLowerCase()}s?`;
    c.querySelector('#prompt').textContent = promptText;
    speak(promptText, getLang());

    const field = c.querySelector('#field');
    field.innerHTML = '';
    const size = Math.min(150, Math.max(110, window.innerWidth * 0.11));
    // scatter without overlap: grid cells shuffled, place count animals
    const cols = 5, rows = 2;
    const cells = [];
    for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) cells.push([col, r]);
    cells.sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(this._question.count, cells.length); i++) {
      const [col, row] = cells[i];
      const spot = document.createElement('div');
      spot.style.cssText = `position:absolute;left:${col * 20 + 3 + Math.random() * 5}%;top:${row * 50 + 5 + Math.random() * 12}%;`;
      const svg = animal.make(size);
      svg.classList.add('float');
      svg.style.animationDelay = `${Math.random() * 2}s`;
      spot.appendChild(svg);
      field.appendChild(spot);
    }

    const choicesBox = c.querySelector('#choices');
    choicesBox.innerHTML = '';
    for (const n of this._question.choices) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = n;
      btn.style.cssText = 'width:110px;height:90px;font-size:44px;font-weight:800;color:#13496e;';
      onActivate(btn, () => this._answer(n, btn));
      choicesBox.appendChild(btn);
    }
  },

  _answer(n, btn) {
    if (this._locked) return;
    const correct = n === this._question.count;
    this._state = nextDifficulty(this._state, correct);
    if (correct) {
      this._locked = true;
      sfx.cheer();
      speak(t('great'), getLang());
      btn.style.background = 'linear-gradient(180deg,#a8e6c4,#6ec99a)';
      this._timers.push(...confetti(this._container));
      this._timers.push(setTimeout(() => this._newRound(), 1800));
    } else {
      sfx.wrongSoft();
      speak(t('tryAgain'), getLang());
      btn.classList.add('shake');
      this._timers.push(setTimeout(() => btn.classList.remove('shake'), 600));
    }
  },

  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._container = null;
    try { speechSynthesis.cancel(); } catch {}
  },
};
