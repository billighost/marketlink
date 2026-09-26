import React from 'react';
import { Star } from 'lucide-react';
import styles from './Stars.module.css';

/**
 * Star rating display (read-only) and interactive input.
 * Read-only: fill with ink, outline for empty.
 * Interactive: radio-group for submitting reviews.
 */
export function Stars({ rating = 0, max = 5, interactive = false, onChange, className = '' }) {
  if (interactive) {
    return (
      <div className={`${styles.stars} ${className}`} role="radiogroup" aria-label="Rating">
        {Array.from({ length: max }, (_, i) => {
          const value = i + 1;
          return (
            <label key={value} className={styles.starLabel}>
              <input
                type="radio"
                name="star-rating"
                value={value}
                checked={rating === value}
                onChange={() => onChange?.(value)}
                className="visuallyHidden"
              />
              <Star
                size={24}
                strokeWidth={1.5}
                className={value <= rating ? styles.filled : styles.empty}
                fill={value <= rating ? 'currentColor' : 'none'}
              />
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`${styles.stars} ${className}`} aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={14}
          strokeWidth={1.5}
          className={i < Math.round(rating) ? styles.filled : styles.empty}
          fill={i < Math.round(rating) ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default Stars;
