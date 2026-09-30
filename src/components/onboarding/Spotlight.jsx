import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './Onboarding.module.css';

/**
 * Checks whether an element is truly visible and rendered in the DOM.
 */
function isElementVisible(el) {
  if (!el || !el.isConnected) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const style = window.getComputedStyle(el);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return false;
  }
  return true;
}

/**
 * Resolves the active visible target element, giving priority to targetSelector
 * and cleanly falling back to fallbackSelector if the primary element is hidden
 * (e.g. desktop navigation or sidebar hidden on mobile).
 */
export function getVisibleTargetElement(targetSelector, fallbackSelector) {
  if (targetSelector) {
    try {
      const el = document.querySelector(targetSelector);
      if (isElementVisible(el)) return el;
    } catch {
      // Invalid selector fallback
    }
  }

  if (fallbackSelector) {
    try {
      const fallbackEl = document.querySelector(fallbackSelector);
      if (isElementVisible(fallbackEl)) return fallbackEl;
    } catch {
      // Invalid selector fallback
    }
  }

  return null;
}

/**
 * Spotlight creates an interactive visual overlay that darkens the background
 * and casts a soft illuminated cutout with a glow border over the target element.
 */
export function Spotlight({ targetSelector, fallbackSelector, padding, onTargetFound }) {
  const [rect, setRect] = useState(null);
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const rafRef = useRef(null);

  // Use slightly tighter padding on mobile so highlights don't overflow
  const isMobile = viewportSize.width < 768;
  const effectivePadding = padding !== undefined ? padding : (isMobile ? 6 : 8);

  const updateTargetRect = useCallback(() => {
    const el = getVisibleTargetElement(targetSelector, fallbackSelector);

    if (!el) {
      setRect(null);
      if (onTargetFound) onTargetFound(null);
      return;
    }

    const rawRect = el.getBoundingClientRect();

    if (rawRect.width === 0 && rawRect.height === 0) {
      setRect(null);
      if (onTargetFound) onTargetFound(null);
      return;
    }

    const vw = window.visualViewport?.width || window.innerWidth;
    const vh = window.visualViewport?.height || window.innerHeight;

    // Viewport-clamped cutout coordinates
    const left = Math.max(2, rawRect.left - effectivePadding);
    const top = Math.max(2, rawRect.top - effectivePadding);
    const right = Math.min(vw - 2, rawRect.right + effectivePadding);
    const bottom = Math.min(vh - 2, rawRect.bottom + effectivePadding);

    const calculated = {
      x: left,
      y: top,
      width: Math.max(16, right - left),
      height: Math.max(16, bottom - top),
      rawTop: rawRect.top,
      rawBottom: rawRect.bottom,
      rawLeft: rawRect.left,
      rawRight: rawRect.right,
      element: el,
    };

    setRect((prev) => {
      if (
        prev &&
        Math.abs(prev.x - calculated.x) < 0.5 &&
        Math.abs(prev.y - calculated.y) < 0.5 &&
        Math.abs(prev.width - calculated.width) < 0.5 &&
        Math.abs(prev.height - calculated.height) < 0.5
      ) {
        return prev;
      }
      return calculated;
    });

    if (onTargetFound) onTargetFound(el);
  }, [targetSelector, fallbackSelector, effectivePadding, onTargetFound]);

  // Scroll element into view smoothly when step changes
  useEffect(() => {
    const el = getVisibleTargetElement(targetSelector, fallbackSelector);

    if (el) {
      const bounding = el.getBoundingClientRect();
      const isMobileScreen = window.innerWidth < 768;
      const topSafeZone = isMobileScreen ? 64 : 80;
      const bottomSafeZone = isMobileScreen ? 80 : 120;

      const isVisible =
        bounding.top >= topSafeZone &&
        bounding.bottom <= window.innerHeight - bottomSafeZone &&
        bounding.left >= 0 &&
        bounding.right <= window.innerWidth;

      if (!isVisible) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }

    const checkTimer = setTimeout(updateTargetRect, 200);
    const checkTimer2 = setTimeout(updateTargetRect, 500);

    return () => {
      clearTimeout(checkTimer);
      clearTimeout(checkTimer2);
    };
  }, [targetSelector, fallbackSelector, updateTargetRect]);

  // Listen for resize, orientation changes, and continuous scroll tracking
  useEffect(() => {
    const updateSize = () => {
      const vw = window.visualViewport?.width || window.innerWidth;
      const vh = window.visualViewport?.height || window.innerHeight;
      setViewportSize({ width: vw, height: vh });
      updateTargetRect();
    };

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateTargetRect);
    };

    window.addEventListener('resize', updateSize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.visualViewport?.addEventListener('resize', updateSize, { passive: true });
    window.visualViewport?.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    updateTargetRect();

    // Poll periodically while active to catch dynamic DOM transitions
    const interval = setInterval(updateTargetRect, 300);

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('scroll', handleScroll);
      window.visualViewport?.removeEventListener('resize', updateSize);
      window.visualViewport?.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateTargetRect]);

  // If no target element found in DOM, render a subtle dark overlay backdrop
  if (!rect) {
    return (
      <div className={styles.spotlightBackdropFallback} aria-hidden="true" />
    );
  }

  const { width: vw, height: vh } = viewportSize;
  const radius = Math.min(10, Math.max(6, Math.min(rect.width, rect.height) / 4));

  return (
    <div className={styles.spotlightContainer} aria-hidden="true">
      {/* SVG Mask Overlay */}
      <svg
        className={styles.spotlightSvg}
        width={vw}
        height={vh}
        viewBox={`0 0 ${vw} ${vh}`}
      >
        <defs>
          <mask id="marketlink-spotlight-mask">
            {/* White area = visible overlay */}
            <rect x="0" y="0" width={vw} height={vh} fill="white" />
            {/* Black area = cut-out through which the app element shines */}
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx={radius}
              ry={radius}
              fill="black"
            />
          </mask>
        </defs>

        {/* Fill whole screen with tinted overlay masked by cutout */}
        <rect
          x="0"
          y="0"
          width={vw}
          height={vh}
          fill="rgba(46, 43, 38, 0.68)"
          mask="url(#marketlink-spotlight-mask)"
        />
      </svg>

      {/* Illuminated target border & pulse ring */}
      <div
        className={styles.spotlightHighlightRing}
        style={{
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          borderRadius: `${radius}px`,
        }}
      />
    </div>
  );
}

export default Spotlight;
