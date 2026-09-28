import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import Illustration from '@/components/domain/Illustration';
import DayDots from '@/components/domain/DayDots';
import { useCatalogueRoutes } from '@/components/catalogue/routes';
import styles from './StallInline.module.css';

export function StallInline({ farmer, market, className = '', audience = 'buyer' }) {
  const routes = useCatalogueRoutes(audience);
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Star size={11} fill="currentColor" aria-hidden="true" />
                <span>{rating}</span>
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
          to={routes.stall(farmer.id || farmer._id)}
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
