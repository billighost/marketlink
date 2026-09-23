import React from 'react';
import styles from './StatusDot.module.css';

/**
 * Status indicator dot + text label
 */
export function StatusDot({ label, tone, className = '' }) {
  // Determine tone if not explicitly provided
  let computedTone = tone;
  if (!computedTone) {
    if (label === 'In stock' || label === 'Ready for pickup' || label === 'Completed') {
      computedTone = 'herb';
    } else if (label === 'Low stock' || label === 'Placed' || label === 'Accepted') {
      computedTone = 'carrot';
    } else if (label === 'Cancelled' || label === 'Sold out') {
      computedTone = 'danger';
    } else {
      computedTone = 'neutral';
    }
  }

  return (
    <span className={`${styles.statusDot} ${styles[computedTone]} ${className}`}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </span>
  );
}

export default StatusDot;
