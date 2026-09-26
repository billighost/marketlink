import React from 'react';
import styles from './PickupCode.module.css';

/**
 * The collection code a Customer shows at the stall. Rendered large, tabular and
 * widely tracked because it will be read aloud across a noisy market stall.
 *
 * The server generates it from an alphabet with no I, L, O, 0 or 1 (Stage 3),
 * so there is nothing to misread. Renders nothing when the order has no code
 * (legacy orders predating the field).
 *
 * @param {string} code
 * @param {'lg'|'md'} size
 * @param {string} [className]
 */
export function PickupCode({ code, size = 'lg', className = '' }) {
  if (!code) return null;

  return (
    <div className={`${styles.block} ${styles[size]} ${className}`}>
      <span className={styles.label}>Collection code</span>
      <output
        className={styles.code}
        aria-label={`Collection code ${String(code).split('').join(' ')}`}
      >
        {code}
      </output>
      <span className={styles.hint}>Show this at the stall</span>
    </div>
  );
}

export default PickupCode;
