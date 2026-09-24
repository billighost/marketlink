/**
 * Fly-to-cart animation utility.
 * Creates a small beet-coloured dot that flies from a source element to the cart icon
 * along a gentle arc using element.animate(). Respects reduced motion.
 */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Announce messages politely to assistive technology
 */
export function announceToScreenReader(message) {
  if (typeof document === 'undefined') return;
  let announcer = document.getElementById('a11y-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    Object.assign(announcer.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '-1px',
      padding: '0',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      border: '0',
    });
    document.body.appendChild(announcer);
  }
  announcer.textContent = message;
}

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

  // Find correct cart icon target (desktop vs mobile)
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const target = isDesktop
    ? (document.querySelector('[data-cart-target-desktop]') || document.querySelector('[data-cart-target]'))
    : (document.querySelector('[data-cart-target]') || document.querySelector('[data-cart-target-desktop]'));

  if (!sourceEl || !target) {
    onArrive?.();
    return;
  }

  const sourceRect = sourceEl.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  // If source or target are hidden or offscreen (0 width/height)
  if (sourceRect.width === 0 || targetRect.width === 0) {
    onArrive?.();
    return;
  }

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

  const cleanup = () => {
    if (dot.parentNode) {
      dot.remove();
    }
    onArrive?.();
  };

  animation.onfinish = cleanup;
  animation.oncancel = cleanup;
}

/**
 * Bump animation on the cart icon when an item arrives.
 * @param {HTMLElement} [el] - Optional cart icon element
 */
export function bumpCartIcon(el) {
  if (prefersReducedMotion()) return;

  const targetEl =
    el ||
    (typeof window !== 'undefined' && window.innerWidth >= 768
      ? document.querySelector('[data-cart-target-desktop]')
      : document.querySelector('[data-cart-target]'));

  if (!targetEl) return;

  targetEl.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.15)' },
      { transform: 'scale(1)' },
    ],
    { duration: 250, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
  );
}

/**
 * Pop animation on the cart badge when the count changes.
 * @param {HTMLElement} [el] - Optional badge element
 */
export function popBadge(el) {
  if (prefersReducedMotion()) return;

  const targetEl = el || document.querySelector('[data-cart-badge]');
  if (!targetEl) return;

  targetEl.animate(
    [
      { transform: 'scale(0.8)' },
      { transform: 'scale(1.15)' },
      { transform: 'scale(1)' },
    ],
    { duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
  );
}
