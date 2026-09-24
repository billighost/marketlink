import React from 'react';
import styles from './Badge.module.css';

/**
 * Short status or tag chip (1–2 words).
 * Tones: neutral, success, warning, danger.
 */
export function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span className={`${styles.badge} ${styles[tone]} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
