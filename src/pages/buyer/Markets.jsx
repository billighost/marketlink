import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navigation, Compass, Map as MapIcon, List, X, Star, MapPin, Clock, ShoppingBag } from 'lucide-react';
import { getMarkets, getFarmers, getMarketFarmers } from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/context/AuthContext';
import { setHomeMarket } from '@/api/me';
import MarketCard from '@/components/domain/MarketCard';
import { MapView } from '@/components/domain/MapView';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Chip from '@/components/ui/Chip';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import styles from './Markets.module.css';

const DAY_OPTIONS = [
  { label: 'All days', val: undefined },
  { label: 'Wednesday', val: 'wed' },
  { label: 'Friday', val: 'fri' },
  { label: 'Saturday', val: 'sat' },
  { label: 'Sunday', val: 'sun' },
];

const MARKER_FILTERS = [
  { id: 'market', label: 'Markets' },
  { id: 'farmer', label: 'Farmers' },
];

/**
 * Rich popup that shows when clicking a market or farmer marker on the map.
 */
function MarkerPopup({ item, type, onClose, onNavigate }) {
  if (!item) return null;

  return (
    <div className={styles.popup} role="dialog" aria-label={`Details for ${item.name || item.stallName}`}>
      <div className={styles.popupHeader}>
        <div className={styles.popupIconWrap} aria-hidden="true">
          {type === 'market' ? <MapPin size={16} /> : <ShoppingBag size={16} />}
        </div>
        <div className={styles.popupMeta}>
          <strong className={styles.popupName}>{type === 'market' ? item.name : item.stallName}</strong>
          {type === 'market' && item.address && (
            <span className={styles.popupSub}>{item.address}</span>
          )}
          {type === 'farmer' && (
            <span className={styles.popupSub}>
              {item.ratingAvg > 0 && (
                <><Star size={11} aria-hidden="true" fill="currentColor" /> {item.ratingAvg.toFixed(1)}</>
              )}
            </span>
          )}
        </div>
        <button className={styles.popupClose} onClick={onClose} aria-label="Close popup">
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {type === 'market' && (
        <div className={styles.popupBody}>
          {Array.isArray(item.schedule) && item.schedule.length > 0 && (
            <p className={styles.popupDetail}>
              <Clock size={12} aria-hidden="true" />
              {item.schedule.map((s) => {
                const dayLabels = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
                const h = (min) => {
                  const h24 = Math.floor(min / 60);
                  const m = min % 60;
                  const ampm = h24 >= 12 ? 'PM' : 'AM';
                  const h12 = h24 % 12 || 12;
                  return `${h12}${m ? `:${String(m).padStart(2,'0')}` : ''}${ampm}`;
                };
                return `${dayLabels[s.day] || s.day} ${h(s.openMin)}–${h(s.closeMin)}`;
              }).join(' · ')}
            </p>
          )}
          {item.farmerCount > 0 && (
            <p className={styles.popupDetail}>
              <ShoppingBag size={12} aria-hidden="true" />
              {item.farmerCount} active farmer{item.farmerCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {type === 'farmer' && (
        <div className={styles.popupBody}>
          {item.specialty && (
            <p className={styles.popupDetail}><span className={styles.popupTag}>{item.specialty}</span></p>
          )}
          {Array.isArray(item.operatingDays) && item.operatingDays.length > 0 && (
            <p className={styles.popupDetail}>
              <Clock size={12} aria-hidden="true" />
              {item.operatingDays.join(', ')}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className={styles.popupAction}
        onClick={() => onNavigate(item, type)}
        aria-label={`View ${type === 'market' ? item.name : item.stallName}`}
      >
        View {type === 'market' ? 'market' : 'farmer'} →
      </button>
    </div>
  );
}

/**
 * Customer Markets directory page — Live Market Map with typed markers and popups.
 */
export function Markets() {
  const { user, switchMarket } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [viewMode, setViewMode] = useState('list');
  const [selectedDay, setSelectedDay] = useState(undefined);
  const [userCoords, setUserCoords] = useState(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [activeMarkerFilters, setActiveMarkerFilters] = useState(['market', 'farmer']);
  const [selectedPopup, setSelectedPopup] = useState(null); // { item, type }

  // Highlight IDs passed from Smart Basket "View on map"
  const highlightFarmerIds = location.state?.highlightFarmerIds || [];
  const highlightMarketIds = location.state?.highlightMarketIds || [];

  const queryParams = {
    day: selectedDay,
    lat: userCoords?.lat,
    lng: userCoords?.lng,
    radiusKm: userCoords ? 50 : undefined,
  };

  const { data: marketsData, loading: marketsLoading } = useQuery(
    ['buyer-markets', selectedDay, userCoords?.lat, userCoords?.lng],
    ({ signal }) => getMarkets(queryParams, signal)
  );

  const { data: farmersData, loading: farmersLoading } = useQuery(
    ['buyer-live-farmers', selectedDay],
    ({ signal }) => getFarmers({ day: selectedDay, limit: 100 }, signal)
  );

  const markets = marketsData?.data || [];
  const farmers = farmersData?.data || [];
  const loading = marketsLoading;
  const selectedMarketId = user?.homeMarketId || user?.homeMarket?.id || markets[0]?.id;

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLocating(false);
      },
      () => {
        setGeoLocating(false);
        setGeoError('Location permission denied. Showing all regional markets.');
      },
      { timeout: 8000 }
    );
  }, []);

  const handleSelectMarket = (market) => { switchMarket?.(market.id); };

  const toggleFilter = (filterId) => {
    setActiveMarkerFilters((prev) =>
      prev.includes(filterId)
        ? prev.length > 1 ? prev.filter((f) => f !== filterId) : prev // keep at least 1
        : [...prev, filterId]
    );
  };

  // Build typed markers for the map
  const mapMarkers = [
    ...(activeMarkerFilters.includes('market')
      ? markets
          .filter((m) => m.location?.lat && m.location?.lng)
          .map((m) => ({
            id: m.id,
            lat: m.location.lat,
            lng: m.location.lng,
            label: m.name,
            subtitle: m.address,
            markerType: 'market',
            _raw: m,
          }))
      : []),
    ...(activeMarkerFilters.includes('farmer')
      ? farmers
          .filter((f) => f.location?.lat && f.location?.lng)
          .map((f) => ({
            id: f.id,
            lat: f.location.lat,
            lng: f.location.lng,
            label: f.stallName,
            subtitle: f.specialty || '',
            markerType: 'farmer',
            _raw: f,
          }))
      : []),
  ];

  const handleMarkerClick = (marker) => {
    setSelectedPopup({ item: marker._raw, type: marker.markerType });
  };

  const handlePopupNavigate = (item, type) => {
    if (type === 'market') {
      navigate(`/buyer/markets/${item.id}`);
    } else {
      navigate(`/buyer/farmers/${item.id}`);
    }
    setSelectedPopup(null);
  };

  // Auto-switch to map view if navigated from Smart Basket
  useEffect(() => {
    if (highlightFarmerIds.length > 0 || highlightMarketIds.length > 0) {
      setViewMode('map');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Live Market</h1>
          <SegmentedControl
            name="markets-view"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'list', label: <><List size={14} aria-hidden="true" /> List</> },
              { value: 'map', label: <><MapIcon size={14} aria-hidden="true" /> Map</> },
            ]}
          />
        </div>

        {/* Day of week chips */}
        <div className={styles.daysScroll} role="tablist" aria-label="Market days">
          <button
            type="button"
            className={`${styles.locationBtn} ${userCoords ? styles.locationActive : ''}`}
            onClick={handleUseMyLocation}
            disabled={geoLocating}
            aria-label="Sort markets by current location"
          >
            <Navigation size={14} className={geoLocating ? styles.spin : ''} aria-hidden="true" />
            <span>{geoLocating ? 'Locating…' : userCoords ? 'Near me' : 'Use my location'}</span>
          </button>

          {DAY_OPTIONS.map((opt) => (
            <Chip
              key={opt.label}
              selected={selectedDay === opt.val}
              onClick={() => setSelectedDay(opt.val)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>

        {geoError && <p className={styles.geoNote} role="alert">{geoError}</p>}
      </header>

      {/* ── Map view ────────────────────────────────────────── */}
      {viewMode === 'map' && (
        <div className={styles.mapContainer}>
          {/* Marker type filters */}
          <div className={styles.mapFilterBar} role="group" aria-label="Toggle marker types">
            {MARKER_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`${styles.mapFilterChip} ${styles[`mapFilterChip_${id}`]} ${activeMarkerFilters.includes(id) ? styles.mapFilterChipActive : ''}`}
                onClick={() => toggleFilter(id)}
                aria-pressed={activeMarkerFilters.includes(id)}
              >
                {label}
              </button>
            ))}
            {(highlightFarmerIds.length > 0 || highlightMarketIds.length > 0) && (
              <span className={styles.basketHighlightBadge}>
                🛒 Basket items highlighted
              </span>
            )}
          </div>

          <MapView
            markers={mapMarkers.map((m) => ({
              ...m,
              // Pulse/highlight markers that come from Smart Basket
              highlight:
                (m.markerType === 'farmer' && highlightFarmerIds.includes(m.id)) ||
                (m.markerType === 'market' && highlightMarketIds.includes(m.id)),
            }))}
            selectedId={selectedMarketId}
            onSelect={handleMarkerClick}
            height="55dvh"
            ariaLabel="Live market map showing markets and farmers"
          />

          {/* Popup panel */}
          {selectedPopup && (
            <div className={styles.popupOverlay}>
              <MarkerPopup
                item={selectedPopup.item}
                type={selectedPopup.type}
                onClose={() => setSelectedPopup(null)}
                onNavigate={handlePopupNavigate}
              />
            </div>
          )}

          {/* Scrollable market cards below map */}
          <div className={styles.mapCardList}>
            {markets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                onSelect={handleSelectMarket}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── List view ────────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className={styles.listContainer}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Skeleton height="100px" borderRadius="var(--radius-md)" />
              <Skeleton height="100px" borderRadius="var(--radius-md)" />
              <Skeleton height="100px" borderRadius="var(--radius-md)" />
            </div>
          )}

          {!loading && markets.length === 0 && (
            <EmptyState
              title="No markets found"
              description="No markets operate on the selected day. Try viewing all days."
              actionLabel="View all days"
              onAction={() => setSelectedDay(undefined)}
            />
          )}

          {!loading && markets.length > 0 && (
            <div className={styles.grid}>
              {markets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  onSelect={handleSelectMarket}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Markets;
