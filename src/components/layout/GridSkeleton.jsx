import React from 'react';
import styles from './GridSkeleton.module.css';

/**
 * Individual skeleton card matching ProductCard dimensions.
 */
export function SkeletonCard({ className = '' }) {
  return (
    <article className={`${styles.card} ${className}`} aria-hidden="true">
      <div className={styles.image} />
      <div className={styles.body}>
        <div className={styles.lineTitle} />
        <div className={styles.lineSub} />
        <div className={styles.footer}>
          <div className={styles.linePrice} />
          <div className={styles.buttonPlaceholder} />
        </div>
      </div>
    </article>
  );
}

/**
 * Layout-matched produce grid skeleton.
 *
 * @param {number} count Number of skeleton cards to render (default 8)
 * @param {string} className
 */
export function GridSkeleton({ count = 8, className = '' }) {
  return (
    <div
      className={`${styles.grid} ${className}`}
      aria-label="Loading produce catalog"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default GridSkeleton;
