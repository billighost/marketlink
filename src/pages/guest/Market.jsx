import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  Map as MapIcon,
  List as ListIcon,
  Bookmark,
  Clock,
  Store,
  X,
  Sliders,
  ChevronDown,
  ArrowRight,
  Star,
  Sparkles,
} from 'lucide-react';
import { getMarkets } from '@/api/catalog';
import MapView from '@/components/domain/MapView';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import styles from './Market.module.css';

export function Market() {
  useDocumentTitle('Explore Farmers Markets — MarketLink');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialMode = searchParams.get('view') === 'list' ? 'list' : 'map';
  const [viewMode, setViewMode] = useState(initialMode);

  const [rawMarkets, setRawMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Regions');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All Markets');
  const [selectedMarketId, setSelectedMarketId] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(true);
  const [savedMarkets, setSavedMarkets] = useState({});
  const [hoveredMarketId, setHoveredMarketId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMarkets()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : data?.data || data?.items || [];
        setRawMarkets(list);
        if (list.length > 0) {
          setSelectedMarketId(list[0].id || list[0]._id);
        }
      })
      .catch(() => {
        if (active) setRawMarkets([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const normalizedMarkets = useMemo(() => {
    return rawMarkets.map((m) => {
      const id = m.id || m._id;
      const daysStr = Array.isArray(m.days) ? m.days.join(', ') : m.day || 'Saturday';
      return {
        id,
        name: m.name,
        image: m.image || '/images/market-unionsquare.jpg',
        status: m.status === 'active' || m.status === 'open' ? 'Open Saturday' : m.status || 'Active',
        statusType: 'open',
        statusDetail: `${m.hours || '8:00 AM – 1:00 PM'} · ${daysStr}`,
        distance: m.distance || 'Local area',
        distanceMiles: m.distance || 'Market location',
        location: m.address || 'Market Square',
        fullAddress: m.address || 'Market Square',
        hours: m.hours || '8:00 AM – 1:00 PM',
        vendors: m.farmerCount ? `${m.farmerCount} Farmers` : 'Local Farmers & Artisans',
        rating: m.rating || 4.9,
        reviewCount: m.reviewCount || 36,
        day: daysStr,
        categories: ['All Markets', daysStr.includes('Sat') || daysStr.includes('Sun') ? 'Weekend' : 'Weekday'],
        description:
          m.description ||
          `Community farmers market open ${daysStr}. Fresh produce and artisanal goods available for direct pre-order.`,
        path: `/markets/${id}`,
        lat: m.coordinates?.lat || 40.735,
        lng: m.coordinates?.lng || -73.99,
      };
    });
  }, [rawMarkets]);

  const filterTabs = [
    { label: 'All Markets', filter: 'All Markets' },
    { label: 'Weekend Markets', filter: 'Weekend' },
    { label: 'Weekday Markets', filter: 'Weekday' },
  ];

  const handleModeChange = (mode) => {
    setViewMode(mode);
    setSearchParams({ view: mode });
  };

  const toggleSave = (id, e) => {
    if (e) e.stopPropagation();
    setSavedMarkets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectMarket = (m) => {
    setSelectedMarketId(m.id);
    setIsPopupOpen(true);
  };

  const filteredMarkets = useMemo(() => {
    return normalizedMarkets.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name?.toLowerCase().includes(q);
        const matchesLoc = m.location?.toLowerCase().includes(q);
        const matchesDesc = m.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesDesc) return false;
      }

      if (selectedFilterCategory !== 'All Markets') {
        if (!m.categories.includes(selectedFilterCategory)) return false;
      }

      return true;
    });
  }, [normalizedMarkets, searchQuery, selectedFilterCategory]);

  const activeMarket =
    normalizedMarkets.find((m) => m.id === selectedMarketId) || normalizedMarkets[0];

  const mapMarkers = useMemo(() => {
    return filteredMarkets.map((m) => ({
      id: m.id,
      lat: m.lat,
      lng: m.lng,
      title: m.name,
      subtitle: m.location,
    }));
  }, [filteredMarkets]);

  return (
    <div className={styles.pageContainer}>
      {/* ─── HEADER BAR ─────────────────────────────────────────── */}
      <div className={styles.headerBar}>
        <div className="container">
          <div className={styles.headerBarInner}>
            <div className={styles.headerTitleGroup}>
              <div className={styles.headerKickerRow}>
                <span className={styles.headerKicker}>
                  <Sparkles size={13} />
                  Regional Farmers Market Directory
                </span>
                <span className={styles.countBadge}>
                  {normalizedMarkets.length} Verified Markets
                </span>
              </div>
              <h1 className={styles.pageTitle}>Explore Farmers Markets</h1>
              <p className={styles.pageSubtitle}>
                Find fresh seasonal harvests, artisan goods, and direct-from-farm producers near you.
              </p>
            </div>

            {/* Segmented View Mode Switcher */}
            <div className={styles.viewModeWrapper}>
              <div className={styles.toggleButtonGroup}>
                <button
                  type="button"
                  onClick={() => handleModeChange('map')}
                  className={`${styles.toggleBtn} ${
                    viewMode === 'map' ? styles.toggleBtnActive : ''
                  }`}
                  aria-pressed={viewMode === 'map'}
                >
                  <MapIcon size={14} />
                  <span>Map View</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('list')}
                  className={`${styles.toggleBtn} ${
                    viewMode === 'list' ? styles.toggleBtnActive : ''
                  }`}
                  aria-pressed={viewMode === 'list'}
                >
                  <ListIcon size={14} />
                  <span>List View</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── VIEW MODE: MAP VIEW ─────────────────────────────────── */}
      {viewMode === 'map' ? (
        <div className={styles.mapViewContainer}>
          {/* ── LEFT PANEL: INTERACTIVE SEARCH & MARKETS LIST ── */}
          <aside className={styles.mapSidebar} aria-label="Market search and list">
            {/* Search Input */}
            <div className={styles.sidebarSearchWrap}>
              <Search size={15} className={styles.sidebarSearchIcon} />
              <input
                type="text"
                placeholder="Search markets or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.sidebarSearchInput}
                aria-label="Search markets"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchBtn}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className={styles.filterPillsTrack}>
              <div className={styles.filterPillsScroll} role="tablist">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => setSelectedFilterCategory(tab.filter)}
                    className={`${styles.filterPillBtn} ${
                      selectedFilterCategory === tab.filter ? styles.filterPillBtnActive : ''
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Cards List */}
            <div className={styles.cardsListScroll}>
              {loading ? (
                <div style={{ padding: 'var(--space-6) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ height: 100, background: '#ede8df', borderRadius: 8 }} />
                  <div style={{ height: 100, background: '#ede8df', borderRadius: 8 }} />
                </div>
              ) : filteredMarkets.length > 0 ? (
                filteredMarkets.map((m) => {
                  const isSelected = m.id === selectedMarketId;
                  const isHovered = m.id === hoveredMarketId;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectMarket(m)}
                      onMouseEnter={() => setHoveredMarketId(m.id)}
                      onMouseLeave={() => setHoveredMarketId(null)}
                      className={`${styles.mapMarketCard} ${
                        isSelected ? styles.mapMarketCardSelected : ''
                      } ${isHovered ? styles.mapMarketCardHovered : ''}`}
                    >
                      <div className={styles.mapMarketCardImgWrap}>
                        <img src={m.image} alt={m.name} className={styles.mapMarketCardImg} />
                      </div>
                      <div className={styles.mapMarketCardBody}>
                        <div className={styles.cardHeaderRow}>
                          <h3 className={styles.mapMarketName}>{m.name}</h3>
                          <span className={styles.openNowBadge}>{m.status}</span>
                        </div>
                        <p className={styles.mapMarketLocation}>
                          <MapPin size={11} className={styles.pinSmall} />
                          <span>{m.location}</span>
                        </p>
                        <div className={styles.cardFooterRow}>
                          <span className={styles.cardSchedule}>
                            <Clock size={11} /> {m.hours}
                          </span>
                          <span className={styles.cardRating}>
                            <Star size={11} fill="#D4850A" color="#D4850A" /> {m.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyResults}>
                  <Store size={32} className={styles.emptyIcon} />
                  <h4>No markets found</h4>
                  <p>Try searching for a different neighborhood or reset your filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedFilterCategory('All Markets');
                    }}
                    className={styles.resetFiltersBtn}
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* ── RIGHT PANEL: REAL LEAFLET MAP VIEW ── */}
          <section className={styles.mapCanvasArea} aria-label="Interactive market map" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px' }}>
            <MapView
              markers={mapMarkers}
              selectedId={selectedMarketId}
              onSelect={(id) => {
                setSelectedMarketId(id);
                setIsPopupOpen(true);
              }}
              height="100%"
              zoom={13}
              interactive={true}
              showDirectionsLink={true}
              ariaLabel="Map of farmers markets"
            />

            {/* ─── FLOATING DETAIL CARD (BOTTOM RIGHT) ─────────── */}
            {isPopupOpen && activeMarket && (
              <div className={styles.floatingMarketCard}>
                <div className={styles.floatingImgWrap}>
                  <img
                    src={activeMarket.image}
                    alt={activeMarket.name}
                    className={styles.floatingCoverImg}
                  />
                  <div className={styles.floatingImgOverlay}>
                    <span className={styles.floatingStatusBadge}>
                      <span className={styles.floatingStatusDot} />
                      {activeMarket.statusDetail}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPopupOpen(false)}
                      className={styles.floatingCloseBtn}
                      aria-label="Close preview"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.floatingCardBody}>
                  <div className={styles.floatingTitleRow}>
                    <h2 className={styles.floatingTitle}>{activeMarket.name}</h2>
                    <div className={styles.floatingRating}>
                      <Star size={13} fill="#D4850A" color="#D4850A" />
                      <strong>{activeMarket.rating}</strong>
                    </div>
                  </div>

                  <p className={styles.floatingLocation}>
                    <MapPin size={12} className={styles.floatingPinIcon} />
                    <span>{activeMarket.location}</span>
                  </p>

                  <p className={styles.floatingDesc}>{activeMarket.description}</p>

                  <div className={styles.floatingStatsGrid}>
                    <div className={styles.floatingStatBox}>
                      <span className={styles.floatingStatLabel}>Schedule</span>
                      <strong className={styles.floatingStatValue}>
                        {activeMarket.hours}
                      </strong>
                    </div>
                    <div className={styles.floatingStatBox}>
                      <span className={styles.floatingStatLabel}>Market Day</span>
                      <strong className={styles.floatingStatValue}>
                        {activeMarket.day}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.floatingActionsRow}>
                    <Link to={activeMarket.path} className={styles.viewFullMarketBtn}>
                      <span>View Full Market Page</span>
                      <ArrowRight size={14} />
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => toggleSave(activeMarket.id, e)}
                      className={`${styles.floatingBookmarkBtn} ${
                        savedMarkets[activeMarket.id] ? styles.floatingBookmarkActive : ''
                      }`}
                      title={savedMarkets[activeMarket.id] ? 'Remove from saved' : 'Save market'}
                      aria-label="Save market"
                    >
                      <Bookmark
                        size={16}
                        fill={savedMarkets[activeMarket.id] ? '#541722' : 'none'}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* ─── VIEW MODE: GRID / LIST VIEW ─────────────────────────── */
        <div className="container" style={{ paddingBlock: '28px 60px' }}>
          <div className={styles.listFilterBar}>
            <div className={styles.listSearchInputWrap}>
              <Search size={15} className={styles.sidebarSearchIcon} />
              <input
                type="text"
                placeholder="Search by market name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.listSearchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchBtn}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className={styles.listPillsRow}>
              {filterTabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setSelectedFilterCategory(tab.filter)}
                  className={`${styles.filterPillBtn} ${
                    selectedFilterCategory === tab.filter ? styles.filterPillBtnActive : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.marketsGrid}>
            {filteredMarkets.map((m) => {
              const isSaved = savedMarkets[m.id];
              return (
                <article key={m.id} className={styles.marketGridCard}>
                  <div className={styles.cardImageContainer}>
                    <img src={m.image} alt={m.name} className={styles.gridCardImg} />
                    <span className={styles.gridStatusOpen}>
                      <span className={styles.badgeDot} />
                      {m.status}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleSave(m.id, e)}
                      className={`${styles.gridSaveBtn} ${isSaved ? styles.gridSaveBtnActive : ''}`}
                      aria-label="Save market"
                    >
                      <Bookmark size={15} fill={isSaved ? '#541722' : 'none'} />
                    </button>
                  </div>

                  <div className={styles.gridCardBody}>
                    <div className={styles.gridCardTopRow}>
                      <span className={styles.gridDistance}>
                        <MapPin size={12} /> {m.location}
                      </span>
                      <div className={styles.gridRating}>
                        <Star size={12} fill="#D4850A" color="#D4850A" />
                        <strong>{m.rating}</strong>
                        <span>({m.reviewCount})</span>
                      </div>
                    </div>

                    <h2 className={styles.gridTitle}>
                      <Link to={m.path} className={styles.gridTitleLink}>
                        {m.name}
                      </Link>
                    </h2>
                    <p className={styles.gridAddress}>{m.location}</p>
                    <p className={styles.gridDescription}>{m.description}</p>

                    <div className={styles.gridMetaTags}>
                      <span className={styles.gridMetaTag}>
                        <Store size={12} /> {m.vendors}
                      </span>
                      <span className={styles.gridMetaTag}>
                        <Clock size={12} /> {m.hours}
                      </span>
                      <span className={styles.gridMetaTag}>
                        <Calendar size={12} /> {m.day}
                      </span>
                    </div>

                    <div className={styles.gridCardFooter}>
                      <Link to={m.path} className={styles.gridCardViewBtn}>
                        <span>View Market & Pre-Order</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Market;
