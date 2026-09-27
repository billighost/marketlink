import React, { useState, useEffect, useMemo } from 'react';
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
  Clock,
  Sparkles,
  Leaf,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Award,
  Info,
  Check,
  Truck,
  Sun,
  Sprout,
  HelpCircle,
} from 'lucide-react';
import { getFarmerDetail, getFarmerProducts, getFarmerReviews, getFarmers } from '@/api/catalog';
import { formatPrice, formatDate } from '@/utils/format';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import MapView from '@/components/domain/MapView';
import Illustration from '@/components/domain/Illustration';
import { DayDots } from '@/components/domain/DayDots';
import styles from './FarmerDetail.module.css';

function getFarmerImages(f) {
  const stall = (f?.stallName || f?.farmName || f?.name || '').toLowerCase();
  const contact = (f?.contactPerson || '').toLowerCase();

  const cover = f?.bannerUrl || f?.coverImage || f?.imageUrl || null;
  const avatar = f?.logoUrl || f?.avatar || null;

  if (stall.includes('willow') || stall.includes('poultry') || contact.includes('david')) {
    return {
      avatar: avatar || '/images/farmer-david.jpg',
      cover: cover || '/images/riverbend-farm.jpg',
      specialty: 'Pasture-Raised Poultry & Farm Eggs',
    };
  }
  if (stall.includes('oak') || stall.includes('mill') || stall.includes('bakery') || contact.includes('priya') || contact.includes('dan')) {
    return {
      avatar: avatar || '/images/farmer-priya.jpg',
      cover: cover || '/images/hero-market-crates.jpg',
      specialty: 'Wood-Fired Sourdough & Ancient Grains',
    };
  }
  if (stall.includes('cedarbrook') || stall.includes('flower') || stall.includes('sunridge') || stall.includes('berry') || contact.includes('clara') || contact.includes('sarah')) {
    return {
      avatar: avatar || '/images/farmer-sarah.jpg',
      cover: cover || '/images/market-wildflower.jpg',
      specialty: 'Organic Berries & Cut Flowers',
    };
  }
  if (stall.includes('riverbend') || contact.includes('anna') || contact.includes('kowalski')) {
    return {
      avatar: avatar || '/images/farmer-elena.jpg',
      cover: cover || '/images/riverbend-farm.jpg',
      specialty: 'Heirloom Vegetables & Culinary Herbs',
    };
  }
  if (stall.includes('maplecrest') || stall.includes('creamery') || stall.includes('cheese') || contact.includes('lucas')) {
    return {
      avatar: avatar || '/images/farmer-marcus.jpg',
      cover: cover || '/images/market-morning.jpg',
      specialty: 'Artisan Jersey Cheeses & Cultured Butter',
    };
  }
  if (stall.includes('hollow') || stall.includes('mushroom') || stall.includes('green') || contact.includes('marcus') || contact.includes('lena')) {
    return {
      avatar: avatar || '/images/farmer-marcus.jpg',
      cover: cover || '/images/market-riverside.jpg',
      specialty: 'Forest Mushrooms & Raw Wildflower Honey',
    };
  }

  return {
    avatar: avatar || '/images/farmer-david.jpg',
    cover: cover || '/images/hero-market-crates.jpg',
    specialty: f?.specialty || 'Fresh Market Produce',
  };
}

function getProductVisual(product) {
  if (product?.imageUrl) return { type: 'img', src: product.imageUrl };
  if (product?.image) return { type: 'img', src: product.image };
  const name = (product?.name || '').toLowerCase();
  if (name.includes('tomato')) return { type: 'img', src: '/images/product-tomatoes.jpg' };
  if (name.includes('sourdough') || name.includes('bread') || name.includes('loaf')) {
    return { type: 'img', src: '/images/product-sourdough.jpg' };
  }
  if (name.includes('lettuce') || name.includes('green') || name.includes('kale') || name.includes('chard') || name.includes('spinach')) {
    return { type: 'img', src: '/images/product-lettuce.jpg' };
  }
  if (name.includes('strawberr') || name.includes('berry') || name.includes('blueberry') || name.includes('peach')) {
    return { type: 'img', src: '/images/product-strawberries.jpg' };
  }
  if (name.includes('honey') || name.includes('jam') || name.includes('preserve')) {
    return { type: 'img', src: '/images/product-honey.jpg' };
  }
  if (name.includes('bouquet') || name.includes('flower')) return { type: 'illustration', name: 'flowers' };
  if (name.includes('corn')) return { type: 'illustration', name: 'corn' };
  if (name.includes('mushroom') || name.includes('lion') || name.includes('oyster') || name.includes('shiitake')) {
    return { type: 'illustration', name: 'mushrooms' };
  }
  if (name.includes('ricotta') || name.includes('cheese') || name.includes('dairy') || name.includes('butter')) {
    return { type: 'illustration', name: 'cheese-wedge' };
  }
  if (name.includes('egg') || name.includes('poultry') || name.includes('chicken')) return { type: 'illustration', name: 'egg-carton' };
  if (name.includes('carrot')) return { type: 'illustration', name: 'crate-carrots' };
  if (name.includes('beet')) return { type: 'illustration', name: 'beet-bunch' };
  if (product?.art) return { type: 'illustration', name: product.art };
  return { type: 'illustration', name: 'basket' };
}

function minToTime(min) {
  if (min == null) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const FAQ_ITEMS = [
  {
    q: 'How does ordering from a stall on MarketLink work?',
    a: 'You can browse current seasonal harvests listed directly by this grower. Reserving ahead guarantees your items are set aside before market tables sell out, and allows you to pick up quickly at the weekend stall without waiting in line.',
  },
  {
    q: 'What is the order cutoff time for weekend pickup?',
    a: 'Most growers close orders 12 hours before market opening (typically Friday evening by 8:00 PM). This ensures the farm team has time to harvest, wash, and package your produce at dawn before heading to the market.',
  },
  {
    q: 'Can I bring my own bags and containers?',
    a: 'Yes, absolutely! Growers actively encourage shoppers to bring reusable totes, egg cartons, and produce bags. It reduces packaging waste and helps maintain sustainable local markets.',
  },
  {
    q: 'Are all products 100% grown or made by this producer?',
    a: 'Yes. MarketLink enforces a strict 100% Producer-Only standard. Re-selling wholesale or auction produce is strictly prohibited. Every item comes from the grower’s own land, kitchen, or workshop.',
  },
  {
    q: 'What happens if a crop is impacted by weather or harvest conditions?',
    a: 'If sudden frost, heavy rain, or unexpected conditions affect a crop, the grower will alert you promptly and offer an equivalent fresh substitution or an automatic immediate refund.',
  },
];

export function FarmerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [otherFarmers, setOtherFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('crops');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [openFaq, setOpenFaq] = useState([0]); // first FAQ open by default

  useDocumentTitle(farmer ? `${farmer.stallName || farmer.name} — MarketLink` : 'Farmer Stall Details — MarketLink');

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedStalls = JSON.parse(localStorage.getItem('marketlink_saved_stalls') || '[]');
      if (id && savedStalls.includes(id)) {
        setSaved(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [id]);

  const toggleSaveStall = () => {
    try {
      const savedStalls = JSON.parse(localStorage.getItem('marketlink_saved_stalls') || '[]');
      let updated;
      if (saved) {
        updated = savedStalls.filter((sid) => sid !== id);
        setSaved(false);
      } else {
        updated = [...new Set([...savedStalls, id])];
        setSaved(true);
      }
      localStorage.setItem('marketlink_saved_stalls', JSON.stringify(updated));
    } catch {
      setSaved(!saved);
    }
  };

  const handleShare = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const toggleFaq = (index) => {
    if (openFaq.includes(index)) {
      setOpenFaq(openFaq.filter((i) => i !== index));
    } else {
      setOpenFaq([...openFaq, index]);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getFarmerDetail(id).catch((err) => {
        throw err;
      }),
      getFarmerProducts(id).catch(() => []),
      getFarmerReviews(id).catch(() => []),
      getFarmers({ limit: 6 }).catch(() => ({ data: [] })),
    ])
      .then(([f, p, r, nearby]) => {
        if (!active) return;
        setFarmer(f);
        setProducts(Array.isArray(p) ? p : p?.items || p?.data || []);
        setReviews(Array.isArray(r) ? r : r?.items || r?.data || []);
        const allGrowers = Array.isArray(nearby) ? nearby : nearby?.data || [];
        setOtherFarmers(allGrowers.filter((g) => (g.id || g._id) !== id).slice(0, 3));
      })
      .catch((err) => {
        if (active) setError(err.message || 'Farmer not found');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Derive unique categories from products
  const productCategories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      const c = typeof p.category === 'object' ? p.category?.name : p.category;
      if (c && typeof c === 'string') cats.add(c);
    });
    return ['All', ...Array.from(cats)];
  }, [products]);

  // Filter products by category, search query, and in-stock toggle
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All') {
        const catName = typeof p.category === 'object' ? p.category?.name : p.category;
        if (catName !== selectedCategory) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }
      // In-stock toggle
      if (inStockOnly && p.availability === 'out') {
        return false;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery, inStockOnly]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ padding: '60px 20px' }}>
          <div style={{ height: 32, width: '30%', background: '#ede8df', borderRadius: 8, marginBottom: 20 }} />
          <div style={{ height: 260, background: '#ede8df', borderRadius: 16, marginBottom: 30 }} />
          <div style={{ height: 420, background: '#ede8df', borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (error || !farmer) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#4a1521' }}>Grower Profile Not Found</h1>
          <p style={{ color: '#4a433b', margin: '16px 0 24px' }}>
            {error || 'This grower profile could not be loaded or is no longer active on the market.'}
          </p>
          <Link
            to={PATHS.FARMERS}
            style={{
              display: 'inline-flex',
              padding: '10px 24px',
              backgroundColor: '#541722',
              color: '#ffffff',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Browse all farmers
          </Link>
        </div>
      </div>
    );
  }

  const farmTitle = farmer.stallName || farmer.name || 'Local Farm';
  const growerName = farmer.contactPerson || farmer.name || 'Local Producer';
  const markets = Array.isArray(farmer.markets) ? farmer.markets : [];
  const farmerVisual = getFarmerImages(farmer);
  const establishedYear = farmer.since || 2019;
  const ratingScore = farmer.ratingAvg ? Number(farmer.ratingAvg).toFixed(1) : '4.9';
  const reviewCount = farmer.ratingCount || reviews.length || 0;
  const breakdown = farmer.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalBreakdownReviews = Object.values(breakdown).reduce((a, b) => a + (Number(b) || 0), 0) || reviewCount || 1;

  // Next pickup window derivation
  const pickupWindows = Array.isArray(farmer.pickupWindows) ? farmer.pickupWindows : [];
  const firstWindow = pickupWindows[0];
  const cutoffHours = farmer.cutoffMinutesBefore ? Math.round(farmer.cutoffMinutesBefore / 60) : 12;

  // Map markers for farm and markets
  const mapMarkers = [];
  if (farmer?.location?.lat && farmer?.location?.lng) {
    mapMarkers.push({
      id: farmer.id || farmer._id,
      lat: farmer.location.lat,
      lng: farmer.location.lng,
      title: farmTitle,
      subtitle: farmer.address || 'Farmstead location',
    });
  }
  markets.forEach((m) => {
    const lat = m.location?.lat != null ? m.location.lat : m.coordinates?.lat != null ? m.coordinates.lat : null;
    const lng = m.location?.lng != null ? m.location.lng : m.coordinates?.lng != null ? m.coordinates.lng : null;
    if (lat && lng) {
      mapMarkers.push({
        id: m.id || m._id,
        lat,
        lng,
        title: m.name,
        subtitle: m.address || 'Market stall location',
      });
    }
  });

  return (
    <div className={styles.page}>
      {/* ─── BREADCRUMBS ─────────────────────────────────────────── */}
      <div className={styles.breadcrumbBar}>
        <div className="container">
          <div className={styles.breadcrumbs}>
            <Link to={PATHS.FARMERS} className={styles.backBtn}>
              <ArrowLeft size={15} />
              <span>All Farmers</span>
            </Link>
            <span className={styles.sep}>›</span>
            <span className={styles.crumbLocation}>{farmer.specialty || farmerVisual.specialty}</span>
            <span className={styles.sep}>›</span>
            <span className={styles.crumbCurrent}>{farmTitle}</span>
          </div>
        </div>
      </div>

      {/* ─── HERO COVER BANNER ───────────────────────────────────── */}
      <div className={styles.heroBannerWrap}>
        <img
          src={farmer.coverImage || farmer.bannerUrl || farmerVisual.cover}
          alt={farmTitle}
          className={styles.heroCoverImg}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/riverbend-farm.jpg';
          }}
        />
        <div className={styles.heroCoverOverlay} />

        <div className="container" style={{ position: 'relative', height: '100%' }}>
          <div className={styles.heroActionsTop}>
            <button
              type="button"
              onClick={toggleSaveStall}
              className={`${styles.heroActionBtn} ${saved ? styles.heroActionBtnActive : ''}`}
              aria-label="Save farm stall"
            >
              <Bookmark size={15} fill={saved ? '#541722' : 'none'} color={saved ? '#541722' : 'currentColor'} />
              <span>{saved ? 'Saved Stall' : 'Save Stall'}</span>
            </button>
            <button
              type="button"
              className={styles.heroActionBtn}
              onClick={handleShare}
              aria-label="Share stall link"
            >
              {copied ? (
                <>
                  <Check size={15} color="#175e21" />
                  <span style={{ color: '#175e21' }}>Link Copied</span>
                </>
              ) : (
                <>
                  <Share2 size={15} />
                  <span>Share</span>
                </>
              )}
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
                src={farmer.avatar || farmer.logoUrl || farmerVisual.avatar}
                alt={growerName}
                className={styles.profileAvatarImg}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/farmer-david.jpg';
                }}
              />
            </div>

            <div className={styles.profileInfoArea}>
              <div className={styles.profileBadgesRow}>
                <span className={styles.profileBadge}>
                  <ShieldCheck size={12} />
                  100% Producer Only
                </span>
                {farmer.stallNumber && (
                  <span className={styles.profileBadge} style={{ backgroundColor: '#f5eee8', color: '#541722' }}>
                    Stall {farmer.stallNumber}
                  </span>
                )}
                {farmer.isTopSeller && (
                  <span className={styles.profileBadge} style={{ backgroundColor: '#eaefe2', color: '#3d6124' }}>
                    <Award size={12} />
                    Top Rated Seller
                  </span>
                )}
                {farmer.openToday && (
                  <span className={styles.profileBadge} style={{ backgroundColor: '#e5f6e8', color: '#175e21' }}>
                    Trading Today
                  </span>
                )}
                <span className={styles.profileBadge} style={{ backgroundColor: '#fbf5f2', color: '#7a3b45' }}>
                  Est. {establishedYear}
                </span>
              </div>

              <h1 className={styles.farmTitle}>{farmTitle}</h1>
              <p className={styles.farmerSubtitle}>
                Cultivated by <strong>{growerName}</strong> · <span>{farmer.specialty || farmerVisual.specialty}</span>
              </p>

              <div className={styles.profileMetaRow}>
                <div className={styles.metaItem}>
                  <MapPin size={14} className={styles.metaIcon} />
                  <span>{farmer.address || 'Regional Family Farm'}</span>
                </div>
                <div className={styles.metaItem}>
                  <Star size={14} fill="#E07A2C" color="#E07A2C" />
                  <strong>{ratingScore}</strong>
                  <span>({reviewCount > 0 ? `${reviewCount} community reviews` : 'Verified Producer'})</span>
                </div>
                <div className={styles.metaItem}>
                  <Calendar size={14} className={styles.metaIcon} />
                  <span>
                    {farmer.operatingDays && farmer.operatingDays.length > 0
                      ? `Trades ${farmer.operatingDays.map((d) => d.toUpperCase()).join(', ')}`
                      : 'Saturday Market Stalls'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.profileActionsRight}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('crops');
                  const el = document.getElementById('stall-content-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={styles.preorderPrimaryBtn}
              >
                <ShoppingBag size={16} />
                <span>Reserve Weekend Harvest</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION BAR ─────────────────────────────────── */}
      <div className={styles.tabBarWrapper} id="stall-content-section">
        <div className="container">
          <nav className={styles.tabNav} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'crops'}
              onClick={() => setActiveTab('crops')}
              className={`${styles.tabBtn} ${activeTab === 'crops' ? styles.tabBtnActive : ''}`}
            >
              Available Harvest ({products.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'story'}
              onClick={() => setActiveTab('story')}
              className={`${styles.tabBtn} ${activeTab === 'story' ? styles.tabBtnActive : ''}`}
            >
              Story & Practices
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'markets'}
              onClick={() => setActiveTab('markets')}
              className={`${styles.tabBtn} ${activeTab === 'markets' ? styles.tabBtnActive : ''}`}
            >
              Where to Find ({markets.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'reviews'}
              onClick={() => setActiveTab('reviews')}
              className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}
            >
              Reviews ({reviewCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'faq'}
              onClick={() => setActiveTab('faq')}
              className={`${styles.tabBtn} ${activeTab === 'faq' ? styles.tabBtnActive : ''}`}
            >
              Stall Guidelines & FAQ
            </button>
          </nav>
        </div>
      </div>

      {/* ─── MAIN TWO-COLUMN CONTENT AREA ─────────────────────────── */}
      <div className="container">
        <div className={styles.mainLayoutGrid}>
          {/* LEFT: TAB PANELS */}
          <div className={styles.tabPanelsArea}>
            {/* 1. CROPS & AVAILABLE HARVEST TAB */}
            {activeTab === 'crops' && (
              <section className={styles.tabSection}>
                <div className={styles.sectionHeadingRow}>
                  <h2 className={styles.sectionTitle}>Fresh Harvest & Market Table</h2>
                  <p className={styles.sectionSub}>
                    Harvested fresh at dawn and packed for your local weekend market pickup.
                  </p>
                </div>

                {/* Toolbar: Search, In-stock toggle, Category filter chips */}
                <div className={styles.catalogToolbar}>
                  <div className={styles.searchAndAvailabilityRow}>
                    <div className={styles.searchWrap}>
                      <Search size={15} className={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder="Search this grower's crops..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setInStockOnly(!inStockOnly)}
                      className={`${styles.inStockToggleBtn} ${inStockOnly ? styles.inStockToggleBtnActive : ''}`}
                    >
                      <CheckCircle2 size={13} />
                      <span>In Stock Only</span>
                    </button>
                  </div>

                  {productCategories.length > 1 && (
                    <div className={styles.categoryChipsList}>
                      {productCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`${styles.categoryChip} ${selectedCategory === cat ? styles.categoryChipActive : ''}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Products Grid */}
                <div className={styles.productsGrid}>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      const visual = getProductVisual(product);
                      const price = formatPrice(product.priceCents || (product.price ? product.price * 100 : 0));
                      const isLowStock = product.availability === 'low';
                      const isOutOfStock = product.availability === 'out';

                      return (
                        <div key={product.id || product._id} className={styles.productCard}>
                          <div className={styles.productImgWrap}>
                            {visual.type === 'img' ? (
                              <img
                                src={visual.src}
                                alt={product.name}
                                className={styles.productImg}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#f5eee8',
                                }}
                              >
                                <Illustration name={visual.name} size="md" />
                              </div>
                            )}
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'none',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5eee8',
                              }}
                            >
                              <Illustration name="basket" size="md" />
                            </div>

                            <span
                              className={styles.productBadge}
                              style={{
                                backgroundColor: isOutOfStock
                                  ? '#fce8e6'
                                  : isLowStock
                                  ? '#fef0d6'
                                  : 'rgba(229, 246, 232, 0.95)',
                                color: isOutOfStock ? '#b91c1c' : isLowStock ? '#92400e' : '#175e21',
                              }}
                            >
                              {isOutOfStock ? 'Sold Out' : isLowStock ? 'Few Left' : 'Fresh Harvest'}
                            </span>
                          </div>

                          <div className={styles.productBody}>
                            <span className={styles.productCat}>
                              {typeof product.category === 'object'
                                ? product.category?.name || 'Produce'
                                : product.category || 'Produce'}
                            </span>
                            <h3 className={styles.productName}>
                              <Link to={`/products/${product.id || product._id}`} className={styles.productLink}>
                                {product.name}
                              </Link>
                            </h3>
                            <p className={styles.productDesc}>
                              {product.description || 'Harvested fresh for Saturday market pickup.'}
                            </p>
                            <div className={styles.productPriceRow}>
                              <div className={styles.priceWrap}>
                                <span className={styles.priceNum}>{price}</span>
                                <span className={styles.priceUnit}>/ {product.unit || 'unit'}</span>
                              </div>
                              <span className={styles.stockNotice}>
                                {isOutOfStock ? 'Waitlist' : isLowStock ? 'Order early' : 'In stock'}
                              </span>
                            </div>
                            <Link to={`/products/${product.id || product._id}`} className={styles.reserveBtn}>
                              <span>View Item Details</span>
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '40px 20px', textAlign: 'center', color: '#6e655c' }}>
                      <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>No harvests match your filter</p>
                      <p style={{ fontSize: '0.8125rem' }}>Try searching for another keyword or selecting "All" categories.</p>
                    </div>
                  )}
                </div>

                {/* Pre-order Callout Banner */}
                <div className={styles.preorderCallout}>
                  <div className={styles.preorderCalloutLeft}>
                    <div className={styles.preorderCalloutIcon}>
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <h3 className={styles.preorderCalloutTitle}>Pre-Order for Guaranteed Weekend Pickup</h3>
                      <p className={styles.preorderCalloutText}>
                        Items like heirloom tomatoes, farm eggs, and fresh sourdough sell out rapidly before noon. Create
                        a free buyer account to lock in your order with {farmTitle} before the Friday cutoff.
                      </p>
                    </div>
                  </div>
                  <div className={styles.preorderCalloutActions}>
                    <Link to={`${PATHS.REGISTER}?redirect=/farmers/${id}`} className={styles.btnPrimarySmall}>
                      Create Buyer Account
                    </Link>
                    <Link to={`${PATHS.LOGIN}?redirect=/farmers/${id}`} className={styles.btnSecondarySmall}>
                      Sign In
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* 2. STORY, HERITAGE & PRACTICES TAB */}
            {activeTab === 'story' && (
              <section className={styles.tabSection}>
                <div className={styles.sectionHeadingRow}>
                  <h2 className={styles.sectionTitle}>The Soil, Hand, and Heritage Behind {farmTitle}</h2>
                  <p className={styles.sectionSub}>Transparent, responsible agricultural stewardship from field to stall.</p>
                </div>

                <article className={styles.storyCard}>
                  <p className={styles.storyParagraph}>
                    {farmer.story ||
                      farmer.bio ||
                      `${farmTitle} is an independent regional farm committed to responsible agriculture, non-depleting crop cycles, and providing high quality harvests directly to local farmers markets. Everything listed is sown, tended, and harvested on our land with meticulous attention to flavor, nutrient density, and soil regeneration.`}
                  </p>

                  <div className={styles.practicesGrid}>
                    <div className={styles.practiceCard}>
                      <div className={styles.practiceHeader}>
                        <Sparkles size={16} className={styles.checkIcon} />
                        <h4>100% Producer-Direct</h4>
                      </div>
                      <p>No brokers or middlemen. 100% of your dollar directly sustains independent regional farming.</p>
                    </div>
                    <div className={styles.practiceCard}>
                      <div className={styles.practiceHeader}>
                        <Sun size={16} className={styles.checkIcon} />
                        <h4>Dawn-Harvested Ripeness</h4>
                      </div>
                      <p>Picked at peak sugar and nutrient levels within 24 hours of market opening for superior taste.</p>
                    </div>
                    <div className={styles.practiceCard}>
                      <div className={styles.practiceHeader}>
                        <Sprout size={16} className={styles.checkIcon} />
                        <h4>Living Soil Stewardship</h4>
                      </div>
                      <p>Natural composting, diverse cover cropping, and bee-pollinator sanctuaries build fertile earth.</p>
                    </div>
                  </div>
                </article>

                {/* Meet the Grower Spotlight */}
                <div className={styles.meetGrowerBox}>
                  <div className={styles.meetGrowerAvatarWrap}>
                    <img
                      src={farmer.avatar || farmer.logoUrl || farmerVisual.avatar}
                      alt={growerName}
                      className={styles.meetGrowerAvatarImg}
                    />
                  </div>
                  <div className={styles.meetGrowerBody}>
                    <div className={styles.meetGrowerHeader}>
                      <h3 className={styles.meetGrowerName}>{growerName}</h3>
                      <span className={styles.meetGrowerRole}>Head Cultivator & Founder</span>
                    </div>
                    <blockquote className={styles.meetGrowerQuote}>
                      “Real food doesn’t need long transit or artificial preservation. When crops grow in healthy living
                      soil and reach neighbors the very same weekend, the difference in taste is unmistakable.”
                    </blockquote>
                    <p className={styles.meetGrowerDetails}>
                      Stewarding land since {establishedYear}. Focuses on {farmer.specialty || farmerVisual.specialty}.
                      Available at the stall each weekend to discuss varieties, cooking tips, and seasonal availability.
                    </p>
                  </div>
                </div>

                {/* Four-Season Harvest Calendar */}
                <div className={styles.seasonsCard}>
                  <h3 className={styles.sectionTitle} style={{ fontSize: '1.15rem' }}>
                    Four-Season Crop Calendar
                  </h3>
                  <p className={styles.sectionSub}>
                    What to look forward to at our stall table throughout the agricultural year.
                  </p>

                  <div className={styles.seasonsGrid}>
                    <div className={styles.seasonBox}>
                      <div className={styles.seasonBoxHeader}>
                        <h4 className={styles.seasonTitle}>Spring</h4>
                        <span className={styles.seasonMonths}>Mar – May</span>
                      </div>
                      <ul className={styles.seasonCropsList}>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Tender Salad Greens</span>
                        </li>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Radishes & Spring Scallions</span>
                        </li>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Green Garlic & Chives</span>
                        </li>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Early Greenhouse Herbs</span>
                        </li>
                      </ul>
                    </div>

                    <div className={styles.seasonBox}>
                      <div className={styles.seasonBoxHeader}>
                        <h4 className={styles.seasonTitle}>Summer</h4>
                        <span className={styles.seasonMonths}>Jun – Aug</span>
                      </div>
                      <ul className={styles.seasonCropsList}>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Heirloom Vine Tomatoes</span>
                        </li>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Sweet Bicolor Corn</span>
                        </li>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Field Berries & Stone Fruit</span>
                        </li>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Sweet Peppers & Zucchini</span>
                        </li>
                      </ul>
                    </div>

                    <div className={styles.seasonBox}>
                      <div className={styles.seasonBoxHeader}>
                        <h4 className={styles.seasonTitle}>Autumn</h4>
                        <span className={styles.seasonMonths}>Sep – Nov</span>
                      </div>
                      <ul className={styles.seasonCropsList}>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Winter Squashes & Pumpkins</span>
                        </li>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Crisp Orchard Apples</span>
                        </li>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Carrots & Rainbow Beets</span>
                        </li>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Cold-Hardy Tuscan Kale</span>
                        </li>
                      </ul>
                    </div>

                    <div className={styles.seasonBox}>
                      <div className={styles.seasonBoxHeader}>
                        <h4 className={styles.seasonTitle}>Winter</h4>
                        <span className={styles.seasonMonths}>Dec – Feb</span>
                      </div>
                      <ul className={styles.seasonCropsList}>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Cellared Root Crops</span>
                        </li>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Microgreens & Pea Shoots</span>
                        </li>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Aged Hard Cheeses</span>
                        </li>
                        <li className={styles.seasonCropItem}>
                          <span className={styles.seasonCropBullet} />
                          <span>Raw Honeys & Preserves</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 3. WHERE TO FIND & MARKET SCHEDULES TAB */}
            {activeTab === 'markets' && (
              <section className={styles.tabSection}>
                <div className={styles.sectionHeadingRow}>
                  <h2 className={styles.sectionTitle}>Where to Find {farmTitle}</h2>
                  <p className={styles.sectionSub}>
                    Visit the stall in person or reserve online for convenient weekend curb & table pickup.
                  </p>
                </div>

                <div className={styles.schedulesList}>
                  {markets.length > 0 ? (
                    markets.map((m) => (
                      <div key={m.id || m._id} className={styles.scheduleCard}>
                        <div className={styles.scheduleCardLeft}>
                          <div className={styles.scheduleIconWrap}>
                            <Store size={22} />
                          </div>
                          <div>
                            <h3 className={styles.scheduleMarketName}>{m.name}</h3>
                            <p className={styles.scheduleMarketLoc}>
                              <MapPin size={13} />
                              <span>{m.address || 'Market Square, Regional Plaza'}</span>
                            </p>
                            <div className={styles.scheduleMetaRow}>
                              <span className={styles.scheduleDay}>
                                <Calendar size={13} />
                                <span>{m.schedule?.[0]?.day || m.day || 'Saturdays · 8:00 AM – 1:00 PM'}</span>
                              </span>
                              {farmer.stallNumber && (
                                <span className={styles.scheduleDay}>
                                  <Store size={13} />
                                  <span>Stall #{farmer.stallNumber}</span>
                                </span>
                              )}
                              <span className={styles.scheduleCutoff}>
                                <Clock size={13} />
                                <span>Order cutoff: {cutoffHours}h before open</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${m.name} ${m.address || ''}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.viewMarketBtn}
                            style={{ backgroundColor: '#ffffff', border: '1px solid #dcd1c8', color: '#595147' }}
                          >
                            <ExternalLink size={13} />
                            <span>Directions</span>
                          </a>
                          <Link to={`/markets/${m.id || m._id}`} className={styles.viewMarketBtn}>
                            <span>View Market Stalls</span>
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.scheduleCard}>
                      <div className={styles.scheduleCardLeft}>
                        <div className={styles.scheduleIconWrap}>
                          <Store size={22} />
                        </div>
                        <div>
                          <h3 className={styles.scheduleMarketName}>Passaic County Regional Farmers Market</h3>
                          <p className={styles.scheduleMarketLoc}>
                            <MapPin size={13} />
                            <span>Main Green Plaza, Stall 4</span>
                          </p>
                          <div className={styles.scheduleMetaRow}>
                            <span className={styles.scheduleDay}>
                              <Calendar size={13} />
                              <span>Saturdays · 8:00 AM – 1:00 PM</span>
                            </span>
                            <span className={styles.scheduleCutoff}>
                              <Clock size={13} />
                              <span>Cutoff: Friday 8:00 PM</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Map View */}
                {mapMarkers.length > 0 && (
                  <div style={{ marginTop: '24px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ebe1db' }}>
                    <MapView
                      markers={mapMarkers}
                      height="300px"
                      zoom={12}
                      interactive={true}
                      ariaLabel={`Locations for ${farmTitle}`}
                    />
                  </div>
                )}

                {/* Step-by-Step Pickup Guide */}
                <div className={styles.pickupGuideCard}>
                  <h3 className={styles.sectionTitle} style={{ fontSize: '1.15rem' }}>
                    How Saturday Market Pickup Works
                  </h3>
                  <p className={styles.sectionSub}>
                    Skip market lines while locking in the highest quality dawn harvests.
                  </p>

                  <div className={styles.pickupStepsGrid}>
                    <div className={styles.pickupStepBox}>
                      <span className={styles.stepNumberBadge}>1</span>
                      <h4 className={styles.stepTitle}>Browse & Reserve</h4>
                      <p className={styles.stepDesc}>
                        Choose items online from {farmTitle} before the weekly Friday cutoff.
                      </p>
                    </div>

                    <div className={styles.pickupStepBox}>
                      <span className={styles.stepNumberBadge}>2</span>
                      <h4 className={styles.stepTitle}>Dawn Harvest & Pack</h4>
                      <p className={styles.stepDesc}>
                        The farm crew picks produce fresh at daybreak and boxes your reservation by name.
                      </p>
                    </div>

                    <div className={styles.pickupStepBox}>
                      <span className={styles.stepNumberBadge}>3</span>
                      <h4 className={styles.stepTitle}>Visit the Stall</h4>
                      <p className={styles.stepDesc}>
                        Walk right up to {farmer.stallNumber ? `Stall #${farmer.stallNumber}` : 'the market table'} during pickup hours.
                      </p>
                    </div>

                    <div className={styles.pickupStepBox}>
                      <span className={styles.stepNumberBadge}>4</span>
                      <h4 className={styles.stepTitle}>Pack & Enjoy</h4>
                      <p className={styles.stepDesc}>
                        Confirm your order name, pack into your reusable tote, and enjoy authentic flavor!
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 4. REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <section className={styles.tabSection}>
                <div className={styles.sectionHeadingRow}>
                  <h2 className={styles.sectionTitle}>Community Feedback & Verified Reviews</h2>
                  <p className={styles.sectionSub}>Honest feedback from weekend market shoppers and neighbors.</p>
                </div>

                {/* Overall Rating & Breakdown Bars */}
                <div className={styles.reviewsRatingContainer}>
                  <div className={styles.overallRatingCard}>
                    <span className={styles.ratingNumberBig}>{ratingScore}</span>
                    <div className={styles.starsRow}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          fill={i < Math.round(Number(ratingScore)) ? '#E07A2C' : 'none'}
                          color={i < Math.round(Number(ratingScore)) ? '#E07A2C' : '#dcd1c8'}
                        />
                      ))}
                    </div>
                    <span className={styles.ratingCardCount}>
                      Based on {reviewCount} {reviewCount === 1 ? 'verified review' : 'verified reviews'}
                    </span>
                  </div>

                  <div className={styles.breakdownBarsList}>
                    {[5, 4, 3, 2, 1].map((starNum) => {
                      const count = Number(breakdown[starNum]) || (starNum === 5 ? Math.max(1, reviewCount - 1) : starNum === 4 ? Math.min(1, reviewCount) : 0);
                      const pct = Math.round((count / Math.max(1, totalBreakdownReviews)) * 100);

                      return (
                        <div key={starNum} className={styles.breakdownRow}>
                          <span className={styles.breakdownStarLabel}>
                            <span>{starNum}</span>
                            <Star size={11} fill="#E07A2C" color="#E07A2C" />
                          </span>
                          <div className={styles.breakdownBarTrack}>
                            <div className={styles.breakdownBarFill} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={styles.breakdownCount}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                <div className={styles.reviewsList}>
                  {reviews.length > 0 ? (
                    reviews.map((r, i) => {
                      const reviewerName = r.customerName || r.userName || r.author || 'Verified Market Shopper';
                      const initial = reviewerName.charAt(0).toUpperCase();

                      return (
                        <div key={r.id || i} className={styles.reviewCard}>
                          <div className={styles.reviewHeader}>
                            <div className={styles.reviewAvatar}>{initial}</div>
                            <div style={{ flex: 1 }}>
                              <strong className={styles.reviewAuthor}>{reviewerName}</strong>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div className={styles.reviewStars}>
                                  {[...Array(5)].map((_, idx) => (
                                    <Star
                                      key={idx}
                                      size={12}
                                      fill={idx < (r.rating || 5) ? '#E07A2C' : 'none'}
                                      color={idx < (r.rating || 5) ? '#E07A2C' : '#dcd1c8'}
                                    />
                                  ))}
                                </div>
                                <span className={styles.reviewDate}>
                                  {r.createdAt ? formatDate(r.createdAt) : 'Recent weekend pickup'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className={styles.reviewText}>
                            {r.comment || r.text || 'Wonderfully fresh produce, great service at the stall, and unmatched flavor! Will definitely order ahead again.'}
                          </p>

                          {/* Farmer's Verified Reply */}
                          {r.reply && (
                            <div className={styles.reviewReplyBox}>
                              <div className={styles.reviewReplyHeader}>
                                <span className={styles.reviewReplyBadge}>
                                  <Check size={12} />
                                  <span>Response from {farmTitle}</span>
                                </span>
                                {r.reply.at && (
                                  <span className={styles.reviewReplyDate}>{formatDate(r.reply.at)}</span>
                                )}
                              </div>
                              <p className={styles.reviewReplyText}>{r.reply.text}</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '36px 20px', textAlign: 'center', backgroundColor: '#faf7f5', borderRadius: 12 }}>
                      <p style={{ fontWeight: 600, color: '#2e2b26', marginBottom: 6 }}>
                        No reviews published yet for this season
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: '#6b6259' }}>
                        Reserve your weekend order and be among the first neighbors to share verified community feedback!
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 5. STALL GUIDELINES & FAQ TAB */}
            {activeTab === 'faq' && (
              <section className={styles.tabSection}>
                <div className={styles.sectionHeadingRow}>
                  <h2 className={styles.sectionTitle}>Frequently Asked Questions & Stall Policies</h2>
                  <p className={styles.sectionSub}>Everything you need to know about shopping with {farmTitle}.</p>
                </div>

                <div className={styles.faqCard}>
                  <div className={styles.faqList}>
                    {FAQ_ITEMS.map((item, idx) => {
                      const isOpen = openFaq.includes(idx);
                      return (
                        <div key={idx} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
                          <button
                            type="button"
                            onClick={() => toggleFaq(idx)}
                            className={styles.faqQuestionBtn}
                            aria-expanded={isOpen}
                          >
                            <span>{item.q}</span>
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          {isOpen && <p className={styles.faqAnswer}>{item.a}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT: STICKY SIDEBAR */}
          <aside className={styles.sidebar}>
            {/* 1. Stall Facts Card */}
            <div className={styles.sideCard}>
              <h3 className={styles.sideCardTitle}>Stall Information</h3>
              <ul className={styles.sideFactsList}>
                <li className={styles.factRow}>
                  <span className={styles.factLabel}>Trading Days</span>
                  <DayDots days={farmer.operatingDays || farmer.operatingDayNumbers || ['sat', 'sun']} size="sm" />
                </li>
                <li className={styles.factRow}>
                  <span className={styles.factLabel}>Next Pickup Window</span>
                  <span className={styles.factVal}>
                    {firstWindow ? minToTime(firstWindow.startMin) + ' – ' + minToTime(firstWindow.endMin) : '8:00 AM – 1:00 PM'}
                  </span>
                </li>
                <li className={styles.factRow}>
                  <span className={styles.factLabel}>Order Cutoff</span>
                  <span className={styles.factVal}>{cutoffHours} hrs prior to market</span>
                </li>
                <li className={styles.factRow}>
                  <span className={styles.factLabel}>Stall Number</span>
                  <span className={styles.factVal}>{farmer.stallNumber ? `Stall #${farmer.stallNumber}` : 'Main Plaza'}</span>
                </li>
                <li className={styles.factRow}>
                  <span className={styles.factLabel}>Available Harvests</span>
                  <span className={styles.factVal}>{products.length} listed crops</span>
                </li>
                <li className={styles.factRow}>
                  <span className={styles.factLabel}>Producer Standard</span>
                  <span className={styles.factValHighlight}>100% Direct</span>
                </li>
                <li className={styles.factRow}>
                  <span className={styles.factLabel}>Established</span>
                  <span className={styles.factVal}>Year {establishedYear}</span>
                </li>
              </ul>
            </div>

            {/* 2. Guest Order Callout Card */}
            <div className={styles.sideCard} style={{ backgroundColor: '#fef8f6', borderColor: '#ebdcd6' }}>
              <h3 className={styles.sideCardTitle} style={{ color: '#4a1521' }}>
                Pre-Order for Pickup
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#595147', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                Create a buyer account to reserve items from {farmTitle} ahead of time. Fast, contactless pickup at the
                weekend market stall with zero line waiting.
              </p>
              <Link to={`${PATHS.REGISTER}?redirect=/farmers/${id}`} className={styles.guaranteeBtn}>
                Register Free to Order
              </Link>
              <div style={{ textAlign: 'center', marginTop: 10 }}>
                <Link
                  to={`${PATHS.LOGIN}?redirect=/farmers/${id}`}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.75rem',
                    color: '#541722',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Already registered? Sign in
                </Link>
              </div>
            </div>

            {/* 3. Producer Guarantee Card */}
            <div className={`${styles.sideCard} ${styles.guaranteeCard}`}>
              <div className={styles.guaranteeIcon}>
                <ShieldCheck size={22} />
              </div>
              <h4>100% Farm-Fresh Guarantee</h4>
              <p>
                Every crop and prepared good from {farmTitle} is harvested at peak ripeness. If anything does not meet
                your expectations, let us know within 24 hours of market pickup for an instant refund or replacement.
              </p>
              <Link to={PATHS.ABOUT} className={styles.guaranteeBtn} style={{ backgroundColor: '#4a1521' }}>
                Our Producer Standards
              </Link>
            </div>

            {/* 4. Participating Markets Card */}
            {markets.length > 0 && (
              <div className={styles.sideCard}>
                <h3 className={styles.sideCardTitle}>Participating Markets</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {markets.map((m) => (
                    <Link
                      key={m.id || m._id}
                      to={`/markets/${m.id || m._id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        backgroundColor: '#faf7f5',
                        borderRadius: 8,
                        textDecoration: 'none',
                        color: '#2e2b26',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                      <ExternalLink size={13} color="#8c8175" style={{ flexShrink: 0 }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* ─── BOTTOM DISCOVERY: OTHER LOCAL GROWERS ──────────────── */}
        {otherFarmers.length > 0 && (
          <section className={styles.otherGrowersSection}>
            <div className={styles.otherGrowersHeader}>
              <div>
                <h2 className={styles.sectionTitle} style={{ fontSize: '1.35rem' }}>
                  Explore More Local Producers
                </h2>
                <p className={styles.sectionSub}>Discover neighboring growers, bakers, and apiaries at the market.</p>
              </div>
              <Link
                to={PATHS.FARMERS}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#541722',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>View all growers</span>
                <span>›</span>
              </Link>
            </div>

            <div className={styles.otherGrowersGrid}>
              {otherFarmers.map((gf) => {
                const gVisual = getFarmerImages(gf);
                const gTitle = gf.stallName || gf.farmName || gf.name || 'Local Farm';
                const gSpecialty = gf.specialty || gVisual.specialty;
                const gRating = gf.ratingAvg ? Number(gf.ratingAvg).toFixed(1) : '4.9';

                return (
                  <Link key={gf.id || gf._id} to={`/farmers/${gf.id || gf._id}`} className={styles.otherGrowerCard}>
                    <div className={styles.otherGrowerCover}>
                      <img
                        src={gf.bannerUrl || gf.coverImage || gVisual.cover}
                        alt={gTitle}
                        className={styles.otherGrowerCoverImg}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/riverbend-farm.jpg';
                        }}
                      />
                      <div className={styles.otherGrowerAvatar}>
                        <img
                          src={gf.avatar || gf.logoUrl || gVisual.avatar}
                          alt={gTitle}
                          className={styles.otherGrowerAvatarImg}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/farmer-david.jpg';
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.otherGrowerBody}>
                      <h3 className={styles.otherGrowerName}>{gTitle}</h3>
                      <p className={styles.otherGrowerSpecialty}>{gSpecialty}</p>
                      <div className={styles.otherGrowerFooter}>
                        <span className={styles.otherGrowerRating}>
                          <Star size={13} fill="#E07A2C" color="#E07A2C" />
                          <span>{gRating}</span>
                        </span>
                        <span style={{ color: '#541722', fontWeight: 600 }}>Explore Stall →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default FarmerDetail;
