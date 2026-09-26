import React from 'react';
import styles from './DayDots.module.css';

const DAY_CODE_TO_NUM = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Seven day markers, Sunday first, filled for days this stall trades.
 * The group carries one accessible label; the individual dots are decorative.
 *
 * @param {Array<number|string|object>} days  from farmer.operatingDayNumbers — ints 0=Sunday..6=Saturday
 * @param {'sm'|'md'} size                    sm = 24px (inline), md = 28px (stall page)
 * @param {number}   today                   0..6, current weekday in market timezone; gets a ring
 */
export function DayDots({ days = [], size = 'sm', today }) {
  const active = Array.isArray(days)
    ? Array.from(
        new Set(
          days
            .map((d) => {
              if (typeof d === 'number') return d;
              if (typeof d === 'string') return DAY_CODE_TO_NUM[d.toLowerCase()];
              if (d && typeof d.day === 'string') return DAY_CODE_TO_NUM[d.day.toLowerCase()];
              if (d && typeof d.day === 'number') return d.day;
              return undefined;
            })
            .filter((n) => typeof n === 'number' && !isNaN(n) && n >= 0 && n <= 6)
        )
      )
    : [];

  const label = active.length
    ? `Trades on ${active.map((d) => NAMES[d]).join(', ')}`
    : 'Trading days not listed';

  return (
    <div className={`${styles.days} ${styles[size] || styles.sm}`} role="img" aria-label={label}>
      {LETTERS.map((letter, i) => (
        <span
          key={i}
          className={[
            active.includes(i) ? styles.on : styles.off,
            i === today ? styles.today : '',
          ].filter(Boolean).join(' ')}
          aria-hidden="true"
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

export default DayDots;
