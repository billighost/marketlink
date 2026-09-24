import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Illustration from '@/components/domain/Illustration';
import styles from './FarmerCard.module.css';

/**
 * Farmer card component.
 * Minimal design system specifications:
 *  - Tile aspect ratio 4/3 with centered illustration
 *  - Reserved 2-line stall name height prevents ragged cards in rows
 *  - Single muted line (specialty / stall)
 *  - Heart removed from card (lives in Farmer sheet and Favourites)
 *  - Stretched link covers card cleanly with zero overlapping buttons
 */
export function FarmerCard({
  farmer,
  variant = 'row',
  className = '',
}) {
  const location = useLocation();

  if (!farmer) return null;

  const farmerSheetPath = `/buyer/farmers/${farmer.id}`;
  const linkState = { background: location.state?.background || location };

  return (
    <article
      className={`${styles.card} ${styles[variant] || styles.row} ${className}`}
      aria-label={`${farmer.stallName}, ${farmer.specialty}`}
    >
      <Link
        to={farmerSheetPath}
        state={linkState}
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
          <h3 className={styles.stallName}>{farmer.stallName}</h3>
          <p className={styles.specialty}>{farmer.specialty}</p>
        </div>

        <div className={styles.meta}>
          <span className={styles.stallNumber}>{farmer.stallNumber}</span>
        </div>
      </div>
    </article>
  );
}

export default FarmerCard;
