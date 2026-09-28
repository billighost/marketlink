import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './Onboarding.module.css';

/**
 * Spotlight creates an interactive visual overlay that darkens the background
 * and casts a soft illuminated cutout with a glow border over the target element.
 */
export function Spotlight({ targetSelector, fallbackSelector, padding = 8, onTargetFound }) {
  const [rect, setRect] = useState(null);
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const rafRef = useRef(null);

  const updateTargetRect = useCallback(() => {
    let el = targetSelector ? document.querySelector(targetSelector) : null;
    if (!el && fallbackSelector) {
      el = document.querySelector(fallbackSelector);
    }

    if (!el) {
      setRect(null);
      if (onTargetFound) onTargetFound(null);
      return;
    }

    // Target is present
    const rawRect = el.getBoundingClientRect();

    // Check if target is hidden/0-sized
    if (rawRect.width === 0 && rawRect.height === 0) {
      setRect(null);
      if (onTargetFound) onTargetFound(null);
      return;
    }

    const calculated = {
      x: Math.max(0, rawRect.left - padding),
      y: Math.max(0, rawRect.top - padding),
      width: rawRect.width + padding * 2,
      height: rawRect.height + padding * 2,
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
  }, [targetSelector, fallbackSelector, padding, onTargetFound]);

  // Scroll element into view smoothly when step changes
  useEffect(() => {
    let el = targetSelector ? document.querySelector(targetSelector) : null;
    if (!el && fallbackSelector) {
      el = document.querySelector(fallbackSelector);
    }

    if (el) {
      // Check if visible in viewport
      const bounding = el.getBoundingClientRect();
      const isVisible =
        bounding.top >= 80 &&
        bounding.bottom <= window.innerHeight - 120 &&
        bounding.left >= 0 &&
        bounding.right <= window.innerWidth;

      if (!isVisible) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: window.innerWidth < 768 ? 'start' : 'center',
          inline: 'nearest',
        });
      }
    }

    // Re-check target position after scroll
    const checkTimer = setTimeout(updateTargetRect, 200);
    const checkTimer2 = setTimeout(updateTargetRect, 500);

    return () => {
      clearTimeout(checkTimer);
      clearTimeout(checkTimer2);
    };
  }, [targetSelector, fallbackSelector, updateTargetRect]);

  // Listen for resize and continuous scroll tracking
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      updateTargetRect();
    };

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateTargetRect);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    updateTargetRect();

    // Poll periodically while active to catch dynamic layout adjustments
    const interval = setInterval(updateTargetRect, 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
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
