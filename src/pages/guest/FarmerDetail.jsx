import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Store,
  ShieldCheck,
  Star,
  Bookmark,
  Share2,
  Leaf,
  CheckCircle2,
  Clock,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Heart,
  Phone,
  Mail,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import styles from './FarmerDetail.module.css';

/* ── Sample dynamic database for guest farmers ────────────────────── */
const FARMERS_DB = {
  'f-riverbend': {
    id: 'f-riverbend',
    name: 'Elena Vance',
    farmName: 'Riverbend Farm',
    coverImage: '/images/riverbend-farm.jpg',
    avatarImage: '/images/farmer-elena.jpg',
    location: 'Hudson Valley, NY',
    distance: '38 miles to Greenwich Village',
    since: 2018,
    rating: 4.9,
    reviewCount: 48,
    specialty: 'Heirloom Vegetables & Leafy Greens',
    badges: ['100% Certified Organic', 'Passaic Watershed Stewards', 'Generational Land'],
    tagline: 'Cultivating heritage vegetables on 40 fertile riverfront acres.',
    story:
      'Three generations of the Vance family have stewarded the alluvial soil along the Passaic River in the Hudson Valley. We believe that exceptional flavor begins in the soil biology. We practice closed-loop regenerative farming: every crop is grown without synthetic fertilizers or chemical pesticides, fed by on-farm compost and cover-cropped legumes. Harvest begins at 4:30 AM before market mornings so the produce you take home was still growing in our soil just hours earlier.',
    practices: [
      {
        title: 'Zero Synthetic Inputs',
        desc: 'Certified organic methods using living compost, compost teas, and companion planting.',
      },
      {
        title: 'Morning-Of Harvest',
        desc: 'Greens and vegetables are harvested at dawn to preserve natural sugars and crispness.',
      },
      {
        title: 'Heirloom Seed Preservation',
        desc: 'We save over 25 varieties of heritage open-pollinated seeds adapted to our microclimate.',
      },
    ],
    marketSchedules: [
      {
        marketName: 'Greenwich Village Farmers Market',
        marketId: 'market-greenwich',
        location: 'Abingdon Square, NY',
        day: 'Every Saturday',
        hours: '8:00 AM – 2:00 PM',
        stall: 'Stall #4 (North Path)',
        preorderCutoff: 'Friday 5:00 PM',
      },
      {
        marketName: 'Union Square Greenmarket',
        marketId: 'market-unionsquare',
        location: 'Union Square Plaza, NY',
        day: 'Wednesdays & Fridays',
        hours: '8:00 AM – 6:00 PM',
        stall: 'Stall #12 (West Corner)',
        preorderCutoff: 'Day prior, 4:00 PM',
      },
    ],
    products: [
      {
        id: 'fp-tomatoes',
        name: 'Organic Heirloom Tomato Mix',
        category: 'Vegetables',
        price: '$6.50',
        unit: '/ basket',
        stock: '14 baskets available',
        image: '/images/product-tomatoes.jpg',
        badge: 'In Season',
        desc: 'Vine-ripened mix of Brandywine, Cherokee Purple, and Green Zebra heritage tomatoes.',
      },
      {
        id: 'fp-lettuce',
        name: 'Living Butterhead Lettuce',
        category: 'Greens',
        price: '$3.00',
        unit: '/ head',
        stock: '8 heads available',
        image: '/images/product-lettuce.jpg',
        badge: 'Harvested Today',
        desc: 'Tender buttery leaves harvested with root intact for maximum kitchen freshness.',
      },
      {
        id: 'fp-strawberries',
        name: 'Alpine Strawberries',
        category: 'Berries',
        price: '$6.50',
        unit: '/ pint',
        stock: '6 pints left',
        image: '/images/product-strawberries.jpg',
        badge: 'Limited Crop',
        desc: 'Intensely fragrant petite European alpine strawberries with notes of pineapple and rose.',
      },
      {
        id: 'fp-honey',
        name: 'Raw Meadow Wildflower Honey',
        category: 'Pantry',
        price: '$12.00',
        unit: '/ 16oz',
        stock: '18 jars left',
        image: '/images/product-honey.jpg',
        badge: 'Single Origin',
        desc: 'Unheated, unfiltered raw honey produced from bee boxes located adjacent to our clover fields.',
      },
    ],
    reviews: [
      {
        id: 'r1',
        author: 'Julian Thorne',
        rating: 5,
        date: 'March 2026',
        text: 'Elena’s tomatoes are legendary in the West Village. When tomato season hits, this is the only stall you need to visit. The sweetness and depth of flavor are incomparable.',
      },
      {
        id: 'r2',
        author: 'Rebecca Zhang',
        rating: 5,
        date: 'February 2026',
        text: 'I pre-order my butterhead lettuce every Friday through MarketLink. Picking it up at Stall #4 takes 30 seconds and the greens last nearly two weeks in the crisper.',
      },
      {
        id: 'r3',
        author: 'Carlos Mendes',
        rating: 5,
        date: 'February 2026',
        text: 'Wonderful people, genuine family farming. You can taste the care they pour into their harvest.',
      },
    ],
  },
  'f-sunburst': {
    id: 'f-sunburst',
    name: 'Marcus Chen',
    farmName: "Chen's Organic Acres",
    coverImage: '/images/market-riverside.jpg',
    avatarImage: '/images/farmer-marcus.jpg',
    location: 'Catskill, NY',
    distance: '52 miles to Greenwich Village',
    since: 2021,
    rating: 4.8,
    reviewCount: 39,
    specialty: 'Hydroponic Living Salads & Microgreens',
    badges: ['Pesticide Free', 'Zero Waste Water', 'Solar Powered'],
    tagline: 'High-tech clean farming producing nutrient-dense living greens year-round.',
    story:
      'Marcus Chen founded Chen Organic Acres to rethink urban-regional agriculture. Utilizing closed-loop nutrient film techniques, we grow crisp greens using 90% less water than open field tillage. We never spray synthetic pesticides or herbicides.',
    practices: [
      { title: 'Closed Loop Water Recirculation', desc: 'Saves 90% water compared to conventional furrow irrigation.' },
      { title: '100% Solar-Powered CEA', desc: 'All LED spectrums and pumps run on our rooftop photovoltaic array.' },
    ],
    marketSchedules: [
      {
        marketName: 'Union Square Greenmarket',
        marketId: 'market-unionsquare',
        location: 'Union Square Plaza, NY',
        day: 'Wed, Fri, Sat',
        hours: '8:00 AM – 6:00 PM',
        stall: 'Stall #18',
        preorderCutoff: 'Thursday 6:00 PM',
      },
    ],
    products: [
      {
        id: 'fp-lettuce',
        name: 'Living Butterhead Lettuce',
        category: 'Greens',
        price: '$3.00',
        unit: '/ head',
        stock: '15 heads left',
        image: '/images/product-lettuce.jpg',
        badge: 'Living Root',
        desc: 'Crisp, sweet, clean butterhead grown without pesticides.',
      },
    ],
    reviews: [
      { id: 'r1', author: 'Mark D.', rating: 5, date: 'March 2026', text: 'Cleanest greens in the market. The roots are still on!' },
    ],
  },
};

const getFallbackFarmer = (id) => ({
  id,
  name: 'Local Grower',
  farmName: 'Local Heritage Farm',
  coverImage: '/images/riverbend-farm.jpg',
  avatarImage: '/images/farmer-sarah.jpg',
  location: 'Hudson Valley, NY',
  distance: '40 miles to Manhattan',
  since: 2020,
  rating: 4.8,
  reviewCount: 25,
  specialty: 'Seasonal Farm Produce & Pantry',
  badges: ['Organic Practices', 'Family Owned'],
  tagline: 'Sustainably grown crops harvested with care.',
  story: 'A dedicated regional farm family bringing seasonal wholesome goods to your community farmers market.',
  practices: [
    { title: 'Regenerative Agriculture', desc: 'Healthy soil practices and minimal tillage.' },
  ],
  marketSchedules: [
    {
      marketName: 'Greenwich Village Farmers Market',
      marketId: 'market-greenwich',
      location: 'Abingdon Square, NY',
      day: 'Every Saturday',
      hours: '8:00 AM – 2:00 PM',
      stall: 'Stall #7',
      preorderCutoff: 'Friday 5:00 PM',
    },
  ],
  products: [
    {
      id: 'fp-tomatoes',
      name: 'Fresh Heirloom Tomatoes',
      category: 'Vegetables',
      price: '$5.50',
      unit: '/ basket',
      stock: '10 available',
      image: '/images/product-tomatoes.jpg',
      badge: 'Fresh Harvest',
      desc: 'Delicious locally grown heirloom tomatoes.',
    },
  ],
  reviews: [
    { id: 'r1', author: 'Market Visitor', rating: 5, date: 'March 2026', text: 'Wonderful fresh produce and helpful friendly farmers!' },
  ],
});

export function FarmerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const farmer = FARMERS_DB[id] || getFallbackFarmer(id);
  useDocumentTitle(`${farmer.farmName} (${farmer.name}) — MarketLink`);

  const [activeTab, setActiveTab] = useState('crops');
  const [saved, setSaved] = useState(false);
  const [reservedItems, setReservedItems] = useState({});

  const handleToggleReserve = (productId) => {
    setReservedItems((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  return (
    <div className={styles.page}>
      {/* ─── BREADCRUMBS ────────────────────────────────────────── */}
      <div className={styles.breadcrumbBar}>
        <div className="container">
          <div className={styles.breadcrumbs}>
            <Link to={PATHS.FARMERS} className={styles.backBtn}>
              <ArrowLeft size={15} />
              <span>All Farmers</span>
            </Link>
            <span className={styles.sep}>›</span>
            <span className={styles.crumbLocation}>{farmer.location}</span>
            <span className={styles.sep}>›</span>
            <span className={styles.crumbCurrent}>{farmer.farmName}</span>
          </div>
        </div>
      </div>

      {/* ─── HERO COVER BANNER ──────────────────────────────────── */}
      <div className={styles.heroBannerWrap}>
        <img
          src={farmer.coverImage}
          alt={farmer.farmName}
          className={styles.heroCoverImg}
        />
        <div className={styles.heroCoverOverlay} />

        <div className="container" style={{ position: 'relative', height: '100%' }}>
          <div className={styles.heroActionsTop}>
            <button
              type="button"
              onClick={() => setSaved(!saved)}
              className={`${styles.heroActionBtn} ${saved ? styles.heroActionBtnActive : ''}`}
              aria-label="Save farm stall"
            >
              <Bookmark size={16} fill={saved ? '#6A1B29' : 'none'} />
              <span>{saved ? 'Saved' : 'Save Stall'}</span>
            </button>
            <button
              type="button"
              className={styles.heroActionBtn}
              onClick={() => {
                if (navigator?.clipboard) navigator.clipboard.writeText(window.location.href);
              }}
              aria-label="Share farm"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── FARMER PROFILE HEADER CARD ─────────────────────────── */}
      <div className="container">
        <div className={styles.profileHeaderCard}>
          <div className={styles.profileHeaderInner}>
            <div className={styles.profileAvatarWrap}>
              <img
                src={farmer.avatarImage}
                alt={farmer.name}
                className={styles.profileAvatarImg}
              />
            </div>

            <div className={styles.profileInfoArea}>
              <div className={styles.profileBadgesRow}>
                {farmer.badges.map((b) => (
                  <span key={b} className={styles.profileBadge}>
                    <ShieldCheck size={12} />
                    {b}
                  </span>
                ))}
              </div>

              <h1 className={styles.farmTitle}>{farmer.farmName}</h1>
              <p className={styles.farmerSubtitle}>
                Cultivated by <strong>{farmer.name}</strong> • {farmer.specialty}
              </p>

              <div className={styles.profileMetaRow}>
                <div className={styles.metaItem}>
                  <MapPin size={14} className={styles.metaIcon} />
                  <span>{farmer.location} ({farmer.distance})</span>
                </div>
                <div className={styles.metaItem}>
                  <Calendar size={14} className={styles.metaIcon} />
                  <span>Growing since {farmer.since}</span>
                </div>
                <div className={styles.ratingGroup}>
                  <Star size={14} fill="#E07A2C" color="#E07A2C" />
                  <strong>{farmer.rating}</strong>
                  <span className={styles.reviewCount}>({farmer.reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            <div className={styles.profileActionsRight}>
              <Link to={PATHS.REGISTER} className={styles.preorderPrimaryBtn}>
                <ShoppingBag size={16} />
                <span>Pre-Order from Stall</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION BAR ─────────────────────────────────── */}
      <div className={styles.tabBarWrapper}>
        <div className="container">
          <nav className={styles.tabNav} aria-label="Farmer sections">
            <button
              type="button"
              onClick={() => setActiveTab('crops')}
              className={`${styles.tabBtn} ${activeTab === 'crops' ? styles.tabBtnActive : ''}`}
            >
              Available Crops & Goods ({farmer.products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('story')}
              className={`${styles.tabBtn} ${activeTab === 'story' ? styles.tabBtnActive : ''}`}
            >
              Farm Story & Practices
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('markets')}
              className={`${styles.tabBtn} ${activeTab === 'markets' ? styles.tabBtnActive : ''}`}
            >
              Market Schedule ({farmer.marketSchedules.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}
            >
              Reviews ({farmer.reviews.length})
            </button>
          </nav>
        </div>
      </div>

      {/* ─── MAIN CONTENT TWO-COLUMN GRID ───────────────────────── */}
      <div className="container">
        <div className={styles.mainLayoutGrid}>
          {/* ── LEFT COLUMN: TAB PANELS ── */}
          <main className={styles.tabPanelsArea}>
            {/* 1. CROPS & GOODS TAB */}
            {activeTab === 'crops' && (
              <section className={styles.tabSection}>
                <div className={styles.sectionHeadingRow}>
                  <div>
                    <h2 className={styles.sectionTitle}>Fresh Harvest Available for Pre-Order</h2>
                    <p className={styles.sectionSub}>
                      Reserve your goods online and collect them freshly boxed from the stall on market day.
                    </p>
                  </div>
                </div>

                <div className={styles.productsGrid}>
                  {farmer.products.map((p) => {
                    const isReserved = reservedItems[p.id];
                    return (
                      <div key={p.id} className={styles.productCard}>
                        <div className={styles.productImgWrap}>
                          <img src={p.image} alt={p.name} className={styles.productImg} />
                          <span className={styles.productBadge}>{p.badge}</span>
                        </div>
                        <div className={styles.productBody}>
                          <span className={styles.productCat}>{p.category}</span>
                          <h3 className={styles.productName}>{p.name}</h3>
                          <p className={styles.productDesc}>{p.desc}</p>

                          <div className={styles.productPriceRow}>
                            <div className={styles.priceWrap}>
                              <span className={styles.priceNum}>{p.price}</span>
                              <span className={styles.priceUnit}>{p.unit}</span>
                            </div>
                            <span className={styles.stockNotice}>{p.stock}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleReserve(p.id)}
                            className={`${styles.reserveBtn} ${
                              isReserved ? styles.reserveBtnActive : ''
                            }`}
                          >
                            <ShoppingBag size={15} />
                            <span>{isReserved ? '✓ Reserved for Pickup' : 'Reserve for Pickup'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 2. STORY & PHILOSOPHY TAB */}
            {activeTab === 'story' && (
              <section className={styles.tabSection}>
                <article className={styles.storyCard}>
                  <h2 className={styles.sectionTitle}>Our Soil & Family Legacy</h2>
                  <p className={styles.storyParagraph}>{farmer.story}</p>

                  <div className={styles.practicesGrid}>
                    {farmer.practices.map((pr, idx) => (
                      <div key={idx} className={styles.practiceCard}>
                        <div className={styles.practiceHeader}>
                          <CheckCircle2 size={16} className={styles.checkIcon} />
                          <h4>{pr.title}</h4>
                        </div>
                        <p>{pr.desc}</p>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            )}

            {/* 3. MARKET SCHEDULE TAB */}
            {activeTab === 'markets' && (
              <section className={styles.tabSection}>
                <h2 className={styles.sectionTitle}>Where to Find {farmer.farmName}</h2>
                <div className={styles.schedulesList}>
                  {farmer.marketSchedules.map((ms) => (
                    <div key={ms.marketName} className={styles.scheduleCard}>
                      <div className={styles.scheduleCardLeft}>
                        <div className={styles.scheduleIconWrap}>
                          <Store size={22} />
                        </div>
                        <div>
                          <h3 className={styles.scheduleMarketName}>{ms.marketName}</h3>
                          <p className={styles.scheduleMarketLoc}>
                            <MapPin size={13} /> {ms.location} • <strong>{ms.stall}</strong>
                          </p>
                          <div className={styles.scheduleMetaRow}>
                            <span className={styles.scheduleDay}>
                              <Calendar size={13} /> {ms.day} ({ms.hours})
                            </span>
                            <span className={styles.scheduleCutoff}>
                              <Clock size={13} /> Pre-order cutoff: {ms.preorderCutoff}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link to={`/markets/${ms.marketId}`} className={styles.viewMarketBtn}>
                        <span>Market Info</span>
                        <ChevronRight size={15} />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <section className={styles.tabSection}>
                <div className={styles.reviewsOverviewRow}>
                  <div className={styles.overallRatingCard}>
                    <span className={styles.ratingNumberBig}>{farmer.rating}</span>
                    <div className={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={16} fill="#E07A2C" color="#E07A2C" />
                      ))}
                    </div>
                    <span className={styles.ratingCardCount}>
                      Based on {farmer.reviewCount} customer reviews
                    </span>
                  </div>
                </div>

                <div className={styles.reviewsList}>
                  {farmer.reviews.map((r) => (
                    <div key={r.id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.reviewAvatar}>
                          {r.author.charAt(0)}
                        </div>
                        <div>
                          <strong className={styles.reviewAuthor}>{r.author}</strong>
                          <div className={styles.reviewStars}>
                            {[...Array(r.rating)].map((_, i) => (
                              <Star key={i} size={12} fill="#E07A2C" color="#E07A2C" />
                            ))}
                            <span className={styles.reviewDate}>{r.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className={styles.reviewText}>{r.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* ── RIGHT COLUMN: SIDEBAR ── */}
          <aside className={styles.sidebar}>
            {/* Card 1: Fast Stall Info */}
            <div className={styles.sideCard}>
              <h3 className={styles.sideCardTitle}>Farm Stall Facts</h3>
              <ul className={styles.sideFactsList}>
                <li className={styles.factRow}>
                  <span className={styles.factLabel}>Head Grower</span>
                  <span className={styles.factVal}>{farmer.name}</span>
                </li>
                <li className={styles.factRow}>
                  <span className={styles.factLabel}>Origin</span>
                  <span className={styles.factVal}>{farmer.location}</span>
                </li>
                <li className={styles.factRow}>
                  <span className={styles.factLabel}>Growing Since</span>
                  <span className={styles.factVal}>{farmer.since}</span>
                </li>
                <li className={styles.factRow}>
                  <span className={styles.factLabel}>Pesticide Policy</span>
                  <span className={styles.factValHighlight}>100% Zero Chemical</span>
                </li>
              </ul>
            </div>

            {/* Card 2: Pre-order Guarantee */}
            <div className={`${styles.sideCard} ${styles.guaranteeCard}`}>
              <div className={styles.guaranteeIcon}>
                <ShieldCheck size={24} />
              </div>
              <h4>Direct-to-Grower Pre-Orders</h4>
              <p>
                100% of your pre-order payment supports the Vance family directly without supermarket markups or broker delays.
              </p>
              <Link to={PATHS.REGISTER} className={styles.guaranteeBtn}>
                Create Free Account
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default FarmerDetail;
