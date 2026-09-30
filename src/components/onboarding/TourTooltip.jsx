import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import Illustration from '@/components/domain/Illustration';
import TourProgress from './TourProgress';
import styles from './Onboarding.module.css';

/**
 * Smartly positioned tooltip card that explains the currently highlighted feature.
 * Calculates optimal viewport coordinates on desktop and converts to a docked bottom or top
 * card on mobile to prevent occluding the highlighted element.
 */
export function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  targetElement,
  onNext,
  onPrev,
  onSkip,
  onFinish,
}) {
  const tooltipRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: 'bottom' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  // Responsive breakpoint tracking
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine mobile docking position: 'top' or 'bottom'
  // Ensures card never covers the spotlighted element on mobile
  const resolveMobilePlacement = useCallback(() => {
    if (!targetElement) {
      return step?.preferredMobilePlacement || 'bottom';
    }

    const tRect = targetElement.getBoundingClientRect();
    const vh = window.visualViewport?.height || window.innerHeight;

    // If target is in the bottom portion of viewport or in the bottom nav bar,
    // dock card at top so target and pulse ring remain 100% visible
    if (tRect.bottom > vh - 220 || tRect.top > vh * 0.45) {
      return 'top';
    }

    if (step?.preferredMobilePlacement) {
      return step.preferredMobilePlacement;
    }

    return 'bottom';
  }, [targetElement, step]);

  const mobilePlacement = resolveMobilePlacement();

  // Compute smart tooltip position relative to target for desktop
  const updatePosition = useCallback(() => {
    if (isMobile) return;

    const card = tooltipRef.current;
    const cardRect = card ? card.getBoundingClientRect() : { width: 360, height: 260 };
    const cardW = cardRect.width || 360;
    const cardH = cardRect.height || 260;
    const margin = 14;
    const viewportPad = 16;

    if (!targetElement) {
      // Fallback: center in viewport
      setCoords({
        top: Math.max(viewportPad, (window.innerHeight - cardH) / 2),
        left: Math.max(viewportPad, (window.innerWidth - cardW) / 2),
        placement: 'center',
      });
      return;
    }

    const tRect = targetElement.getBoundingClientRect();
    const preferred = step?.placement || 'bottom';

    let resolvedPlacement = preferred;
    let top = 0;
    let left = 0;

    const spaceBelow = window.innerHeight - tRect.bottom;
    const spaceAbove = tRect.top;
    const spaceRight = window.innerWidth - tRect.right;
    const spaceLeft = tRect.left;

    if (preferred === 'bottom' && spaceBelow < cardH + margin && spaceAbove > cardH + margin) {
      resolvedPlacement = 'top';
    } else if (preferred === 'top' && spaceAbove < cardH + margin && spaceBelow > cardH + margin) {
      resolvedPlacement = 'bottom';
    } else if (preferred === 'right' && spaceRight < cardW + margin && spaceLeft > cardW + margin) {
      resolvedPlacement = 'left';
    } else if (preferred === 'left' && spaceLeft < cardW + margin && spaceRight > cardW + margin) {
      resolvedPlacement = 'right';
    }

    if (resolvedPlacement === 'bottom') {
      top = tRect.bottom + margin;
      left = tRect.left + tRect.width / 2 - cardW / 2;
    } else if (resolvedPlacement === 'top') {
      top = tRect.top - cardH - margin;
      left = tRect.left + tRect.width / 2 - cardW / 2;
    } else if (resolvedPlacement === 'left') {
      top = tRect.top + tRect.height / 2 - cardH / 2;
      left = tRect.left - cardW - margin;
    } else if (resolvedPlacement === 'right') {
      top = tRect.top + tRect.height / 2 - cardH / 2;
      left = tRect.right + margin;
    }

    // Viewport clamping
    const clampedLeft = Math.max(viewportPad, Math.min(window.innerWidth - cardW - viewportPad, left));
    const clampedTop = Math.max(viewportPad, Math.min(window.innerHeight - cardH - viewportPad, top));

    setCoords({
      top: clampedTop,
      left: clampedLeft,
      placement: resolvedPlacement,
    });
  }, [isMobile, targetElement, step]);

  useEffect(() => {
    updatePosition();
    const timer = setTimeout(updatePosition, 100);
    const timer2 = setTimeout(updatePosition, 300);
    window.addEventListener('resize', updatePosition, { passive: true });
    window.addEventListener('scroll', updatePosition, { passive: true });

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [updatePosition]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (!isLast) {
          e.preventDefault();
          onNext();
        } else {
          e.preventDefault();
          onFinish();
        }
      } else if (e.key === 'ArrowLeft') {
        if (!isFirst) {
          e.preventDefault();
          onPrev();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFirst, isLast, onNext, onPrev, onSkip, onFinish]);

  // Touch gesture swipe support for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;

      // Horizontal swipe threshold: > 45px, mostly horizontal, under 450ms
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 450) {
        if (dx < 0) {
          // Swipe left -> Next
          if (!isLast) onNext();
          else onFinish();
        } else {
          // Swipe right -> Previous
          if (!isFirst) onPrev();
        }
      }
    }
  };

  // Focus management
  useEffect(() => {
    tooltipRef.current?.focus();
  }, [stepIndex]);

  const styleProps = isMobile
    ? {}
    : {
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        position: 'fixed',
      };

  const mobileClass = isMobile
    ? mobilePlacement === 'top'
      ? styles.tooltipMobileTopCard
      : styles.tooltipMobileBottomCard
    : '';

  return (
    <div
      ref={tooltipRef}
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      tabIndex={-1}
      className={`${styles.tooltipCard} ${mobileClass}`}
      style={styleProps}
      data-placement={isMobile ? mobilePlacement : coords.placement}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header bar: Icon/Badge + Close/Skip */}
      <div className={styles.tooltipHeader}>
        <div className={styles.tooltipBadgeRow}>
          {step.illustration && (
            <div className={styles.tooltipIconWrap} aria-hidden="true">
              <Illustration name={step.illustration} size="sm" />
            </div>
          )}
          <span className={styles.tooltipStepBadge}>
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className={styles.closeBtn}
          aria-label="Skip tour"
          title="Skip tour (Esc)"
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      </div>

      {/* Content */}
      <div className={styles.tooltipBody}>
        <h3 className={styles.tooltipTitle}>{step.title}</h3>
        <p className={styles.tooltipDesc}>{step.content}</p>
      </div>

      {/* Progress Dots */}
      <div className={styles.tooltipProgressRow}>
        <TourProgress currentStepIndex={stepIndex} totalSteps={totalSteps} />
      </div>

      {/* Action Footer */}
      <div className={styles.tooltipFooter}>
        <button
          type="button"
          onClick={onSkip}
          className={styles.skipBtn}
          aria-label="Skip remaining tour"
        >
          Skip tour
        </button>

        <div className={styles.navActionsGroup}>
          {!isFirst && (
            <button
              type="button"
              onClick={onPrev}
              className={styles.backBtn}
              aria-label="Previous tour step"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              onClick={onFinish}
              className={styles.finishBtn}
              aria-label="Finish and close tour"
            >
              <span>Finish Tour</span>
              <Check size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className={styles.nextBtn}
              aria-label="Next tour step"
            >
              <span>Next</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TourTooltip;
