/**
 * Fly-to-cart animation utility.
 * Creates a small beet-coloured dot that flies from a source element to the cart icon
 * along a gentle arc using element.animate(). Respects reduced motion.
 */

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Animate a dot from sourceEl to the cart icon target.
 * @param {HTMLElement} sourceEl - The button or element the dot flies from
 * @param {Function} onArrive - Callback when the dot reaches the cart
 */
export function flyToCart(sourceEl, onArrive) {
  // Skip animation if user prefers reduced motion
  if (prefersReducedMotion()) {
    onArrive?.();
    return;
  }

  // Find the cart icon target (data-cart-target on the bottom nav or top nav cart)
  const target =
    document.querySelector('[data-cart-target]') ||
    document.querySelector('[data-cart-target-desktop]');

  if (!sourceEl || !target) {
    onArrive?.();
    return;
  }

  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // Create the flying dot
  const dot = document.createElement('div');
  dot.setAttribute('aria-hidden', 'true');
  Object.assign(dot.style, {
    position: 'fixed',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-beet)',
    zIndex: '600', // Above sheets and toast
    pointerEvents: 'none',
    top: `${sourceRect.top + sourceRect.height / 2 - 5}px`,
    left: `${sourceRect.left + sourceRect.width / 2 - 5}px`,
  });
  document.body.appendChild(dot);

  // Calculate deltas
  const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
  const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

  // Animate with a gentle arc (mid-keyframe goes upward)
  const animation = dot.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${deltaX * 0.5}px, ${deltaY * 0.3 - 30}px) scale(0.8)`, opacity: 0.9 },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.4)`, opacity: 0 },
    ],
    {
      duration: 450,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      fill: 'forwards',
    }
  );

  animation.onfinish = () => {
    dot.remove();
    onArrive?.();
  };
}

/**
 * Bump animation on the cart icon when an item arrives.
 * @param {HTMLElement} el - The cart icon element
 */
export function bumpCartIcon(el) {
  if (!el || prefersReducedMotion()) return;

  el.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.18)' },
      { transform: 'scale(1)' },
    ],
    { duration: 300, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
  );
}

/**
 * Pop animation on the cart badge when the count changes.
 * @param {HTMLElement} el - The badge element
 */
export function popBadge(el) {
  if (!el || prefersReducedMotion()) return;

  el.animate(
    [
      { transform: 'scale(0.8)' },
      { transform: 'scale(1.1)' },
      { transform: 'scale(1)' },
    ],
    { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
  );
}
