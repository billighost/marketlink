import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Calendar, Store, ArrowLeft } from 'lucide-react';
import { getFarmer, getProductsByFarmer, getReviewsByFarmer } from '@/data/placeholders';
import { useFavorites } from '@/context/FavoritesContext';
import Illustration from '@/components/domain/Illustration';
import ProductCard from '@/components/domain/ProductCard';
import ReviewItem from '@/components/domain/ReviewItem';
import Stars from '@/components/ui/Stars';
import Tabs from '@/components/ui/Tabs';
import styles from './FarmerDetail.module.css';

/**
 * Farmer detail sheet view with Stock, Reviews, and About tabs.
 */
export function FarmerDetail({ inSheet = true, onClose }) {
  const { id } = useParams();
  const { isFarmerFavorite, toggleFarmer } = useFavorites();
  const [activeTab, setActiveTab] = useState('stock');

  const farmer = getFarmer(id);

  if (!farmer) {
    return (
      <div className={styles.notFound}>
        <h2>Farmer not found</h2>
        <button type="button" className={styles.backLink} onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  const isFavorite = isFarmerFavorite(farmer.id);
  const farmerProducts = getProductsByFarmer(farmer.id);
  const farmerReviews = getReviewsByFarmer(farmer.id);

  const tabs = [
    { id: 'stock', label: 'Stock', count: farmerProducts.length },
    { id: 'reviews', label: 'Reviews', count: farmerReviews.length },
    { id: 'about', label: 'About' },
  ];

  return (
    <div className={`${styles.container} ${!inSheet ? styles.standalone : ''}`}>
      {!inSheet && (
        <div className={styles.fallbackHeader}>
          <Link to="/buyer/farmers" className={styles.backButton}>
            <ArrowLeft size={20} aria-hidden="true" />
            <span>Back to farmers</span>
          </Link>
        </div>
      )}

      {/* Hero Stall Header */}
      <header className={styles.hero}>
        <div className={styles.avatarWrapper}>
          <Illustration name={farmer.art || 'crate-carrots'} size="md" />
        </div>

        <div className={styles.heroDetails}>
          <div className={styles.nameRow}>
            <h1 className={styles.stallName}>{farmer.stallName}</h1>
            <button
              type="button"
              className={`${styles.favoriteButton} ${isFavorite ? styles.favorited : ''}`}
              onClick={() => toggleFarmer(farmer.id)}
              aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart
                size={20}
                strokeWidth={1.75}
                fill={isFavorite ? 'var(--color-beet)' : 'none'}
                aria-hidden="true"
              />
            </button>
          </div>

          <p className={styles.specialty}>{farmer.specialty}</p>

          <div className={styles.metaRow}>
            <div className={styles.ratingRow}>
              <Stars rating={farmer.rating} />
              <span className={styles.ratingText}>
                {farmer.rating} ({farmer.reviewCount})
              </span>
            </div>
            <span className={styles.dot} aria-hidden="true">·</span>
            <span className={styles.stallNumber}>{farmer.stallNumber}</span>
          </div>

          {farmer.days && (
            <div className={styles.daysRow}>
              <Calendar size={14} className={styles.metaIcon} aria-hidden="true" />
              <span>At the market: {farmer.days.join(', ')}</span>
            </div>
          )}
        </div>
      </header>

      {/* Tabs Switcher */}
      <div className={styles.tabsWrapper}>
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Panels */}
      <div className={styles.tabContent}>
        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <div className={styles.productGrid}>
            {farmerProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                farmer={farmer}
                variant="grid"
              />
            ))}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className={styles.reviewsList}>
            {farmerReviews.length > 0 ? (
              farmerReviews.map((rev) => (
                <ReviewItem key={rev.id} review={rev} />
              ))
            ) : (
              <p className={styles.emptyText}>No reviews yet for this farmer stall.</p>
            )}
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className={styles.aboutPanel}>
            <section className={styles.aboutSection}>
              <h3 className={styles.aboutTitle}>Our story</h3>
              <p className={styles.storyText}>{farmer.story}</p>
            </section>

            <section className={styles.aboutSection}>
              <h3 className={styles.aboutTitle}>Farm details</h3>
              <div className={styles.factsList}>
                <div className={styles.factRow}>
                  <span className={styles.factLabel}>Growing since</span>
                  <span className={styles.factValue}>{farmer.since}</span>
                </div>
                <div className={styles.factRow}>
                  <span className={styles.factLabel}>Market stall</span>
                  <span className={styles.factValue}>{farmer.stallNumber}</span>
                </div>
                <div className={styles.factRow}>
                  <span className={styles.factLabel}>Pre-order cut-off</span>
                  <span className={styles.factValue}>Friday, 6:00 pm</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmerDetail;
