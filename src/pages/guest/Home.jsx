import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  SlidersHorizontal,
  MapPin,
  Clock,
  Heart,
  BookmarkCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Store,
  Calendar,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import useQuery from '@/hooks/useQuery';
import { getPublicHome, getMarkets } from '@/api/catalog';
import { formatPrice } from '@/utils/format';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import styles from './Home.module.css';

const HOW_IT_WORKS = [
  {
    num: '01',
    icon: MapPin,
    title: 'Find Your Market',
    desc: 'Locate local farmers markets operating in your neighborhood on market days.',
  },
  {
    num: '02',
    icon: ShoppingBag,
    title: 'Browse Fresh Harvest',
    desc: 'View seasonal crops, artisanal bakery items, and fresh dairy directly from certified local growers.',
  },
  {
    num: '03',
    icon: Clock,
    title: 'Reserve Before Cutoff',
    desc: 'Lock in your items throughout the week before the cutoff deadline so growers harvest to order.',
  },
  {
    num: '04',
    icon: Store,
    title: 'Pick Up & Pay in Person',
    desc: 'Visit the stall on market morning to inspect your fresh produce and pay the farmer in person.',
  },
];

export function Home() {
  useDocumentTitle('MarketLink ΓÇö Fresh from The Farm');
  const navigate = useNavigate();

  const { data: homeData, loading: homeLoading, error: homeError } = useQuery('public_home', getPublicHome);
  const { data: marketsData, loading: marketsLoading } = useQuery('guest_markets_home', () => getMarkets({ limit: 3 }));

  const { add } = useCart();
  const { isProductFavorite, toggleProduct } = useFavorites();
  const [reservedIds, setReservedIds] = useState(new Set());

  const handleReserve = (item) => {
    add(item.id);
    setReservedIds((prev) => new Set([...prev, item.id]));
  };

  const board = homeData?.board || null;
  const boardItems = board?.items || [];
  const farmers = homeData?.farmers || [];
  const markets = Array.isArray(marketsData?.data) ? marketsData.data : [];

  return (
    <div className={styles.homeContainer}>
      {/* ΓöÇΓöÇΓöÇ 1. HERO SECTION (Unchanged Decorative Design) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <div className={styles.heroBrandMark}>
            <MarketLinkLogo variant="stacked" size="hero" />
          </div>

          <h1 className={styles.heroTitle}>
            Fresh From The<span className={styles.from}> Farm </span>.
            <br />
            Ready when you are.
          </h1>

          <p className={styles.heroLead}>
            Discover whatΓÇÖs available at nearby markets, reserve your favorites and pick them up fresh at the market.
          </p>

          <div className={styles.heroActions}>
            <Link to={PATHS.MARKETS} className={styles.browseMarketsBtn}>
              <span>Browse Markets</span>
            </Link>

            <Link to={PATHS.PRODUCTS} className={styles.exploreProduceBtn}>
              <span>Explore Fresh Produce</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ΓöÇΓöÇΓöÇ 2. WEEKEND GATHERINGS / MARKETS ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section className={styles.marketsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>WEEKEND GATHERINGS</p>
              <h2 className={styles.sectionTitle}>Find a Market Near You</h2>
            </div>
            <Link to={PATHS.MARKETS} className={styles.filterBtn}>
              <SlidersHorizontal size={15} />
              <span>All Markets</span>
            </Link>
          </div>

          {marketsLoading ? (
            <div className={styles.marketsGrid}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.marketCard} style={{ minHeight: '280px', padding: 'var(--space-4)' }}>
                  <Skeleton width="100%" height="160px" style={{ borderRadius: 'var(--radius-md)' }} />
                  <Skeleton width="70%" height="24px" style={{ marginTop: 'var(--space-3)' }} />
                  <Skeleton width="50%" height="16px" style={{ marginTop: 'var(--space-2)' }} />
                </div>
              ))}
            </div>
          ) : markets.length === 0 ? (
            <EmptyState
              title="No markets listed right now"
              text="Check back soon as local weekend markets are added."
              actionLabel="Explore Produce"
              onAction={() => navigate(PATHS.PRODUCTS)}
            />
          ) : (
            <div className={styles.marketsGrid}>
              {markets.map((market) => (
                <div key={market.id} className={styles.marketCard}>
                  <div className={styles.marketImgWrapper}>
                    <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-beet)', fontFamily: 'var(--font-head)', fontSize: 'var(--text-h3)' }}>
                      <Store size={32} strokeWidth={1.5} />
                    </div>
                    <span className={`${styles.marketStatusBadge} ${styles.badgeToday}`}>
                      {market.schedule?.days ? market.schedule.days.join(', ').toUpperCase() : 'OPEN WEEKENDS'}
                    </span>
                  </div>

                  <div className={styles.marketBody}>
                    <p className={styles.marketLocation}>
                      <MapPin size={13} className={styles.iconInline} />
                      <span>{market.address || market.city || 'Local Square'}</span>
                    </p>

                    <h3 className={styles.marketName}>{market.name}</h3>

                    <p className={styles.marketSchedule}>
                      <Clock size={13} className={styles.iconInline} />
                      <span>{market.schedule?.hours || 'Saturdays ΓÇó 8:00 AM ΓÇô 2:00 PM'}</span>
                    </p>

                    <div className={styles.marketFooter}>
                      <span className={styles.vendorCount}>
                        {market.stats?.farmerCount ? `${market.stats.farmerCount} Active Farmers` : 'Attending Farmers'}
                      </span>
                      <Link to={`/markets/${market.id}`} className={styles.viewMarketLink}>
                        <span>View Market</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ΓöÇΓöÇΓöÇ 3. SEASONAL HARVEST / PRICE BOARD ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section className={styles.productsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                {board?.market?.name ? `LIVE PRICE BOARD ┬╖ ${board.market.name.toUpperCase()}` : 'LIVE PRICE BOARD'}
              </p>
              <h2 className={styles.sectionTitle}>Fresh From The Stalls</h2>
            </div>
            <Link to={PATHS.PRODUCTS} className={styles.filterBtn}>
              <span>View Full Catalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {homeLoading ? (
            <div className={styles.productsGrid}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.productCard} style={{ minHeight: '260px', padding: 'var(--space-4)' }}>
                  <Skeleton width="100%" height="140px" style={{ borderRadius: 'var(--radius-md)' }} />
                  <Skeleton width="60%" height="20px" style={{ marginTop: 'var(--space-3)' }} />
                  <Skeleton width="40%" height="16px" style={{ marginTop: 'var(--space-2)' }} />
                </div>
              ))}
            </div>
          ) : boardItems.length === 0 ? (
            <EmptyState
              title="No price board items listed today"
              text="Farmers publish this week's harvest prices leading up to Saturday morning."
              actionLabel="Browse All Products"
              onAction={() => navigate(PATHS.PRODUCTS)}
            />
          ) : (
            <div className={styles.productsGrid}>
              {boardItems.slice(0, 8).map((product) => {
                const isFav = isProductFavorite(product.id);
                const isReserved = reservedIds.has(product.id);

                return (
                  <div key={product.id} className={styles.productCard}>
                    <div className={styles.productImgWrapper}>
                      <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-soft)' }}>
                        <Sprout size={28} strokeWidth={1.5} />
                      </div>

                      {/* Favorite Heart Button */}
                      <button
                        type="button"
                        onClick={() => toggleProduct(product.id)}
                        className={`${styles.favoriteBtn} ${isFav ? styles.favoriteBtnActive : ''}`}
                        aria-label="Save to favorites"
                      >
                        <Heart
                          size={16}
                          fill={isFav ? '#7A2E3B' : 'none'}
                          color={isFav ? '#7A2E3B' : '#2E2B26'}
                          strokeWidth={2}
                        />
                      </button>

                      {/* Stock pill overlay */}
                      <span
                        className={`${styles.productStockBadge} ${
                          product.availability === 'low' ? styles.stockLow : styles.stockIn
                        }`}
                      >
                        {product.availability === 'low' ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>

                    <div className={styles.productBody}>
                      <p className={styles.productFarmer}>
                        {product.farmerName} {product.stallNumber ? `ΓÇó ${product.stallNumber}` : ''}
                      </p>
                      <h3 className={styles.productTitle}>
                        <Link to={`/products/${product.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {product.name}
                        </Link>
                      </h3>

                      <div className={styles.productPriceRow}>
                        <p className={styles.productPrice}>
                          <span className={styles.priceNum}>{formatPrice(product.priceCents)}</span>{' '}
                          <span className={styles.priceUnit}>/ {product.unit}</span>
                        </p>

                        <button
                          type="button"
                          onClick={() => handleReserve(product)}
                          className={`${styles.reserveBtn} ${isReserved ? styles.reserveBtnDone : ''}`}
                        >
                          {isReserved ? (
                            <>
                              <BookmarkCheck size={13} />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={12} />
                              <span>Pre-order</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
            <Link
              to={PATHS.PRODUCTS}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 22px',
                backgroundColor: 'var(--color-beet-tint)',
                border: 'var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-beet)',
                fontFamily: "var(--font-body, 'Inter', sans-serif)",
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>Explore All Seasonal Harvest</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ΓöÇΓöÇΓöÇ 4. THE GROWERS / MEET LOCAL FARMERS ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
      <section className={styles.farmersSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>THE GROWERS</p>
              <h2 className={styles.sectionTitle}>Meet The Farmers</h2>
            </div>
            <Link to={PATHS.FARMERS} className={styles.viewAllLink}>
              <span>View All Growers</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {homeLoading ? (
            <div className={styles.farmersGrid}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.farmerCard} style={{ minHeight: '180px', padding: 'var(--space-4)' }}>
                  <Skeleton width="100%" height="80px" style={{ borderRadius: 'var(--radius-md)' }} />
                  <Skeleton width="60%" height="20px" style={{ marginTop: 'var(--space-2)' }} />
                </div>
              ))}
            </div>
          ) : farmers.length === 0 ? (
            <EmptyState
              title="No growers found"
              text="Our producer directory will update once weekend stalls confirm attendance."
              actionLabel="View Markets"
              onAction={() => navigate(PATHS.MARKETS)}
            />
          ) : (
            <div className={styles.farmersGrid}>
              {farmers.map((farmer) => (
                <div key={farmer.id} className={styles.farmerCard}>
                  <div className={styles.farmerImgWrapper}>
                    <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-beet)', fontFamily: 'var(--font-head)', fontSize: 'var(--text-h3)' }}>
                      {farmer.stallName?.charAt(0) || 'F'}
                    </div>
                  </div>

                  <div className={styles.farmerBody}>
                    <h3 className={styles.farmerName}>{farmer.stallName}</h3>
                    <p className={styles.farmerFarm}>{farmer.specialty || 'Fresh regional harvest'}</p>
                    <span className={styles.farmerSpecialty}>
                      {farmer.stallNumber ? `${farmer.stallNumber} ΓÇó ` : ''}
                      {farmer.operatingDays ? farmer.operatingDays.join(', ').toUpperCase() : 'WEEKENDS'}
                    </span>

                    <div className={styles.farmerFooter}>
                      <Link to={`/farmers/${farmer.id}`} className={styles.viewStallLink}>
                        <span>Visit Stall</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. HOW MARKETLINK WORKS */}
      <section className={styles.howItWorksSection}>
        <div className="container">
          <div className={styles.howHeader}>
            <span className={styles.howEyebrow}>FARM TO TOTE</span>
            <h2 className={styles.howTitle}>How MarketLink Works</h2>
            <p className={styles.howSubtitle}>
              Skip the 6:00 AM rush. Guaranteed farm-fresh pre-orders without delivery markups.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className={styles.stepCard}>
                  <div className={styles.stepCardHeader}>
                    <div className={styles.stepIconWrapper}>
                      <Icon size={20} strokeWidth={2.2} />
                    </div>
                    <span className={styles.stepBadge}>Step {step.num}</span>
                  </div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className={styles.ctaBannerSection}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <div className={styles.ctaBadge}>
                <Sprout size={14} strokeWidth={2.4} />
                <span>FRESH COMMUNITY HARVEST</span>
              </div>
              <h2 className={styles.ctaTitle}>Ready to taste real, local produce?</h2>
              <p className={styles.ctaSubtitle}>
                Connect directly with family growers in your neighborhood. Pre-order by Friday, collect in person on the weekend.
              </p>
              <div className={styles.ctaButtons}>
                <Link to={PATHS.PRODUCTS} className={styles.ctaPrimaryBtn}>
                  <span>Explore Harvest</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to={PATHS.MARKETS} className={styles.ctaSecondaryBtn}>
                  <span>Find Markets</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
