import React, { useEffect, useRef, useCallback } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import styles from './BottomSheet.module.css';

/**
 * BottomSheet overlay.
 * Sizes: 'peek' (fits content), 'tall' (92dvh), 'full' (100dvh).
 * Mobile: slides up from bottom. Desktop 768px+: peek = centered dialog, tall/full = right drawer.
 * Provides focus trap, Esc close, backdrop tap close, inert background, drag-to-dismiss.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  size = 'tall',
  showBack = false,
  onBack,
  footer,
  children,
  className = '',
}) {
  const sheetRef = useRef(null);
  const previousFocusRef = useRef(null);
  const dragStartY = useRef(null);
  const dragCurrentY = useRef(null);

  // Save and restore focus; lock body scroll
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      document.body.classList.add('noScroll');

      // Set inert on app wrapper (if supported)
      const appWrapper = document.getElementById('root');
      if (appWrapper && sheetRef.current) {
        // The sheet is inside root, so we inert sibling elements
        Array.from(appWrapper.children).forEach((child) => {
          if (child !== sheetRef.current?.closest('[data-sheet-overlay]')) {
            child.setAttribute('inert', '');
          }
        });
      }

      // Focus the sheet
      const timer = setTimeout(() => {
        const firstFocusable = sheetRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.classList.remove('noScroll');
        // Remove inert
        const appWrapper = document.getElementById('root');
        if (appWrapper) {
          Array.from(appWrapper.children).forEach((child) => {
            child.removeAttribute('inert');
          });
        }
        previousFocusRef.current?.focus();
      };
    }
  }, [open]);

  // Keyboard: Escape to close, focus trap
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Drag-to-dismiss on handle/header
  const handleDragStart = useCallback((e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartY.current = y;
    dragCurrentY.current = y;
  }, []);

  const handleDragMove = useCallback((e) => {
    if (dragStartY.current === null) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    dragCurrentY.current = y;
    const delta = y - dragStartY.current;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragStartY.current === null || !sheetRef.current) {
      dragStartY.current = null;
      return;
    }
    const delta = dragCurrentY.current - dragStartY.current;
    const sheetHeight = sheetRef.current.offsetHeight;

    if (delta > sheetHeight * 0.33) {
      // Close
      onClose();
    } else {
      // Spring back
      sheetRef.current.style.transform = '';
    }
    dragStartY.current = null;
  }, [onClose]);

  if (!open) return null;

  return (
    <div data-sheet-overlay className={styles.overlay} onClick={onClose}>
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${styles[size]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber handle (mobile) — drag target */}
        <div
          className={styles.handleArea}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className={styles.handle} />
        </div>

        {/* Header row */}
        {(title || showBack || true) && (
          <div
            className={styles.header}
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
          >
            {showBack && onBack ? (
              <button
                type="button"
                className={styles.backButton}
                onClick={onBack}
                aria-label="Go back"
              >
                <ArrowLeft size={20} strokeWidth={1.5} />
              </button>
            ) : (
              <div className={styles.headerSpacer} />
            )}
            {title && (
              <h2 id="sheet-title" className={styles.title}>{title}</h2>
            )}
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Scrollable body */}
        <div className={styles.body}>
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
}

export default BottomSheet;
