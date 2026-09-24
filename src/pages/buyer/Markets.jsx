import React, { useState } from 'react';
import { markets } from '@/data/placeholders';
import { useAuth } from '@/context/AuthContext';
import MarketCard from '@/components/domain/MarketCard';
import MapPlaceholder from '@/components/domain/MapPlaceholder';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Chip from '@/components/ui/Chip';
import styles from './Markets.module.css';

const DAYS = ['All days', 'Wednesday', 'Saturday', 'Sunday'];

/**
 * Customer Markets directory page.
 * Offers List and Map view toggle, and day of week filters.
 */
export function Markets() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('list');
  const [selectedDay, setSelectedDay] = useState('All days');
  const [selectedMarketId, setSelectedMarketId] = useState(user?.homeMarketId || 'market-elm');

  const filteredMarkets = markets.filter((market) => {
    if (selectedDay === 'All days') return true;
    return market.days?.includes(selectedDay);
  });

  const handleSelectMarket = (market) => {
    setSelectedMarketId(market.id);
    if (user) {
      user.homeMarketId = market.id;
    }
  };

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
      </header>

      {/* View: Map */}
      {viewMode === 'map' && (
        <div className={styles.mapContainer}>
          <MapPlaceholder
            address={markets.find((m) => m.id === selectedMarketId)?.name || 'Markets near you'}
            height="280px"
          />
          <div className={styles.mapCardList}>
            {filteredMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={{
                  ...market,
                  farmerCount: market.farmerIds?.length || 8,
                }}
                onSelect={handleSelectMarket}
              />
            ))}
          </div>
        </div>
      )}

      {/* View: List */}
      {viewMode === 'list' && (
        <div className={styles.list}>
          {filteredMarkets.map((market) => (
            <MarketCard
              key={market.id}
              market={{
                ...market,
                farmerCount: market.farmerIds?.length || 8,
              }}
              onSelect={handleSelectMarket}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Markets;
