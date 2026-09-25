import React from 'react';
import styles from './TimeSelect.module.css';

import { formatMinutesToTime, generateTimeOptions } from '../../utils/format.js';

export { formatMinutesToTime, generateTimeOptions };

/**
 * TimeSelect component for 30-minute pickup windows and market operating schedules.
 */
export function TimeSelect({
  id,
  name,
  value,
  onChange,
  label,
  disabled = false,
  min = 300,
  max = 1380,
  step = 30,
  error,
  className = '',
  'aria-label': ariaLabel,
  placeholder = 'Select time',
}) {
  const options = generateTimeOptions(min, max, step);
  const selectId = id || name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const handleChange = (e) => {
    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
    if (onChange) {
      onChange(val);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={`${styles.selectWrapper} ${error ? styles.hasError : ''}`}>
        <select
          id={selectId}
          name={name}
          value={value ?? ''}
          onChange={handleChange}
          disabled={disabled}
          aria-label={ariaLabel || label}
          aria-invalid={Boolean(error)}
          className={styles.select}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}

export default TimeSelect;
