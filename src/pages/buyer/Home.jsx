import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Sparkles, Clock, ArrowRight, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOpenSheet } from '@/hooks/useOpenSheet';
import { useFeed } from '@/hooks/useFeed';
import { getGreeting } from '@/utils/greeting';
import { orders, categories, homeMarket, getMarket } from '@/data/placeholders';
import HorizontalRow from '@/components/layout/HorizontalRow';
import ProductCard from '@/components/domain/ProductCard';
import FarmerCard from '@/components/domain/FarmerCard';
import Chip from '@/components/ui/Chip';
import StatusDot from '@/components/ui/StatusDot';
import { SkeletonCard } from '@/components/ui/Skeleton';
import styles from './Home.module.css';

/**
 * Customer Home page ("Market" tab).
 * Mobile-first curated and endless shopping experience.
 */
export function Home() {
  const { user } = useAuth();
  const { openSheet } = useOpenSheet();
  const { sections, loadMore, loading, hasMore } = useFeed();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const sentinelRef = useRef(null);

  const currentMarket = (user?.homeMarketId ? getMarket(user.homeMarketId) : null) || homeMarket;
  const displayName = user?.firstName || user?.name?.split(' ')[0] || 'there';

  // Check for any active orders
  const activeOrder = orders.find(
    (o) => o.status === 'Ready for pickup' || o.status === 'Accepted' || o.status === 'Placed'
  );

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

  const handleCategoryClick = (categoryName) => {
    if (categoryName === 'All') {
      navigate('/buyer/products');
    } else {
      navigate(`/buyer/products?category=${encodeURIComponent(categoryName)}`);
    }
  };

  const handleOpenAssistant = () => {
    openSheet('/buyer/assistant');
  };

  const handleOpenActiveOrder = () => {
    if (activeOrder) {
      openSheet(`/buyer/orders/${activeOrder.id}`);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Header Area ──────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.greetingGroup}>
          <h1 className={styles.greeting}>{getGreeting(displayName)}</h1>
          <div className={styles.marketStatus}>
            <StatusDot label="Open Saturday" tone="success" />
            <span className={styles.marketSchedule}>
              {currentMarket.name} · 8 am – 1 pm
            </span>
          </div>
        </div>

        {/* Search & Assistant Pill */}
        <div className={styles.searchRow}>
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

          <button
            type="button"
            className={styles.assistantPill}
            onClick={handleOpenAssistant}
            aria-label="Ask MarketLink shopping assistant"
          >
            <Sparkles size={16} className={styles.sparkleIcon} aria-hidden="true" />
            <span>Ask</span>
          </button>
        </div>
      </header>

      {/* ── Active Pickup Banner (if active order exists) ─────────────── */}
      {activeOrder && (
        <section className={styles.pickupBanner} aria-label="Active order notification">
          <div className={styles.pickupContent}>
            <div className={styles.pickupIconWrap}>
              <ShoppingBag size={20} className={styles.pickupIcon} aria-hidden="true" />
            </div>
            <div className={styles.pickupText}>
              <div className={styles.pickupStatus}>
                <span className={styles.pickupBadge}>{activeOrder.status}</span>
                <span className={styles.pickupNumber}>{activeOrder.number}</span>
              </div>
              <p className={styles.pickupDesc}>
                {activeOrder.status === 'Ready for pickup'
                  ? 'Your order is packed and waiting at the market stall.'
                  : `Scheduled pickup: ${activeOrder.pickupSlot}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.pickupAction}
            onClick={handleOpenActiveOrder}
            aria-label={`View order ${activeOrder.number} details`}
          >
            <span>View order</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      )}

      {/* ── Category Chips Row ────────────────────────────────────────── */}
      <nav className={styles.categoryNav} aria-label="Product categories">
        <div className={styles.categoryScroll}>
          <Chip onClick={() => handleCategoryClick('All')} selected={false}>
            All
          </Chip>
          {categories.map((cat) => (
            <Chip
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              selected={false}
            >
              {cat}
            </Chip>
          ))}
        </div>
      </nav>

      {/* ── Curated & Endless Feed ────────────────────────────────────── */}
      <div className={styles.feed}>
        {sections.map((section) => (
          <div key={section.id} className={styles.sectionWrap}>
            <HorizontalRow
              title={section.title}
              subtitle={section.subtitle}
              seeAllLabel="See all"
              onSeeAll={() => navigate(section.seeAllPath)}
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

            {/* Punctuation Divider */}
            {section.punctuation && (
              <div className={styles.punctuation} aria-hidden="true">
                <blockquote className={styles.punctuationQuote}>
                  “{section.punctuation.text}”
                </blockquote>
                {section.punctuation.author && (
                  <cite className={styles.punctuationAuthor}>
                    — {section.punctuation.author}
                  </cite>
                )}
              </div>
            )}
          </div>
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
