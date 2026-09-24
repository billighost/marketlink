import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './HorizontalRow.module.css';

/**
 * Horizontal scroll row with section header, bleed-to-edge scroll container,
 * and arrow buttons on desktop (1024px+).
 * Items snap to start, hidden scrollbar, peek effect.
 */
export function HorizontalRow({
  title,
  subtitle,
  seeAllLabel = 'See all',
  onSeeAll,
  children,
  className = '',
}) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className={`${styles.section} ${className}`}>
      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.headerRight}>
          {onSeeAll && (
            <button type="button" className={styles.seeAll} onClick={onSeeAll}>
              {seeAllLabel}
            </button>
          )}
          {/* Arrow buttons: visible only on desktop 1024px+ */}
          <div className={styles.arrows}>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => scroll('left')}
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => scroll('right')}
              aria-label="Scroll right"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className={styles.scroll}
        role="region"
        aria-label={title}
        tabIndex={0}
      >
        <div className={styles.track} data-check-even>
          {children}
        </div>
      </div>
    </section>
  );
}

export default HorizontalRow;
