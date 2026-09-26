import React from 'react';
import { Link } from 'react-router-dom';
import DayDots from '@/components/domain/DayDots';
import styles from './MarketCard.module.css';

/**
 * MarketCard rewritten as a full-width row card, not a tile.
 * Shows:
 *  - Market name (Idiqlat h3)
 *  - One-line open state from clock
 *  - Meta line (city · distance · stall count)
 *  - DayDots
 *
 * @param {object}   market
 * @param {Function} onSelect
 * @param {boolean}  isSelected
 * @param {string}   className
 */
export function MarketCard({
  market,
  onSelect,
  isSelected = false,
  className = '',
}) {
  if (!market) return null;

  const clock = market.clock;
  const isOpen = Boolean(clock?.openNow);

  // Derive city from city property or address
  const city =
    market.city ||
    (market.address && market.address.includes(',')
      ? market.address.split(',')[1]?.trim()
      : market.address) ||
    '';

  const distance =
    market.distance ||
    (typeof market.distanceKm === 'number'
      ? `${market.distanceKm.toFixed(1)} km`
      : null);

  const farmerCount = market.farmerCount ?? market.stallCount ?? market.attendingCount ?? null;
  const stallCountText =
    farmerCount != null
      ? `${farmerCount} ${farmerCount === 1 ? 'stall' : 'stalls'}`
      : null;

  const metaParts = [city, distance, stallCountText].filter(Boolean);

  const days =
    market.operatingDayNumbers ||
    (Array.isArray(market.schedule) ? market.schedule.map((s) => s.day) : []);

  const handleClick = (e) => {
    if (onSelect) {
      onSelect(market);
    }
  };

  return (
    <article
      className={`${styles.card} ${isSelected ? styles.selectedCard : ''} ${className}`}
      aria-label={`${market.name}${city ? `, ${city}` : ''}`}
      onClick={handleClick}
    >
      <Link
        to={`/buyer/markets/${market.id}`}
        className={styles.stretchedLink}
        tabIndex={0}
        aria-label={`View ${market.name}`}
      />

      <div className={styles.header}>
        <h3 className={styles.name}>{market.name}</h3>
      </div>

      {/* One-line open state from clock */}
      <div className={styles.statusLine}>
        {isOpen ? (
          <>
            <span className={styles.statusDotOpen} aria-hidden="true">●</span>
            <span className={styles.statusOpen}>open now</span>
            {clock?.closesAtLabel && (
              <>
                <span className={styles.sep} aria-hidden="true">·</span>
                <span className={styles.statusMuted}>closes {clock.closesAtLabel}</span>
              </>
            )}
          </>
        ) : (
          <>
            <span className={styles.statusDotClosed} aria-hidden="true">●</span>
            {clock?.windowLabel && <span className={styles.statusMuted}>{clock.windowLabel}</span>}
            {clock?.windowLabel && clock?.nextOpenLabel && (
              <span className={styles.sep} aria-hidden="true">·</span>
            )}
            {clock?.nextOpenLabel && (
              <span className={styles.statusMuted}>{clock.nextOpenLabel}</span>
            )}
            {!clock?.windowLabel && !clock?.nextOpenLabel && (
              <span className={styles.statusMuted}>Check schedule</span>
            )}
          </>
        )}
      </div>

      {/* Meta line: city · distance · stall count */}
      {metaParts.length > 0 && (
        <div className={styles.metaLine}>
          {metaParts.map((part, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className={styles.sep} aria-hidden="true">·</span>}
              <span>{part}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Seven day-dots */}
      <div className={styles.daysWrapper}>
        <DayDots days={days} size="sm" />
      </div>
    </article>
  );
}

export default MarketCard;
