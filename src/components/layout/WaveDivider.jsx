import React from 'react';
import styles from './WaveDivider.module.css';

/**
 * Static wave divider between white page surface and canvas bands.
 * @param {'soft' | 'gentle'} shape
 * @param {boolean} flip - If true, sits at the bottom of a canvas band
 */
export function WaveDivider({ shape = 'soft', flip = false, className = '' }) {
  const pathD =
    shape === 'gentle'
      ? 'M0,120 L0,45 C320,15 680,85 1040,45 C1220,25 1360,65 1440,70 L1440,120 Z'
      : 'M0,120 L0,60 C400,105 800,25 1200,65 C1320,75 1400,60 1440,55 L1440,120 Z';

  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={`${styles.wave} ${className}`}
      data-flip={flip ? 'true' : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <path d={pathD} className={styles.path} />
    </svg>
  );
}

export default WaveDivider;
