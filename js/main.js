import { ANIMALS } from './core/animals.js';
import { hub } from './hub.js';
import { tapSea } from './games/tap-sea.js';
import { shadowMatch } from './games/shadow-match.js';
import { countTap } from './games/count-tap.js';

const scenes = {};
let current = null;

export function registerScene(name, scene) { scenes[name] = scene; }

export function go(name) {
  const app = document.getElementById('app');
  if (!scenes[name]) { console.error(`go(): unknown scene "${name}"`); return; }
  if (current && current.destroy) current.destroy();
  app.innerHTML = '';
  current = scenes[name];
  current.init(app, go);
}

registerScene('hub', hub);

function stubScene(label) {
  return {
    init(container, go) {
      const d = document.createElement('div');
      d.style.cssText = 'color:#fff;text-align:center;padding-top:40vh;font-size:24px;';
      d.textContent = label + ' — coming soon';
      const back = document.createElement('button');
      back.className = 'btn btn-round';
      back.textContent = '🏠';
      back.style.cssText += 'position:absolute;top:12px;left:12px;';
      back.addEventListener('pointerup', () => go('hub'));
      container.append(d, back);
    },
    destroy() {},
  };
}
registerScene('tap-sea', tapSea);
registerScene('shadow-match', shadowMatch);
registerScene('count-tap', countTap);
registerScene('listen-find', stubScene('เสียงเรียกใคร'));

registerScene('preview', {
  init(container) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:24px;justify-content:center;align-items:center;padding:40px;height:100%;overflow:auto;';
    for (const a of ANIMALS) {
      const cell = document.createElement('div');
      cell.style.cssText = 'text-align:center;color:#fff;font-weight:700;';
      const svg = a.make(220);
      svg.classList.add('float');
      cell.appendChild(svg);
      const label = document.createElement('div');
      label.textContent = `${a.th} · ${a.en}`;
      cell.appendChild(label);
      wrap.appendChild(cell);
    }
    container.appendChild(wrap);
  },
  destroy() {},
});

go(new URLSearchParams(location.search).get('preview') === 'animals' ? 'preview' : 'hub');
