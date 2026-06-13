// Gameplay listens to Pointer Events only (design rule), but keyboards must
// still work: native buttons fire 'click' with detail 0 for Enter/Space and
// never fire 'pointerup'. Pointer-driven clicks (detail > 0) are ignored so
// a tap never fires the handler twice.
export function onActivate(el, handler) {
  el.addEventListener('pointerup', handler);
  el.addEventListener('click', (e) => { if (e.detail === 0) handler(e); });
}

// Tap = pointerup that ended within 10px of its pointerdown. Pointerups that
// finish a scroll drag don't fire (browsers usually send pointercancel when
// native pan takes over — the distance check is the cross-browser backstop).
// Keyboard Enter/Space still activates via click detail 0.
export function onTap(el, handler) {
  let down = null;
  el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointerup', (e) => {
    const wasTap = down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10;
    down = null;
    if (wasTap) handler(e);
  });
  el.addEventListener('click', (e) => { if (e.detail === 0) handler(e); });
}
