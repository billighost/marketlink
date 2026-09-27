import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';
import styles from './SegmentedControl.module.css';

/**
 * Pill switch for toggling between views (e.g. Active | Past).
 * Uses real radio-group semantics with arrow-key support.
 * The active background is one element that slides to the selected option
 * rather than each option drawing its own background.
 */
export function SegmentedControl({ options, value, onChange, name = 'segment', className = '' }) {
  const groupRef = useRef(null);
  const optionRefs = useRef([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  const measure = useCallback(() => {
    const activeIndex = options.findIndex((o) => o.value === value);
    const el = optionRefs.current[activeIndex];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    }
  }, [options, value]);

  // Measure synchronously after paint so the indicator never flashes in the wrong spot
  useLayoutEffect(() => {
    measure();
  }, [measure]);

  // Option widths are responsive (1fr grid columns), so re-measure on resize
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

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
      <div
        className={styles.indicator}
        aria-hidden="true"
        style={{
          transform: `translateX(${indicator.left}px)`,
          width: `${indicator.width}px`,
          opacity: indicator.ready ? 1 : 0,
        }}
      />

      {options.map((option, i) => (
        <label
          key={option.value}
          ref={(el) => (optionRefs.current[i] = el)}
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