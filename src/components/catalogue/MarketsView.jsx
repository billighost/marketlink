import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, LayoutList, X, CalendarDays } from 'lucide-react';
import { getMarkets } from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import PageTitle from '@/components/layout/PageTitle';
import MarketCard from '@/components/domain/MarketCard';
import { MapView } from '@/components/domain/MapView';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import MapMarketCard from './MapMarketCard';
import { useCatalogueRoutes } from './routes';
import styles from './MarketsView.module.css';

const DAY_OPTIONS = [
  { label: 'Any day', val: undefined, icon: CalendarDays },
  { label: 'Sun', val: 'sun' },
  { label: 'Mon', val: 'mon' },
  { label: 'Tue', val: 'tue' },
  { label: 'Wed', val: 'wed' },
  { label: 'Thu', val: 'thu' },
  { label: 'Fri', val: 'fri' },
  { label: 'Sat', val: 'sat' },
];

/**
 * Shared Markets list / map view.
 * @param {'guest'|'buyer'} audience chooses actions and link targets, never content
 */
export function MarketsView({ audience = 'guest' }) {
  const routes = useCatalogueRoutes(audience);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') === 'list' ? 'list' : 'map';
  const dayParam = searchParams.get('day') || undefined;

  const [selectedDay, setSelectedDay] = useState(dayParam);
  const [selectedMarketId, setSelectedMarketId] = useState(null);
  const [isMapCardDismissed, setIsMapCardDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectedCardRef = useRef(null);
  const mapViewRef = useRef(null); // exposed imperative handle from MapView

  const setViewMode = (mode) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        // Always set explicitly so the URL reflects reality
        next.set('view', mode);
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

  // Fetch markets with day filter (catalog handles /api/public vs /api automatically)
  const { data: marketsData, loading } = useQuery(
    [`${audience}-markets`, selectedDay],
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
      setSelectedMarketId(markets[0].id || markets[0]._id);
    }
  }, [markets, selectedMarketId]);

  // Filter valid markers for MapView
  const mapMarkers = useMemo(() => {
    return markets
      .filter((m) => m?.location?.lat && m?.location?.lng)
      .map((m) => ({
        id: m.id || m._id,
        lat: Number(m.location.lat),
        lng: Number(m.location.lng),
        title: m.name,
        subtitle: m.address,
      }));
  }, [markets]);

  const handleMarkerSelect = (markerOrId) => {
    const id = typeof markerOrId === 'object' ? markerOrId.id : markerOrId;
    setSelectedMarketId(id);
    setIsMapCardDismissed(false);
    const m = markets.find((item) => (item.id || item._id) === id);
    if (m?.location?.lat && m?.location?.lng && mapViewRef.current?.flyTo) {
      mapViewRef.current.flyTo(Number(m.location.lat), Number(m.location.lng), 14);
    }
    if (selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (mapViewRef.current?.openMarkerPopup) {
      mapViewRef.current.openMarkerPopup(id);
    }
  };

  const handleSidebarCardSelect = (market) => {
    const id = market.id || market._id;
    setSelectedMarketId(id);
    setIsMapCardDismissed(false);
    // Fly map to this market's location
    if (market.location?.lat && market.location?.lng && mapViewRef.current?.flyTo) {
      mapViewRef.current.flyTo(
        Number(market.location.lat),
        Number(market.location.lng),
        14
      );
    }
    // Open the marker tooltip after a short delay to let flyTo settle
    window.setTimeout(() => {
      if (mapViewRef.current?.openMarkerPopup) {
        mapViewRef.current.openMarkerPopup(id);
      }
    }, 400);
  };

  const selectedMarket = useMemo(() => {
    return (
      markets.find((m) => (m.id || m._id) === selectedMarketId) ||
      markets[0] ||
      null
    );
  }, [markets, selectedMarketId]);

  const countText = searchQuery.trim()
    ? markets.length === 1
      ? '1 result'
      : `${markets.length} results`
    : allMarkets.length === 1
    ? '1 market near you'
    : `${allMarkets.length} markets near you`;

  return (
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
                { value: 'map', label: 'Map', icon: MapPin },
                { value: 'list', label: 'List', icon: LayoutList },
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
              placeholder="Search markets by name, city, or neighborhood..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search markets"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search text"
              >
                <X size={15} />
              </button>
            )}
          </form>

          {/* Day filter chips row */}
          <div className={styles.dayChips} role="tablist" aria-label="Filter markets by day">
            {DAY_OPTIONS.map((opt) => {
              const isSelected = selectedDay === opt.val;
              const Icon = opt.icon;
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
                  {Icon && <Icon size={13} className={styles.chipIcon} aria-hidden="true" />}
                  <span>{opt.label}</span>
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

      {/* Empty State */}
      {!loading && marketsData != null && markets.length === 0 && (
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
            <MarketCard
              key={market.id || market._id}
              market={market}
              audience={audience}
            />
          ))}
        </div>
      )}

      {/* Map View */}
      {!loading && markets.length > 0 && viewMode === 'map' && (
        <div className={styles.mapViewLayout}>
          {/* Main Map Area */}
          <div className={styles.mapMainArea}>
            <div className={styles.mapWrapperFull}>
              <MapView
                ref={mapViewRef}
                markers={mapMarkers}
                selectedId={selectedMarketId}
                onSelect={handleMarkerSelect}
                height="100%"
                zoom={11}
                interactive={true}
                showDirectionsLink={false}
                ariaLabel="Map of nearby farmers markets"
              >
                {selectedMarket && !isMapCardDismissed && (
                  <MapMarketCard
                    market={selectedMarket}
                    audience={audience}
                    onClose={() => setIsMapCardDismissed(true)}
                  />
                )}
                {selectedMarket && isMapCardDismissed && (
                  <button
                    type="button"
                    className={styles.mapCardRestoreBtn}
                    onClick={() => setIsMapCardDismissed(false)}
                    aria-label={`Show ${selectedMarket.name} on map`}
                    title={`Show ${selectedMarket.name}`}
                  >
                    <MapPin size={13} className={styles.mapCardRestoreIcon} aria-hidden="true" />
                    <span>Show {selectedMarket.name}</span>
                  </button>
                )}
              </MapView>
            </div>
          </div>

          {/* Sidebar with all market cards */}
          <div className={styles.mapSidebar}>
            <div className={styles.sidebarHeader}>
              <span className={styles.sidebarCount}>
                <MapPin size={13} className={styles.sidebarPinIcon} aria-hidden="true" />
                <span>{markets.length} {markets.length === 1 ? 'Location' : 'Locations'}</span>
              </span>
              <span className={styles.sidebarHint}>Select to locate</span>
            </div>

            {markets.map((market) => {
              const id = market.id || market._id;
              const isSelected = id === selectedMarketId;
              return (
                <div
                  key={id}
                  ref={isSelected ? selectedCardRef : null}
                  className={styles.mapSidebarCard}
                >
                  <MarketCard
                    market={market}
                    isSelected={isSelected}
                    audience={audience}
                    variant="map"
                    onSelect={handleSidebarCardSelect}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketsView;
