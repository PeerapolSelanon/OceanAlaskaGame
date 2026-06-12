// Persisted settings. Falls back to in-memory map when localStorage
// is unavailable (node tests, private browsing).
const mem = new Map();
const PREFIX = 'oceanAlaska.';

function store() {
  try { if (typeof localStorage !== 'undefined') return localStorage; } catch { /* blocked */ }
  return null;
}

export function get(key, def) {
  const ls = store();
  const raw = ls ? ls.getItem(PREFIX + key) : mem.get(key);
  if (raw == null) return def;
  try { return JSON.parse(raw); } catch { return def; }
}

export function set(key, value) {
  const raw = JSON.stringify(value);
  const ls = store();
  if (ls) ls.setItem(PREFIX + key, raw); else mem.set(key, raw);
}
