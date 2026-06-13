import { byId } from './animals.js';
import { el } from './svg.js';

// Hub tile art: the game's mascot animal composed with a small gameplay cue
// (ripple, shadow, dotted letter, sound waves, numbers) so a parent can read
// what each game DOES at a glance. One shared 200x150 viewBox keeps every
// tile's art the same visual scale. Cue colors use the game's accent token
// (passed in via CSS style so var() resolves); animal colors stay baked in.

function outer() {
  return el('svg', { viewBox: '0 0 200 150', class: 'animal' });
}

// Nest the mascot's own SVG at a position/size inside the composite.
function placeAnimal(parent, id, x, y, w, { shadow = false } = {}) {
  const a = byId(id).make(w);
  a.setAttribute('x', x);
  a.setAttribute('y', y);
  if (shadow) { a.style.filter = 'brightness(0)'; a.style.opacity = '.28'; }
  parent.appendChild(a);
  return a;
}

function stroke(node, color, width, extra = '') {
  node.style.cssText = `fill:none;stroke:${color};stroke-width:${width};stroke-linecap:round;${extra}`;
  return node;
}

const SCENES = {
  // แตะทะเล: orca over expanding tap ripples
  'tap-sea'(s, color) {
    [[46, 15, .22], [31, 10, .38], [16, 6, .58]].forEach(([rx, ry, op]) =>
      stroke(el('ellipse', { cx: 104, cy: 124, rx, ry }, s), color, 3, `opacity:${op}`));
    el('circle', { cx: 104, cy: 124, r: 5 }, s).style.cssText = `fill:${color}`;
    placeAnimal(s, 'orca', 42, 8, 120);
  },
  // จับคู่เงา: the seal and its grey shadow, side by side
  'shadow-match'(s, color) {
    placeAnimal(s, 'seal', 4, 16, 104);
    placeAnimal(s, 'seal', 100, 82, 96, { shadow: true });
    // a soft dashed link hinting "drag onto its shadow"
    stroke(el('path', { d: 'M 78 70 Q 120 84 138 104' }, s), color, 3, 'stroke-dasharray:2 7;opacity:.7');
  },
  // วาดตามรอย: a big dotted letter A with the otter beside it
  'trace-letters'(s, color) {
    stroke(el('path', { d: 'M 80 110 L 104 30 L 128 110' }, s), color, 9, 'stroke-dasharray:1 9');
    stroke(el('path', { d: 'M 91 76 L 117 76' }, s), color, 9, 'stroke-dasharray:1 9');
    placeAnimal(s, 'otter', 4, 92, 80);
  },
  // เสียงเรียกใคร: the puffin calling, sound waves radiating right
  'listen-find'(s, color) {
    placeAnimal(s, 'puffin', 30, 8, 72);
    [[18, .7], [33, .45], [48, .25]].forEach(([r, op]) =>
      stroke(el('path', { d: `M 116 74 m 0 -${r} a ${r} ${r} 0 0 1 0 ${2 * r}` }, s), color, 4, `opacity:${op}`));
  },
  // นับสัตว์ทะเล: three little salmon counted 1-2-3
  'count-tap'(s) {
    [10, 72, 134].forEach((x, i) => {
      placeAnimal(s, 'salmon', x, 58, 56);
      const n = el('text', { x: x + 28, y: 42, 'text-anchor': 'middle' }, s);
      n.textContent = String(i + 1);
      n.style.cssText = 'font:800 26px system-ui,sans-serif;fill:var(--ink-deep)';
    });
  },
};

// g: { scene, animal, color } — color is a var(--token) string.
export function makeGameArt(g) {
  const draw = SCENES[g.scene];
  if (!draw) return byId(g.animal).make(150); // unknown game: plain mascot
  const s = outer();
  draw(s, g.color);
  return s;
}
