export function confetti(container, count = 30) {
  const colors = ['var(--sunset-orange)', 'var(--kelp-green)', 'var(--glacier-blue)', 'var(--anemone-purple)', 'var(--sun-gold)'];
  const timers = [];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.cssText = `left:${10 + Math.random() * 80}%;top:0;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.4}s;`;
    container.appendChild(p);
    timers.push(setTimeout(() => p.remove(), 2200));
  }
  return timers;
}
