import { t, getLang, toggleLang } from './core/i18n.js';
import { speak, sfx, isSoundOn, setSoundOn, warmUp, hasVoice } from './core/audio.js';
import { byId, playCry } from './core/animals.js';
import { onActivate } from './core/ui.js';

const GAME_BUTTONS = [
  { scene: 'tap-sea', nameKey: 'tapSea', ageKey: 'age12', animal: 'orca', color: '#79b8d6' },
  { scene: 'shadow-match', nameKey: 'shadowMatch', ageKey: 'age24', animal: 'seal', color: '#f2a25c' },
  { scene: 'count-tap', nameKey: 'countTap', ageKey: 'age35', animal: 'salmon', color: '#6ec99a' },
  { scene: 'listen-find', nameKey: 'listenFind', ageKey: 'age35', animal: 'puffin', color: '#c98ad9' },
];

export const hub = {
  _nav: null,
  _hold: null,
  _voiceCheck: null,
  init(container, go) {
    container.insertAdjacentHTML('beforeend', `
      <div class="topbar">
        <div class="title">🌊 <span data-i18n="appTitle"></span></div>
        <div class="controls">
          <button class="btn" id="lang-btn" style="padding:0 20px;font-weight:800;color:#155e8d;font-size:18px;min-height:56px;"><span class="hold-fill"></span><span class="lang-label"></span></button>
          <button class="btn btn-round" id="sound-btn"></button>
        </div>
      </div>
      <div id="hub-grid" style="position:absolute;inset:84px 4vw 3vh;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:2.5vh 2.5vw;"></div>
    `);
    const refreshText = () => {
      container.querySelector('[data-i18n="appTitle"]').textContent = t('appTitle');
      const langBtn = container.querySelector('#lang-btn');
      langBtn.querySelector('.lang-label').textContent = getLang() === 'th' ? 'ไทย → EN' : 'EN → ไทย';
      langBtn.setAttribute('aria-label', t('switchLang'));
      langBtn.title = t('switchLang');
      const soundBtn = container.querySelector('#sound-btn');
      soundBtn.textContent = isSoundOn() ? '🔊' : '🔇';
      soundBtn.setAttribute('aria-label', isSoundOn() ? t('muteSound') : t('unmuteSound'));
      container.querySelectorAll('[data-game-name]').forEach(n => { n.textContent = t(n.dataset.gameName); });
      container.querySelectorAll('[data-game-age]').forEach(n => { n.textContent = t(n.dataset.gameAge); });
    };

    const grid = container.querySelector('#hub-grid');
    GAME_BUTTONS.forEach((g, i) => {
      const btn = document.createElement('button');
      btn.className = 'btn game-tile';
      btn.style.borderBottom = `6px solid ${g.color}`;
      const zone = document.createElement('div');
      zone.className = 'animal-zone';
      const svg = byId(g.animal).make(150);
      svg.classList.add('float');
      // each animal swims and blinks on its own beat, like a real tidepool
      svg.style.animationDuration = `${3 + i * 0.35}s`;
      svg.style.animationDelay = `-${i * 0.9}s`;
      svg.style.setProperty('--blink-delay', `${i * 1.1}s`);
      zone.appendChild(svg);
      btn.appendChild(zone);
      btn.insertAdjacentHTML('beforeend', `
        <div class="game-name" data-game-name="${g.nameKey}"></div>
        <div class="game-age" data-game-age="${g.ageKey}"></div>
      `);
      const launch = () => {
        if (hub._nav) return; // already heading into a game
        warmUp();
        playCry(byId(g.animal));
        svg.classList.remove('float');
        svg.style.animationDuration = ''; // stagger values are for float only
        svg.style.animationDelay = '';
        svg.classList.add('boing');
        speak(t(g.nameKey), getLang());
        hub._nav = setTimeout(() => go(g.scene), 650);
      };
      onActivate(btn, launch);
      grid.appendChild(btn);
    });

    // language switch: press-and-hold so little hands can't flip it by accident
    // (keyboard Enter/Space still toggles instantly — that's a parent at a PC)
    const langBtn = container.querySelector('#lang-btn');
    const doToggleLang = () => {
      toggleLang(); refreshText();
      speak(t('appTitle'), getLang());
    };
    const cancelHold = () => {
      langBtn.classList.remove('holding');
      clearTimeout(hub._hold);
      hub._hold = null;
    };
    langBtn.addEventListener('pointerdown', () => {
      warmUp();
      langBtn.classList.add('holding');
      hub._hold = setTimeout(() => { cancelHold(); doToggleLang(); }, 700);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => langBtn.addEventListener(ev, cancelHold));
    langBtn.addEventListener('click', (e) => { if (e.detail === 0) { warmUp(); doToggleLang(); } });

    const toggleSound = () => {
      warmUp(); setSoundOn(!isSoundOn()); refreshText();
      if (isSoundOn()) sfx.ding();
    };
    onActivate(container.querySelector('#sound-btn'), toggleSound);
    refreshText();

    // Parent-facing note when the device has no Thai voice installed (e.g.
    // Chrome on Windows without the Thai speech pack): Thai prompts would be
    // silent. Checked after a delay so the async voice list has loaded.
    hub._voiceCheck = setTimeout(() => {
      if (getLang() === 'th' && !hasVoice('th') && !container.querySelector('#voice-note')) {
        const note = document.createElement('div');
        note.id = 'voice-note';
        note.textContent = 'เครื่องนี้ยังไม่มีเสียงพูดภาษาไทย เกมจะพูดเฉพาะภาษาอังกฤษ — ลองเปิดด้วย Microsoft Edge หรือ iPad ซึ่งมีเสียงไทยในตัว';
        note.style.cssText = 'position:absolute;bottom:4px;width:100%;text-align:center;color:#dceefb;font-size:13px;text-shadow:0 1px 3px rgba(0,30,60,.6);pointer-events:none;';
        container.appendChild(note);
      }
    }, 1500);
  },
  destroy() {
    clearTimeout(this._nav);
    this._nav = null;
    clearTimeout(this._hold);
    this._hold = null;
    clearTimeout(this._voiceCheck);
    this._voiceCheck = null;
    try { speechSynthesis.cancel(); } catch {}
  },
};
