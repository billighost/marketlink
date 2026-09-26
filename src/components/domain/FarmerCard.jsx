import React from 'react';
import { Link } from 'react-router-dom';
import Illustration from '@/components/domain/Illustration';
import styles from './FarmerCard.module.css';

function getStallInitials(name) {
  if (!name) return 'S';
  const words = name.trim().split(/\s+/).filter((w) => /^[a-zA-Z0-9]/.test(w));
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return (words[0]?.slice(0, 2) || 'S').toUpperCase();
}

/**
 * Farmer card component.
 * Minimal design system specifications:
 *  - Tile aspect ratio 4/3 with centered illustration (row/list/grid)
 *  - Variant 'stall': 40px avatar with initials, 2-line reserved stall name,
 *    contact/specialty line, open/closed status, and optional low-stock warning.
 *  - Reserved heights prevent ragged cards in rows
 *  - Stretched link covers card cleanly with zero overlapping buttons
 */
export function FarmerCard({
  farmer,
  variant = 'row',
  className = '',
}) {
  if (!farmer) return null;

  if (variant === 'stall') {
    const initials = getStallInitials(farmer.stallName);
    const farmerSub = farmer.contactPerson || farmer.specialty || '';
    const hasLowStock = Boolean(farmer.lowStockCount && farmer.lowStockCount > 0);

    return (
      <article
        className={`${styles.card} ${styles.stall} ${className}`}
        aria-label={`${farmer.stallName}, ${farmerSub}`}
      >
        <Link
          to={`/buyer/stalls/${farmer.id}`}
          className={styles.stretchedLink}
          tabIndex={0}
          aria-label={`View stall ${farmer.stallName}`}
        />

        {/* 40px round avatar: initials on --color-beet-tint */}
        <div className={styles.stallAvatar} aria-hidden="true">
          <span className={styles.stallInitials}>{initials}</span>
        </div>

        {/* Details Content */}
        <div className={styles.stallContent}>
          <h3 className={styles.stallHeading}>{farmer.stallName}</h3>
          <p className={styles.stallSub}>{farmerSub || '\u00A0'}</p>
          <div className={styles.stallStatus}>
            {farmer.openToday ? (
              <>
                <span className={styles.herbDot} aria-hidden="true" />
                <span className={styles.openText}>Open today</span>
              </>
            ) : (
              <span className={styles.notOpenText}>Not here today</span>
            )}
          </div>
          <div className={styles.lowStockRow}>
            {hasLowStock ? (
              <span className={styles.lowStockText}>
                {farmer.lowStockCount} {farmer.lowStockCount === 1 ? 'item low' : 'items low'}
              </span>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`${styles.card} ${styles[variant] || styles.row} ${className}`}
      aria-label={`${farmer.stallName}, ${farmer.specialty}`}
    >
      <Link
        to={`/buyer/stalls/${farmer.id}`}
        className={styles.stretchedLink}
        tabIndex={0}
        aria-label={`View stall ${farmer.stallName}`}
      />

      {/* Top / Left: Illustration container */}
      <div className={styles.imageTile} data-aspect="4/3">
        <div className={styles.illustrationWrapper}>
          <Illustration
            name={farmer.art || 'crate-carrots'}
            size="md"
          />
        </div>
      </div>

      {/* Details Content */}
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h3 className={styles.stallName}>{farmer.stallName}</h3>
            {farmer.isTopSeller && (
              <span className={styles.topSellerBadge}>Top Seller</span>
            )}
          </div>
          <p className={styles.specialty}>{farmer.specialty}</p>
        </div>

        <div className={styles.meta}>
          <div className={styles.ratingBadge}>
            <span className={styles.starIcon}>★</span>
            <span className={styles.ratingValue}>{farmer.rating}</span>
            <span className={styles.reviewCount}>({farmer.reviewCount})</span>
          </div>
          <span className={styles.metaDot} aria-hidden="true">·</span>
          <span className={styles.stallNumber}>{farmer.stallNumber}</span>
        </div>
      </div>
    </article>
  );
}

export default FarmerCard;
