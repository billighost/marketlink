import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const allMarkets = useMemo(() => {
    return Array.isArray(marketsData) ? marketsData : marketsData?.data || [];
  }, [marketsData]);

  // Client-side filter by search query
  const markets = useMemo(() => {
    if (!searchQuery.trim()) return allMarkets;
    const q = searchQuery.toLowerCase();
    return allMarkets.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.address?.toLowerCase().includes(q) ||
        m.city?.toLowerCase().includes(q)
    );
  }, [allMarkets, searchQuery]);

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

  const countText = searchQuery.trim()
    ? markets.length === 1
      ? '1 result'
      : `${markets.length} results`
    : allMarkets.length === 1
    ? '1 market near you'
    : `${allMarkets.length} markets near you`;

  return (
    <Page width="wide">
      <div className={styles.container}>
        <header className={styles.topBar}>
          <div className={styles.titleRow}>
            <PageTitle title="Markets" context={countText} />
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
          </div>

          <div className={styles.controlsWrap}>
            {/* Search bar */}
            <form className={styles.searchForm} role="search" onSubmit={(e) => e.preventDefault()}>
              <Search size={17} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search markets by name or location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search markets"
              />
            </form>

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
        {(loading || (!marketsData && markets.length === 0)) && (
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

        {/* Empty State: No nearby markets / filters */}
        {!loading && marketsData != null && markets.length === 0 && (
          <EmptyState
            scene="lost-path"
            title={
              searchQuery
                ? `No markets matching "${searchQuery}"`
                : selectedDay
                ? `No markets operating on ${DAY_OPTIONS.find((d) => d.val === selectedDay)?.label || selectedDay}`
                : 'No nearby markets found'
            }
            text={
              searchQuery
                ? `We couldn't find any farmers markets matching "${searchQuery}"${selectedDay ? ` on this day` : ''}. Try broadening your search or resetting filters.`
                : selectedDay
                ? 'No farmers markets are open on this day in this area. Most regional growers trade on Saturday and Sunday mornings.'
                : 'No farmers markets were found in your immediate area. Try expanding your search radius to explore all regional producer markets.'
            }
            actionLabel={
              searchQuery
                ? 'Clear search & show all markets'
                : selectedDay
                ? 'View all days & regional markets'
                : 'Show all regional markets'
            }
            onAction={() => {
              setSearchQuery('');
              handleSelectDay(undefined);
            }}
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
