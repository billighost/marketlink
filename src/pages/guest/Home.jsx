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
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import useQuery from '@/hooks/useQuery';
import { getPublicHome, getMarkets } from '@/api/catalog';
import { formatPrice, formatMarketSchedule } from '@/utils/format';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Illustration from '@/components/domain/Illustration';
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

function getMarketImage(market) {
  if (market?.imageUrl) return market.imageUrl;
  if (market?.image) return market.image;
  const name = (market?.name || '').toLowerCase();
  const slug = (market?.slug || '').toLowerCase();
  if (name.includes('elm') || slug.includes('elm')) return '/images/market-morning.jpg';
  if (name.includes('grove') || slug.includes('grove')) return '/images/market-riverside.jpg';
  if (name.includes('hilltop') || slug.includes('hilltop')) return '/images/market-greenwich.jpg';
  if (name.includes('central') || slug.includes('central')) return '/images/market-central.jpg';
  if (name.includes('chelsea') || slug.includes('chelsea')) return '/images/market-chelsea.jpg';
  if (name.includes('union') || slug.includes('union')) return '/images/market-unionsquare.jpg';
  return '/images/market-central.jpg';
}

function getMarketScheduleBadge(market) {
  if (Array.isArray(market?.schedule) && market.schedule.length > 0) {
    const days = market.schedule.map((s) => (typeof s === 'string' ? s : s.day)).filter(Boolean);
    if (days.length > 0) {
      return `OPEN ${days.map((d) => d.toUpperCase()).join(' & ')}`;
    }
  }
  if (market?.schedule?.days && Array.isArray(market.schedule.days)) {
    return `OPEN ${market.schedule.days.map((d) => d.toUpperCase()).join(' & ')}`;
  }
  return 'OPEN WEEKENDS';
}

function getProductVisual(product) {
  if (product?.imageUrl) return { type: 'img', src: product.imageUrl };
  if (product?.image) return { type: 'img', src: product.image };
  const name = (product?.name || '').toLowerCase();
  if (name.includes('tomato')) return { type: 'img', src: '/images/product-tomatoes.jpg' };
  if (name.includes('sourdough') || name.includes('bread') || name.includes('loaf')) {
    return { type: 'img', src: '/images/product-sourdough.jpg' };
  }
  if (name.includes('lettuce') || name.includes('green') || name.includes('kale') || name.includes('chard')) {
    return { type: 'img', src: '/images/product-lettuce.jpg' };
  }
  if (name.includes('strawberr') || name.includes('berry')) {
    return { type: 'img', src: '/images/product-strawberries.jpg' };
  }
  if (name.includes('honey')) return { type: 'img', src: '/images/product-honey.jpg' };
  if (name.includes('bouquet') || name.includes('flower')) return { type: 'illustration', name: 'flowers' };
  if (name.includes('corn')) return { type: 'illustration', name: 'corn' };
  if (name.includes('mushroom') || name.includes('lion') || name.includes('oyster')) {
    return { type: 'illustration', name: 'mushrooms' };
  }
  if (name.includes('ricotta') || name.includes('cheese') || name.includes('dairy')) {
    return { type: 'illustration', name: 'cheese-wedge' };
  }
  if (name.includes('egg') || name.includes('poultry')) return { type: 'illustration', name: 'egg-carton' };
  if (name.includes('carrot')) return { type: 'illustration', name: 'crate-carrots' };
  if (name.includes('beet')) return { type: 'illustration', name: 'beet-bunch' };
  if (product?.art) return { type: 'illustration', name: product.art };
  return { type: 'illustration', name: 'basket' };
}

function getFarmerVisual(farmer) {
  if (farmer?.imageUrl) return { type: 'img', src: farmer.imageUrl };
  const stall = (farmer?.stallName || '').toLowerCase();
  if (stall.includes('willow') || stall.includes('poultry')) {
    return { type: 'img', src: '/images/farmer-marcus.jpg', fallbackArt: 'egg-carton' };
  }
  if (stall.includes('oak') || stall.includes('mill') || stall.includes('bakery')) {
    return { type: 'img', src: '/images/farmer-elena.jpg', fallbackArt: 'sourdough-boule' };
  }
  if (stall.includes('cedarbrook') || stall.includes('flower')) {
    return { type: 'img', src: '/images/farmer-sarah.jpg', fallbackArt: 'flowers' };
  }
  if (stall.includes('riverbend')) {
    return { type: 'img', src: '/images/farmer-david.jpg', fallbackArt: 'crate-carrots' };
  }
  if (stall.includes('maplecrest') || stall.includes('creamery')) {
    return { type: 'img', src: '/images/farmer-priya.jpg', fallbackArt: 'cheese-wedge' };
  }
  if (farmer?.art) return { type: 'illustration', name: farmer.art };
  return { type: 'illustration', name: 'stall' };
}

export function Home() {
  useDocumentTitle('MarketLink — Fresh from The Farm');
  const navigate = useNavigate();

  const { data: homeData, loading: homeLoading } = useQuery('public_home', getPublicHome);
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
      {/* ─── 1. HERO SECTION ────────────────────────────────────────── */}
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          <div className={styles.heroBrandMark}>
            <MarketLinkLogo variant="stacked" size="hero" />
          </div>

          <h1 className={styles.heroTitle}>
            Fresh From The<span className={styles.from}> Farm</span>.
            <br />
            Ready when you are.
          </h1>

          <p className={styles.heroLead}>
            Discover what's available at nearby markets, reserve your favorites and pick them up fresh at the market.
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

      {/* ─── 2. WEEKEND GATHERINGS / MARKETS ────────────────────────── */}
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
                    <img
                      src={getMarketImage(market)}
                      alt={market.name}
                      className={styles.marketImg}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/market-central.jpg';
                      }}
                    />
                    <span className={`${styles.marketStatusBadge} ${styles.badgeToday}`}>
                      {getMarketScheduleBadge(market)}
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
                      <span>{formatMarketSchedule(market) || 'Saturdays · 8:00 AM – 2:00 PM'}</span>
                    </p>

                    <div className={styles.marketFooter}>
                      <span className={styles.vendorCount}>
                        {market.farmerCount ? `${market.farmerCount} Active Farmers` : 'Attending Farmers'}
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

      {/* ─── 3. SEASONAL HARVEST / PRICE BOARD ─────────────────────── */}
      <section className={styles.productsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                {board?.market?.name ? `LIVE PRICE BOARD · ${board.market.name.toUpperCase()}` : 'LIVE PRICE BOARD'}
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
                const visual = getProductVisual(product);

                return (
                  <div key={product.id} className={styles.productCard}>
                    <div className={styles.productImgWrapper}>
                      {visual.type === 'img' ? (
                        <img
                          src={visual.src}
                          alt={product.name}
                          className={styles.productImg}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : (
                        <div className={styles.productIllustrationWrap}>
                          <Illustration name={visual.name} size="md" />
                        </div>
                      )}
                      <div className={styles.productIllustrationWrap} style={{ display: 'none' }}>
                        <Illustration name="basket" size="md" />
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
                        {product.farmerName} {product.stallNumber ? `• ${product.stallNumber}` : ''}
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

          <div className={styles.exploreHarvestRow}>
            <Link to={PATHS.PRODUCTS} className={styles.exploreHarvestBtn}>
              <span>Explore All Seasonal Harvest</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. THE GROWERS / MEET LOCAL FARMERS ─────────────────── */}
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
              {farmers.map((farmer) => {
                const visual = getFarmerVisual(farmer);
                const operatingDays = Array.isArray(farmer.operatingDays)
                  ? farmer.operatingDays.map((d) => d.toUpperCase()).join(', ')
                  : 'WEEKENDS';

                return (
                  <div key={farmer.id} className={styles.farmerCard}>
                    <div className={styles.farmerImgWrapper}>
                      {visual.type === 'img' ? (
                        <img
                          src={visual.src}
                          alt={farmer.stallName}
                          className={styles.farmerAvatarImg}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : (
                        <div className={styles.farmerArtWrap}>
                          <Illustration name={visual.name} size="md" />
                        </div>
                      )}
                      <div className={styles.farmerArtWrap} style={{ display: 'none' }}>
                        <Illustration name={visual.fallbackArt || 'stall'} size="md" />
                      </div>
                    </div>

                    <div className={styles.farmerBody}>
                      <div className={styles.farmerTopRow}>
                        <h3 className={styles.farmerName}>{farmer.stallName}</h3>
                        {farmer.isTopSeller && <span className={styles.topSellerBadge}>Top Seller</span>}
                        {farmer.isNew && <span className={styles.newBadge}>New</span>}
                      </div>

                      <p className={styles.farmerFarm}>{farmer.specialty || 'Fresh regional harvest'}</p>

                      <div className={styles.farmerMetaRow}>
                        <span className={styles.farmerSpecialty}>
                          {farmer.stallNumber ? `${farmer.stallNumber} • ` : ''}
                          {operatingDays}
                        </span>
                        {farmer.ratingAvg > 0 && (
                          <span className={styles.farmerRating}>
                            ★ {Number(farmer.ratingAvg).toFixed(1)}
                            {farmer.ratingCount ? ` (${farmer.ratingCount})` : ''}
                          </span>
                        )}
                      </div>

                      <div className={styles.farmerFooter}>
                        <Link to={`/farmers/${farmer.id}`} className={styles.viewStallLink}>
                          <span>Visit Stall</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── 5. HOW MARKETLINK WORKS ──────────────────────────────── */}
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

      {/* ─── 6. CALL TO ACTION BANNER ───────────────────────────────── */}
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
