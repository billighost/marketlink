import React from 'react';
import styles from './SectionBand.module.css';

/**
 * SectionBand — a full-width page section with an optional canvas background.
 *
 * Rules:
 * - At most one banded section per page.
 * - Only Home is allowed to use the canvas band.
 * - All other pages: pass no `canvas` prop (defaults to white).
 *
 * @param {boolean} [canvas=false]    true = --color-canvas background
 * @param {React.ReactNode} children
 * @param {string} [className]
 */
export function SectionBand({ canvas = false, children, className = '', ...rest }) {
  return (
    <section
      className={`${styles.band} ${canvas ? styles.canvas : ''} ${className}`}
      {...rest}
    >
      <div className={styles.inner}>
        {children}
      </div>
    </section>
  );
}

export default SectionBand;
