import React from 'react';
import styles from './Toggle.module.css';

/**
 * Accessible toggle switch with role="switch" and aria-checked.
 * 44px hit area. Used in Profile notification settings.
 */
export function Toggle({ checked, onChange, label, id, className = '' }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.on : ''} ${className}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
      {label && <span className="visuallyHidden">{label}</span>}
    </button>
  );
}

export default Toggle;
