import React from 'react';
import styles from './Skeleton.module.css';

/**
 * Loading placeholder with gentle opacity pulse.
 * Disabled under prefers-reduced-motion (handled in CSS).
 */
export function Skeleton({ width, height, radius = 'md', className = '' }) {
  return (
    <div
      className={`${styles.skeleton} ${styles[radius]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/** Skeleton card for product rows */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`${styles.card} ${className}`}>
      <Skeleton height="120px" radius="md" />
      <div className={styles.cardBody}>
        <Skeleton width="60%" height="14px" radius="sm" />
        <Skeleton width="80%" height="16px" radius="sm" />
        <Skeleton width="40%" height="14px" radius="sm" />
      </div>
    </div>
  );
}

export default Skeleton;
