import React from 'react';
import styles from './TimeSelect.module.css';

/**
 * Formats minutes from midnight into 12-hour am/pm string (e.g. 480 -> "8:00am")
 */
export function formatMinutesToTime(totalMin) {
  if (totalMin === undefined || totalMin === null || isNaN(totalMin)) return '';
  const num = Number(totalMin);
  const hours = Math.floor(num / 60);
  const mins = num % 60;
  const period = hours >= 12 && hours < 24 ? 'pm' : 'am';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMin = mins.toString().padStart(2, '0');
  return `${displayHour}:${displayMin}${period}`;
}

/**
 * Generates options list in 30-minute increments from min to max.
 */
export function generateTimeOptions(startMin = 300, endMin = 1380, stepMin = 30) {
  const options = [];
  for (let m = startMin; m <= endMin; m += stepMin) {
    options.push({
      value: m,
      label: formatMinutesToTime(m),
    });
  }
  return options;
}

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
