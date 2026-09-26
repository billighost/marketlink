import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Calendar, Store, ArrowLeft, Clock, MapPin } from 'lucide-react';
import { getFarmerDetail, getFarmerProducts, getFarmerReviews } from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { useFavorites } from '@/context/FavoritesContext';
import Illustration from '@/components/domain/Illustration';
import ProductCard from '@/components/domain/ProductCard';
import ReviewItem from '@/components/domain/ReviewItem';
import { MapView } from '@/components/domain/MapView';
import Stars from '@/components/ui/Stars';
import Tabs from '@/components/ui/Tabs';
import Skeleton from '@/components/ui/Skeleton';
import styles from './FarmerDetail.module.css';

/**
 * Farmer detail sheet view with Stock, Reviews, and About tabs.
 * Connected to GET /api/farmers/:id, /products, and /reviews with real MapView in About.
 */
export function FarmerDetail({ inSheet = true, onClose }) {
  const { id } = useParams();
  const { isFarmerFavorite, toggleFarmer } = useFavorites();
  const [activeTab, setActiveTab] = useState('stock');
  const [logoError, setLogoError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const { data: farmer, loading, error } = useQuery(
    ['farmer-detail', id],
    ({ signal }) => getFarmerDetail(id, signal)
  );

  const { data: productsData } = useQuery(
    ['farmer-products', id],
    ({ signal }) => getFarmerProducts(id, {}, signal),
    { enabled: Boolean(id) }
  );

  const { data: reviewsData } = useQuery(
    ['farmer-reviews', id],
    ({ signal }) => getFarmerReviews(id, {}, signal),
    { enabled: Boolean(id) }
  );

  if (loading) {
    return (
      <div className={`${styles.container} ${!inSheet ? styles.standalone : ''}`}>
        <div style={{ padding: 'var(--space-6)' }}>
          <Skeleton height="80px" borderRadius="var(--radius-lg)" style={{ marginBottom: 'var(--space-4)' }} />
          <Skeleton height="32px" width="50%" style={{ marginBottom: 'var(--space-2)' }} />
          <Skeleton height="20px" width="30%" style={{ marginBottom: 'var(--space-6)' }} />
          <Skeleton height="160px" borderRadius="var(--radius-md)" />
        </div>
      </div>
    );
  }

  if (error || !farmer) {
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
  const farmerProducts = productsData?.data || [];
  const farmerReviews = reviewsData?.data || [];

  const tabs = [
    { id: 'stock', label: 'Stock', count: farmerProducts.length },
    { id: 'reviews', label: 'Reviews', count: farmerReviews.length },
    { id: 'about', label: 'About' },
  ];

  const farmerMarker = farmer.location?.lat && farmer.location?.lng ? [
    {
      id: farmer.id,
      lat: farmer.location.lat,
      lng: farmer.location.lng,
      label: farmer.stallName,
    },
  ] : [];

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

      {/* Hero Stall Banner */}
      {farmer.bannerUrl && !bannerError && (
        <div className={styles.bannerWrapper} data-aspect="16/9">
          <img
            src={farmer.bannerUrl}
            alt={`${farmer.stallName} banner`}
            loading="lazy"
            className={styles.bannerImg}
            onError={() => setBannerError(true)}
          />
        </div>
      )}

      {/* Hero Stall Header */}
      <header className={styles.hero}>
        <div className={styles.avatarWrapper}>
          {farmer.logoUrl && !logoError ? (
            <img
              src={farmer.logoUrl}
              alt={`${farmer.stallName} logo`}
              loading="lazy"
              className={styles.avatarImg}
              onError={() => setLogoError(true)}
            />
          ) : (
            <Illustration name={farmer.art || 'stall'} size="md" />
          )}
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
              <Stars rating={farmer.ratingAvg || 5} />
              <span className={styles.ratingText}>
                {farmer.ratingAvg?.toFixed(1) || '5.0'} ({farmer.ratingCount || farmerReviews.length})
              </span>
            </div>
            {farmer.stallNumber && (
              <>
                <span className={styles.dot} aria-hidden="true">·</span>
                <span className={styles.stallNumber}>{farmer.stallNumber}</span>
              </>
            )}
          </div>

          {farmer.operatingDays && (
            <div className={styles.daysRow}>
              <Calendar size={14} className={styles.metaIcon} aria-hidden="true" />
              <span>
                At the market: {farmer.operatingDays.map((d) => d.toUpperCase()).join(', ')}
              </span>
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
            {farmerProducts.length > 0 ? (
              farmerProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  farmer={farmer}
                  variant="grid"
                />
              ))
            ) : (
              <p className={styles.emptyText}>No products currently listed for this week.</p>
            )}
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
              <p className={styles.storyText}>
                {farmer.story || 'Dedicated local producer offering fresh harvests directly to community members.'}
              </p>
            </section>

            <section className={styles.aboutSection}>
              <h3 className={styles.aboutTitle}>Farm details</h3>
              <div className={styles.factsList}>
                {farmer.since && (
                  <div className={styles.factRow}>
                    <span className={styles.factLabel}>Growing since</span>
                    <span className={styles.factValue}>{farmer.since}</span>
                  </div>
                )}
                {farmer.stallNumber && (
                  <div className={styles.factRow}>
                    <span className={styles.factLabel}>Market stall</span>
                    <span className={styles.factValue}>{farmer.stallNumber}</span>
                  </div>
                )}
                {farmer.address && (
                  <div className={styles.factRow}>
                    <span className={styles.factLabel}>Location</span>
                    <span className={styles.factValue}>{farmer.address}</span>
                  </div>
                )}
                {farmer.markets?.length > 0 && (
                  <div className={styles.factRow}>
                    <span className={styles.factLabel}>Operating markets</span>
                    <span className={styles.factValue}>
                      {farmer.markets.map((m) => m.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Farm stall map pin */}
            {farmerMarker.length > 0 && (
              <section className={styles.aboutSection}>
                <h3 className={styles.aboutTitle}>Stall & Farm Location</h3>
                <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-wood-hairline)' }}>
                  <MapView
                    markers={farmerMarker}
                    selectedId={farmer.id}
                    height="180px"
                    showDirectionsLink={false}
                  />
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmerDetail;
