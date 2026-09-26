import React, { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@/hooks/useQuery';
import { getFarmers, getCategories, getMarketDetail } from '@/api/catalog';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import FarmerCard from '@/components/domain/FarmerCard';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { byOpenThenScarcity } from '@/utils/sortStalls';
import styles from './Farmers.module.css';

/**
 * Page A: Stalls index (/buyer/stalls)
 *
 * Density and aesthetics:
 *  - Page width="wide"
 *  - PageTitle title="Stalls" with context line from count and market
 *  - One non-wrapping chip row (max seven: All, Open today, top categories)
 *  - Active chip is ink-filled, never beet
 *  - Grid of FarmerCard variant="stall" (2 / 3 / 4 columns)
 *  - byOpenThenScarcity sorting
 *  - EmptyState with "market-closed" scene
 */
export function Farmers() {
  useDocumentTitle('Stalls · MarketLink');

  const { selectedMarketId, user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Fetch current market details for context name
  const { data: marketData } = useQuery(
    ['market-detail', selectedMarketId],
    ({ signal }) => getMarketDetail(selectedMarketId, signal),
    { enabled: Boolean(selectedMarketId) }
  );

  const marketName =
    marketData?.name ||
    user?.homeMarket?.name ||
    'the market';

  // Fetch categories
  const { data: categoriesData } = useQuery(
    ['categories'],
    ({ signal }) => getCategories(signal)
  );

  // Fetch stalls for the current market (or all stalls if no market)
  const { data: farmersData, loading } = useQuery(
    ['buyer-stalls', selectedMarketId],
    ({ signal }) =>
      getFarmers(
        {
          market: selectedMarketId || undefined,
          limit: 50,
        },
        signal
      )
  );

  const rawStalls = useMemo(() => {
    const list = Array.isArray(farmersData)
      ? farmersData
      : farmersData?.data || [];
    return [...list].sort(byOpenThenScarcity);
  }, [farmersData]);

  // Compute available categories (max 5 top categories for 7 total chips)
  const categoryChips = useMemo(() => {
    const rawCategories = Array.isArray(categoriesData) ? categoriesData : [];
    const usedSlugs = new Set();
    const chips = [];

    // Prioritize categories that actually exist on currently loaded stalls
    for (const stall of rawStalls) {
      const slug = stall.categorySlug || stall.category;
      const name = stall.categoryName || stall.category || stall.specialty;
      if (slug && !usedSlugs.has(slug)) {
        usedSlugs.add(slug);
        chips.push({ id: slug, label: name || slug });
      }
      if (chips.length >= 5) break;
    }

    // Fall back to server categories if needed
    if (chips.length < 5) {
      for (const cat of rawCategories) {
        const slug = cat.slug || cat.id || cat.name?.toLowerCase();
        const name = cat.name || cat;
        if (slug && !usedSlugs.has(slug)) {
          usedSlugs.add(slug);
          chips.push({ id: slug, label: name });
        }
        if (chips.length >= 5) break;
      }
    }

    return chips.slice(0, 5);
  }, [rawStalls, categoriesData]);

  // Filter stalls according to chip selection
  const filteredStalls = useMemo(() => {
    if (selectedFilter === 'all') {
      return rawStalls;
    }
    if (selectedFilter === 'open') {
      return rawStalls.filter((s) => Boolean(s.openToday));
    }
    // Category slug match
    const filterLower = selectedFilter.toLowerCase();
    return rawStalls.filter((s) => {
      const stallCat = (s.categorySlug || s.category || s.specialty || '').toLowerCase();
      return stallCat.includes(filterLower);
    });
  }, [rawStalls, selectedFilter]);

  const countText =
    filteredStalls.length === 1 ? '1 stall' : `${filteredStalls.length} stalls`;
  const contextLine = marketName
    ? `${countText} at ${marketName}`
    : countText;

  return (
    <Page width="wide">
      <header className={styles.header}>
        <PageTitle title="Stalls" context={contextLine} />

        {/* One non-wrapping chip row, max 7 chips */}
        <div
          className={styles.chipScroll}
          role="tablist"
          aria-label="Filter stalls"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedFilter === 'all'}
            className={[
              styles.chip,
              selectedFilter === 'all' ? styles.activeChip : '',
            ].filter(Boolean).join(' ')}
            onClick={() => setSelectedFilter('all')}
          >
            All
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={selectedFilter === 'open'}
            className={[
              styles.chip,
              selectedFilter === 'open' ? styles.activeChip : '',
            ].filter(Boolean).join(' ')}
            onClick={() => setSelectedFilter('open')}
          >
            Open today
          </button>

          {categoryChips.map((cat) => {
            const isSelected = selectedFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={[
                  styles.chip,
                  isSelected ? styles.activeChip : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedFilter(cat.id)}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Loading Skeletons */}
      {loading && rawStalls.length === 0 && (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} aria-hidden="true">
              <Skeleton height="2.5rem" width="2.5rem" borderRadius="var(--radius-full)" />
              <Skeleton height="1.25rem" width="70%" />
              <Skeleton height="0.875rem" width="50%" />
              <Skeleton height="1rem" width="40%" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredStalls.length === 0 && (
        <EmptyState
          scene="market-closed"
          title="No stalls listed"
          text="Try another market, or check back before market day."
          actionLabel="Browse markets"
          actionTo="/buyer/markets"
        />
      )}

      {/* Stalls Grid: 2 / 3 / 4 columns */}
      {!loading && filteredStalls.length > 0 && (
        <div className={styles.grid}>
          {filteredStalls.map((farmer) => (
            <FarmerCard key={farmer.id} farmer={farmer} variant="stall" />
          ))}
        </div>
      )}
    </Page>
  );
}

export default Farmers;
