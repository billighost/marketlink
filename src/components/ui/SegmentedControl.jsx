import React, { useRef } from 'react';
import styles from './SegmentedControl.module.css';

/**
 * Pill switch for toggling between views (e.g. Active | Past).
 * Uses real radio-group semantics with arrow-key support.
 */
export function SegmentedControl({ options, value, onChange, name = 'segment', className = '' }) {
  const groupRef = useRef(null);

  const handleKeyDown = (e) => {
    const currentIndex = options.findIndex((o) => o.value === value);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    }

    if (nextIndex !== currentIndex) {
      onChange(options[nextIndex].value);
      // Focus the new radio
      const radios = groupRef.current?.querySelectorAll('input[type="radio"]');
      radios?.[nextIndex]?.focus();
    }
  };

  return (
    <div
      ref={groupRef}
      className={`${styles.control} ${className}`}
      role="radiogroup"
      aria-label={name}
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={`${styles.option} ${value === option.value ? styles.active : ''}`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="visuallyHidden"
            tabIndex={value === option.value ? 0 : -1}
          />
          <span className={styles.label}>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export default SegmentedControl;
