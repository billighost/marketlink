import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMarkets } from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import MarketCard from '@/components/domain/MarketCard';
import { MapView } from '@/components/domain/MapView';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import styles from './Markets.module.css';

const DAY_OPTIONS = [
  { label: 'Any day', val: undefined },
  { label: 'Sun', val: 'sun' },
  { label: 'Mon', val: 'mon' },
  { label: 'Tue', val: 'tue' },
  { label: 'Wed', val: 'wed' },
  { label: 'Thu', val: 'thu' },
  { label: 'Fri', val: 'fri' },
  { label: 'Sat', val: 'sat' },
];

/**
 * Page C: Markets index (/buyer/markets)
 *
 * Requirements:
 *  - Page width="wide"
 *  - PageTitle title="Markets" with context line (e.g. "6 markets near you")
 *  - SegmentedControl toggles List / Map (List is default, persisted in URL)
 *  - Day chips satisfy SRS "browse markets by location and day"
 *  - MarketCard full-width row card (1 per row under 768, 2 columns at 768+)
 *  - MapView 420px with all markers, marker selection with card below
 *  - EmptyState with "lost-path" scene
 *  - 0 beet elements
 */
export function Markets() {
  useDocumentTitle('Markets · MarketLink');

  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') === 'map' ? 'map' : 'list';
  const dayParam = searchParams.get('day') || undefined;

  const [selectedDay, setSelectedDay] = useState(dayParam);
  const [selectedMarketId, setSelectedMarketId] = useState(null);
  const selectedCardRef = useRef(null);

  const setViewMode = (mode) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (mode === 'map') {
          next.set('view', 'map');
        } else {
          next.delete('view');
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleSelectDay = (val) => {
    setSelectedDay(val);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (val) {
          next.set('day', val);
        } else {
          next.delete('day');
        }
        return next;
      },
      { replace: true }
    );
  };

  // Fetch markets with day filter
  const { data: marketsData, loading } = useQuery(
    ['buyer-markets', selectedDay],
    ({ signal }) => getMarkets({ day: selectedDay || undefined }, signal)
  );

  const markets = useMemo(() => {
    return Array.isArray(marketsData) ? marketsData : marketsData?.data || [];
  }, [marketsData]);

  // Set default selected market for map view
  useEffect(() => {
    if (markets.length > 0 && !selectedMarketId) {
      setSelectedMarketId(markets[0].id);
    }
  }, [markets, selectedMarketId]);

  // Filter valid markers for MapView
  const mapMarkers = useMemo(() => {
    return markets
      .filter((m) => m?.location?.lat && m?.location?.lng)
      .map((m) => ({
        id: m.id,
        lat: Number(m.location.lat),
        lng: Number(m.location.lng),
        title: m.name,
        subtitle: m.address,
      }));
  }, [markets]);

  const handleMarkerSelect = (id) => {
    setSelectedMarketId(id);
    if (selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const selectedMarket = useMemo(() => {
    return markets.find((m) => m.id === selectedMarketId) || markets[0] || null;
  }, [markets, selectedMarketId]);

  const countText =
    markets.length === 1 ? '1 market near you' : `${markets.length} markets near you`;

  return (
    <Page width="wide">
      <div className={styles.container}>
        <header className={styles.topBar}>
          <PageTitle title="Markets" context={countText} />

          <div className={styles.controlsWrap}>
            {/* View switcher: List vs Map */}
            <div className={styles.segmentedWrap}>
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

            {/* Day filter chips row */}
            <div className={styles.dayChips} role="tablist" aria-label="Filter markets by day">
              {DAY_OPTIONS.map((opt) => {
                const isSelected = selectedDay === opt.val;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={[
                      styles.chip,
                      isSelected ? styles.activeChip : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleSelectDay(opt.val)}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Loading Skeletons */}
        {loading && markets.length === 0 && (
          <div className={styles.listGrid}>
            <div className={styles.skeletonCard} aria-hidden="true">
              <Skeleton height="1.75rem" width="60%" />
              <Skeleton height="1rem" width="40%" />
              <Skeleton height="1rem" width="50%" />
            </div>
            <div className={styles.skeletonCard} aria-hidden="true">
              <Skeleton height="1.75rem" width="60%" />
              <Skeleton height="1rem" width="40%" />
              <Skeleton height="1rem" width="50%" />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && markets.length === 0 && (
          <EmptyState
            scene="lost-path"
            title="No markets found"
            text="Try a different day."
            actionLabel="View all days"
            onAction={() => handleSelectDay(undefined)}
          />
        )}

        {/* List View */}
        {!loading && markets.length > 0 && viewMode === 'list' && (
          <div className={styles.listGrid}>
            {markets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}

        {/* Map View */}
        {!loading && markets.length > 0 && viewMode === 'map' && (
          <div className={styles.mapViewWrap}>
            <div className={styles.mapWrapper}>
              <MapView
                markers={mapMarkers}
                selectedId={selectedMarketId}
                onSelect={handleMarkerSelect}
                height="420px"
                zoom={12}
                interactive={true}
                showDirectionsLink={false}
                ariaLabel="Map of nearby farmers markets"
              />
            </div>

            {/* Selected market card directly below map */}
            {selectedMarket && (
              <div ref={selectedCardRef} className={styles.selectedCardWrap}>
                <MarketCard
                  market={selectedMarket}
                  isSelected={true}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Page>
  );
}

export default Markets;
