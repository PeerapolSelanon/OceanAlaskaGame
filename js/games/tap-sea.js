import { ANIMALS, byId, playCry } from '../core/animals.js';
import { speakName, sfx } from '../core/audio.js';
import { getLang, t } from '../core/i18n.js';
import { onActivate } from '../core/ui.js';

const MAX_ON_SCREEN = 6;

export const tapSea = {
  _container: null,
  _timers: [],
  init(container, go) {
    this._timers = [];
    this._container = container;
    container.insertAdjacentHTML('beforeend', `
      <button class="btn btn-round" id="back-btn" aria-label="${t('back')}" style="position:absolute;top:12px;left:12px;z-index:10;">🏠</button>
      <div id="sea" style="position:absolute;inset:0;"></div>
      <div id="hint" style="position:absolute;bottom:4vh;width:100%;text-align:center;color:#fff;font-size:clamp(18px,3vw,28px);font-weight:700;text-shadow:0 2px 6px rgba(0,30,60,.5);pointer-events:none;">${t('tapAnywhere')}</div>
    `);
    // ambient bubbles
    for (let i = 0; i < 8; i++) {
      const b = document.createElement('div');
      const size = 6 + Math.random() * 14;
      b.className = 'bubble';
      b.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;bottom:-20px;animation-duration:${6 + Math.random() * 8}s;animation-delay:${Math.random() * 6}s;`;
      container.querySelector('#sea').appendChild(b);
    }
    onActivate(container.querySelector('#back-btn'), e => { e.stopPropagation(); go('hub'); });
    container.querySelector('#sea').addEventListener('pointerdown', (e) => this._onTap(e));
  },
  _onTap(e) {
    const sea = this._container.querySelector('#sea');
    const hint = this._container.querySelector('#hint');
    if (hint) hint.remove();
    const hitAnimal = e.target.closest('.animal-spot');
    if (hitAnimal) {
      const animal = byId(hitAnimal.dataset.id);
      if (!animal) return;
      const svg = hitAnimal.querySelector('svg');
      svg.classList.remove('boing'); void svg.getBoundingClientRect(); // restart animation
      svg.classList.add('boing');
      playCry(animal);
      speakName(animal, getLang());
      return;
    }
    // spawn a random animal at the tap point
    sfx.pop();
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const spot = document.createElement('div');
    spot.className = 'animal-spot';
    spot.dataset.id = animal.id;
    const size = Math.min(220, Math.max(140, window.innerWidth * 0.16));
    spot.style.cssText = `position:absolute;left:${e.clientX - size / 2}px;top:${e.clientY - size / 2}px;cursor:pointer;`;
    const svg = animal.make(size);
    svg.classList.add('pop-in');
    this._timers.push(setTimeout(() => { svg.classList.remove('pop-in'); svg.classList.add('float'); }, 500));
    spot.appendChild(svg);
    sea.appendChild(spot);
    speakName(animal, getLang());
    // keep at most MAX_ON_SCREEN: fade out the oldest (skip ones already fading)
    const spots = [...sea.querySelectorAll('.animal-spot:not([data-fading])')];
    for (let i = 0; i < spots.length - MAX_ON_SCREEN; i++) {
      const oldest = spots[i];
      oldest.dataset.fading = '1';
      oldest.querySelector('svg').classList.add('fade-out');
      this._timers.push(setTimeout(() => oldest.remove(), 800));
    }
  },
  destroy() {
    this._timers.forEach(clearTimeout);
    this._timers = [];
    this._container = null;
    try { speechSynthesis.cancel(); } catch {}
  },
};
