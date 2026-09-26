import React from 'react';
import styles from './MarketClock.module.css';

/**
 * The market-day clock. One quiet line, plus a hairline progress rule while the market is open.
 *
 * Closed:  "Riverbend Market · Saturday 8:00–13:00 · opens in 2 days"
 * Open:    "Riverbend Market · open now · closes 13:00"   + progress rule
 *
 * @param {string}  marketName
 * @param {boolean} openNow
 * @param {string}  windowLabel   e.g. "Saturday 8:00–13:00"
 * @param {string}  nextOpenLabel e.g. "opens in 2 days"
 * @param {string}  closesAtLabel e.g. "13:00"
 * @param {number}  progress      0 to 1, how far through today's window. Only used when openNow.
 */
export function MarketClock({
  marketName,
  openNow = false,
  windowLabel,
  nextOpenLabel,
  closesAtLabel,
  progress = 0,
}) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  const hasSchedule = openNow || Boolean(windowLabel) || Boolean(nextOpenLabel);

  return (
    <div className={styles.clock}>
      <p className={styles.line}>
        <span className={styles.market}>{marketName}</span>
        {hasSchedule && (
          <>
            <span className={styles.sep} aria-hidden="true">·</span>
            {openNow ? (
              <>
                <span className={styles.open}>open now</span>
                <span className={styles.sep} aria-hidden="true">·</span>
                <span className={styles.muted}>closes {closesAtLabel}</span>
              </>
            ) : (
              <>
                {windowLabel && <span className={styles.muted}>{windowLabel}</span>}
                {windowLabel && nextOpenLabel && (
                  <span className={styles.sep} aria-hidden="true">·</span>
                )}
                {nextOpenLabel && <span className={styles.muted}>{nextOpenLabel}</span>}
              </>
            )}
          </>
        )}
      </p>

      {openNow && (
        <div
          className={styles.track}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-label={`Market day progress, closes ${closesAtLabel}`}
        >
          <div className={styles.fill} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default MarketClock;
