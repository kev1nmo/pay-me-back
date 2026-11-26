const COINS = ['💸', '💰', '🪙', '💵'];
const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fire a little burst of money emoji out of an element (e.g. the button that was clicked). */
export function burst(origin: Element | null | undefined, count = 14) {
  if (!origin || prefersReducedMotion()) return;
  const r = origin.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'coin';
    el.textContent = COINS[Math.floor(Math.random() * COINS.length)];
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1; // mostly upward
    const dist = 60 + Math.random() * 90;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const rot = (Math.random() - 0.5) * 360;
    el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.3)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.1) rotate(${rot}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${dx * 1.2}px), calc(-50% + ${dy + 70}px)) scale(0.7) rotate(${rot * 1.6}deg)`, opacity: 0 },
      ],
      { duration: 850 + Math.random() * 450, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    ).onfinish = () => el.remove();
  }
}

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Staggered fade-up entrance for cards. */
export const enter = (i = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: i * 0.07, ease: EASE },
});

/** Enter/exit for list rows (use with AnimatePresence + layout). */
export const rowMotion = {
  initial: { opacity: 0, y: -10, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.22 } },
  transition: { type: 'spring' as const, stiffness: 420, damping: 32 },
};
