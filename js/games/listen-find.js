import { ANIMALS, byId, playCry } from '../core/animals.js';
import { speak, speakName, sfx } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { pickQuestion } from './logic/round-utils.js';
import { confetti } from '../core/confetti.js';

const CHOICES = 4;
const ANIMAL_IDS = ANIMALS.map(a => a.id);

export const listenFind = {
  _container: null,
  _target: null,
  _locked: false,
  _timers: [],

  init(container, go) {
    this._container = container;
    this._locked = false;
    this._target = null;
    this._timers = [];
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <button class="btn btn-round" id="repeat-btn" style="position:absolute;top:12px;right:12px;z-index:10;">🔊</button>
      <div id="prompt" style="position:absolute;top:16px;width:100%;text-align:center;color:#fff;font-size:clamp(20px,3.4vw,32px);font-weight:800;text-shadow:0 2px 6px rgba(0,30,60,.5);pointer-events:none;"></div>
      <div id="grid" style="position:absolute;inset:90px 6vw 6vh;display:grid;grid-template-columns:1fr 1fr;gap:3vh 4vw;justify-items:center;align-items:center;"></div>
    `);
    container.querySelector('#back-btn').addEventListener('pointerup', () => go('hub'));
    container.querySelector('#repeat-btn').addEventListener('pointerup', () => this._sayPrompt());
    this._newRound();
  },

  _sayPrompt() {
    if (!this._container || this._locked) return;
    const lang = getLang();
    const name = lang === 'th' ? this._target.th : this._target.en;
    const text = lang === 'th' ? `${name} อยู่ที่ไหนนะ?` : `${t('whereIs')} ${name}?`;
    this._container.querySelector('#prompt').textContent = text;
    speak(text, lang);
  },

  _newRound() {
    this._locked = false;
    const { target, choices } = pickQuestion(ANIMAL_IDS, CHOICES);
    this._target = byId(target);
    const grid = this._container.querySelector('#grid');
    grid.innerHTML = '';
    const size = Math.min(210, Math.max(140, window.innerWidth * 0.15));
    for (const id of choices) {
      const card = document.createElement('button');
      card.className = 'btn';
      card.dataset.id = id;
      card.style.cssText = 'padding:12px 20px;background:rgba(255,255,255,.92);';
      const svg = byId(id).make(size);
      svg.classList.add('float');
      svg.style.animationDelay = `${Math.random() * 2}s`;
      card.appendChild(svg);
      card.addEventListener('pointerup', () => this._answer(card));
      grid.appendChild(card);
    }
    this._sayPrompt();
  },

  _answer(card) {
    if (this._locked) return;
    const svg = card.querySelector('svg');
    if (card.dataset.id === this._target.id) {
      this._locked = true;
      sfx.cheer();
      svg.classList.add('boing');
      playCry(this._target);
      speakName(this._target, getLang());
      card.style.background = 'linear-gradient(180deg,#a8e6c4,#6ec99a)';
      this._timers.push(...confetti(this._container));
      this._timers.push(setTimeout(() => this._newRound(), 2400));
    } else {
      sfx.wrongSoft();
      svg.classList.remove('shake');
      void svg.getBoundingClientRect();
      svg.classList.add('shake');
      this._timers.push(setTimeout(() => this._sayPrompt(), 700));
    }
  },

  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._container = null;
  },
};
