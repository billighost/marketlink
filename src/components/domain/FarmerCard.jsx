import React from 'react';
import { Star } from 'lucide-react';
import Card from '@/components/ui/Card';
import Illustration from '@/components/domain/Illustration';
import styles from './FarmerCard.module.css';

/**
 * FarmerCard for showcasing local farms and bakers.
 * On guest pages, cards are display-only (no link, no button).
 */
export function FarmerCard({ farmer, className = '' }) {
  const { name, description, rating, reviewCount, illustration = 'crate' } = farmer;

  return (
    <Card padding="none" className={`${styles.card} ${className}`}>
      <div className={styles.imageBox} aria-hidden="true">
        <Illustration name={illustration} size="lg" />
      </div>
      <div className={styles.body}>
        <div className={styles.headerRow}>
          <h3 className={styles.name}>{name}</h3>
          {rating && (
            <div className={styles.rating} aria-label={`Rating ${rating} out of 5 stars`}>
              <Star size={14} strokeWidth={1.5} className={styles.starIcon} aria-hidden="true" />
              <span className={styles.ratingScore}>{rating}</span>
              {reviewCount && (
                <span className={styles.reviewCount}>({reviewCount})</span>
              )}
            </div>
          )}
        </div>
        <p className={styles.description}>{description}</p>
      </div>
    </Card>
  );
}

export default FarmerCard;
