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

// Placeholder hub (replaced in Task 6)
registerScene('hub', {
  init(container) {
    const h = document.createElement('h1');
    h.textContent = 'ทะเลอลาสก้าของหนู 🌊';
    h.style.cssText = 'color:#fff;text-align:center;padding-top:40vh;';
    container.appendChild(h);
  },
  destroy() {},
});

go('hub');
