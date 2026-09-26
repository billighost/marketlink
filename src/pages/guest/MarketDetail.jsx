<<<<<<< HEAD
﻿import React, { useState, useEffect } from 'react';import { Link, useParams, useNavigate } from 'react-router-dom';import {  MapPin,  Calendar,  Clock,  Store,  Bookmark,  Share2,  ChevronDown,  ArrowRight,  ExternalLink,  ShoppingBag,  ShieldCheck,  Check,  Star,  Sparkles,  Info,} from 'lucide-react';import { getMarketDetail, getMarketFarmers, getMarketProducts } from '@/api/catalog';import { formatPrice } from '@/utils/format';import { PATHS } from '@/routes/paths';import useDocumentTitle from '@/hooks/useDocumentTitle';import MapView from '@/components/domain/MapView';import Illustration from '@/components/domain/Illustration';import styles from './MarketDetail.module.css';export function MarketDetail() {  const { id } = useParams();  const navigate = useNavigate();  const [market, setMarket] = useState(null);  const [farmers, setFarmers] = useState([]);  const [products, setProducts] = useState([]);  const [loading, setLoading] = useState(true);  const [error, setError] = useState(null);  const [activeTab, setActiveTab] = useState('overview');  const [saved, setSaved] = useState(false);  const [copied, setCopied] = useState(false);  const [selectedCategory, setSelectedCategory] = useState('All');  useDocumentTitle(market ? `${market.name} ΓÇö MarketLink` : 'Farmers Market Details ΓÇö MarketLink');  useEffect(() => {    let active = true;    setLoading(true);    setError(null);    Promise.all([      getMarketDetail(id).catch((err) => {        throw err;      }),      getMarketFarmers(id).catch(() => []),      getMarketProducts(id).catch(() => []),    ])      .then(([m, f, p]) => {        if (!active) return;        setMarket(m);        setFarmers(Array.isArray(f) ? f : f?.items || f?.data || []);        setProducts(Array.isArray(p) ? p : p?.items || p?.data || []);      })      .catch((err) => {        if (active) setError(err.message || 'Market not found');      })      .finally(() => {        if (active) setLoading(false);      });    return () => {      active = false;    };  }, [id]);  const handleShare = () => {    if (navigator?.clipboard) {      navigator.clipboard.writeText(window.location.href);      setCopied(true);      setTimeout(() => setCopied(false), 2000);    }  };  const handleTabJump = (tabName) => {    setActiveTab(tabName);    const contentEl = document.getElementById('market-tabs-content');    if (contentEl) {      contentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });    }  };  if (loading) {    return (      <div className={styles.page}>        <div className="container" style={{ padding: '60px 20px' }}>          <div style={{ height: 40, width: '40%', background: '#ede8df', borderRadius: 8, marginBottom: 20 }} />          <div style={{ height: 260, background: '#ede8df', borderRadius: 16, marginBottom: 30 }} />          <div style={{ height: 400, background: '#ede8df', borderRadius: 16 }} />        </div>      </div>    );  }  if (error || !market) {    return (      <div className={styles.page}>        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>          <h1 style={{ fontFamily: 'Georgia, serif', color: '#4a1521' }}>Market Not Found</h1>          <p style={{ color: '#4a433b', margin: '16px 0 24px' }}>            {error || 'This market could not be loaded or may no longer be listed.'}          </p>          <Link            to={PATHS.MARKETS}            style={{              display: 'inline-flex',              padding: '10px 24px',              backgroundColor: '#541722',              color: '#ffffff',              borderRadius: 8,              textDecoration: 'none',              fontWeight: 600,            }}          >            Browse all markets          </Link>        </div>      </div>    );  }  const daysStr = Array.isArray(market.days) ? market.days.join(', ') : market.day || 'Saturday';  const hoursStr = market.hours || '8:00 AM ΓÇô 1:00 PM';  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];  const filteredProducts =    selectedCategory === 'All'      ? products      : products.filter((p) => p.category === selectedCategory);  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(    `${market.name} ${market.address}`  )}`;  return (    <div className={styles.page}>      {}      <div className={styles.breadcrumbBar}>        <div className="container">          <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>            <Link to={PATHS.HOME} className={styles.crumbLink}>              Home            </Link>            <span className={styles.crumbDivider}>ΓÇ║</span>            <Link to={PATHS.MARKETS} className={styles.crumbLink}>              Markets            </Link>            <span className={styles.crumbDivider}>ΓÇ║</span>            <span className={styles.crumbCurrent}>{market.name}</span>          </nav>        </div>      </div>      {}      <header className={styles.headerSection}>        <div className="container">          <div className={styles.headerLayout}>            <div className={styles.headerLeft}>              <div className={styles.badgeRow}>                <span className={styles.statusPillOpen}>                  <span className={styles.statusDot} />                  Open {daysStr}                </span>                <span className={styles.schedulePill}>{hoursStr}</span>                <span className={styles.verifiedPill}>                  <ShieldCheck size={13} />                  Verified Producer Only                </span>              </div>              <h1 className={styles.marketNameTitle}>{market.name}</h1>              <div className={styles.headerMetaRow}>                <div className={styles.locationItem}>                  <MapPin size={14} className={styles.metaIcon} />                  <span>{market.address}</span>                </div>                <span className={styles.subSep}>ΓÇó</span>                <div className={styles.ratingBadge}>                  <Star size={14} fill="#D4850A" color="#D4850A" />                  <strong>4.9</strong>                  <span>(Community Market)</span>                </div>              </div>            </div>            {}            <div className={styles.headerActions}>              <div className={styles.actionButtonsRow}>                <button                  type="button"                  onClick={() => setSaved(!saved)}                  className={`${styles.saveButton} ${saved ? styles.savedActive : ''}`}                  aria-label={saved ? 'Remove from saved' : 'Save market'}                >                  <Bookmark                    size={16}                    fill={saved ? '#541722' : 'none'}                    strokeWidth={2}                    className={styles.actionIcon}                  />                  <span>{saved ? 'Saved' : 'Save Market'}</span>                </button>                <button                  type="button"                  onClick={handleShare}                  className={styles.shareButton}                  title="Share link"                  aria-label="Share market link"                >                  {copied ? <Check size={16} color="#175e21" /> : <Share2 size={16} />}                  <span>{copied ? 'Copied!' : 'Share'}</span>                </button>              </div>              <button                type="button"                onClick={() => handleTabJump('products')}                className={styles.jumpProductsBtn}              >                <ShoppingBag size={16} />                <span>Browse Saturday Harvest</span>                <ChevronDown size={15} />              </button>            </div>          </div>        </div>      </header>      {}      <div className={styles.tabsStickyBar}>        <div className="container">          <nav className={styles.tabsNav} role="tablist">            <button              type="button"              role="tab"              aria-selected={activeTab === 'overview'}              onClick={() => setActiveTab('overview')}              className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}            >              Overview & About            </button>            <button              type="button"              role="tab"              aria-selected={activeTab === 'vendors'}              onClick={() => setActiveTab('vendors')}              className={`${styles.tabBtn} ${activeTab === 'vendors' ? styles.tabBtnActive : ''}`}            >              Attending Farmers ({farmers.length})            </button>            <button              type="button"              role="tab"              aria-selected={activeTab === 'products'}              onClick={() => setActiveTab('products')}              className={`${styles.tabBtn} ${activeTab === 'products' ? styles.tabBtnActive : ''}`}            >              Available Harvest ({products.length})            </button>            <button              type="button"              role="tab"              aria-selected={activeTab === 'schedule'}              onClick={() => setActiveTab('schedule')}              className={`${styles.tabBtn} ${activeTab === 'schedule' ? styles.tabBtnActive : ''}`}            >              Schedule & Location            </button>          </nav>        </div>      </div>      {}      <div id="market-tabs-content" className={styles.mainContentSection}>        <div className="container">          <div className={styles.mainGrid}>            {}            <main className={styles.leftColumn}>              {}              {activeTab === 'overview' && (                <div className={styles.tabPane}>                  <div className={styles.contentCard}>                    <h2 className={styles.cardHeading}>About {market.name}</h2>                    <p className={styles.aboutText}>                      {market.description ||                        `Welcome to ${market.name}. Bringing fresh seasonal produce, artisan bakery, and farm goods directly from regional family farms to community tables. All items are available for direct pre-order during the week for Saturday morning pickup.`}                    </p>                    <div className={styles.historyCallout}>                      <Sparkles size={16} className={styles.calloutIcon} />                      <p>                        Every attending grower is a verified producer. Harvested fresh at dawn and held safely at your stall canopy.                      </p>                    </div>                  </div>                  {}                  <div className={styles.contentCard}>                    <h2 className={styles.cardHeading}>Pre-Order & Pickup Guidelines</h2>                    <ul style={{ paddingLeft: 20, color: '#4a433b', lineHeight: 1.8, fontSize: '0.9rem', margin: 0 }}>                      <li>Browse items from local family farm stalls attending on {daysStr}.</li>                      <li>Pre-order during the week to guarantee your seasonal harvest.</li>                      <li>Pick up at the market stall during operating hours ({hoursStr}).</li>                      <li>Pay directly at each stall canopy upon pickup. Cash or card accepted.</li>                    </ul>                  </div>                </div>              )}              {}              {activeTab === 'vendors' && (                <div className={styles.tabPane}>                  <div className={styles.contentCard}>                    <div className={styles.sectionHeaderRow}>                      <div>                        <h2 className={styles.cardHeading}>Participating Farmers & Artisans</h2>                        <p className={styles.sectionSub}>                          Every vendor is 100% verified producer-only. Zero resellers, zero markups.                        </p>                      </div>                    </div>                    <div className={styles.vendorCardsGrid}>                      {farmers.length > 0 ? (                        farmers.map((f) => (                          <div key={f.id || f._id} className={styles.vendorCard}>                            <div className={styles.vendorDetails}>                              <div className={styles.vendorNameRow}>                                <h3 className={styles.vendorName}>{f.stallName || f.name}</h3>                                {f.stallNumber && (                                  <span className={styles.vendorBadge}>Stall {f.stallNumber}</span>                                )}                              </div>                              <p className={styles.vendorFarm}>{f.bio || 'Local farm producer'}</p>                              <Link to={`/farmers/${f.id || f._id}`} className={styles.exploreStallLink}>                                <span>Explore Farm Stall</span>                                <ArrowRight size={13} />                              </Link>                            </div>                          </div>                        ))                      ) : (                        <p style={{ color: '#6e655c', padding: '16px 0' }}>No attending farmers listed for this location yet.</p>                      )}                    </div>                  </div>                </div>              )}              {}              {activeTab === 'products' && (                <div className={styles.tabPane}>                  <div className={styles.contentCard}>                    <div className={styles.productsHeaderRow}>                      <div>                        <h2 className={styles.cardHeading}>Available for Pre-Order</h2>                        <p className={styles.sectionSub}>                          Reserved online during the week, harvested at dawn, and held at the stall                        </p>                      </div>                      {}                      {categories.length > 1 && (                        <div className={styles.filterPills}>                          {categories.map((cat) => (                            <button                              key={cat}                              type="button"                              onClick={() => setSelectedCategory(cat)}                              className={`${styles.filterPill} ${                                selectedCategory === cat ? styles.filterPillActive : ''                              }`}                            >                              {cat}                            </button>                          ))}                        </div>                      )}                    </div>                    <div className={styles.productsGrid}>                      {filteredProducts.length > 0 ? (                        filteredProducts.map((p) => (                          <div key={p.id || p._id} className={styles.productCard}>                            <div className={styles.productBody}>                              <span className={styles.productVendor}>{p.farmer?.stallName || 'Local Farm'}</span>                              <h3 className={styles.productName}>{p.name}</h3>                              <p className={styles.productPriceRow}>                                <span className={styles.productPrice}>{formatPrice(p.priceCents || p.price)}</span>                                <span className={styles.productUnit}>/ {p.unit}</span>                              </p>                              <Link to={`/products/${p.id || p._id}`} className={styles.reserveBtn}>                                View Details                              </Link>                            </div>                          </div>                        ))                      ) : (                        <p style={{ color: '#6e655c', padding: '16px 0' }}>No harvest items available at this time.</p>                      )}                    </div>                  </div>                </div>              )}              {}              {activeTab === 'schedule' && (                <div className={styles.tabPane}>                  <div className={styles.contentCard}>                    <h2 className={styles.cardHeading}>Market Schedule & Guidelines</h2>                    <div className={styles.scheduleDetailBox}>                      <div className={styles.scheduleDetailRow}>                        <Calendar size={18} className={styles.scheduleIcon} />                        <div>                          <strong>Operating Days</strong>                          <p>{daysStr} ┬╖ {hoursStr}</p>                        </div>                      </div>                      <div className={styles.scheduleDetailRow}>                        <Clock size={18} className={styles.scheduleIcon} />                        <div>                          <strong>Pre-Order Window</strong>                          <p>Order during the week for Saturday morning pickup.</p>                        </div>                      </div>                      <div className={styles.scheduleDetailRow}>                        <MapPin size={18} className={styles.scheduleIcon} />                        <div>                          <strong>Address</strong>                          <p>{market.address}</p>                        </div>                      </div>                    </div>                  </div>                </div>              )}            </main>            {}            <aside className={styles.sidebar}>              <div className={styles.sideCard}>                <div className={styles.sideCardHeader}>                  <Store size={18} className={styles.sideHeaderIcon} />                  <h2 className={styles.sideCardTitle}>Market Location</h2>                </div>                {}                <div className={styles.sideMapWrapper} style={{ height: '180px', overflow: 'hidden', borderRadius: 8 }}>                  <MapView                    markers={[                      {                        id: market.id || market._id,                        lat: market.coordinates?.lat || 40.735,                        lng: market.coordinates?.lng || -73.99,                        title: market.name,                        subtitle: market.address,                      },                    ]}                    height="180px"                    zoom={15}                    interactive={false}                    showDirectionsLink={false}                    ariaLabel={`Map location of ${market.name}`}                  />                </div>                <p className={styles.sideLocationText}>                  {market.address}                </p>                <a                  href={directionsUrl}                  target="_blank"                  rel="noopener noreferrer"                  className={styles.getDirectionsBtn}                >                  <ExternalLink size={14} />                  <span>Get Directions</span>                </a>              </div>              {}              <div className={styles.sideCard}>                <div className={styles.sideCardHeader}>                  <Clock size={18} className={styles.sideHeaderIcon} />                  <h2 className={styles.sideCardTitle}>Hours & Schedule</h2>                </div>                <div className={styles.hoursRow}>                  <span className={styles.hoursDay}>{daysStr}</span>                  <span className={styles.hoursTime}>{hoursStr}</span>                </div>                <div className={styles.cutoffBox}>                  <Info size={14} className={styles.cutoffIcon} />                  <span>Pre-orders close Friday 6:00 PM before market morning.</span>                </div>              </div>            </aside>          </div>        </div>      </div>    </div>  );}export default MarketDetail;
=======
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Clock,
  Store,
  Bookmark,
  Share2,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  ShoppingBag,
  ShieldCheck,
  Check,
  Star,
  Sparkles,
  Info,
  Navigation,
  Phone,
  Mail,
  Award,
  Users,
  ZoomIn,
} from 'lucide-react';
import { getMarketDetail, getMarketFarmers, getMarketProducts } from '@/api/catalog';
import { formatPrice, formatMarketSchedule } from '@/utils/format';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import MapView from '@/components/domain/MapView';
import { Illustration } from '@/components/domain/Illustration';
import { useToast } from '@/context/ToastContext';
import { ImageZoomModal } from '@/components/ui/ImageZoomModal';
import styles from './MarketDetail.module.css';

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
  if (name.includes('riverside') || slug.includes('riverside')) return '/images/market-riverside.jpg';
  if (name.includes('wildflower') || slug.includes('wildflower')) return '/images/market-wildflower.jpg';
  return '/images/market-central.jpg';
}

function getProductVisual(product) {
  if (product?.imageUrl) return { type: 'img', src: product.imageUrl };
  if (product?.image) return { type: 'img', src: product.image };
  const name = (product?.name || '').toLowerCase();
  const art = (product?.art || '').toLowerCase();
  if (name.includes('tomato') || art.includes('tomato')) return { type: 'img', src: '/images/product-tomatoes.jpg' };
  if (name.includes('sourdough') || name.includes('bread') || name.includes('loaf') || art.includes('sourdough') || art.includes('bread')) {
    return { type: 'img', src: '/images/product-sourdough.jpg' };
  }
  if (name.includes('lettuce') || name.includes('green') || name.includes('kale') || name.includes('chard') || art.includes('lettuce')) {
    return { type: 'img', src: '/images/product-lettuce.jpg' };
  }
  if (name.includes('strawberr') || name.includes('berry') || art.includes('strawberr')) {
    return { type: 'img', src: '/images/product-strawberries.jpg' };
  }
  if (name.includes('honey') || art.includes('honey')) return { type: 'img', src: '/images/product-honey.jpg' };
  if (name.includes('carrot') || art.includes('carrot')) return { type: 'img', src: '/images/hero-carrots.jpg' };
  if (name.includes('bouquet') || name.includes('flower') || art.includes('flower')) return { type: 'illustration', name: 'flowers' };
  if (name.includes('corn') || art.includes('corn')) return { type: 'illustration', name: 'corn' };
  if (name.includes('mushroom') || name.includes('lion') || name.includes('oyster') || art.includes('mushroom')) {
    return { type: 'illustration', name: 'mushrooms' };
  }
  if (name.includes('cheese') || name.includes('ricotta') || name.includes('dairy') || art.includes('cheese')) {
    return { type: 'illustration', name: 'cheese-wedge' };
  }
  if (name.includes('egg') || name.includes('poultry') || art.includes('egg')) return { type: 'illustration', name: 'egg-carton' };
  if (name.includes('beet') || art.includes('beet')) return { type: 'illustration', name: 'beet-bunch' };
  if (product?.art) return { type: 'illustration', name: product.art };
  return { type: 'illustration', name: 'basket' };
}

function getFarmerVisual(farmer) {
  if (farmer?.imageUrl) return { type: 'img', src: farmer.imageUrl };
  const stall = (farmer?.stallName || farmer?.name || '').toLowerCase();
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

export function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [market, setMarket] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [zoomModalIndex, setZoomModalIndex] = useState(0);

  const galleryImages = [
    {
      src: getMarketImage(market),
      alt: market?.name || 'Farmers Market',
      caption: `${market?.name || 'Farmers Market'} — ${market?.address || 'Market Location'}`,
    },
    {
      src: '/images/market-morning.jpg',
      alt: 'Market Morning Stalls',
      caption: `${market?.name || 'Farmers Market'} — Morning Stall Setup & Artisans`,
    },
    {
      src: '/images/hero-market-crates.jpg',
      alt: 'Farm Fresh Crates',
      caption: `${market?.name || 'Farmers Market'} — Fresh Harvest & Seasonal Crates`,
    },
  ];

  const handleOpenZoom = (index = 0) => {
    setZoomModalIndex(index);
    setZoomModalOpen(true);
  };

  useDocumentTitle(market ? `${market.name} — MarketLink` : 'Farmers Market — MarketLink');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getMarketDetail(id).catch((err) => {
        throw err;
      }),
      getMarketFarmers(id).catch(() => []),
      getMarketProducts(id).catch(() => []),
    ])
      .then(([m, fList, pList]) => {
        if (!active) return;
        setMarket(m);
        const f = Array.isArray(fList) ? fList : fList?.items || fList?.data || [];
        setFarmers(f);
        const p = Array.isArray(pList) ? pList : pList?.items || pList?.data || [];
        setProducts(p);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Market not found');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast({ message: 'Market link copied to clipboard', type: 'info' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTabJump = (tabName) => {
    setActiveTab(tabName);
    const contentEl = document.getElementById('market-tabs-content');
    if (contentEl) {
      contentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ padding: '60px 20px' }}>
          <div style={{ height: 40, width: '40%', background: '#ede8df', borderRadius: 8, marginBottom: 20 }} />
          <div style={{ height: 260, background: '#ede8df', borderRadius: 16, marginBottom: 30 }} />
          <div style={{ height: 400, background: '#ede8df', borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className={styles.page}>
        <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#4a1521' }}>Market Not Found</h1>
          <p style={{ color: '#4a433b', margin: '16px 0 24px' }}>
            {error || 'This market could not be loaded or may no longer be listed.'}
          </p>
          <Link
            to={PATHS.MARKETS}
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
            Browse all markets
          </Link>
        </div>
      </div>
    );
  }

  const scheduleText = formatMarketSchedule(market) || 'Saturdays · 8:00 AM – 1:00 PM';
  const scheduleDays = Array.isArray(market.schedule)
    ? market.schedule.map((s) => (typeof s === 'string' ? s : s.day)).filter(Boolean)
    : Array.isArray(market.days)
    ? market.days
    : [market.day || 'sat'];
  const daysStr =
    scheduleDays
      .map((d) => (typeof d === 'string' ? d.charAt(0).toUpperCase() + d.slice(1) : ''))
      .filter(Boolean)
      .join(', ') || 'Saturday';

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${market.name} ${market.address}`
  )}`;

  const lat =
    market.location?.lat != null
      ? market.location.lat
      : market.coordinates?.lat != null
      ? market.coordinates.lat
      : 40.735;
  const lng =
    market.location?.lng != null
      ? market.location.lng
      : market.coordinates?.lng != null
      ? market.coordinates.lng
      : -74.172;

  return (
    <div className={styles.page}>
      {/* ─── BREADCRUMBS BAR ─────────────────────────────────────── */}
      <div className={styles.breadcrumbBar}>
        <div className="container">
          <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
            <Link to={PATHS.HOME} className={styles.crumbLink}>
              Home
            </Link>
            <span className={styles.crumbDivider}>›</span>
            <Link to={PATHS.MARKETS} className={styles.crumbLink}>
              Markets
            </Link>
            <span className={styles.crumbDivider}>›</span>
            <span className={styles.crumbCurrent}>{market.name}</span>
          </nav>
        </div>
      </div>

      {/* ─── HEADER / HERO TITLE BLOCK ─────────────────────────── */}
      <header className={styles.headerSection}>
        <div className="container">
          <div className={styles.headerLayout}>
            <div className={styles.headerLeft}>
              <div className={styles.badgeRow}>
                <span className={styles.statusPillOpen}>
                  <span className={styles.statusDot} />
                  Open {daysStr}
                </span>
                <span className={styles.schedulePill}>{scheduleText}</span>
                <span className={styles.verifiedPill}>
                  <ShieldCheck size={13} />
                  Verified Producer Only
                </span>
              </div>

              <h1 className={styles.marketTitle}>{market.name}</h1>

              <div className={styles.subtitleRow}>
                <div className={styles.locationSubtitle}>
                  <MapPin size={14} className={styles.locationIcon} />
                  <span>{market.address}</span>
                </div>
                <span className={styles.subSep}>•</span>
                <div className={styles.ratingBadge}>
                  <Star size={14} fill="#D4850A" color="#D4850A" />
                  <strong>4.9</strong>
                  <span>(Community Market)</span>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className={styles.headerActions}>
              <div className={styles.actionButtonsRow}>
                <button
                  type="button"
                  onClick={() => setSaved(!saved)}
                  className={`${styles.saveButton} ${saved ? styles.savedActive : ''}`}
                  aria-label={saved ? 'Remove from saved' : 'Save market'}
                >
                  <Bookmark
                    size={16}
                    fill={saved ? '#541722' : 'none'}
                    strokeWidth={2}
                    className={styles.actionIcon}
                  />
                  <span>{saved ? 'Saved' : 'Save Market'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className={styles.shareButton}
                  title="Share link"
                  aria-label="Share market link"
                >
                  {copied ? <Check size={16} color="#175e21" /> : <Share2 size={16} />}
                  <span>{copied ? 'Copied!' : 'Share'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleTabJump('products')}
                className={styles.jumpProductsBtn}
              >
                <ShoppingBag size={16} />
                <span>Browse Saturday Harvest</span>
                <ChevronDown size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── GALLERY COLLAGE MOSAIC ──────────────────────────────── */}
      <section className={styles.gallerySection}>
        <div className="container">
          <div className={styles.galleryCollage}>
            <div
              className={`${styles.galleryMain} ${styles.zoomableGalleryItem}`}
              onClick={() => handleOpenZoom(0)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleOpenZoom(0)}
              aria-label={`Zoom in on ${market.name} photo`}
              title="Click to zoom in"
            >
              <img
                src={getMarketImage(market)}
                alt={market.name}
                className={styles.galleryImg}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/market-central.jpg';
                }}
              />
              <span className={styles.galleryCaptionPill}>
                <MapPin size={12} /> {market.address || 'Market Location'}
              </span>
              <span className={styles.zoomHoverBadge}>
                <ZoomIn size={13} />
                <span>Zoom Photo</span>
              </span>
            </div>

            <div className={styles.galleryRightStack}>
              <div
                className={`${styles.gallerySubItem} ${styles.zoomableGalleryItem}`}
                onClick={() => handleOpenZoom(1)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleOpenZoom(1)}
                aria-label="Zoom in on Stall Setup photo"
                title="Click to zoom in"
              >
                <img
                  src="/images/market-morning.jpg"
                  alt="Market Morning Stalls"
                  className={styles.galleryImg}
                />
                <span className={styles.gallerySubPill}>Stall Setup</span>
                <span className={styles.zoomHoverBadge}>
                  <ZoomIn size={12} />
                  <span>Zoom</span>
                </span>
              </div>

              <div
                className={`${styles.gallerySubItem} ${styles.zoomableGalleryItem}`}
                onClick={() => handleOpenZoom(2)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleOpenZoom(2)}
                aria-label="Zoom in on Fresh Harvest photo"
                title="Click to zoom in"
              >
                <img
                  src="/images/hero-market-crates.jpg"
                  alt="Farm Fresh Crates"
                  className={styles.galleryImg}
                />
                <span className={styles.gallerySubPill}>Fresh Harvest</span>
                <span className={styles.zoomHoverBadge}>
                  <ZoomIn size={12} />
                  <span>Zoom</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fullscreen Interactive Zoom Lightbox Modal */}
      <ImageZoomModal
        isOpen={zoomModalOpen}
        onClose={() => setZoomModalOpen(false)}
        images={galleryImages}
        initialIndex={zoomModalIndex}
      />

      {/* ─── QUICK INFO STRIP ────────────────────────────────────── */}
      <section className={styles.quickInfoSection}>
        <div className="container">
          <div className={styles.quickInfoBar}>
            <div className={styles.quickInfoItem}>
              <div className={`${styles.quickIconWrap} ${styles.iconPink}`}>
                <Calendar size={18} />
              </div>
              <div className={styles.quickInfoContent}>
                <span className={styles.quickLabel}>Market Day</span>
                <strong className={styles.quickValue}>{daysStr}</strong>
              </div>
            </div>

            <div className={styles.quickInfoItem}>
              <div className={`${styles.quickIconWrap} ${styles.iconOrange}`}>
                <Clock size={18} />
              </div>
              <div className={styles.quickInfoContent}>
                <span className={styles.quickLabel}>Operating Hours</span>
                <strong className={styles.quickValue}>
                  {scheduleText.includes('·') ? scheduleText.split('·')[1].trim() : scheduleText}
                </strong>
              </div>
            </div>

            <div className={styles.quickInfoItem}>
              <div className={`${styles.quickIconWrap} ${styles.iconGreen}`}>
                <Store size={18} />
              </div>
              <div className={styles.quickInfoContent}>
                <span className={styles.quickLabel}>Verified Stalls</span>
                <strong className={styles.quickValue}>{farmers.length || 18} Local Producers</strong>
              </div>
            </div>

            <div className={styles.quickInfoItem}>
              <div className={`${styles.quickIconWrap} ${styles.iconSlate}`}>
                <ShieldCheck size={18} />
              </div>
              <div className={styles.quickInfoContent}>
                <span className={styles.quickLabel}>Fulfillment</span>
                <strong className={styles.quickValue}>Pre-Order & Pickup</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TAB NAVIGATION BAR ─────────────────────────────────── */}
      <div className={styles.tabNavBarSection}>
        <div className="container">
          <nav className={styles.tabsNav} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
            >
              Overview & About
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'vendors'}
              onClick={() => setActiveTab('vendors')}
              className={`${styles.tabBtn} ${activeTab === 'vendors' ? styles.tabBtnActive : ''}`}
            >
              Attending Farmers ({farmers.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
              className={`${styles.tabBtn} ${activeTab === 'products' ? styles.tabBtnActive : ''}`}
            >
              Available Harvest ({products.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'schedule'}
              onClick={() => setActiveTab('schedule')}
              className={`${styles.tabBtn} ${activeTab === 'schedule' ? styles.tabBtnActive : ''}`}
            >
              Schedule & Location
            </button>
          </nav>
        </div>
      </div>

      {/* ─── MAIN TWO-COLUMN CONTENT AREA ────────────────────────── */}
      <div id="market-tabs-content" className={styles.mainContentSection}>
        <div className="container">
          <div className={styles.mainGrid}>
            {/* LEFT COLUMN: TAB CONTENT PANES */}
            <main className={styles.leftColumn}>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className={styles.tabPane}>
                  <div className={styles.contentCard}>
                    {market.bannerUrl && (
                      <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 16, aspectRatio: '16/9' }}>
                        <img
                          src={market.bannerUrl}
                          alt={market.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </div>
                    )}
                    <h2 className={styles.cardHeading}>About {market.name}</h2>
                    <p className={styles.aboutText}>
                      {market.description ||
                        `Welcome to ${market.name}. Bringing fresh seasonal produce, artisan sourdough, and farmstead goods directly from regional family farms to community tables. All items are available for direct pre-order during the week for Saturday morning pickup.`}
                    </p>

                    <div className={styles.historyCallout}>
                      <Sparkles size={16} className={styles.historyIcon} />
                      <p>
                        Every attending grower is a certified regional producer. Produce is harvested fresh at dawn and packed in craft paper totes held safely at your stall canopy.
                      </p>
                    </div>

                    {/* Highlights Grid */}
                    <h3 style={{ fontSize: '1rem', color: '#4a1521', margin: '0 0 14px 0', fontWeight: 700 }}>
                      What Makes This Market Special
                    </h3>
                    <div className={styles.highlightsGrid}>
                      <div className={styles.highlightItem}>
                        <div className={styles.highlightHeader}>
                          <div className={styles.highlightIconWrap}>
                            <Sparkles size={16} />
                          </div>
                          <h4 className={styles.highlightTitle}>Dawn Harvested Fresh</h4>
                        </div>
                        <p className={styles.highlightDesc}>
                          Greens, tomatoes, and berries harvested within 18 hours of Saturday market morning.
                        </p>
                      </div>

                      <div className={styles.highlightItem}>
                        <div className={styles.highlightHeader}>
                          <div className={styles.highlightIconWrap}>
                            <ShieldCheck size={16} />
                          </div>
                          <h4 className={styles.highlightTitle}>100% Producer-Only</h4>
                        </div>
                        <p className={styles.highlightDesc}>
                          No wholesalers or jobbers. Meet the actual farmers who grow your food.
                        </p>
                      </div>

                      <div className={styles.highlightItem}>
                        <div className={styles.highlightHeader}>
                          <div className={styles.highlightIconWrap}>
                            <Award size={16} />
                          </div>
                          <h4 className={styles.highlightTitle}>SNAP & EBT Match</h4>
                        </div>
                        <p className={styles.highlightDesc}>
                          Stop by the info pavilion for $2 Market Match tokens for every $2 in EBT benefits.
                        </p>
                      </div>

                      <div className={styles.highlightItem}>
                        <div className={styles.highlightHeader}>
                          <div className={styles.highlightIconWrap}>
                            <ShoppingBag size={16} />
                          </div>
                          <h4 className={styles.highlightTitle}>Zero Middleman Markup</h4>
                        </div>
                        <p className={styles.highlightDesc}>
                          You reserve online at farm gate prices and pay directly to the grower at their stall.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Market Stats Card */}
                  <div className={styles.statsCard}>
                    <h2 className={styles.statsCardHeading}>Market Impact & Community Metrics</h2>
                    <div className={styles.statsMetricGrid}>
                      <div className={styles.metricItem}>
                        <span className={styles.metricVal}>{farmers.length || 18}+</span>
                        <span className={styles.metricLbl}>Attending Stalls</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricVal}>1,200+</span>
                        <span className={styles.metricLbl}>Weekly Shoppers</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricVal}>100%</span>
                        <span className={styles.metricLbl}>Regional Farms</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricVal}>4.9 ★</span>
                        <span className={styles.metricLbl}>Customer Rating</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VENDORS */}
              {activeTab === 'vendors' && (
                <div className={styles.tabPane}>
                  <div className={styles.contentCard}>
                    <div className={styles.sectionHeaderRow}>
                      <div>
                        <h2 className={styles.cardHeading}>Participating Farmers & Artisans</h2>
                        <p className={styles.sectionSub}>
                          Every vendor is 100% verified producer-only. Zero middlemen, direct from grower to tote.
                        </p>
                      </div>
                    </div>

                    <div className={styles.vendorCardsGrid}>
                      {farmers.length > 0 ? (
                        farmers.map((f) => {
                          const visual = getFarmerVisual(f);
                          return (
                            <div key={f.id || f._id} className={styles.vendorCard}>
                              {visual.type === 'img' ? (
                                <img
                                  src={visual.src}
                                  alt={f.stallName || f.name}
                                  className={styles.vendorImg}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/images/farmer-elena.jpg';
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 12,
                                    backgroundColor: '#f5eee8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Illustration name={visual.name || 'stall'} size={32} />
                                </div>
                              )}
                              <div className={styles.vendorDetails}>
                                <div className={styles.vendorNameRow}>
                                  <h3 className={styles.vendorName}>{f.stallName || f.name}</h3>
                                  {f.stallNumber && (
                                    <span className={styles.vendorBadge}>{f.stallNumber}</span>
                                  )}
                                </div>
                                <p className={styles.vendorFarm}>{f.specialty || f.bio || 'Local farm producer'}</p>
                                <Link to={`/farmers/${f.id || f._id}`} className={styles.exploreStallLink}>
                                  <span>Explore Farm Stall</span>
                                  <ArrowRight size={13} />
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ color: '#6e655c', padding: '16px 0' }}>
                          No attending farmers listed for this location yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRODUCTS */}
              {activeTab === 'products' && (
                <div className={styles.tabPane}>
                  <div className={styles.contentCard}>
                    <div className={styles.sectionHeaderRow}>
                      <div>
                        <h2 className={styles.cardHeading}>Available for Pre-Order</h2>
                        <p className={styles.sectionSub}>
                          Reserved online during the week, harvested at dawn, and held at the stall
                        </p>
                      </div>

                      {/* Filter Pills */}
                      {categories.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setSelectedCategory(cat)}
                              className={`${styles.filterPill} ${
                                selectedCategory === cat ? styles.filterPillActive : ''
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={styles.productsGrid}>
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((p) => {
                          const visual = getProductVisual(p);
                          const unitPrice = formatPrice(
                            p.priceCents || (p.price ? p.price * 100 : 0)
                          );

                          return (
                            <div key={p.id || p._id} className={styles.productCard}>
                              <div className={styles.productImageWrap}>
                                {visual.type === 'img' ? (
                                  <img
                                    src={visual.src}
                                    alt={p.name}
                                    className={styles.productImg}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = 'none';
                                      if (e.target.nextSibling)
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}

                                <div
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    display: visual.type === 'img' ? 'none' : 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f5eee8',
                                  }}
                                >
                                  <Illustration name={visual.name || 'basket'} size={72} />
                                </div>

                                <span className={styles.productTagPill}>
                                  {p.availability === 'low' ? 'Low Stock' : 'In Season'}
                                </span>
                              </div>

                              <div className={styles.productBody}>
                                <span className={styles.productVendor}>
                                  {p.farmer?.stallName || p.farmerName || 'Local Farm'}
                                </span>
                                <h3 className={styles.productTitle}>
                                  <Link
                                    to={`/products/${p.id || p._id}`}
                                    className={styles.productLink}
                                  >
                                    {p.name}
                                  </Link>
                                </h3>

                                <div className={styles.productPricingRow}>
                                  <div className={styles.productPriceGroup}>
                                    <span className={styles.productPrice}>{unitPrice}</span>
                                    <span className={styles.productUnit}>/ {p.unit || 'each'}</span>
                                  </div>
                                  <span className={styles.productStockMuted}>
                                    {p.quantityLeft ? `${p.quantityLeft} left` : 'Harvested daily'}
                                  </span>
                                </div>

                                <Link
                                  to={`/products/${p.id || p._id}`}
                                  className={styles.reserveButton}
                                >
                                  <ShoppingBag size={14} />
                                  <span>Pre-Order Details</span>
                                </Link>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ color: '#6e655c', padding: '16px 0' }}>
                          No harvest items available in this category.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SCHEDULE & DIRECTIONS */}
              {activeTab === 'schedule' && (
                <div className={styles.tabPane}>
                  <div className={styles.contentCard}>
                    <h2 className={styles.cardHeading}>Market Schedule & Location Guidelines</h2>

                    <div className={styles.scheduleDetailBox}>
                      <div className={styles.scheduleDetailRow}>
                        <Calendar size={18} className={styles.scheduleIcon} />
                        <div>
                          <strong>Operating Days</strong>
                          <p>{daysStr} · {scheduleText}</p>
                        </div>
                      </div>

                      <div className={styles.scheduleDetailRow}>
                        <Clock size={18} className={styles.scheduleIcon} />
                        <div>
                          <strong>Pre-Order Cutoff</strong>
                          <p>Place orders during the week before Friday 6:00 PM for Saturday pickup.</p>
                        </div>
                      </div>

                      <div className={styles.scheduleDetailRow}>
                        <MapPin size={18} className={styles.scheduleIcon} />
                        <div>
                          <strong>Stall Canopy Location</strong>
                          <p>{market.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className={styles.transitBox}>
                      <h3 className={styles.transitHeading}>Getting Here & Parking Access</h3>
                      <p className={styles.transitText}>
                        <strong>Public Transit:</strong> Accessible via regional subway, bus routes, and local commuter lines. Follow directional wayfinding signs towards the main market pavilion.
                      </p>
                      <p className={styles.transitText}>
                        <strong>Bicycle & Pedestrian:</strong> Bike racks and pedestrian pathways available at both north and south entrances. Clean, wide walkways between all canopies.
                      </p>
                      <p className={styles.transitText}>
                        <strong>Accessibility:</strong> Level pavement, ADA accessible ramps, and priority parking spaces located directly adjacent to the market info booth.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </main>

            {/* RIGHT COLUMN: STICKY SIDEBAR WITH LEAFLET MAPVIEW */}
            <aside className={styles.sidebar}>
              {/* Market Location Card */}
              <div className={styles.sideCard}>
                <div className={styles.sideCardHeader}>
                  <Store size={18} className={styles.sideHeaderIcon} />
                  <h2 className={styles.sideCardTitle}>Market Location</h2>
                </div>

                <div
                  className={styles.sideMapWrapper}
                  style={{ height: '180px', overflow: 'hidden', borderRadius: 10 }}
                >
                  <MapView
                    markers={[
                      {
                        id: market.id || market._id,
                        lat,
                        lng,
                        title: market.name,
                        subtitle: market.address,
                      },
                    ]}
                    height="180px"
                    zoom={15}
                    interactive={false}
                    showDirectionsLink={false}
                    ariaLabel={`Map location of ${market.name}`}
                  />
                </div>

                <p className={styles.sideLocationText}>{market.address}</p>

                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.getDirectionsButton}
                >
                  <ExternalLink size={14} />
                  <span>Get Directions in Google Maps</span>
                </a>
              </div>

              {/* Hours Card */}
              <div className={styles.sideCard}>
                <div className={styles.sideCardHeader}>
                  <Clock size={18} className={styles.sideHeaderIcon} />
                  <h2 className={styles.sideCardTitle}>Hours & Schedule</h2>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, color: '#24201c' }}>{daysStr}</span>
                  <span style={{ color: '#541722', fontWeight: 600 }}>{scheduleText}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: '#faf5f2',
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontSize: '0.75rem',
                    color: '#8c3f20',
                  }}
                >
                  <Info size={14} style={{ flexShrink: 0 }} />
                  <span>Pre-orders close Friday 6:00 PM before market morning.</span>
                </div>
              </div>

              {/* Guidelines Card */}
              <div className={styles.sideCard}>
                <div className={styles.sideCardHeader}>
                  <ShieldCheck size={18} className={styles.sideHeaderIcon} />
                  <h2 className={styles.sideCardTitle}>Market Guidelines</h2>
                </div>

                <ul className={styles.guidelinesList}>
                  <li className={styles.guidelineItem}>
                    <Check size={15} className={styles.guidelineCheck} />
                    <span>Bring reusable bags or pick up a clean paper tote at the stall.</span>
                  </li>
                  <li className={styles.guidelineItem}>
                    <Check size={15} className={styles.guidelineCheck} />
                    <span>Pay farmers directly upon collection via Cash, Card, or SNAP.</span>
                  </li>
                  <li className={styles.guidelineItem}>
                    <Check size={15} className={styles.guidelineCheck} />
                    <span>Pre-orders are guaranteed and held until 1:00 PM.</span>
                  </li>
                </ul>
              </div>

              {/* Operations Desk Card */}
              <div className={styles.sideCard}>
                <div className={styles.sideCardHeader}>
                  <Store size={18} className={styles.sideHeaderIcon} />
                  <h2 className={styles.sideCardTitle}>Market Operations Desk</h2>
                </div>

                <p className={styles.managerOrg}>
                  Managed by MarketLink Regional Producers Network.
                </p>

                <div className={styles.managerContactList}>
                  <Link to={PATHS.CONTACT} className={styles.managerContactLink}>
                    <Mail size={14} className={styles.managerContactIcon} />
                    <span>Contact Market Coordinator</span>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM COMMUNITY CTA BANNER ─────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaBadgeRow}>
              <span className={styles.ctaBadge}>
                <Sparkles size={13} />
                Fresh from Regional Soil
              </span>
            </div>
            <h2 className={styles.ctaTitle}>Experience Market Morning in Person</h2>
            <p className={styles.ctaSubtitle}>
              Meet the growers, taste seasonal harvest at peak ripeness, and bring wholesome regional produce home to your kitchen table.
            </p>
            <div className={styles.ctaButtonGroup}>
              <Link to={PATHS.PRODUCTS} className={styles.ctaPrimaryBtn}>
                <ShoppingBag size={16} />
                <span>Explore This Week's Harvest</span>
              </Link>
              <Link to={PATHS.MARKETS} className={styles.ctaSecondaryBtn}>
                <span>Browse All Weekend Markets</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MarketDetail;
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
