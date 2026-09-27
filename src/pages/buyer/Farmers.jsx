import React, { useState, useMemo } from 'react';
import { Search, X, Sprout } from 'lucide-react';
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

function getCategoryIcon(slug = '', name = '') {
  const text = `${slug} ${name}`.toLowerCase();
  if (text.includes('veg') || text.includes('green') || text.includes('herb')) return '🥬';
  if (text.includes('fruit') || text.includes('berr') || text.includes('apple')) return '🍓';
  if (text.includes('bake') || text.includes('bread') || text.includes('pastr')) return '🥐';
  if (text.includes('dair') || text.includes('cheese') || text.includes('egg')) return '🧀';
  if (text.includes('honey') || text.includes('jam') || text.includes('preserve')) return '🍯';
  if (text.includes('flower') || text.includes('plant')) return '🌸';
  if (text.includes('mushroom')) return '🍄';
  if (text.includes('meat') || text.includes('poultry')) return '🥩';
  return '🌿';
}

/**
 * Page A: Stalls index (/buyer/stalls)
 *
 * Spiced up with:
 *  - Interactive hero bar with live stats
 *  - Instant search across stall names, specialties, stories, and produce
 *  - Categorized chips with emoji icons & live counts
 *  - Active filter feedback and suggestion chips
 *  - FarmerCard with themed illustration banners & produce badges
 */
export function Farmers() {
  useDocumentTitle('Stalls · MarketLink');

  const { selectedMarketId, user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch current market details for context name
  const { data: marketData } = useQuery(
    ['market-detail', selectedMarketId],
    ({ signal }) => getMarketDetail(selectedMarketId, signal).catch(() => null),
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

  const openCount = useMemo(
    () => rawStalls.filter((s) => Boolean(s.openToday)).length,
    [rawStalls]
  );

  // Compute available categories with item count
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
      if (chips.length >= 6) break;
    }

    // Fall back to server categories if needed
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

    // Compute counts
    for (const chip of chips) {
      const filterLower = chip.id.toLowerCase();
      chip.count = rawStalls.filter((s) => {
        const stallCat = (s.categorySlug || s.category || s.specialty || '').toLowerCase();
        return stallCat.includes(filterLower);
      }).length;
    }

    return chips.slice(0, 6);
  }, [rawStalls, categoriesData]);

  // Filter stalls according to chip selection and search query
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
        {/* Hero Header Area */}
        <div className={styles.heroBox}>
          <div className={styles.eyebrow}>
            <Sprout size={13} className={styles.eyebrowIcon} />
            <span>Community Producers · Direct From Farm & Oven</span>
          </div>

          <div className={styles.titleRow}>
            <PageTitle title="Market Stalls" context={contextLine} />
          </div>

          {/* Quick Metrics Bar */}
          <div className={styles.statsStrip}>
            <span className={styles.statBadge}>
              <span className={styles.pulseDot} />
              <strong>{openCount}</strong> Open Today
            </span>
            <span className={styles.statBadge}>
              🌾 <strong>{rawStalls.length}</strong> Local Producers
            </span>
            <span className={styles.statBadge}>
              📍 100% Harvested within 50 miles
            </span>
          </div>

          {/* Search bar */}
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

        {/* One non-wrapping chip row, max 8 chips with icons */}
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
            <span className={styles.chipIcon}>🧺</span>
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
            <span className={styles.chipIcon}>🟢</span>
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
                <span className={styles.chipIcon}>{getCategoryIcon(cat.id, cat.label)}</span>
                <span>{cat.label}</span>
                {cat.count > 0 && <span className={styles.chipBadge}>{cat.count}</span>}
              </button>
            );
          })}
        </div>

        {/* Active Filter Notice */}
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

      {/* Results region */}
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