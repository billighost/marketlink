import React from 'react';
import styles from './Chip.module.css';

/**
 * Filter pill chip component.
 * Follows design system specifications:
 *  - flex: 0 0 auto, white-space: nowrap
 *  - 44px touch-target hit area, horizontal padding var(--space-4)
 *  - text var(--text-body) Inter 500, radius-full, hairline border
 *  - Selected: beet border and text, beet-tint background, aria-pressed
 */
export function Chip({
  children,
  selected = false,
  onClick,
  className = '',
  ...rest
}) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${selected ? styles.selected : ''} ${className}`}
      aria-pressed={selected}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Chip;
