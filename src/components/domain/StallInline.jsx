import React from 'react';
import { Link } from 'react-router-dom';
import Illustration from '@/components/domain/Illustration';
import DayDots from '@/components/domain/DayDots';
import styles from './StallInline.module.css';

/**
 * Compact stall strip for the produce page.
 * Bridges from produce to the farmer who grew it.
 *
 * @param {object} farmer Farmer details object
 * @param {object} market Market details object or string
 * @param {string} className
 */
export function StallInline({ farmer, market, className = '' }) {
  if (!farmer) return null;

  const stallName = farmer.stallName || 'Local Farm Stall';
  const farmerName = farmer.ownerName || farmer.farmerName || farmer.name || '';
  const rating = farmer.ratingAvg ? Number(farmer.ratingAvg).toFixed(1) : null;
  const reviewCount = farmer.ratingCount ?? farmer.reviewCount ?? null;

  const marketName =
    (typeof market === 'string' ? market : market?.name) ||
    farmer.marketName ||
    farmer.market?.name ||
    'Local Market';

  // Compute 2-letter initials
  const initials = stallName
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.topRow}>
        <div className={styles.avatar}>
          {farmer.art ? (
            <Illustration name={farmer.art} size="sm" />
          ) : (
            <span className={styles.initials} aria-hidden="true">
              {initials || 'ML'}
            </span>
          )}
        </div>

        <div className={styles.info}>
          <h3 className={styles.stallName}>{stallName}</h3>

          <div className={styles.farmerMeta}>
            {farmerName && <span>{farmerName}</span>}
            {farmerName && (rating || reviewCount) && <span aria-hidden="true">·</span>}
            {rating && (
              <span>
                ★ {rating}
                {reviewCount != null && ` (${reviewCount})`}
              </span>
            )}
          </div>

          <DayDots
            days={farmer.operatingDayNumbers || farmer.operatingDays}
            size="sm"
          />

          {marketName && <div className={styles.marketName}>{marketName}</div>}
        </div>
      </div>

      <div className={styles.linkRow}>
        <Link
          to={`/buyer/stalls/${farmer.id}`}
          className={styles.stallLink}
          aria-label={`See the whole stall for ${stallName}`}
        >
          See the whole stall →
        </Link>
      </div>
    </div>
  );
}

export default StallInline;
