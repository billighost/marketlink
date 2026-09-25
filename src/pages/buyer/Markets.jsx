import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Navigation, Clock, Store, Users, X, ChevronRight, ArrowRight } from 'lucide-react';
import { markets } from '@/data/placeholders';
import { useAuth } from '@/context/AuthContext';
import MarketCard from '@/components/domain/MarketCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Chip from '@/components/ui/Chip';
import EmptyState from '@/components/ui/EmptyState';
import styles from './Markets.module.css';

const DAYS = ['All days', 'Wednesday', 'Saturday', 'Sunday'];

// Vector coordinates for interactive map markers
const MARKET_COORDINATES = {
  'market-elm': { x: 38, y: 52 },
  'market-river': { x: 62, y: 35 },
  'market-grove': { x: 25, y: 68 },
  'market-hill': { x: 74, y: 62 },
};

/**
 * Customer Markets directory page.
 * Provides interactive search, day filters, rich list view, and interactive cartography map.
 */
export function Markets() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState(searchParams.get('view') === 'map' ? 'map' : 'list');
  const [selectedDay, setSelectedDay] = useState('All days');
  const [search, setSearch] = useState('');
  const [selectedMarketId, setSelectedMarketId] = useState(user?.homeMarketId || 'market-elm');

  useEffect(() => {
    const qView = searchParams.get('view');
    if (qView === 'map' && viewMode !== 'map') {
      setViewMode('map');
    }
  }, [searchParams]);

  const handleViewChange = (mode) => {
    setViewMode(mode);
    const newParams = new URLSearchParams(searchParams);
    if (mode === 'map') {
      newParams.set('view', 'map');
    } else {
      newParams.delete('view');
    }
    setSearchParams(newParams);
  };

  const filteredMarkets = useMemo(() => {
    return markets.filter((market) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = market.name.toLowerCase().includes(q);
        const matchesAddress = market.address.toLowerCase().includes(q);
        if (!matchesName && !matchesAddress) return false;
      }
      if (selectedDay !== 'All days') {
        if (!market.days?.includes(selectedDay)) return false;
      }
      return true;
    });
  }, [search, selectedDay]);

  const activeMarket = markets.find((m) => m.id === selectedMarketId) || filteredMarkets[0] || markets[0];

  const handleSelectMarket = (market) => {
    setSelectedMarketId(market.id);
    if (user) {
      user.homeMarketId = market.id;
    }
  };

  const handleGetDirections = (address) => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.page}>
      {/* Header & Controls */}
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Farmers Markets</h1>
            <p className={styles.subtitle}>
              Discover authentic Saturday pickup markets, meeting regional growers and craft producers.
            </p>
          </div>
          <SegmentedControl
            name="markets-view"
            value={viewMode}
            onChange={handleViewChange}
            options={[
              { value: 'list', label: 'List View' },
              { value: 'map', label: 'Explore Map' },
            ]}
          />
        </div>

        {/* Search Bar */}
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search markets by name or neighborhood..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search markets"
            />
            {search && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Day of Week Chips */}
          <div className={styles.daysScroll} role="tablist" aria-label="Market days">
            {DAYS.map((day) => (
              <Chip
                key={day}
                selected={selectedDay === day}
                onClick={() => setSelectedDay(day)}
              >
                {day}
              </Chip>
            ))}
          </div>
        </div>
      </header>

      {/* ── View: Interactive Map ──────────────────────────────────── */}
      {viewMode === 'map' && (
        <div className={styles.mapLayout}>
          <div className={styles.mapFrame} role="region" aria-label="Interactive market discovery map">
            {/* Ambient Map SVG Graphic */}
            <svg
              viewBox="0 0 1000 600"
              className={styles.mapSvg}
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(235, 220, 213, 0.4)" strokeWidth="1" />
                </pattern>
                <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#dce8ee" />
                  <stop offset="100%" stopColor="#c5dbe4" />
                </linearGradient>
              </defs>

              <rect width="100%" height="100%" fill="#faf7f2" />
              <rect width="100%" height="100%" fill="url(#gridPattern)" />

              {/* Curving River */}
              <path
                d="M -50 180 C 250 120, 400 350, 700 280 C 850 240, 950 320, 1050 300"
                fill="none"
                stroke="url(#riverGrad)"
                strokeWidth="70"
                strokeLinecap="round"
                opacity="0.8"
              />
              <path
                d="M -50 180 C 250 120, 400 350, 700 280 C 850 240, 950 320, 1050 300"
                fill="none"
                stroke="#b2cdd9"
                strokeWidth="4"
                strokeDasharray="8 6"
                opacity="0.6"
              />

              {/* Park Areas */}
              <rect x="180" y="240" width="160" height="120" rx="20" fill="#eaf2e3" stroke="#d5e5ca" strokeWidth="1.5" />
              <text x="260" y="305" textAnchor="middle" fill="#608055" fontSize="13" fontFamily="Inter, sans-serif" fontWeight="600">
                Central Greenspace
              </text>

              <rect x="680" y="100" width="180" height="130" rx="24" fill="#eaf2e3" stroke="#d5e5ca" strokeWidth="1.5" />
              <text x="770" y="170" textAnchor="middle" fill="#608055" fontSize="13" fontFamily="Inter, sans-serif" fontWeight="600">
                Riverside Park
              </text>
            </svg>

            {/* Interactive Pins */}
            <div className={styles.pinLayer}>
              {markets.map((m) => {
                const coords = MARKET_COORDINATES[m.id] || { x: 50, y: 50 };
                const isSelected = m.id === activeMarket?.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`${styles.mapPinBtn} ${isSelected ? styles.mapPinActive : ''}`}
                    style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                    onClick={() => setSelectedMarketId(m.id)}
                    aria-label={`Select ${m.name}`}
                  >
                    {isSelected && <span className={styles.pinPulseEffect} />}
                    <div className={styles.pinInner}>
                      <Store size={15} />
                    </div>
                    <span className={styles.pinLabel}>{m.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Market Floating Card */}
            {activeMarket && (
              <div className={styles.floatingMarketCard}>
                <div className={styles.floatingHeader}>
                  <div className={styles.floatingTitleWrap}>
                    <h3 className={styles.floatingName}>{activeMarket.name}</h3>
                    <p className={styles.floatingAddress}>
                      <MapPin size={13} className={styles.floatingPinIcon} />
                      <span>{activeMarket.address}</span>
                      {activeMarket.distance && <span>· {activeMarket.distance}</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.directionsBtn}
                    onClick={() => handleGetDirections(activeMarket.address)}
                    title="Get directions in Google Maps"
                  >
                    <Navigation size={14} />
                    <span>Directions</span>
                  </button>
                </div>

                <div className={styles.floatingMeta}>
                  <div className={styles.floatingMetaItem}>
                    <Clock size={13} />
                    <span>{activeMarket.days?.join(', ')} · 8:00 AM – 1:00 PM</span>
                  </div>
                  <div className={styles.floatingMetaItem}>
                    <Users size={13} />
                    <span>{activeMarket.farmerIds?.length || 8} Local Farm Stalls</span>
                  </div>
                </div>

                <div className={styles.floatingActionRow}>
                  <Link
                    to={`/buyer/markets/${activeMarket.id}`}
                    className={styles.viewMarketBtn}
                  >
                    <span>View Market & Stalls</span>
                    <ArrowRight size={14} />
                  </Link>
                  <button
                    type="button"
                    className={styles.setPrimaryBtn}
                    onClick={() => handleSelectMarket(activeMarket)}
                  >
                    {user?.homeMarketId === activeMarket.id ? '✓ Primary Pickup Market' : 'Set as My Pickup Market'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── View: List ─────────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className={styles.list}>
          {filteredMarkets.length > 0 ? (
            filteredMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={{
                  ...market,
                  farmerCount: market.farmerIds?.length || 8,
                }}
                onSelect={handleSelectMarket}
              />
            ))
          ) : (
            <EmptyState
              illustration="stall"
              title="No markets match your criteria"
              text="Try selecting 'All days' or clear your search query to see all regional markets."
              actionLabel="Reset filters"
              onAction={() => {
                setSearch('');
                setSelectedDay('All days');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Markets;
