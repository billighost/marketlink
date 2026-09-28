import React, { useState, useMemo } from 'react';
import { Search, X, Sprout, Store, MapPin } from 'lucide-react';
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

export function Farmers() {
  useDocumentTitle('Stalls · MarketLink');

  const { selectedMarketId, user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: marketData } = useQuery(
    ['market-detail', selectedMarketId],
    ({ signal }) => getMarketDetail(selectedMarketId, signal).catch(() => null),
    { enabled: Boolean(selectedMarketId) }
  );

  const marketName =
    marketData?.name ||
    user?.homeMarket?.name ||
    'the market';

  const { data: categoriesData } = useQuery(
    ['categories'],
    ({ signal }) => getCategories(signal)
  );

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

  const openCount = useMemo(
    () => rawStalls.filter((s) => Boolean(s.openToday)).length,
    [rawStalls]
  );

  const categoryChips = useMemo(() => {
    const rawCategories = Array.isArray(categoriesData) ? categoriesData : [];
    const usedSlugs = new Set();
    const chips = [];

    for (const stall of rawStalls) {
      const slug = stall.categorySlug || stall.category;
      const name = stall.categoryName || stall.category || stall.specialty;
      if (slug && !usedSlugs.has(slug)) {
        usedSlugs.add(slug);
        chips.push({ id: slug, label: name || slug });
      }
      if (chips.length >= 6) break;
    }

    if (chips.length < 6) {
      for (const cat of rawCategories) {
        const slug = cat.slug || cat.id || cat.name?.toLowerCase();
        const name = cat.name || cat;
        if (slug && !usedSlugs.has(slug)) {
          usedSlugs.add(slug);
          chips.push({ id: slug, label: name });
        }
        if (chips.length >= 6) break;
      }
    }

    for (const chip of chips) {
      const filterLower = chip.id.toLowerCase();
      chip.count = rawStalls.filter((s) => {
        const stallCat = (s.categorySlug || s.category || s.specialty || '').toLowerCase();
        return stallCat.includes(filterLower);
      }).length;
    }

    return chips.slice(0, 6);
  }, [rawStalls, categoriesData]);

  const filteredStalls = useMemo(() => {
    let list = rawStalls;

    if (selectedFilter === 'open') {
      list = list.filter((s) => Boolean(s.openToday));
    } else if (selectedFilter !== 'all') {
      const filterLower = selectedFilter.toLowerCase();
      list = list.filter((s) => {
        const stallCat = (s.categorySlug || s.category || s.specialty || '').toLowerCase();
        return stallCat.includes(filterLower);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => {
        return (
          (s.stallName && s.stallName.toLowerCase().includes(q)) ||
          (s.specialty && s.specialty.toLowerCase().includes(q)) ||
          (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
          (s.story && s.story.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [rawStalls, selectedFilter, searchQuery]);

  const countText =
    filteredStalls.length === 1 ? '1 stall' : `${filteredStalls.length} stalls`;
  const contextLine = marketName
    ? `${countText} at ${marketName}`
    : countText;

  const showLoading = loading || (!farmersData && rawStalls.length === 0);
  const showEmpty = !loading && farmersData != null && filteredStalls.length === 0;
  const showGrid = !loading && filteredStalls.length > 0;

  return (
    <Page width="wide">
      <header className={styles.header}>
        
        <div className={styles.heroBox}>
          <div className={styles.eyebrow}>
            <Sprout size={13} className={styles.eyebrowIcon} />
            <span>Community Producers · Direct From Farm & Oven</span>
          </div>

          <div className={styles.titleRow}>
            <PageTitle title="Market Stalls" context={contextLine} />
          </div>

          <div className={styles.statsStrip}>
            <span className={styles.statBadge}>
              <span className={styles.pulseDot} />
              <strong>{openCount}</strong> Open Today
            </span>
            <span className={styles.statBadge}>
              <Store size={14} className={styles.statBadgeIcon} aria-hidden="true" />
              <strong>{rawStalls.length}</strong> Local Producers
            </span>
            <span className={styles.statBadge}>
              <MapPin size={14} className={styles.statBadgeIcon} aria-hidden="true" />
              100% Harvested within 50 miles
            </span>
          </div>

          <div className={styles.searchContainer}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stalls, produce, or growers (e.g. berries, sourdough, honey)..."
              className={styles.searchInput}
              aria-label="Search stalls and produce"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

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
            <span>All</span>
            <span className={styles.chipBadge}>{rawStalls.length}</span>
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
            <span>Open today</span>
            <span className={styles.chipBadge}>{openCount}</span>
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
                <span>{cat.label}</span>
                {cat.count > 0 && <span className={styles.chipBadge}>{cat.count}</span>}
              </button>
            );
          })}
        </div>

        {(selectedFilter !== 'all' || searchQuery.trim()) && (
          <div className={styles.activeFilterNotice}>
            <span>
              Showing <strong>{filteredStalls.length}</strong> of {rawStalls.length} stalls
              {searchQuery.trim() ? ` matching "${searchQuery}"` : ''}
              {selectedFilter !== 'all' && selectedFilter !== 'open'
                ? ` in ${categoryChips.find((c) => c.id === selectedFilter)?.label || selectedFilter}`
                : selectedFilter === 'open'
                ? ' open today'
                : ''}
            </span>
            <button
              type="button"
              className={styles.resetFiltersBtn}
              onClick={() => {
                setSelectedFilter('all');
                setSearchQuery('');
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </header>

      <div aria-live="polite">
        {showLoading && (
          <div className={styles.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} aria-hidden="true">
                <Skeleton height="7.5rem" width="100%" borderRadius="0" />
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Skeleton height="1.25rem" width="70%" />
                  <Skeleton height="0.875rem" width="50%" />
                  <Skeleton height="1rem" width="40%" />
                </div>
              </div>
            ))}
          </div>
        )}

        {showEmpty && (
          <div className={styles.emptyWrap}>
            <EmptyState
              scene="market-closed"
              title={
                searchQuery
                  ? `No stalls found for "${searchQuery}"`
                  : rawStalls.length > 0
                  ? 'No stalls in this category'
                  : 'No stalls listed'
              }
              text={
                searchQuery
                  ? 'Try searching for a different keyword or check the suggested tags below.'
                  : rawStalls.length > 0
                  ? 'Try choosing another filter above or reset filters to browse all producers.'
                  : 'Try another market, or check back before market day.'
              }
              actionLabel="Show all stalls"
              onAction={() => {
                setSelectedFilter('all');
                setSearchQuery('');
              }}
            />
            {rawStalls.length > 0 && (
              <div className={styles.suggestionsBox}>
                <span className={styles.suggestionsTitle}>Popular searches:</span>
                <div className={styles.suggestionPills}>
                  {['Berries', 'Honey', 'Sourdough', 'Mushrooms', 'Cheese', 'Flowers'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={styles.suggestionPill}
                      onClick={() => setSearchQuery(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showGrid && (
          <div className={styles.grid}>
            {filteredStalls.map((farmer) => (
              <FarmerCard key={farmer.id || farmer._id} farmer={farmer} variant="stall" />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

export default Farmers;
