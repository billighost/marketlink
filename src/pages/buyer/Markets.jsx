import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from 'lucide-react';
import { getMarkets } from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/context/AuthContext';
import MarketCard from '@/components/domain/MarketCard';
import { MapView } from '@/components/domain/MapView';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Chip from '@/components/ui/Chip';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import styles from './Markets.module.css';

const DAY_OPTIONS = [
  { label: 'All days', val: undefined },
  { label: 'Wednesday', val: 'wed' },
  { label: 'Friday', val: 'fri' },
  { label: 'Saturday', val: 'sat' },
  { label: 'Sunday', val: 'sun' },
];

/**
 * Customer Markets directory page.
 * List / Map toggle, day filtering, geolocation distance sorting.
 */
export function Markets() {
  const { user, switchMarket } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list');
  const [selectedDay, setSelectedDay] = useState(undefined);
  const [userCoords, setUserCoords] = useState(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const queryParams = {
    day: selectedDay,
    lat: userCoords?.lat,
    lng: userCoords?.lng,
    radiusKm: userCoords ? 50 : undefined,
  };

  const { data: marketsData, loading } = useQuery(
    ['buyer-markets', selectedDay, userCoords?.lat, userCoords?.lng],
    ({ signal }) => getMarkets(queryParams, signal)
  );

  const markets = marketsData?.data || [];
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
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoLocating(false);
      },
      () => {
        setGeoLocating(false);
        setGeoError('Location permission denied. Showing all regional markets.');
      },
      { timeout: 8000 }
    );
  }, []);

  const handleSelectMarket = (market) => {
    switchMarket?.(market.id);
  };

  const mapMarkers = markets
    .filter((m) => m.location?.lat && m.location?.lng)
    .map((m) => ({
      id: m.id,
      lat: m.location.lat,
      lng: m.location.lng,
      label: m.name,
    }));

  const resultsLabel = loading
    ? ' '
    : `${markets.length} market${markets.length === 1 ? '' : 's'}${userCoords ? ' near you' : ''}`;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Farmers Markets</h1>
          <SegmentedControl
            name="markets-view"
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'list', label: 'List' },
              { value: 'map', label: 'Map' },
            ]}
          />
        </div>
        <p className={styles.subtitle}>Find a market near you and see who's selling this week.</p>

        <div className={styles.filters}>
          <div className={styles.daysScroll} role="tablist" aria-label="Market days">
            <button
              type="button"
              className={`${styles.locationBtn} ${userCoords ? styles.locationActive : ''}`}
              onClick={handleUseMyLocation}
              disabled={geoLocating}
              aria-label="Sort markets by current location"
            >
              <Navigation size={14} className={geoLocating ? styles.spin : ''} />
              <span>{geoLocating ? 'Locating…' : userCoords ? 'Near me' : 'Use my location'}</span>
            </button>

            <span className={styles.filterDivider} aria-hidden="true" />

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

          {geoError && (
            <p className={styles.geoNote} role="status">
              {geoError}
            </p>
          )}
        </div>
      </header>

      {!loading && <p className={styles.resultsMeta}>{resultsLabel}</p>}

      {/* View: Map */}
      {viewMode === 'map' && (
        <div className={styles.mapContainer}>
          <MapView
            markers={mapMarkers}
            selectedId={selectedMarketId}
            onSelect={(id) => navigate(`/buyer/markets/${id}`)}
            height="320px"
          />
          <div className={styles.grid}>
            {markets.map((market) => (
              <MarketCard key={market.id} market={market} onSelect={handleSelectMarket} />
            ))}
          </div>
        </div>
      )}

      {/* View: List */}
      {viewMode === 'list' && (
        <div className={styles.listContainer}>
          {loading && (
            <div className={styles.skeletonStack}>
              <Skeleton height="112px" borderRadius="var(--radius-lg)" />
              <Skeleton height="112px" borderRadius="var(--radius-lg)" />
              <Skeleton height="112px" borderRadius="var(--radius-lg)" />
            </div>
          )}

          {!loading && markets.length === 0 && (
            <EmptyState
              title="No markets found"
              description="No physical markets operate on this selected day. Try viewing all days."
              actionLabel="View all days"
              onAction={() => setSelectedDay(undefined)}
            />
          )}

          {!loading && markets.length > 0 && (
            <div className={styles.grid}>
              {markets.map((market) => (
                <MarketCard key={market.id} market={market} onSelect={handleSelectMarket} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Markets;