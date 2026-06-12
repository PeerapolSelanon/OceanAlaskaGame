import { t, getLang, toggleLang } from './core/i18n.js';
import { speak, sfx, isSoundOn, setSoundOn, warmUp } from './core/audio.js';
import { byId } from './core/animals.js';

const GAME_BUTTONS = [
  { scene: 'tap-sea', nameKey: 'tapSea', ageKey: 'age12', animal: 'orca', color: '#79b8d6' },
  { scene: 'shadow-match', nameKey: 'shadowMatch', ageKey: 'age24', animal: 'seal', color: '#f2a25c' },
  { scene: 'count-tap', nameKey: 'countTap', ageKey: 'age35', animal: 'salmon', color: '#6ec99a' },
  { scene: 'listen-find', nameKey: 'listenFind', ageKey: 'age35', animal: 'puffin', color: '#c98ad9' },
];

export const hub = {
  init(container, go) {
    container.insertAdjacentHTML('beforeend', `
      <div class="topbar">
        <div class="title">🌊 <span data-i18n="appTitle"></span></div>
        <div class="controls">
          <button class="btn" id="lang-btn" style="padding:0 20px;font-weight:800;color:#155e8d;font-size:18px;min-height:56px;"></button>
          <button class="btn btn-round" id="sound-btn"></button>
        </div>
      </div>
      <div id="hub-grid" style="position:absolute;inset:84px 4vw 3vh;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:2.5vh 2.5vw;"></div>
    `);
    const refreshText = () => {
      container.querySelector('[data-i18n="appTitle"]').textContent = t('appTitle');
      container.querySelector('#lang-btn').textContent = getLang() === 'th' ? 'ไทย → EN' : 'EN → ไทย';
      container.querySelector('#sound-btn').textContent = isSoundOn() ? '🔊' : '🔇';
      container.querySelectorAll('[data-game-name]').forEach(n => { n.textContent = t(n.dataset.gameName); });
      container.querySelectorAll('[data-game-age]').forEach(n => { n.textContent = t(n.dataset.gameAge); });
    };

    const grid = container.querySelector('#hub-grid');
    for (const g of GAME_BUTTONS) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.style.cssText = `display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-bottom:6px solid ${g.color};overflow:hidden;`;
      const svg = byId(g.animal).make(150);
      svg.classList.add('float');
      btn.appendChild(svg);
      btn.insertAdjacentHTML('beforeend', `
        <div data-game-name="${g.nameKey}" style="font-weight:800;font-size:clamp(16px,2.6vw,24px);color:#13496e;"></div>
        <div data-game-age="${g.ageKey}" style="font-size:clamp(11px,1.6vw,15px);color:#5b87a3;"></div>
      `);
      btn.addEventListener('pointerup', () => {
        warmUp(); sfx.pop();
        speak(t(g.nameKey), getLang());
        setTimeout(() => go(g.scene), 350);
      });
      grid.appendChild(btn);
    }

    container.querySelector('#lang-btn').addEventListener('pointerup', () => {
      toggleLang(); refreshText();
      speak(t('appTitle'), getLang());
    });
    container.querySelector('#sound-btn').addEventListener('pointerup', () => {
      setSoundOn(!isSoundOn()); refreshText();
      if (isSoundOn()) sfx.ding();
    });
    refreshText();
  },
  destroy() {},
};
