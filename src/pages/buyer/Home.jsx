import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, ArrowRight, ShoppingBag, Sparkles, Clock, Calendar,
  Bell, MapPin, Store, ChevronRight, CheckCircle2, RotateCcw
} from 'lucide-react';
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
import MarketCard from '@/components/domain/MarketCard';
import OrderRow from '@/components/domain/OrderRow';
import { SkeletonCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import styles from './Home.module.css';

/**
 * Flagship Customer Dashboard ("Market" tab).
 * 1. Good morning/afternoon greeting with user's first name
 * 2. Smart Basket flagship card with quick start prompts
 * 3. Upcoming Pickup card with live status and pickup details
 * 4. Favorite Farmers row/carousel
 * 5. Fresh Today products row
 * 6. Nearby Markets with active days and farmer count
 * 7. Restock Alerts and Recent Orders
 * 8. Endless curated feed
 */
export function Home() {
  const { user, selectedMarketId } = useAuth();
  const { openSheet } = useOpenSheet();
  const { sections, loadMore, loading, hasMore } = useFeed();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const sentinelRef = useRef(null);

  const { data: feedMeta } = useQuery(['feed-meta', selectedMarketId], ({ signal }) => getFeedMeta(signal));
  const { data: homeSummary } = useQuery(['home-summary', selectedMarketId], ({ signal }) => getHomeSummary(signal));

  const greetingName = feedMeta?.greetingName || user?.firstName || user?.name?.split(' ')[0] || 'there';
  const scheduleLine =
    feedMeta?.line ||
    (feedMeta?.homeMarket?.name ? `${feedMeta.homeMarket.name} · Open Saturday` : 'Local Farmers Market');

  // Active pickup order from server summary
  const activePickup = homeSummary?.readyForPickup || homeSummary?.nextPickup;

  // Additional summary sections
  const favoriteFarmers = homeSummary?.favoriteFarmers || [];
  const freshToday = homeSummary?.freshToday || [];
  const nearbyMarkets = homeSummary?.nearbyMarkets || [];
  const restockAlerts = homeSummary?.restockAlerts || [];
  const recentOrders = homeSummary?.recentOrders || [];

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

  const handleLaunchSmartBasket = (preset = null) => {
    if (preset) {
      openSheet('/buyer/smart-basket', { state: { smartBasket: preset } });
    } else {
      openSheet('/buyer/smart-basket');
    }
  };

  return (
    <div className={styles.page}>
      {/* ── 1. Header & Greeting Area ────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.greetingGroup}>
          <h1 className={styles.greeting}>{getGreeting(greetingName)} 🌱</h1>
          <p className={styles.marketSchedule}>{scheduleLine}</p>
        </div>

        {/* Search Field */}
        <form className={styles.searchForm} onSubmit={handleSearchSubmit} role="search">
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search farm fresh produce, bakery, meats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search produce, bakery, and farm goods"
          />
        </form>
      </header>

      {/* ── 2. Smart Basket Banner Card ─────────────────────────── */}
      <section className={styles.smartBasketCard} aria-label="Smart Basket Builder">
        <div className={styles.smartBasketCardMain}>
          <div className={styles.smartBasketCardHeader}>
            <div className={styles.smartBasketBadge}>
              <Sparkles size={14} aria-hidden="true" />
              <span>Smart Basket</span>
            </div>
            <h2 className={styles.smartBasketTitle}>Build a Custom Market Basket</h2>
            <p className={styles.smartBasketDesc}>
              Tell us your budget — we will assemble the freshest produce, dairy & bakery items directly from stall inventories.
            </p>
          </div>
          <div className={styles.smartBasketActions}>
            <button
              type="button"
              className={styles.smartBasketBtn}
              onClick={() => handleLaunchSmartBasket()}
              aria-label="Build a Smart Basket"
            >
              <ShoppingBag size={16} aria-hidden="true" />
              <span>Build Smart Basket</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Quick prompt shortcuts */}
        <div className={styles.quickPromptsRow}>
          <span className={styles.quickPromptsLabel}>Quick start:</span>
          <button
            type="button"
            className={styles.quickPromptChip}
            onClick={() =>
              handleLaunchSmartBasket({
                prompt: 'I have ₦10,000. I need vegetables, fruits and eggs for Saturday',
                budget: 10000,
                categories: ['vegetables', 'fruit', 'dairy-and-eggs'],
                pickupDay: 'sat',
              })
            }
          >
            ₦10k Veggies & Eggs
          </button>
          <button
            type="button"
            className={styles.quickPromptChip}
            onClick={() =>
              handleLaunchSmartBasket({
                prompt: 'I have ₦5,000 for fresh vegetables',
                budget: 5000,
                categories: ['vegetables'],
                pickupDay: 'sat',
              })
            }
          >
            ₦5k Fresh Produce
          </button>
          <button
            type="button"
            className={styles.quickPromptChip}
            onClick={() =>
              handleLaunchSmartBasket({
                prompt: 'I have ₦15,000 for weekend family feast',
                budget: 15000,
                categories: ['vegetables', 'fruit', 'dairy-and-eggs', 'bakery'],
                pickupDay: 'sat',
              })
            }
          >
            ₦15k Weekend Feast
          </button>
        </div>
      </section>

      {/* ── 3. Upcoming Pickup Card (when order active) ─────────── */}
      {activePickup && (
        <section className={styles.pickupBanner} aria-label="Active order notification">
          <div className={styles.pickupContent}>
            <div className={styles.pickupIconWrap}>
              <ShoppingBag size={20} className={styles.pickupIcon} aria-hidden="true" />
            </div>
            <div className={styles.pickupText}>
              <div className={styles.pickupStatus}>
                <span className={`${styles.pickupBadge} ${activePickup.status === 'ready' ? styles.pickupBadgeReady : ''}`}>
                  {activePickup.status === 'ready' ? 'Ready for Pickup' : 'Order Placed'}
                </span>
                <span className={styles.pickupNumber}>Order #{activePickup.orderNumber || activePickup.id?.slice(-6)}</span>
              </div>
              <p className={styles.pickupDesc}>
                {activePickup.status === 'ready'
                  ? `Your order is packed and waiting at ${activePickup.farmer?.stallName || 'the stall'}.`
                  : `Scheduled pickup: ${activePickup.pickup?.label || 'Saturday morning window'}`}
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

      {/* ── 4. Favorite Farmers ──────────────────────────────────── */}
      {favoriteFarmers.length > 0 && (
        <div className={styles.sectionWrap}>
          <HorizontalRow
            title="Favorite Farmers"
            subtitle="Direct from your saved growers"
            seeAllLabel="All farmers"
            onSeeAll={() => navigate('/buyer/farmers')}
          >
            {favoriteFarmers.map((farmer) => (
              <FarmerCard
                key={farmer.id}
                farmer={farmer}
                variant="row"
              />
            ))}
          </HorizontalRow>
        </div>
      )}

      {/* ── 5. Fresh Today Products ──────────────────────────────── */}
      {freshToday.length > 0 && (
        <div className={styles.sectionWrap}>
          <HorizontalRow
            title="Fresh Today"
            subtitle="Harvested and delivered for this market"
            seeAllLabel="See all"
            onSeeAll={() => navigate('/buyer/products')}
          >
            {freshToday.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="compact"
              />
            ))}
          </HorizontalRow>
        </div>
      )}

      {/* ── 6. Nearby Markets ────────────────────────────────────── */}
      {nearbyMarkets.length > 0 && (
        <div className={styles.sectionWrap}>
          <HorizontalRow
            title="Nearby Markets"
            subtitle="Find fresh local stalls near you"
            seeAllLabel="Map view"
            onSeeAll={() => navigate('/buyer/markets')}
          >
            {nearbyMarkets.map((market) => (
              <div key={market.id} className={styles.marketCardSlide}>
                <MarketCard
                  market={market}
                  onSelect={() => navigate(`/buyer/markets/${market.id}`)}
                />
              </div>
            ))}
          </HorizontalRow>
        </div>
      )}

      {/* ── 7. Restock Alerts ────────────────────────────────────── */}
      {restockAlerts.length > 0 && (
        <div className={styles.sectionWrap}>
          <HorizontalRow
            title="Back in Stock"
            subtitle="Popular items freshly restocked by local farmers"
            seeAllLabel="Browse all"
            onSeeAll={() => navigate('/buyer/products')}
          >
            {restockAlerts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="compact"
              />
            ))}
          </HorizontalRow>
        </div>
      )}

      {/* ── Recent Orders (if any) ───────────────────────────────── */}
      {recentOrders.length > 0 && (
        <div className={styles.recentOrdersSection}>
          <div className={styles.recentOrdersHeader}>
            <div>
              <h2 className={styles.recentOrdersTitle}>Recent Orders</h2>
              <p className={styles.recentOrdersSub}>Track or reorder past market visits</p>
            </div>
            <button
              type="button"
              className={styles.recentOrdersLink}
              onClick={() => navigate('/buyer/orders')}
            >
              <span>View all</span>
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.recentOrdersList}>
            {recentOrders.slice(0, 3).map((order) => (
              <OrderRow
                key={order.id}
                order={order}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 8. Endless Curated Feed ──────────────────────────────── */}
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

            {/* Assistant callout */}
            {idx === 2 && (
              <div className={styles.assistantCallout}>
                <p className={styles.assistantText}>
                  Not sure what to cook?{' '}
                  <button
                    type="button"
                    onClick={() => openSheet('/buyer/assistant')}
                    className={styles.assistantLink}
                  >
                    Ask MarketLink Assistant
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

        {!loading && sections.length === 0 && (
          <EmptyState
            title="Nothing on the stalls yet"
            text="Farmers are still setting up. Check back soon."
            actionLabel="Browse markets"
            onAction={() => navigate('/buyer/markets')}
          />
        )}

        {/* Intersection Sentinel */}
        <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      </div>
    </div>
  );
}

export default Home;
