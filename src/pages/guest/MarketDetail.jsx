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
} from 'lucide-react';
import { getMarketDetail, getMarketFarmers, getMarketProducts } from '@/api/catalog';
import { formatPrice } from '@/utils/format';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import MapView from '@/components/domain/MapView';
import Illustration from '@/components/domain/Illustration';
import styles from './MarketDetail.module.css';

export function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [market, setMarket] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useDocumentTitle(market ? `${market.name} — MarketLink` : 'Farmers Market Details — MarketLink');

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
      .then(([m, f, p]) => {
        if (!active) return;
        setMarket(m);
        setFarmers(Array.isArray(f) ? f : f?.items || f?.data || []);
        setProducts(Array.isArray(p) ? p : p?.items || p?.data || []);
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
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
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

  const daysStr = Array.isArray(market.days) ? market.days.join(', ') : market.day || 'Saturday';
  const hoursStr = market.hours || '8:00 AM – 1:00 PM';
  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${market.name} ${market.address}`
  )}`;

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
                <span className={styles.schedulePill}>{hoursStr}</span>
                <span className={styles.verifiedPill}>
                  <ShieldCheck size={13} />
                  Verified Producer Only
                </span>
              </div>

              <h1 className={styles.marketNameTitle}>{market.name}</h1>

              <div className={styles.headerMetaRow}>
                <div className={styles.locationItem}>
                  <MapPin size={14} className={styles.metaIcon} />
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

      {/* ─── TAB NAVIGATION BAR ─────────────────────────────────── */}
      <div className={styles.tabsStickyBar}>
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

      {/* ─── MAIN TWO-COLUMN CONTENT AREA ───────────────────────── */}
      <div id="market-tabs-content" className={styles.mainContentSection}>
        <div className="container">
          <div className={styles.mainGrid}>
            {/* ── LEFT COLUMN: TAB CONTENT PANES ── */}
            <main className={styles.leftColumn}>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className={styles.tabPane}>
                  <div className={styles.contentCard}>
                    <h2 className={styles.cardHeading}>About {market.name}</h2>
                    <p className={styles.aboutText}>
                      {market.description ||
                        `Welcome to ${market.name}. Bringing fresh seasonal produce, artisan bakery, and farm goods directly from regional family farms to community tables. All items are available for direct pre-order during the week for Saturday morning pickup.`}
                    </p>

                    <div className={styles.historyCallout}>
                      <Sparkles size={16} className={styles.calloutIcon} />
                      <p>
                        Every attending grower is a verified producer. Harvested fresh at dawn and held safely at your stall canopy.
                      </p>
                    </div>
                  </div>

                  {/* Highlights Summary Box */}
                  <div className={styles.contentCard}>
                    <h2 className={styles.cardHeading}>Pre-Order & Pickup Guidelines</h2>
                    <ul style={{ paddingLeft: 20, color: '#4a433b', lineHeight: 1.8, fontSize: '0.9rem', margin: 0 }}>
                      <li>Browse items from local family farm stalls attending on {daysStr}.</li>
                      <li>Pre-order during the week to guarantee your seasonal harvest.</li>
                      <li>Pick up at the market stall during operating hours ({hoursStr}).</li>
                      <li>Pay directly at each stall canopy upon pickup. Cash or card accepted.</li>
                    </ul>
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
                          Every vendor is 100% verified producer-only. Zero resellers, zero markups.
                        </p>
                      </div>
                    </div>

                    <div className={styles.vendorCardsGrid}>
                      {farmers.length > 0 ? (
                        farmers.map((f) => (
                          <div key={f.id || f._id} className={styles.vendorCard}>
                            <div className={styles.vendorDetails}>
                              <div className={styles.vendorNameRow}>
                                <h3 className={styles.vendorName}>{f.stallName || f.name}</h3>
                                {f.stallNumber && (
                                  <span className={styles.vendorBadge}>Stall {f.stallNumber}</span>
                                )}
                              </div>
                              <p className={styles.vendorFarm}>{f.bio || 'Local farm producer'}</p>
                              <Link to={`/farmers/${f.id || f._id}`} className={styles.exploreStallLink}>
                                <span>Explore Farm Stall</span>
                                <ArrowRight size={13} />
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#6e655c', padding: '16px 0' }}>No attending farmers listed for this location yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRODUCTS */}
              {activeTab === 'products' && (
                <div className={styles.tabPane}>
                  <div className={styles.contentCard}>
                    <div className={styles.productsHeaderRow}>
                      <div>
                        <h2 className={styles.cardHeading}>Available for Pre-Order</h2>
                        <p className={styles.sectionSub}>
                          Reserved online during the week, harvested at dawn, and held at the stall
                        </p>
                      </div>

                      {/* Filter Pills */}
                      {categories.length > 1 && (
                        <div className={styles.filterPills}>
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
                        filteredProducts.map((p) => (
                          <div key={p.id || p._id} className={styles.productCard}>
                            <div className={styles.productBody}>
                              <span className={styles.productVendor}>{p.farmer?.stallName || 'Local Farm'}</span>
                              <h3 className={styles.productName}>{p.name}</h3>
                              <p className={styles.productPriceRow}>
                                <span className={styles.productPrice}>{formatPrice(p.priceCents || p.price)}</span>
                                <span className={styles.productUnit}>/ {p.unit}</span>
                              </p>
                              <Link to={`/products/${p.id || p._id}`} className={styles.reserveBtn}>
                                View Details
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#6e655c', padding: '16px 0' }}>No harvest items available at this time.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SCHEDULE & DIRECTIONS */}
              {activeTab === 'schedule' && (
                <div className={styles.tabPane}>
                  <div className={styles.contentCard}>
                    <h2 className={styles.cardHeading}>Market Schedule & Guidelines</h2>
                    <div className={styles.scheduleDetailBox}>
                      <div className={styles.scheduleDetailRow}>
                        <Calendar size={18} className={styles.scheduleIcon} />
                        <div>
                          <strong>Operating Days</strong>
                          <p>{daysStr} · {hoursStr}</p>
                        </div>
                      </div>

                      <div className={styles.scheduleDetailRow}>
                        <Clock size={18} className={styles.scheduleIcon} />
                        <div>
                          <strong>Pre-Order Window</strong>
                          <p>Order during the week for Saturday morning pickup.</p>
                        </div>
                      </div>

                      <div className={styles.scheduleDetailRow}>
                        <MapPin size={18} className={styles.scheduleIcon} />
                        <div>
                          <strong>Address</strong>
                          <p>{market.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>

            {/* ── RIGHT COLUMN: STICKY SIDEBAR WITH LEAFLET MAPVIEW ── */}
            <aside className={styles.sidebar}>
              <div className={styles.sideCard}>
                <div className={styles.sideCardHeader}>
                  <Store size={18} className={styles.sideHeaderIcon} />
                  <h2 className={styles.sideCardTitle}>Market Location</h2>
                </div>

                {/* Real Leaflet MapView */}
                <div className={styles.sideMapWrapper} style={{ height: '180px', overflow: 'hidden', borderRadius: 8 }}>
                  <MapView
                    markers={[
                      {
                        id: market.id || market._id,
                        lat: market.coordinates?.lat || 40.735,
                        lng: market.coordinates?.lng || -73.99,
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

                <p className={styles.sideLocationText}>
                  {market.address}
                </p>

                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.getDirectionsBtn}
                >
                  <ExternalLink size={14} />
                  <span>Get Directions</span>
                </a>
              </div>

              {/* Hours Card */}
              <div className={styles.sideCard}>
                <div className={styles.sideCardHeader}>
                  <Clock size={18} className={styles.sideHeaderIcon} />
                  <h2 className={styles.sideCardTitle}>Hours & Schedule</h2>
                </div>
                <div className={styles.hoursRow}>
                  <span className={styles.hoursDay}>{daysStr}</span>
                  <span className={styles.hoursTime}>{hoursStr}</span>
                </div>
                <div className={styles.cutoffBox}>
                  <Info size={14} className={styles.cutoffIcon} />
                  <span>Pre-orders close Friday 6:00 PM before market morning.</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketDetail;
