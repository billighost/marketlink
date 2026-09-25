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
  HeartHandshake,
  Sprout,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import styles from './Home.module.css';

const MARKETS = [
  {
    id: 'market-1',
    name: 'Central Community Farmers Market',
    badge: 'Open Today',
    badgeType: 'today',
    location: 'Downtown Plaza, 4th & Main',
    schedule: 'Saturdays • 8:00 AM - 1:00 PM',
    vendors: '42 Active Vendors',
    image: '/images/market-central.jpg',
    path: PATHS.BUYER_MARKETS || '/buyer/markets',
  },
  {
    id: 'market-2',
    name: 'Riverside Artisans & Growers',
    badge: 'Opens Tomorrow',
    badgeType: 'tomorrow',
    location: 'Riverside Park North Pavilion',
    schedule: 'Sundays • 9:00 AM - 2:00 PM',
    vendors: '35 Active Vendors',
    image: '/images/market-riverside.jpg',
    path: PATHS.BUYER_MARKETS || '/buyer/markets',
  },
  {
    id: 'market-3',
    name: 'Mid-Week Harvest Market',
    badge: 'Opens Wednesday',
    badgeType: 'wednesday',
    location: 'Old Town Square',
    schedule: 'Wednesdays • 3:00 PM - 7:00 PM',
    vendors: '19 Active Vendors',
    image: '/images/market-midweek.jpg',
    path: PATHS.BUYER_MARKETS || '/buyer/markets',
  },
];

const PRODUCTS = [
  {
    id: 'prod-1',
    title: 'Heirloom Brandywine Tomatoes',
    farmer: 'Green Valley Farm',
    price: '$4.50',
    unit: '/ lb',
    stock: 'In Stock (14 lbs)',
    stockType: 'in-stock',
    image: '/images/product-tomatoes.jpg',
    tag: 'Organic Certified',
  },
  {
    id: 'prod-2',
    title: 'Living Butterhead Lettuce',
    farmer: 'Sunburst Hydroponics',
    price: '$3.00',
    unit: '/ head',
    stock: 'Low Stock (3 left)',
    stockType: 'low-stock',
    image: '/images/product-lettuce.jpg',
    tag: 'Pesticide Free',
  },
  {
    id: 'prod-3',
    title: 'Raw Wildflower Honey',
    farmer: 'Hollow Creek Apiary',
    price: '$12.00',
    unit: '/ 16oz',
    stock: 'In Stock (12 jars)',
    stockType: 'in-stock',
    image: '/images/product-honey.jpg',
    tag: 'Organic Certified',
  },
  {
    id: 'prod-4',
    title: 'Organic Alpine Strawberries',
    farmer: 'Berry Patch Farm',
    price: '$6.50',
    unit: '/ pint',
    stock: 'In Stock (8 pints)',
    stockType: 'in-stock',
    image: '/images/product-strawberries.jpg',
    tag: 'Organic Certified',
  },
];

const FARMERS = [
  {
    id: 'farmer-1',
    name: 'Elena Vance',
    farm: 'Green Valley Organic Farm',
    specialty: 'Specialty: Heirloom Veggies',
    bio: 'Farming regeneratively in the valley for over 15 years, cultivating heirloom seeds passed down through generations.',
    image: '/images/farmer-elena.jpg',
    path: PATHS.BUYER_FARMERS || '/buyer/farmers',
  },
  {
    id: 'farmer-2',
    name: 'Marcus Chen',
    farm: 'Sunburst Hydroponics',
    specialty: 'Specialty: Living Greens',
    bio: 'Pioneering sustainable urban hydroponics to deliver crisp, pesticide-free salad greens year-round with zero soil runoff.',
    image: '/images/farmer-marcus.jpg',
    path: PATHS.BUYER_FARMERS || '/buyer/farmers',
  },
  {
    id: 'farmer-3',
    name: 'Sarah Jenkins',
    farm: 'Hollow Creek Apiary',
    specialty: 'Specialty: Raw Honey & Wax',
    bio: 'Dedicated caretaker of over 50 thriving beehives across local orchards, producing unheated, unfiltered raw wildflower honey.',
    image: '/images/farmer-sarah.jpg',
    path: PATHS.BUYER_FARMERS || '/buyer/farmers',
  },
];

const STEPS = [
  {
    num: '1',
    title: 'Discover',
    desc: 'Browse local markets and find growers operating right in your neighborhood.',
  },
  {
    num: '2',
    title: 'Choose',
    desc: 'Explore fresh seasonal produce, artisan baked goods, and farm-raised specialties.',
  },
  {
    num: '3',
    title: 'Reserve',
    desc: 'Secure your items online ahead of market day so nothing sells out before you arrive.',
  },
  {
    num: '4',
    title: 'Pick Up',
    desc: 'Visit the farm stall to collect your packed order directly from the grower.',
  },
];

export function Home() {
  useDocumentTitle('MarketLink — Fresh from The Farm');
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('All');
  const [favorites, setFavorites] = useState({});
  const [reservedItems, setReservedItems] = useState({});

  let cartContext = {};
  try {
    cartContext = useCart() || {};
  } catch {
    cartContext = {};
  }
  const { addItem } = cartContext;

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReserve = (product) => {
    setReservedItems((prev) => ({ ...prev, [product.id]: true }));
    if (addItem) {
      try {
        addItem({
          id: product.id,
          name: product.title,
          farmer: product.farmer,
          price: parseFloat(product.price.replace('$', '')),
          unit: product.unit.replace('/', '').trim(),
          image: product.image,
        });
      } catch {
        // Fallback
      }
    }
  };

  const filteredProducts = PRODUCTS.filter((p) => {
    if (activeFilter === 'All') return true;
    return p.tag === activeFilter;
  });

  return (
    <div className={styles.homeContainer}>
      {/* ─── 1. HERO SECTION ────────────────────────────────────────── */}
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay} />

        <div className={styles.heroContent}>
          {/* Centered Brand Mark matching reference image */}
          <div className={styles.heroBrandMark}>
            <MarketLinkLogo variant="stacked" size="hero" />
          </div>

          {/* Headline - prominent & bigger on the overlay */}
          <h1 className={styles.heroTitle}>
            Fresh From The<span className={styles.from}> Farm  </span>.
            <br />
            Ready when you are.
          </h1>

          {/* Subheadline */}
          <p className={styles.heroLead}>
            Discover what’s available at nearby markets, reserve your favorites and pick them up fresh at the market.
          </p>

          {/* Call to Action Buttons */}
          <div className={styles.heroActions}>
            <Link
              to={PATHS.MARKETS || '/markets'}
              className={styles.browseMarketsBtn}
            >
              <span>Browse Markets</span>
              {/* <span className={styles.btnArrow}>&rarr;</span> */}
            </Link>

            <Link
              to={PATHS.PRODUCTS || '/products'}

              className={styles.exploreProduceBtn}
            >
              <span>Explore Fresh Produce</span>
              {/* <span className={styles.btnArrow}>&rarr;</span> */}
            </Link>
          </div>
        </div>
      </section>


      {/* ─── 2. WEEKEND GATHERINGS / FIND A MARKET ─────────────────── */}
      <section className={styles.marketsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>WEEKEND GATHERINGS</p>
              <h2 className={styles.sectionTitle}>Find a Market Near You</h2>
            </div>
            <Link
              to={PATHS.BUYER_MARKETS || '/buyer/markets'}
              className={styles.filterBtn}
            >
              <SlidersHorizontal size={15} />
              <span>Filter Locations</span>
            </Link>
          </div>

          <div className={styles.marketsGrid}>
            {MARKETS.map((market) => (
              <div key={market.id} className={styles.marketCard}>
                <div className={styles.marketImgWrapper}>
                  <img
                    src={market.image}
                    alt={market.name}
                    className={styles.marketImg}
                  />
                  <span
                    className={`${styles.marketStatusBadge} ${market.badgeType === 'today'
                      ? styles.badgeToday
                      : market.badgeType === 'tomorrow'
                        ? styles.badgeTomorrow
                        : styles.badgeWed
                      }`}
                  >
                    {market.badge}
                  </span>
                </div>

                <div className={styles.marketBody}>
                  <p className={styles.marketLocation}>
                    <MapPin size={13} className={styles.iconInline} />
                    <span>{market.location}</span>
                  </p>

                  <h3 className={styles.marketName}>{market.name}</h3>

                  <p className={styles.marketSchedule}>
                    <Clock size={13} className={styles.iconInline} />
                    <span>{market.schedule}</span>
                  </p>

                  <div className={styles.marketFooter}>
                    <span className={styles.vendorCount}>{market.vendors}</span>
                    <Link to={PATHS.MARKETS} className={styles.viewMarketLink}>
                      <span>View Market</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. SEASONAL HARVEST / FRESH the farm ────────── */}
      <section className={styles.productsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>SEASONAL HARVEST</p>
              <h2 className={styles.sectionTitle}>Fresh From The Farm</h2>
            </div>
            <div className={styles.filterPills}>
              {['All', 'Organic Certified', 'Pesticide Free'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`${styles.filterPill} ${activeFilter === filter ? styles.filterPillActive : ''
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.productsGrid}>
            {filteredProducts.map((product) => {
              const isFav = favorites[product.id];
              const isReserved = reservedItems[product.id];

              return (
                <div key={product.id} className={styles.productCard}>
                  <div className={styles.productImgWrapper}>
                    <img
                      src={product.image}
                      alt={product.title}
                      className={styles.productImg}
                    />

                    {/* Favorite Heart Button */}
                    <button
                      type="button"
                      onClick={() => toggleFavorite(product.id)}
                      className={`${styles.favoriteBtn} ${isFav ? styles.favoriteBtnActive : ''
                        }`}
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
                      className={`${styles.productStockBadge} ${product.stockType === 'low-stock'
                        ? styles.stockLow
                        : styles.stockIn
                        }`}
                    >
                      {product.stock}
                    </span>
                  </div>

                  <div className={styles.productBody}>
                    <p className={styles.productFarmer}>{product.farmer}</p>
                    <h3 className={styles.productTitle}>{product.title}</h3>

                    <div className={styles.productPriceRow}>
                      <p className={styles.productPrice}>
                        <span className={styles.priceNum}>{product.price}</span>{' '}
                        <span className={styles.priceUnit}>{product.unit}</span>
                      </p>

                      <button
                        type="button"
                        onClick={() => handleReserve(product)}
                        className={`${styles.reserveBtn} ${isReserved ? styles.reserveBtnDone : ''
                          }`}
                      >
                        {isReserved ? (
                          <>
                            <BookmarkCheck size={13} />
                            <span>Reserved</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} />
                            <span>Reserve</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link
              to={PATHS.PRODUCTS || '/products'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '11px 22px',
                backgroundColor: '#faede9',
                border: '1px solid #ebdcd6',
                borderRadius: '8px',
                color: '#541722',
                fontFamily: "var(--font-body, 'Inter', sans-serif)",
                fontSize: '0.875rem',
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

      {/* ─── 4. THE GROWERS / MEET LOCAL FARMERS ────────────────────── */}
      <section className={styles.farmersSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>THE GROWERS</p>
              <h2 className={styles.sectionTitle}>Meet The Farmers</h2>
            </div>
            <Link
              to={PATHS.FARMERS || '/farmers'}
              className={styles.viewAllLink}
            >
              <span>View All Growers</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className={styles.farmersGrid}>
            {FARMERS.map((farmer) => (
              <div key={farmer.id} className={styles.farmerCard}>
                <div className={styles.farmerHeader}>
                  <img
                    src={farmer.image}
                    alt={farmer.name}
                    className={styles.farmerAvatar}
                  />
                  <div className={styles.farmerInfo}>
                    <h3 className={styles.farmerName}>{farmer.name}</h3>
                    <p className={styles.farmerFarm}>{farmer.farm}</p>
                    <p className={styles.farmerSpecialty}>{farmer.specialty}</p>
                  </div>
                </div>

                <p className={styles.farmerBio}>{farmer.bio}</p>

                <Link to={farmer.path} className={styles.farmerActionBtn}>
                  View Profile & Offerings
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. SIMPLE PROCESS / HOW MARKETLINK WORKS ──────────────── */}
      <section className={styles.processSection}>
        <div className="container">
          <div className={styles.processHeader}>
            <p className={styles.processEyebrow}>SIMPLE PROCESS</p>
            <h2 className={styles.processTitle}>How MarketLink Works</h2>
            <p className={styles.processSubtitle}>
              Connecting your table to local soil in four effortless steps.
            </p>
          </div>

          <div className={styles.processGrid}>
            {STEPS.map((step) => (
              <div key={step.num} className={styles.processCard}>
                <div className={styles.stepNumBadge}>{step.num}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. CALL TO ACTION BANNER ───────────────────────────────── */}
      <section className={styles.ctaBannerSection}>
        <div className={`container ${styles.ctaContainer}`}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaIconWrap}>
              <HeartHandshake size={36} strokeWidth={1.75} className={styles.ctaIcon} />
            </div>

            <h2 className={styles.ctaTitle}>
              Join the Local Food Movement Today
            </h2>

            <p className={styles.ctaSubtitle}>
              Support independent family farms, reduce food miles, and taste the vibrant
              difference of truly fresh, seasonal eating.
            </p>

            <div className={styles.ctaButtons}>
              <Link
                to={PATHS.BUYER_MARKETS || '/buyer/markets'}
                className={styles.ctaPrimaryBtn}
              >
                Find Your Nearest Market
              </Link>

              <Link
                to={PATHS.PRODUCTS || '/buyer/products'}
                className={styles.ctaSecondaryBtn}
              >
                Explore All Products
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
