// Gameplay listens to Pointer Events only (design rule), but keyboards must
// still work: native buttons fire 'click' with detail 0 for Enter/Space and
// never fire 'pointerup'. Pointer-driven clicks (detail > 0) are ignored so
// a tap never fires the handler twice.
export function onActivate(el, handler) {
  el.addEventListener('pointerup', handler);
  el.addEventListener('click', (e) => { if (e.detail === 0) handler(e); });
}
