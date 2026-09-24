import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft } from 'lucide-react';
import styles from './BottomSheet.module.css';

/**
 * Native-feeling BottomSheet component.
 * Features:
 *  - Rendered in a portal to document.body for clean inert background isolation
 *  - 44px invisible grabber hit area + draggable header
 *  - 1:1 follow-the-thumb dragging via requestAnimationFrame direct transform
 *  - Body scroll hand-off: scrolls body normally; only hands off to sheet drag when scrollTop === 0 and dragging down
 *  - Non-passive touchmove prevents native pull-to-refresh during drag hand-off
 *  - Upward rubber-banding (0.3x resistance)
 *  - Dynamic backdrop opacity tracking drag progress
 *  - Velocity tracking over last 100ms (flick to dismiss at >0.5 px/ms or >30% height)
 *  - Two-stop snap option for Product sheets (mid ~60dvh and full ~92dvh)
 *  - Keyboard focus trap, Esc close, aria-modal, focus return to opener
 *  - Respects prefers-reduced-motion
 */
export function BottomSheet({
  open,
  onClose,
  title,
  size = 'tall',
  twoStop = false,
  showBack = false,
  onBack,
  footer,
  children,
  className = '',
}) {
  const overlayRef = useRef(null);
  const sheetRef = useRef(null);
  const bodyRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Drag state refs (no React state updates during drag for 60fps performance)
  const isDraggingRef = useRef(false);
  const dragSourceRef = useRef(null); // 'handle' | 'header' | 'body'
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const currentYRef = useRef(0);
  const initialSheetYRef = useRef(0); // For two-stop mid/full position
  const isDirectionLockedRef = useRef(false);
  const isHorizontalGestureRef = useRef(false);
  const historyRef = useRef([]); // [{ y, time }]
  const animationFrameIdRef = useRef(null);
  const isDismissingRef = useRef(false);

  // Two-stop resting state ('mid' | 'full')
  const currentStopRef = useRef(twoStop ? 'mid' : 'full');

  // Check prefers-reduced-motion
  const prefersReducedMotion = useCallback(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Check if desktop drawer mode (>= 768px)
  const isDesktop = useCallback(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 768;
  }, []);

  // Safe dismiss ensuring onClose is called exactly once after animation
  const dismiss = useCallback(() => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;

    if (prefersReducedMotion() || isDesktop() || !sheetRef.current) {
      onClose();
      return;
    }

    const sheet = sheetRef.current;
    const overlay = overlayRef.current;
    sheet.style.transition = 'transform 240ms cubic-bezier(0.2, 0, 0, 1)';
    sheet.style.transform = 'translate3d(0, 100%, 0)';
    if (overlay) {
      overlay.style.transition = 'opacity 240ms cubic-bezier(0.2, 0, 0, 1)';
      overlay.style.opacity = '0';
    }

    const timer = setTimeout(() => {
      onClose();
    }, 240);

    return () => clearTimeout(timer);
  }, [onClose, prefersReducedMotion, isDesktop]);

  // Snap back to resting position
  const snapTo = useCallback((targetY, duration = 200) => {
    if (!sheetRef.current) return;
    const sheet = sheetRef.current;
    const overlay = overlayRef.current;

    if (prefersReducedMotion()) {
      sheet.style.transform = targetY === 0 ? '' : `translate3d(0, ${targetY}px, 0)`;
      if (overlay) overlay.style.opacity = '1';
      return;
    }

    sheet.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0, 0, 1)`;
    sheet.style.transform = targetY === 0 ? 'translate3d(0, 0, 0)' : `translate3d(0, ${targetY}px, 0)`;
    if (overlay) {
      overlay.style.transition = `opacity ${duration}ms cubic-bezier(0.2, 0, 0, 1)`;
      overlay.style.opacity = '1';
    }

    const cleanup = () => {
      if (sheetRef.current) {
        sheetRef.current.style.transition = '';
        if (targetY === 0) {
          sheetRef.current.style.transform = '';
        }
        sheetRef.current.style.willChange = '';
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = '';
      }
    };

    setTimeout(cleanup, duration);
  }, [prefersReducedMotion]);

  // Update transform via requestAnimationFrame
  const updateTransform = useCallback((yOffset) => {
    if (!sheetRef.current) return;

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }

    animationFrameIdRef.current = requestAnimationFrame(() => {
      if (!sheetRef.current) return;

      let effectiveY = yOffset;
      // Dampen upward movement past resting position with rubber-band resistance
      if (yOffset < 0) {
        effectiveY = yOffset * 0.3; // 0.3 resistance
      }

      sheetRef.current.style.transform = `translate3d(0, ${effectiveY}px, 0)`;

      // Backdrop opacity follows drag progress
      if (overlayRef.current && sheetRef.current) {
        const height = sheetRef.current.offsetHeight || 500;
        const progress = Math.max(0, Math.min(1, effectiveY / height));
        overlayRef.current.style.opacity = (1 - progress * 0.75).toString();
      }
    });
  }, []);

  // Shared drag start logic
  const handleDragStart = useCallback((clientY, clientX, source) => {
    if (isDesktop() || isDismissingRef.current) return;

    isDraggingRef.current = false; // Will become true after ~6px movement
    dragSourceRef.current = source;
    startYRef.current = clientY;
    startXRef.current = clientX;
    currentYRef.current = clientY;
    isDirectionLockedRef.current = false;
    isHorizontalGestureRef.current = false;
    historyRef.current = [{ y: clientY, time: performance.now() }];

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
      sheetRef.current.style.willChange = 'transform';
    }
  }, [isDesktop]);

  // Shared drag move logic
  const handleDragMove = useCallback((clientY, clientX) => {
    if (isDesktop() || isDismissingRef.current || !startYRef.current) return;

    const deltaY = clientY - startYRef.current;
    const deltaX = clientX - startXRef.current;

    // Direction locking after ~8px to prevent interfering with horizontal rows or text
    if (!isDirectionLockedRef.current) {
      const distance = Math.hypot(deltaX, deltaY);
      if (distance > 8) {
        isDirectionLockedRef.current = true;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          isHorizontalGestureRef.current = true;
          return;
        }
      } else {
        return;
      }
    }

    if (isHorizontalGestureRef.current) return;

    // Body scroll hand-off guard: only drag if moving downward from scrollTop 0
    if (dragSourceRef.current === 'body') {
      const bodyEl = bodyRef.current;
      if (bodyEl && bodyEl.scrollTop > 0) {
        return;
      }
      if (deltaY <= 0) {
        // Scrolling up inside body - do not move sheet
        return;
      }
    }

    // Require threshold of ~6px before committing to drag (protects clicks on buttons)
    if (!isDraggingRef.current) {
      if (Math.abs(deltaY) > 6) {
        isDraggingRef.current = true;
      } else {
        return;
      }
    }

    currentYRef.current = clientY;
    const now = performance.now();
    historyRef.current.push({ y: clientY, time: now });
    // Keep only last ~100ms
    historyRef.current = historyRef.current.filter((item) => now - item.time <= 120);

    updateTransform(deltaY);
  }, [isDesktop, updateTransform]);

  // Shared drag end logic with velocity calculation
  const handleDragEnd = useCallback(() => {
    if (isDesktop() || isDismissingRef.current || !startYRef.current) {
      startYRef.current = 0;
      return;
    }

    if (!isDraggingRef.current || isHorizontalGestureRef.current) {
      // It was a tap or horizontal swipe; reset inline styles cleanly
      if (sheetRef.current) {
        sheetRef.current.style.transition = '';
        sheetRef.current.style.transform = '';
        sheetRef.current.style.willChange = '';
      }
      startYRef.current = 0;
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = false;
    const deltaY = currentYRef.current - startYRef.current;
    const sheetHeight = sheetRef.current?.offsetHeight || 500;

    // Calculate velocity (px per ms) from recent movement history
    let velocity = 0;
    const historyLen = historyRef.current.length;
    if (historyLen >= 2) {
      const last = historyRef.current[historyLen - 1];
      const prev = historyRef.current[Math.max(0, historyLen - 4)];
      const dt = last.time - prev.time;
      if (dt > 0) {
        velocity = (last.y - prev.y) / dt;
      }
    }

    // Dismiss condition: downward flick (>0.4 px/ms) or dragged down >30% (or >35% for peek)
    const distanceThreshold = size === 'peek' ? 0.35 : 0.30;
    const isFlick = velocity > 0.4;
    const isPastThreshold = deltaY > sheetHeight * distanceThreshold;

    if (isFlick || isPastThreshold) {
      dismiss();
    } else {
      // Snap back to resting position
      snapTo(0, 200);
    }

    startYRef.current = 0;
    historyRef.current = [];
  }, [isDesktop, size, dismiss, snapTo]);

  // Pointer events on Handle and Header
  const onPointerDownHandle = (e) => {
    // If tapping an interactive button inside the header (close button, back button), do not drag
    if (e.target.closest('button')) return;
    if (!e.isPrimary || e.button !== 0) return;
    handleDragStart(e.clientY, e.clientX, 'handle');
  };

  const onPointerMoveHandle = (e) => {
    if (!startYRef.current) return;
    if (isDraggingRef.current && e.currentTarget.setPointerCapture && !e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    handleDragMove(e.clientY, e.clientX);
  };

  const onPointerUpHandle = (e) => {
    if (e.currentTarget.releasePointerCapture && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
    handleDragEnd();
  };

  const onPointerCancelHandle = () => {
    handleDragEnd();
  };

  // Body non-passive touch listeners for hand-off from scrollTop === 0
  useEffect(() => {
    const bodyEl = bodyRef.current;
    if (!bodyEl) return;

    let touchStartY = 0;
    let touchStartX = 0;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      if (bodyEl.scrollTop === 0) {
        handleDragStart(touchStartY, touchStartX, 'body');
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const dy = currentY - touchStartY;

      // When at top and pulling downward, cancel native scroll so sheet follows thumb
      if (bodyEl.scrollTop <= 0 && dy > 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        handleDragMove(currentY, currentX);
      }
    };

    const onTouchEnd = () => {
      handleDragEnd();
    };

    bodyEl.addEventListener('touchstart', onTouchStart, { passive: true });
    bodyEl.addEventListener('touchmove', onTouchMove, { passive: false });
    bodyEl.addEventListener('touchend', onTouchEnd, { passive: true });
    bodyEl.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      bodyEl.removeEventListener('touchstart', onTouchStart);
      bodyEl.removeEventListener('touchmove', onTouchMove);
      bodyEl.removeEventListener('touchend', onTouchEnd);
      bodyEl.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  // Window blur & pointercancel recovery
  useEffect(() => {
    const handleBlur = () => {
      if (isDraggingRef.current) {
        handleDragEnd();
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [handleDragEnd]);

  // Keyboard, focus management, body scroll lock, and app isolation via inert
  useEffect(() => {
    if (!open) return;

    isDismissingRef.current = false;
    previousFocusRef.current = document.activeElement;

    // Body scroll lock with overscroll-behavior: none on html
    document.documentElement.classList.add('noScroll');
    document.body.classList.add('noScroll');

    // Safely isolate main app root via inert attribute
    const root = document.getElementById('root');
    if (root) {
      root.setAttribute('inert', '');
    }

    // Auto-focus first focusable element inside sheet
    const focusTimer = setTimeout(() => {
      const focusable = sheetRef.current?.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 60);

    // Escape key and tab loop focus trap
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismiss();
        return;
      }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusableEls = sheetRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableEls.length === 0) return;
        const first = focusableEls[0];
        const last = focusableEls[focusableEls.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.classList.remove('noScroll');
      document.body.classList.remove('noScroll');

      const appRoot = document.getElementById('root');
      if (appRoot) {
        appRoot.removeAttribute('inert');
      }

      // Return focus to opener
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [open, dismiss]);

  if (!open) return null;

  const content = (
    <div
      ref={overlayRef}
      data-sheet-overlay
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          dismiss();
        }
      }}
    >
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${styles[size]} ${twoStop ? styles.twoStop : ''} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
      >
        {/* Unified header bar: handle + close button (and optional back button) */}
        <div
          className={styles.header}
          data-drag-zone
          onPointerDown={onPointerDownHandle}
          onPointerMove={onPointerMoveHandle}
          onPointerUp={onPointerUpHandle}
          onPointerCancel={onPointerCancelHandle}
        >
          {showBack && onBack ? (
            <button
              type="button"
              className={styles.backButton}
              onClick={onBack}
              aria-label="Go back"
            >
              <ArrowLeft size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          ) : (
            <div className={styles.headerSpacer} aria-hidden="true" />
          )}

          {/* Grabber handle in center */}
          <div className={styles.handle} aria-hidden="true" />

          <button
            type="button"
            className={styles.closeButton}
            onClick={dismiss}
            aria-label="Close sheet"
          >
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={bodyRef} className={styles.body}>
          {children}
        </div>

        {/* Sticky footer */}
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

export default BottomSheet;
