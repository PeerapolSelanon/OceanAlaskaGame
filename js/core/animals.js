import { el } from './svg.js';
import { sfx } from './audio.js';

function svgRoot(vbW, vbH, width) {
  const svg = el('svg', { viewBox: `0 0 ${vbW} ${vbH}`, width, height: Math.round(width * vbH / vbW), class: 'animal' });
  return svg;
}

function eye(svg, cx, cy, r, { pupil = '#0c0f13', highlight = true } = {}) {
  const g = el('g', { class: 'eye-blink' }, svg);
  el('circle', { cx, cy, r, fill: pupil }, g);
  if (highlight) el('circle', { cx: cx + r * 0.35, cy: cy - r * 0.35, r: r * 0.35, fill: '#fff' }, g);
  return g;
}

const ORCA = {
  id: 'orca', th: 'วาฬเพชฌฆาต', en: 'Orca',
  make(w) {
    const s = svgRoot(320, 180, w);
    el('path', { d: 'M 128 104 C 142 114, 148 130, 142 144 C 130 136, 122 120, 122 106 Z', fill: '#0a0d12', opacity: '.75' }, s);
    el('path', { d: 'M 24 96 C 30 74, 52 60, 88 54 C 130 47, 178 50, 214 64 C 232 71, 246 80, 252 90 C 258 96, 256 102, 248 105 C 220 114, 170 124, 120 124 C 76 124, 40 114, 28 104 C 22 100, 21 98, 24 96 Z', fill: '#1d242e' }, s);
    el('path', { d: 'M 246 94 C 260 78, 276 68, 294 63 C 285 76, 282 87, 286 94 C 282 101, 284 112, 294 125 C 277 119, 259 107, 248 102 Z', fill: '#141a22' }, s);
    el('path', { d: 'M 138 52 C 137 26, 146 8, 161 1 C 158 20, 162 38, 172 53 Z', fill: '#141a22' }, s);
    el('path', { d: 'M 26 98 C 44 84, 70 79, 96 85 C 118 90, 132 99, 136 109 C 138 114, 134 118, 124 119 C 92 122, 54 116, 34 106 C 26 102, 24 100, 26 98 Z', fill: '#eef3f7' }, s);
    el('path', { d: 'M 184 110 C 196 101, 212 98, 224 102 C 218 112, 202 119, 188 117 C 184 115, 182 112, 184 110 Z', fill: '#eef3f7' }, s);
    el('path', { d: 'M 171 59 C 185 55, 200 58, 209 66 C 200 73, 185 75, 173 70 C 169 66, 169 61, 171 59 Z', fill: '#a8b7c4', opacity: '.8' }, s);
    el('ellipse', { cx: 82, cy: 73, rx: 17, ry: 5.5, fill: '#f2f7fa', transform: 'rotate(-17 82 73)' }, s);
    el('path', { d: 'M 27 99 Q 58 108 94 101', stroke: '#0a0d12', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 106 108 C 120 122, 122 144, 104 158 C 92 144, 92 122, 99 106 Z', fill: '#141a22' }, s);
    eye(s, 72, 87, 4.5);
    return s;
  },
  cry() { return [['boing'], ['ding']]; },
};

const HUMPBACK = {
  id: 'humpback', th: 'วาฬหลังค่อม', en: 'Humpback Whale',
  make(w) {
    const s = svgRoot(320, 180, w);
    el('path', { d: 'M 20 100 C 30 70, 70 52, 120 50 C 180 48, 240 64, 268 84 C 280 92, 278 100, 266 104 C 220 118, 140 126, 80 118 C 45 113, 18 110, 20 100 Z', fill: '#4a6275' }, s);
    el('path', { d: 'M 262 92 C 274 76, 288 66, 304 60 C 297 74, 295 84, 298 92 C 295 99, 297 110, 305 122 C 289 116, 272 104, 263 100 Z', fill: '#3c5163' }, s);
    el('path', { d: 'M 182 56 C 188 46, 198 41, 206 41 C 202 49, 200 55, 200 59 Z', fill: '#3c5163' }, s);
    // throat grooves
    el('path', { d: 'M 24 104 C 60 118, 110 122, 150 118', stroke: '#5d7689', 'stroke-width': 2, fill: 'none', opacity: '.8' }, s);
    el('path', { d: 'M 28 110 C 64 122, 110 126, 146 122', stroke: '#5d7689', 'stroke-width': 2, fill: 'none', opacity: '.6' }, s);
    // long white pectoral fin
    el('path', { d: 'M 120 110 C 142 122, 168 130, 192 128 C 178 140, 146 144, 124 132 C 116 126, 114 116, 120 110 Z', fill: '#dde7ee' }, s);
    // head tubercles
    [[36, 84], [48, 76], [62, 70], [78, 65]].forEach(([cx, cy]) => el('circle', { cx, cy, r: 2.2, fill: '#3c5163' }, s));
    eye(s, 58, 94, 4.5);
    el('path', { d: 'M 22 102 Q 50 112 84 108', stroke: '#33485a', 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round' }, s);
    return s;
  },
  cry() { return [['boing'], ['bubble']]; },
};

const SEAL = {
  id: 'seal', th: 'แมวน้ำ', en: 'Harbor Seal',
  make(w) {
    const s = svgRoot(300, 160, w);
    el('path', { d: 'M 232 86 C 248 72, 264 64, 280 62 C 272 74, 268 84, 270 92 C 268 99, 271 110, 280 122 C 264 118, 247 106, 236 96 Z', fill: '#7d8b98' }, s);
    el('path', { d: 'M 34 88 C 32 64, 54 46, 92 42 C 138 38, 192 52, 226 74 C 242 84, 248 94, 240 100 C 216 114, 158 122, 108 118 C 66 114, 38 104, 34 88 Z', fill: '#97a5b2' }, s);
    el('path', { d: 'M 50 100 C 100 112, 170 110, 220 96 C 200 108, 140 116, 90 112 C 66 110, 54 106, 50 100 Z', fill: '#dde4ea' }, s);
    [[110, 56, -14], [132, 50, 8], [152, 60, -6], [176, 68, 12], [122, 70, -10], [144, 78, 6], [96, 64, -18], [168, 86, 0]]
      .forEach(([cx, cy, rot]) => el('ellipse', { cx, cy, rx: 4.5, ry: 2.8, fill: '#5b6873', opacity: '.75', transform: `rotate(${rot} ${cx} ${cy})` }, s));
    el('path', { d: 'M 112 104 C 122 114, 124 128, 112 138 C 102 130, 100 114, 104 102 Z', fill: '#76838f' }, s);
    eye(s, 64, 68, 8, { pupil: '#1d1611' });
    el('path', { d: 'M 40 76 C 42 73, 46 73, 48 76 C 47 80, 41 80, 40 76 Z', fill: '#26201b' }, s);
    el('path', { d: 'M 44 79 Q 44 86 36 88 M 44 79 Q 47 86 55 88', stroke: '#525f6b', 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 36 80 Q 22 77 10 79 M 36 83 Q 22 83 11 87 M 37 86 Q 25 89 15 95 M 51 80 Q 62 78 71 80 M 51 83 Q 63 84 72 88', stroke: '#f2f4f0', 'stroke-width': 1, fill: 'none', 'stroke-linecap': 'round', opacity: '.85' }, s);
    return s;
  },
  cry() { return [['boing'], ['pop']]; },
};

const OTTER = {
  id: 'otter', th: 'นากทะเล', en: 'Sea Otter',
  make(w) {
    const s = svgRoot(280, 160, w);
    // floating on its back
    el('path', { d: 'M 40 104 C 50 84, 90 76, 140 78 C 190 80, 226 88, 242 100 C 250 106, 246 114, 232 116 C 186 124, 90 126, 54 118 C 42 114, 36 110, 40 104 Z', fill: '#6b4a32' }, s);
    el('path', { d: 'M 70 92 C 110 84, 175 86, 215 96 C 200 102, 120 104, 84 100 C 76 98, 70 95, 70 92 Z', fill: '#8a6244' }, s);
    // tail
    el('path', { d: 'M 238 104 C 254 98, 266 100, 272 106 C 264 112, 250 114, 240 112 Z', fill: '#5a3d28' }, s);
    // paws resting on belly
    el('ellipse', { cx: 128, cy: 84, rx: 9, ry: 6, fill: '#5a3d28' }, s);
    el('ellipse', { cx: 154, cy: 82, rx: 9, ry: 6, fill: '#5a3d28' }, s);
    // head (lighter face)
    el('ellipse', { cx: 52, cy: 66, rx: 27, ry: 23, fill: '#6b4a32' }, s);
    el('circle', { cx: 32, cy: 50, r: 7, fill: '#5a3d28' }, s);
    el('circle', { cx: 72, cy: 48, r: 7, fill: '#5a3d28' }, s);
    el('ellipse', { cx: 50, cy: 72, rx: 19, ry: 15, fill: '#d9c4a8' }, s);
    el('path', { d: 'M 44 70 C 46 67, 52 67, 54 70 C 53 74, 45 74, 44 70 Z', fill: '#332518' }, s);
    el('path', { d: 'M 49 73 Q 49 79 42 80 M 49 73 Q 52 79 58 80', stroke: '#7a6248', 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 38 74 Q 26 72 16 74 M 38 77 Q 27 79 18 83 M 60 74 Q 70 72 79 74', stroke: '#f2ead9', 'stroke-width': 1.1, fill: 'none', 'stroke-linecap': 'round', opacity: '.9' }, s);
    eye(s, 40, 62, 4.5, { pupil: '#241a10' });
    eye(s, 62, 61, 4.5, { pupil: '#241a10' });
    return s;
  },
  cry() { return [['pop'], ['bubble']]; },
};

const SEALION = {
  id: 'sealion', th: 'สิงโตทะเล', en: 'Sea Lion',
  make(w) {
    const s = svgRoot(280, 170, w);
    el('path', { d: 'M 236 96 C 250 84, 264 78, 276 78 C 268 88, 266 96, 268 102 C 266 108, 268 118, 276 128 C 262 124, 248 114, 240 106 Z', fill: '#7d5a38' }, s);
    el('path', { d: 'M 30 90 C 40 60, 80 44, 120 46 C 170 48, 215 70, 240 92 C 250 101, 248 108, 236 110 C 200 118, 120 122, 70 112 C 45 107, 26 100, 30 90 Z', fill: '#9c7148' }, s);
    el('path', { d: 'M 46 100 C 90 112, 160 112, 210 100 C 190 110, 120 116, 76 110 C 58 107, 48 104, 46 100 Z', fill: '#c9a273' }, s);
    el('path', { d: 'M 110 104 C 124 120, 124 142, 104 154 C 94 138, 96 118, 102 102 Z', fill: '#7d5a38' }, s);
    // ear flap (distinguishes sea lion from seal)
    el('path', { d: 'M 74 56 C 77 47, 85 44, 92 46 C 90 54, 84 61, 77 63 C 74 61, 72 58, 74 56 Z', fill: '#54361d' }, s);
    el('ellipse', { cx: 42, cy: 78, rx: 14, ry: 10, fill: '#c9a273' }, s);
    el('path', { d: 'M 32 72 C 34 69, 39 69, 41 72 C 40 76, 33 76, 32 72 Z', fill: '#33271a' }, s);
    el('path', { d: 'M 37 76 Q 37 83 30 84 M 37 76 Q 40 83 47 84', stroke: '#6b573e', 'stroke-width': 1.4, fill: 'none', 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 28 78 Q 16 76 8 78 M 29 82 Q 17 84 10 88 M 52 78 Q 62 76 70 78', stroke: '#f2ead9', 'stroke-width': 1.1, fill: 'none', 'stroke-linecap': 'round', opacity: '.9' }, s);
    eye(s, 60, 66, 6.5, { pupil: '#241a10' });
    return s;
  },
  cry() { return [['boing'], ['cheer']]; },
};

const PUFFIN = {
  id: 'puffin', th: 'นกพัฟฟิน', en: 'Puffin',
  make(w) {
    const s = svgRoot(150, 170, w);
    el('path', { d: 'M 75 18 C 105 18, 122 44, 122 84 C 122 120, 104 146, 75 146 C 46 146, 28 120, 28 84 C 28 44, 45 18, 75 18 Z', fill: '#15191f' }, s);
    el('path', { d: 'M 75 62 C 94 62, 105 82, 105 104 C 105 126, 92 142, 75 142 C 58 142, 45 126, 45 104 C 45 82, 56 62, 75 62 Z', fill: '#f2f5f7' }, s);
    el('ellipse', { cx: 60, cy: 48, rx: 26, ry: 23, fill: '#e8edf1' }, s);
    el('path', { d: 'M 38 42 C 24 44, 10 52, 4 62 C 12 68, 26 70, 36 66 C 42 62, 44 50, 38 42 Z', fill: '#f07f1d' }, s);
    el('path', { d: 'M 38 42 C 32 43, 24 46, 18 50 L 14 47 C 21 43, 30 41, 37 41 Z', fill: '#8a97a3' }, s);
    el('path', { d: 'M 35 45 C 28 47, 18 52, 12 58', stroke: '#c93f12', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 112 76 C 124 86, 128 104, 122 122 C 110 116, 102 100, 102 86 Z', fill: '#0d1116' }, s);
    el('path', { d: 'M 58 144 L 52 162 L 60 158 L 64 164 L 68 158 L 74 162 L 66 144 Z', fill: '#f07f1d' }, s);
    el('path', { d: 'M 84 144 L 80 162 L 87 157 L 91 163 L 95 157 L 100 160 L 92 144 Z', fill: '#f07f1d' }, s);
    el('circle', { cx: 64, cy: 44, r: 8.5, fill: 'none', stroke: '#e8541f', 'stroke-width': 1.8 }, s);
    eye(s, 64, 44, 6);
    return s;
  },
  cry() { return [['pop'], ['ding']]; },
};

const SALMON = {
  id: 'salmon', th: 'ปลาแซลมอน', en: 'Salmon',
  make(w) {
    const s = svgRoot(240, 120, w);
    el('path', { d: 'M 14 58 C 32 32, 74 20, 114 24 C 154 28, 184 40, 200 56 C 186 70, 154 82, 114 84 C 74 86, 32 80, 14 58 Z', fill: '#9cb2c2' }, s);
    el('path', { d: 'M 18 62 C 40 76, 80 82, 120 80 C 90 86, 45 82, 18 62 Z', fill: '#dfe8ee' }, s);
    el('path', { d: 'M 198 56 C 210 44, 222 36, 232 32 C 227 42, 226 52, 228 58 C 226 64, 227 72, 232 82 C 221 78, 209 68, 198 60 Z', fill: '#5d7990' }, s);
    el('path', { d: 'M 96 26 C 102 14, 116 8, 128 8 C 124 18, 122 24, 122 28 Z', fill: '#5d7990' }, s);
    el('path', { d: 'M 70 76 C 72 86, 68 96, 58 102 C 56 92, 60 82, 64 75 Z', fill: '#7d96aa' }, s);
    el('ellipse', { cx: 120, cy: 60, rx: 60, ry: 9, fill: '#e08a8a', opacity: '.4' }, s);
    el('path', { d: 'M 54 34 C 64 44, 66 62, 58 76', stroke: '#54707f', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round' }, s);
    [[84, 34], [104, 30], [126, 32], [148, 36], [94, 42], [138, 42]].forEach(([cx, cy]) => el('circle', { cx, cy, r: 1.7, fill: '#33485c' }, s));
    el('path', { d: 'M 14 58 Q 24 62 34 62', stroke: '#54707f', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, s);
    eye(s, 38, 48, 5, { pupil: '#10151a' });
    return s;
  },
  cry() { return [['bubble'], ['pop']]; },
};

const CRAB = {
  id: 'crab', th: 'ปูอลาสก้า', en: 'King Crab',
  make(w) {
    const s = svgRoot(240, 180, w);
    const leg = (d) => el('path', { d, stroke: '#c14a24', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
    leg('M 80 95 L 45 78 L 22 92');
    leg('M 78 105 L 40 105 L 18 122');
    leg('M 82 115 L 50 132 L 32 154');
    leg('M 160 95 L 195 78 L 218 92');
    leg('M 162 105 L 200 105 L 222 122');
    leg('M 158 115 L 190 132 L 208 154');
    // claw arms
    el('path', { d: 'M 98 72 L 74 48', stroke: '#c14a24', 'stroke-width': 8, 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 142 72 L 166 48', stroke: '#c14a24', 'stroke-width': 8, 'stroke-linecap': 'round' }, s);
    el('path', { d: 'M 74 48 C 62 36, 62 24, 72 16 C 76 26, 82 32, 90 34 C 84 42, 78 46, 74 48 Z', fill: '#d9542b' }, s);
    el('path', { d: 'M 166 48 C 178 36, 178 24, 168 16 C 164 26, 158 32, 150 34 C 156 42, 162 46, 166 48 Z', fill: '#d9542b' }, s);
    // carapace with spiky edge
    el('path', { d: 'M 120 58 C 146 58, 166 74, 169 98 C 166 122, 146 136, 120 136 C 94 136, 74 122, 71 98 C 74 74, 94 58, 120 58 Z', fill: '#d9542b' }, s);
    el('path', { d: 'M 88 64 L 92 54 L 98 62 M 110 58 L 116 48 L 122 58 M 134 60 L 142 52 L 146 62', stroke: '#d9542b', 'stroke-width': 5, fill: 'none', 'stroke-linejoin': 'round' }, s);
    el('ellipse', { cx: 120, cy: 112, rx: 34, ry: 14, fill: '#e8744a', opacity: '.7' }, s);
    // eye stalks
    el('path', { d: 'M 108 62 L 103 46 M 132 62 L 137 46', stroke: '#c14a24', 'stroke-width': 4, 'stroke-linecap': 'round' }, s);
    eye(s, 103, 44, 6);
    eye(s, 137, 44, 6);
    el('path', { d: 'M 110 84 Q 120 92 130 84', stroke: '#8f3417', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }, s);
    return s;
  },
  cry() { return [['pop'], ['pop']]; },
};

export const ANIMALS = [ORCA, HUMPBACK, SEAL, OTTER, SEALION, PUFFIN, SALMON, CRAB];
export function byId(id) { return ANIMALS.find(a => a.id === id); }

export function playCry(animal) {
  const steps = animal.cry();
  steps.forEach(([name], i) => setTimeout(() => sfx[name] && sfx[name](), i * 180));
}
