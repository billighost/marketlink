import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from './StatTile.module.css';

/**
 * One platform metric. Value, label, and an optional delta with direction.
 *
 * @param {string|number} value · @param {string} label
 * @param {string} delta      e.g. "+12 this week"
 * @param {'up'|'down'|'flat'} direction
 * @param {string} to         optional; makes the whole tile a link to the relevant page
 */
export function StatTile({ value, label, delta, direction = 'flat', to }) {
  const deltaClass =
    direction === 'up'
      ? styles.deltaUp
      : direction === 'down'
      ? styles.deltaDown
      : styles.deltaFlat;

  const DirectionIcon =
    direction === 'up'
      ? TrendingUp
      : direction === 'down'
      ? TrendingDown
      : Minus;

  const directionText =
    direction === 'up'
      ? 'Increased by'
      : direction === 'down'
      ? 'Decreased by'
      : 'Constant at';

  const content = (
    <>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {delta && (
        <span className={`${styles.deltaWrapper} ${deltaClass}`}>
          <DirectionIcon size={14} aria-hidden="true" />
          <span className="sr-only">{directionText} </span>
          <span>{delta}</span>
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${styles.tile} ${styles.tileLink}`}>
        {content}
      </Link>
    );
  }

  return <div className={styles.tile}>{content}</div>;
}

export default StatTile;
