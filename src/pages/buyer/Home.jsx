import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ArrowRight, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOpenSheet } from '@/hooks/useOpenSheet';
import { useFeed } from '@/hooks/useFeed';
import { useQuery } from '@/hooks/useQuery';
import { getFeedMeta } from '@/api/catalog';
import { getHomeSummary } from '@/api/me';
import { getGreeting } from '@/utils/greeting';
import HorizontalRow from '@/components/layout/HorizontalRow';
import ProductCard from '@/components/domain/ProductCard';
import FarmerCard from '@/components/domain/FarmerCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import styles from './Home.module.css';

/**
 * Customer Home page ("Market" tab).
 * Minimal UI specifications:
 *  - Density budget: greeting h1, one muted line, one search field, then first row
 *  - Feed sections loaded from GET /api/feed with cursor-based endless scroll
 *  - Active pickup notification from GET /api/home/summary
 *  - Sub-line from GET /api/feed/meta
 */
export function Home() {
  const { user } = useAuth();
  const { openSheet } = useOpenSheet();
  const { sections, loadMore, loading, hasMore } = useFeed();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const sentinelRef = useRef(null);

  const { data: feedMeta } = useQuery(['feed-meta'], ({ signal }) => getFeedMeta(signal));
  const { data: homeSummary } = useQuery(['home-summary'], ({ signal }) => getHomeSummary(signal));

  const greetingName = feedMeta?.greetingName || user?.firstName || user?.name?.split(' ')[0] || 'there';
  const scheduleLine =
    feedMeta?.line ||
    (feedMeta?.homeMarket?.name ? `${feedMeta.homeMarket.name} · Open Saturday` : 'Local Farmers Market');

  // Active pickup order from server summary
  const activePickup = homeSummary?.readyForPickup || homeSummary?.nextPickup;

  // IntersectionObserver to load endless feed sections as user scrolls down
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, loading, hasMore]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/buyer/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/buyer/products');
    }
  };

  const handleOpenActiveOrder = () => {
    if (activePickup?.id) {
      openSheet(`/buyer/orders/${activePickup.id}`);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Header Area ──────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.greetingGroup}>
          <h1 className={styles.greeting}>{getGreeting(greetingName)}</h1>
          <p className={styles.marketSchedule}>{scheduleLine}</p>
        </div>

        {/* Clean, full-width search field */}
        <form className={styles.searchForm} onSubmit={handleSearchSubmit} role="search">
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search farm fresh produce, bakery..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search produce, bakery, and farm goods"
          />
        </form>
      </header>

      {/* ── Active Pickup Banner (if active order exists) ─────────────── */}
      {activePickup && (
        <section className={styles.pickupBanner} aria-label="Active order notification">
          <div className={styles.pickupContent}>
            <div className={styles.pickupIconWrap}>
              <ShoppingBag size={20} className={styles.pickupIcon} aria-hidden="true" />
            </div>
            <div className={styles.pickupText}>
              <div className={styles.pickupStatus}>
                <span className={styles.pickupBadge}>
                  {activePickup.status === 'ready' ? 'Ready for pickup' : 'Order Placed'}
                </span>
                <span className={styles.pickupNumber}>{activePickup.orderNumber}</span>
              </div>
              <p className={styles.pickupDesc}>
                {activePickup.status === 'ready'
                  ? `Your order is packed and waiting at ${activePickup.farmer?.stallName || 'the stall'}.`
                  : `Scheduled pickup: ${activePickup.pickup?.label || 'Saturday window'}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.pickupAction}
            onClick={handleOpenActiveOrder}
            aria-label={`View order ${activePickup.orderNumber} details`}
          >
            <span>View order</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      )}

      {/* ── Curated & Endless Feed ────────────────────────────────────── */}
      <div className={styles.feed}>
        {sections.map((section, idx) => (
          <React.Fragment key={section.id}>
            <div className={styles.sectionWrap}>
              <HorizontalRow
                title={section.title}
                subtitle={section.subtitle}
                seeAllLabel="See all"
                onSeeAll={() => navigate(section.seeAllPath || '/buyer/products')}
              >
                {section.items.map((item) => {
                  if (section.type === 'farmers') {
                    return (
                      <FarmerCard
                        key={item.id}
                        farmer={item}
                        variant={section.cardVariant || 'row'}
                      />
                    );
                  }
                  return (
                    <ProductCard
                      key={item.id}
                      product={item}
                      variant={section.cardVariant || 'compact'}
                    />
                  );
                })}
              </HorizontalRow>
            </div>

            {/* Quiet assistant line after the 3rd section */}
            {idx === 2 && (
              <div className={styles.assistantCallout}>
                <p className={styles.assistantText}>
                  Not sure what to cook?{' '}
                  <button
                    type="button"
                    onClick={() => openSheet('/buyer/assistant')}
                    className={styles.assistantLink}
                  >
                    Ask MarketLink
                  </button>
                  .
                </p>
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Loading Skeletons */}
        {loading && (
          <div className={styles.skeletonRow} aria-label="Loading more market items">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Intersection Sentinel */}
        <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      </div>
    </div>
  );
}

export default Home;
