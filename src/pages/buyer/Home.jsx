import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  ShoppingBag,
  Store,
  Sparkles,
  MapPin,
  Clock,
  Heart,
  ChevronRight,
  Bell,
  Map,
  Star,
  TrendingUp,
  Package,
  Bookmark,
  Users,
  Leaf,
  Grid3X3,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOpenSheet } from '@/hooks/useOpenSheet';
import { useFeed } from '@/hooks/useFeed';
import { useNotifications } from '@/context/NotificationContext';
import { getGreeting } from '@/utils/greeting';
import { orders, homeMarket, getMarket, categories, farmers, products, markets } from '@/data/placeholders';
import HorizontalRow from '@/components/layout/HorizontalRow';
import ProductCard from '@/components/domain/ProductCard';
import FarmerCard from '@/components/domain/FarmerCard';
import MarketCard from '@/components/domain/MarketCard';
import GlobalSearchModal from '@/components/domain/GlobalSearchModal';
import { SkeletonCard } from '@/components/ui/Skeleton';
import styles from './Home.module.css';

const QUICK_ACTIONS = [
  { label: 'Nearby Markets',   icon: Store,         path: '/buyer/markets',            sub: '4 markets near you',      color: 'market'  },
  { label: 'Fresh Produce',    icon: Leaf,          path: '/buyer/products',           sub: '36 seasonal picks',       color: 'produce' },
  { label: 'Local Farmers',    icon: Users,         path: '/buyer/farmers',            sub: '12 independent growers',  color: 'farmer'  },
  { label: 'Explore Map',      icon: Map,           path: '/buyer/markets?view=map',   sub: 'Find stalls on a map',    color: 'map'     },
  { label: 'My Orders',        icon: Package,       path: '/buyer/orders',             sub: 'Track your pickups',      color: 'orders'  },
  { label: 'Customer Reviews', icon: Star,          path: '/buyer/reviews',            sub: 'Verified pickup ratings', color: 'reviews' },
  { label: 'Favorites',        icon: Heart,         path: '/buyer/favorites',          sub: 'Saved items & stalls',    color: 'faves'   },
  { label: 'AI Assistant',     icon: Sparkles,      path: '/buyer/assistant',          sub: 'Ask about this weekend',  color: 'ai'      },
];

const AI_PROMPTS = [
  "What's fresh this Saturday?",
  "Who sells organic eggs?",
  "Best honey near me?",
  "Sourdough stall hours?",
];

/**
 * Customer Dashboard Home — fully-featured market experience
 */
export function Home() {
  const { user } = useAuth();
  const { openSheet } = useOpenSheet();
  const { sections, loadMore, loading, hasMore } = useFeed();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const sentinelRef = useRef(null);

  const currentMarket = (user?.homeMarketId ? getMarket(user.homeMarketId) : null) || homeMarket;
  const displayName = user?.firstName || user?.name?.split(' ')[0] || 'there';

  const activeOrder = orders.find(
    (o) => o.status === 'Ready for pickup' || o.status === 'Accepted' || o.status === 'Placed'
  );

  const favoriteFarmers = farmers.slice(0, 3);
  const featuredProducts = products.filter(p => p.tags?.includes('bestseller')).slice(0, 4);
  const upcomingPickup = activeOrder ? orders.find(o => o.status === 'Accepted') || activeOrder : null;

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !loading) loadMore(); },
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

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    navigate(`/buyer/products?category=${encodeURIComponent(cat)}`);
  };

  const handleOpenActiveOrder = () => {
    if (activeOrder) openSheet(`/buyer/orders/${activeOrder.id}`);
  };

  return (
    <div className={styles.page}>

      {/* ── 1. Hero Header ─────────────────────────────────────────────── */}
      <header className={styles.header}>
        {/* Top row: greeting + notification bell */}
        <div className={styles.greetingRow}>
          <div className={styles.greetingGroup}>
            <div className={styles.badgeRow}>
              <span className={styles.statusPill}>
                <span className={styles.pulseDot} />
                Saturday Market
              </span>
              <span className={styles.timePill}>
                <Clock size={11} />
                8:00 AM – 1:00 PM
              </span>
            </div>
            <h1 className={styles.greeting}>{getGreeting(displayName)}</h1>
            <p className={styles.marketSchedule}>
              Your pickup at <strong>{currentMarket.name}</strong>
              <span className={styles.scheduleDot}>·</span>
              Cutoff: <strong>Fri 6 pm</strong>
            </p>
          </div>

          {/* Quick-access bells */}
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerActionBtn}
              onClick={() => navigate('/buyer/profile/notifications')}
              aria-label="Notifications"
            >
              <Bell size={18} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className={styles.headerBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            <Link to="/buyer/profile" className={styles.headerActionBtn} aria-label="Profile">
              <span className={styles.miniAvatar}>
                {(user?.name || 'GA').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            </Link>
          </div>
        </div>

        {/* Search */}
        <form className={styles.searchForm} onSubmit={handleSearchSubmit} role="search">
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search sourdough, heirloom tomatoes, honey, stalls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search produce, bakery, and farm goods"
          />
          <button
            type="button"
            className={styles.searchBtn}
            onClick={() => setIsSearchOpen(true)}
            aria-label="Open global search"
          >
            <Search size={15} />
            <span>Search</span>
          </button>
        </form>

        {/* Category chips */}
        <div className={styles.categoriesBar} role="navigation" aria-label="Quick Categories">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.categoryChip} ${activeCategory === cat ? styles.categoryChipActive : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* ── 2. Active Order / Pickup Banner ────────────────────────────── */}
      {activeOrder && (
        <section className={styles.pickupBanner} aria-label="Active order">
          <div className={styles.pickupLeft}>
            <div className={styles.pickupIconWrap}>
              <ShoppingBag size={20} aria-hidden="true" />
            </div>
            <div className={styles.pickupText}>
              <div className={styles.pickupStatusRow}>
                <span className={styles.pickupBadge}>{activeOrder.status}</span>
                <span className={styles.pickupNumber}>{activeOrder.number}</span>
                <span className={styles.pickupSlot}>
                  <Clock size={12} />
                  {activeOrder.pickupSlot}
                </span>
              </div>
              <p className={styles.pickupDesc}>
                {activeOrder.status === 'Ready for pickup'
                  ? 'Your items are packed & waiting at the market.'
                  : `Confirmed for Saturday pickup at ${currentMarket.name}.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.pickupAction}
            onClick={handleOpenActiveOrder}
            aria-label={`View order ${activeOrder.number}`}
          >
            <span>View Slip</span>
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </section>
      )}

      {/* ── 3. Quick Actions 2×4 Grid ──────────────────────────────────── */}
      <section className={styles.quickSection} aria-label="Quick Access">
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>Quick Access</h2>
        </div>
        <div className={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.path} className={`${styles.quickCard} ${styles[`quickCard_${action.color}`]}`}>
                <div className={styles.quickIconWrap}>
                  <Icon size={20} />
                </div>
                <div className={styles.quickInfo}>
                  <strong className={styles.quickLabel}>{action.label}</strong>
                  <span className={styles.quickSub}>{action.sub}</span>
                </div>
                <ChevronRight size={14} className={styles.quickArrow} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 4. Stats / Market Summary Strip ───────────────────────────── */}
      <section className={styles.statsSection} aria-label="Market summary">
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Store size={16} /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{markets.length}</span>
            <span className={styles.statLabel}>Nearby markets</span>
          </div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Users size={16} /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{farmers.length}</span>
            <span className={styles.statLabel}>Farmers</span>
          </div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Leaf size={16} /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{products.length}</span>
            <span className={styles.statLabel}>Products</span>
          </div>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statCard}>
          <div className={styles.statIcon}><TrendingUp size={16} /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{orders.length}</span>
            <span className={styles.statLabel}>Your orders</span>
          </div>
        </div>
      </section>

      {/* ── Nearby Saturday Markets ──────────────────────────────────── */}
      <section className={styles.marketsPreviewSection} aria-label="Nearby Markets">
        <div className={styles.sectionHeaderRow}>
          <div>
            <h2 className={styles.sectionTitle}>Nearby Saturday Markets</h2>
            <p className={styles.sectionSubtitle}>
              Local markets operating in your area with verified attending grower stalls.
            </p>
          </div>
          <Link to="/buyer/markets" className={styles.seeAllLink}>
            Explore all {markets.length} markets <ChevronRight size={14} />
          </Link>
        </div>
        <div className={styles.marketsGrid}>
          {markets.slice(0, 3).map((market) => (
            <MarketCard
              key={market.id}
              market={{
                ...market,
                farmerCount: market.farmerIds?.length || 8,
              }}
            />
          ))}
        </div>
      </section>

      {/* ── 5. Favorite Farmers Row ───────────────────────────────────── */}
      <section className={styles.favSection} aria-label="Favourite Farmers">
        <div className={styles.sectionHeaderRow}>
          <h2 className={styles.sectionTitle}>Favourite Farmers</h2>
          <Link to="/buyer/favorites" className={styles.seeAllLink}>
            See all <ChevronRight size={14} />
          </Link>
        </div>
        <div className={styles.favFarmerRow}>
          {favoriteFarmers.map((farmer) => (
            <Link
              key={farmer.id}
              to={`/buyer/farmers/${farmer.id}`}
              className={styles.favFarmerCard}
            >
              <div className={styles.favFarmerAvatar}>
                {farmer.stallName[0]}
              </div>
              <div className={styles.favFarmerInfo}>
                <strong className={styles.favFarmerName}>{farmer.stallName}</strong>
                <span className={styles.favFarmerSpecialty}>{farmer.specialty}</span>
                <div className={styles.favFarmerMeta}>
                  <Star size={11} className={styles.starIcon} />
                  <span>{farmer.rating}</span>
                  <span className={styles.metaDot}>·</span>
                  <span>Stall {farmer.stallNumber.split(' ')[1]}</span>
                </div>
              </div>
              <ChevronRight size={14} className={styles.favArrow} />
            </Link>
          ))}
        </div>
      </section>

      {/* ── 6. Saved Market Location Card ─────────────────────────────── */}
      <section className={styles.savedMarketSection} aria-label="Your market">
        <div className={styles.savedMarketCard}>
          <div className={styles.savedMarketLeft}>
            <div className={styles.savedMarketIconWrap}>
              <MapPin size={20} />
            </div>
            <div className={styles.savedMarketInfo}>
              <span className={styles.savedMarketLabel}>Your Primary Market</span>
              <strong className={styles.savedMarketName}>{currentMarket.name}</strong>
              <span className={styles.savedMarketAddress}>{currentMarket.address}</span>
              <div className={styles.savedMarketMeta}>
                <Clock size={12} />
                <span>{currentMarket.hours}</span>
                <span className={styles.metaDot}>·</span>
                <span>{currentMarket.distance}</span>
              </div>
            </div>
          </div>
          <div className={styles.savedMarketActions}>
            <Link to="/buyer/markets" className={styles.savedMarketBtn}>
              <Map size={14} />
              <span>Map</span>
            </Link>
            <Link to="/buyer/profile/markets" className={styles.savedMarketBtnOutline}>
              <span>Change</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. AI Assistant Spotlight ─────────────────────────────────── */}
      <section className={styles.aiSection} aria-label="AI Assistant">
        <div className={styles.aiCard}>
          <div className={styles.aiGlow} aria-hidden="true" />
          <div className={styles.aiCardInner}>
            <div className={styles.aiIconWrap}>
              <Sparkles size={22} />
            </div>
            <div className={styles.aiContent}>
              <strong className={styles.aiTitle}>MarketLink Assistant</strong>
              <p className={styles.aiDesc}>
                Ask about this weekend's harvest, stall hours, or seasonal recipes.
              </p>
              <div className={styles.aiPromptRow}>
                {AI_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className={styles.aiPromptPill}
                    onClick={() => navigate('/buyer/assistant')}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
            <Link to="/buyer/assistant" className={styles.aiBtn}>
              <Zap size={15} />
              <span>Ask Now</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. Curated & Endless Feed ─────────────────────────────────── */}
      <div className={styles.feed}>
        {sections.map((section, idx) => (
          <React.Fragment key={section.id}>
            <div className={styles.sectionWrap}>
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
            </div>
          </React.Fragment>
        ))}

        {loading && (
          <div className={styles.skeletonRow} aria-label="Loading more items">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      </div>

      {/* Global Multi-Type Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}

export default Home;
