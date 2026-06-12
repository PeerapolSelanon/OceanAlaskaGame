import { get, set } from './settings.js';

let audioCtx = null;
let soundOn = get('soundOn', true);

export function isSoundOn() { return soundOn; }
export function setSoundOn(v) { soundOn = v; set('soundOn', v); if (!v) try { speechSynthesis.cancel(); } catch {} }

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// --- synthesized effects ---
function tone(freq, dur, { type = 'sine', vol = 0.25, when = 0, slide = 0 } = {}) {
  if (!soundOn) return;
  const c = ctx();
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  pop()    { tone(520, 0.12, { type: 'square', vol: 0.12, slide: 300 }); },
  ding()   { tone(880, 0.35, { vol: 0.2 }); tone(1320, 0.4, { vol: 0.1, when: 0.05 }); },
  bubble() { tone(300, 0.18, { vol: 0.15, slide: 500 }); },
  boing()  { tone(180, 0.25, { type: 'triangle', vol: 0.25, slide: 240 }); },
  cheer()  { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { vol: 0.2, when: i * 0.12 })); },
  wrongSoft() { tone(330, 0.2, { type: 'triangle', vol: 0.1, slide: -60 }); }, // gentle, not scary
};

// --- speech ---
// getVoices() is populated asynchronously in most browsers (empty until the
// 'voiceschanged' event), so keep a cache that refreshes when the list loads.
let voiceCache = [];
function refreshVoices() {
  try { voiceCache = speechSynthesis.getVoices(); } catch { voiceCache = []; }
}
if (typeof speechSynthesis !== 'undefined') {
  refreshVoices();
  try { speechSynthesis.addEventListener('voiceschanged', refreshVoices); }
  catch { speechSynthesis.onvoiceschanged = refreshVoices; }
}

// Pure helper (unit-tested): find a voice whose BCP-47 tag is the wanted
// language ('th' matches th-TH / th_TH / TH-TH, but not tr-TR).
export function pickVoiceFrom(voices, langCode) {
  const want = langCode.toLowerCase();
  return voices.find(v => {
    if (!v.lang) return false;
    const tag = v.lang.toLowerCase().replace('_', '-');
    return tag === want || tag.startsWith(want + '-');
  }) || null;
}

// True when the device actually has a voice for this language. Lets the UI
// warn that Thai speech needs a Thai voice installed (e.g. Chrome on Windows
// only sees voices installed in Windows settings).
export function hasVoice(lang) {
  if (voiceCache.length === 0) refreshVoices();
  return !!pickVoiceFrom(voiceCache, lang === 'th' ? 'th' : 'en');
}

export function speak(text, lang = 'th', { interrupt = true } = {}) {
  if (!soundOn || typeof speechSynthesis === 'undefined') return;
  if (voiceCache.length === 0) refreshVoices(); // late engines (iOS) fill in after first gesture
  if (interrupt) speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'th' ? 'th-TH' : 'en-US';
  const voice = pickVoiceFrom(voiceCache, lang === 'th' ? 'th' : 'en');
  if (voice) u.voice = voice;
  u.rate = 0.85;
  u.pitch = 1.1;
  speechSynthesis.speak(u);
}

// Speak an animal name in both languages, current language first.
export function speakName(animal, currentLang) {
  const order = currentLang === 'th' ? [['th', animal.th], ['en', animal.en]] : [['en', animal.en], ['th', animal.th]];
  speak(order[0][1], order[0][0]);
  speak(order[1][1], order[1][0], { interrupt: false });
}

// iOS requires voices to load after a user gesture; warm them up.
export function warmUp() {
  try { refreshVoices(); ctx(); } catch {}
}
