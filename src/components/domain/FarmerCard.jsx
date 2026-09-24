import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import Illustration from '@/components/domain/Illustration';
import Stars from '@/components/ui/Stars';
import Badge from '@/components/ui/Badge';
import styles from './FarmerCard.module.css';

/**
 * Farmer card component.
 * Variants:
 *  - 'row': Compact card for horizontal scrolling feeds
 *  - 'list': Wider card for the Farmers directory page
 */
export function FarmerCard({
  farmer,
  variant = 'row',
  className = '',
}) {
  const location = useLocation();
  const { isFarmerFavorite, toggleFarmer } = useFavorites();

  if (!farmer) return null;

  const isFavorite = isFarmerFavorite(farmer.id);

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFarmer(farmer.id);
  };

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
        aria-label={`View ${farmer.stallName}`}
      />

      {/* Top / Left: Avatar image container */}
      <div className={styles.imageTile}>
        <div className={styles.illustrationWrapper}>
          <Illustration
            name={farmer.art || 'crate-carrots'}
            size={variant === 'list' ? 'lg' : 'md'}
          />
        </div>

        {/* Favorite heart button */}
        <button
          type="button"
          className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`}
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? `Remove ${farmer.stallName} from favorites` : `Save ${farmer.stallName} to favorites`}
          aria-pressed={isFavorite}
        >
          <Heart
            size={18}
            strokeWidth={1.75}
            fill={isFavorite ? 'var(--color-beet)' : 'none'}
            className={styles.heartIcon}
            aria-hidden="true"
          />
        </button>

        {farmer.isTopSeller && (
          <div className={styles.badgeWrapper}>
            <Badge variant="neutral" size="sm">Top seller</Badge>
          </div>
        )}
      </div>

      {/* Details Content */}
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.stallName}>{farmer.stallName}</h3>
          <p className={styles.specialty}>{farmer.specialty}</p>
        </div>

        <div className={styles.meta}>
          <div className={styles.ratingRow}>
            <Stars rating={farmer.rating} />
            <span className={styles.ratingText}>
              {farmer.rating} <span className={styles.reviewCount}>({farmer.reviewCount})</span>
            </span>
          </div>

          <div className={styles.locationDays}>
            <span>{farmer.stallNumber}</span>
            {farmer.days && farmer.days.length > 0 && (
              <>
                <span className={styles.dot} aria-hidden="true">·</span>
                <span>{farmer.days.join(', ')}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default FarmerCard;
