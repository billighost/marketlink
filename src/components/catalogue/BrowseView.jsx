import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, History, Sparkles } from 'lucide-react';
import {
  getProducts,
  getCategories,
  getMarkets,
  getSearchSuggestions,
  getSearchHistory,
  recordSearchHistory,
} from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/domain/ProductCard';
import FilterPanel from '@/components/domain/FilterPanel';
import EmptyState from '@/components/ui/EmptyState';
import BottomSheet from '@/components/ui/BottomSheet';
import { GridSkeleton, SkeletonCard } from '@/components/layout/GridSkeleton';
import { useCatalogueRoutes } from './routes';
import styles from './BrowseView.module.css';

/**
 * Search input + suggestions/history dropdown.
 */
function SearchBox({
  search,
  onSearchChange,
  onSubmit,
  isFocused,
  onFocus,
  onBlur,
  suggestions,
  history,
  debouncedSearch,
  onPickSuggestion,
}) {
  const hasDropdownContent = suggestions.length > 0 || history.length > 0;

  return (
    <form className={styles.searchForm} onSubmit={onSubmit} role="search">
      <Search size={18} className={styles.searchIcon} aria-hidden="true" />
      <input
        type="search"
        className={styles.searchInput}
        placeholder="Search produce..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-label="Search produce"
      />
      {search && (
        <button
          type="button"
          className={styles.clearSearchBtn}
          onClick={() => onSearchChange('')}
          aria-label="Clear search text"
        >
          <X size={16} />
        </button>
      )}

      {isFocused && hasDropdownContent && (
        <div className={styles.searchDropdown} role="listbox">
          {suggestions.length > 0 && (
            <div className={styles.dropdownSection}>
              <span className={styles.dropdownTitle}>
                <Sparkles size={13} /> Suggestions
              </span>
              {suggestions.slice(0, 4).map((p) => (
                <button
                  key={p.id || p._id}
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => onPickSuggestion(p.name)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {!debouncedSearch && history.length > 0 && (
            <div className={styles.dropdownSection}>
              <span className={styles.dropdownTitle}>
                <History size={13} /> Recent Searches
              </span>
              {history.slice(0, 4).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => onPickSuggestion(item.term || item)}
                >
                  {item.term || item}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  );
}

/**
 * Shared Browse / Products directory view.
 * @param {'guest'|'buyer'} audience chooses actions and link targets, never content
 */
export function BrowseView({ audience = 'guest' }) {
  const routes = useCatalogueRoutes(audience);
  const { selectedMarketId: authMarketId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial filter values from URL params
  const querySearch = searchParams.get('search') || searchParams.get('q') || '';
  const queryCategory = searchParams.get('category') || 'All';
  const queryStock = searchParams.get('stock') || (searchParams.get('includeSoldOut') === 'false' ? 'in' : '');
  const queryFarmer = searchParams.get('farmer') || searchParams.get('farmerId') || '';
  const querySort = searchParams.get('sort') || 'featured';
  const queryMarket = searchParams.get('market') || (audience === 'buyer' ? authMarketId : '') || '';
  const queryDay = searchParams.get('day') || '';
  const queryMaxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice'), 10) : null;

  const [search, setSearch] = useState(querySearch);
  const debouncedSearch = useDebouncedValue(search, 250);

  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [inStockOnly, setInStockOnly] = useState(queryStock === 'in');
  const [selectedFarmerId, setSelectedFarmerId] = useState(queryFarmer);
  const [selectedSort, setSelectedSort] = useState(querySort);
  const [selectedMarketIdState, setSelectedMarketIdState] = useState(queryMarket);
  const [selectedDay, setSelectedDay] = useState(queryDay);
  const [selectedMaxPriceCents, setSelectedMaxPriceCents] = useState(queryMaxPrice);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Products and cursor pagination
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const inFlightRef = useRef(false);
  const abortFetchRef = useRef(null);
  const sentinelRef = useRef(null);

  // Categories & Markets from API
  const { data: categoriesData } = useQuery(['categories'], ({ signal }) => getCategories(signal));
  const categoriesList = useMemo(() => {
    if (Array.isArray(categoriesData?.data)) return categoriesData.data;
    if (Array.isArray(categoriesData)) return categoriesData;
    return [];
  }, [categoriesData]);

  const { data: marketsData } = useQuery(['markets'], ({ signal }) => getMarkets({}, signal));
  const marketsList = useMemo(() => {
    if (Array.isArray(marketsData?.data)) return marketsData.data;
    if (Array.isArray(marketsData)) return marketsData;
    return [];
  }, [marketsData]);

  // Suggestions & search history
  const { data: suggestionsData } = useQuery(
    [`${audience}-search-suggestions`, debouncedSearch],
    ({ signal }) => (debouncedSearch ? getSearchSuggestions(debouncedSearch, signal) : Promise.resolve(null)),
    { enabled: Boolean(debouncedSearch && isSearchFocused) }
  );
  const suggestions = suggestionsData?.products || [];

  const { data: historyData } = useQuery(
    [`${audience}-search-history`],
    ({ signal }) => getSearchHistory(signal),
    { enabled: Boolean(isSearchFocused && !debouncedSearch) }
  );
  const history = historyData || [];

  // Active market display name
  const currentMarketName = useMemo(() => {
    if (!Array.isArray(marketsList)) return '';
    const market = marketsList.find((m) => m && (m.id === selectedMarketIdState || m._id === selectedMarketIdState));
    return market?.name || '';
  }, [marketsList, selectedMarketIdState]);

  // Fetch products batch
  const fetchProductsBatch = useCallback(async (nextCursor = null, isFresh = false) => {
    if (isFresh) {
      if (abortFetchRef.current) {
        abortFetchRef.current.abort();
      }
      abortFetchRef.current = new AbortController();
    } else {
      if (inFlightRef.current) return;
    }
    const signal = abortFetchRef.current?.signal;
    inFlightRef.current = true;
    setLoading(true);

    try {
      const categoryParam = selectedCategory !== 'All' ? selectedCategory.toLowerCase() : undefined;
      const res = await getProducts({
        q: debouncedSearch || undefined,
        category: categoryParam,
        includeSoldOut: !inStockOnly,
        farmer: selectedFarmerId || undefined,
        market: selectedMarketIdState || undefined,
        sort: selectedSort || 'featured',
        day: selectedDay || undefined,
        maxPrice: selectedMaxPriceCents || undefined,
        cursor: nextCursor || undefined,
        limit: 20,
      }, signal);

      if (signal?.aborted) return;

      let items = res?.data || [];
      // Client-side day / maxPrice fallback if backend did not filter
      if (selectedDay) {
        items = items.filter((p) => !p.operatingDays || p.operatingDays.includes(selectedDay));
      }
      if (selectedMaxPriceCents) {
        items = items.filter((p) => (p.priceCents || p.price || 0) <= selectedMaxPriceCents);
      }

      const newCursor = res?.meta?.nextCursor || null;
      const more = Boolean(res?.meta?.hasMore && newCursor);

      setProductsList((prev) => (isFresh ? items : [...prev, ...items]));
      setCursor(newCursor);
      setHasMore(more);
      setHasLoadedInitial(true);
    } catch (err) {
      if (err?.name === 'AbortError' || signal?.aborted) return;
      console.error('[BrowseView] Error fetching products:', err);
      setHasLoadedInitial(true);
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
        inFlightRef.current = false;
      }
    }
  }, [
    debouncedSearch,
    selectedCategory,
    inStockOnly,
    selectedFarmerId,
    selectedMarketIdState,
    selectedSort,
    selectedDay,
    selectedMaxPriceCents,
  ]);

  // Refetch when filters or search change
  useEffect(() => {
    fetchProductsBatch(null, true);
  }, [fetchProductsBatch]);

  // Mirror state to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
    if (inStockOnly) params.set('stock', 'in');
    if (selectedFarmerId) params.set('farmer', selectedFarmerId);
    if (selectedSort && selectedSort !== 'featured') params.set('sort', selectedSort);
    if (selectedMarketIdState) params.set('market', selectedMarketIdState);
    if (selectedDay) params.set('day', selectedDay);
    if (selectedMaxPriceCents) params.set('maxPrice', String(selectedMaxPriceCents));

    setSearchParams(params, { replace: true });
  }, [
    debouncedSearch,
    selectedCategory,
    inStockOnly,
    selectedFarmerId,
    selectedSort,
    selectedMarketIdState,
    selectedDay,
    selectedMaxPriceCents,
    setSearchParams,
  ]);

  // Endless pagination intersection observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          fetchProductsBatch(cursor, false);
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchProductsBatch, cursor, hasMore, loading]);

  const handleFilterChange = (patch) => {
    if ('inStockOnly' in patch) setInStockOnly(patch.inStockOnly);
    if ('sort' in patch) setSelectedSort(patch.sort);
    if ('category' in patch) setSelectedCategory(patch.category);
    if ('marketId' in patch) setSelectedMarketIdState(patch.marketId);
    if ('day' in patch) setSelectedDay(patch.day);
    if ('maxPriceCents' in patch) setSelectedMaxPriceCents(patch.maxPriceCents);
  };

  const handleReset = () => {
    setSearch('');
    setSelectedCategory('All');
    setInStockOnly(false);
    setSelectedFarmerId('');
    setSelectedSort('featured');
    setSelectedMarketIdState('');
    setSelectedDay('');
    setSelectedMaxPriceCents(null);
    setSearchParams({});
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      recordSearchHistory(search.trim()).catch(() => {});
    }
    setIsSearchFocused(false);
  };

  const handlePickSuggestion = (term) => {
    setSearch(term);
    setIsSearchFocused(false);
  };

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (selectedFarmerId ? 1 : 0) +
    (search ? 1 : 0) +
    (selectedSort !== 'featured' ? 1 : 0) +
    (selectedMarketIdState ? 1 : 0) +
    (selectedDay ? 1 : 0) +
    (selectedMaxPriceCents ? 1 : 0);

  const filterValue = useMemo(() => ({
    inStockOnly,
    sort: selectedSort,
    category: selectedCategory,
    marketId: selectedMarketIdState,
    day: selectedDay,
    maxPriceCents: selectedMaxPriceCents,
  }), [inStockOnly, selectedSort, selectedCategory, selectedMarketIdState, selectedDay, selectedMaxPriceCents]);

  const activeTags = useMemo(() => [
    selectedCategory !== 'All' && {
      key: 'category',
      label: selectedCategory,
      ariaLabel: `Remove category filter ${selectedCategory}`,
      onRemove: () => setSelectedCategory('All'),
    },
    inStockOnly && {
      key: 'stock',
      label: 'In stock',
      ariaLabel: 'Remove in stock filter',
      onRemove: () => setInStockOnly(false),
    },
    selectedDay && {
      key: 'day',
      label: `Day: ${selectedDay.toUpperCase()}`,
      ariaLabel: `Remove day filter ${selectedDay}`,
      onRemove: () => setSelectedDay(''),
    },
    selectedMaxPriceCents && {
      key: 'price',
      label: `Up to £${(selectedMaxPriceCents / 100).toFixed(0)}`,
      ariaLabel: 'Remove price ceiling filter',
      onRemove: () => setSelectedMaxPriceCents(null),
    },
    selectedMarketIdState && {
      key: 'market',
      label: currentMarketName || 'Market',
      ariaLabel: 'Remove market filter',
      onRemove: () => setSelectedMarketIdState(''),
    },
  ].filter(Boolean), [selectedCategory, inStockOnly, selectedDay, selectedMaxPriceCents, selectedMarketIdState, currentMarketName]);

  const visibleCategories = categoriesList.slice(0, 5);
  const resultsLabel = `${productsList.length} ${productsList.length === 1 ? 'item' : 'items'}`;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Desktop Page Header (1024px+) */}
        <header className={styles.desktopHeader}>
          <h1 className={styles.pageTitle}>Browse produce</h1>
          <p className={styles.pageContext}>
            {resultsLabel}
            {currentMarketName ? ` at ${currentMarketName}` : ''}
          </p>
        </header>

        {/* Mobile/Tablet Header (<1024px) */}
        <div className={styles.mobileHeader}>
          <div className={styles.searchRow}>
            <SearchBox
              search={search}
              onSearchChange={setSearch}
              onSubmit={handleSearchSubmit}
              isFocused={isSearchFocused}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              suggestions={suggestions}
              history={history}
              debouncedSearch={debouncedSearch}
              onPickSuggestion={handlePickSuggestion}
            />

            <button
              type="button"
              className={`${styles.filterTriggerBtn} ${activeFilterCount > 0 ? styles.filterTriggerActive : ''}`}
              onClick={() => setIsFilterSheetOpen(true)}
              aria-expanded={isFilterSheetOpen}
              aria-controls="mobile-filter-sheet"
              aria-label={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
            >
              <SlidersHorizontal size={17} aria-hidden="true" />
              <span className={styles.filterTriggerText}>Filters</span>
              {activeFilterCount > 0 && (
                <span className={styles.activeBadge} aria-hidden="true">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Non-wrapping category chip row */}
          <div className={styles.chipRow} role="tablist" aria-label="Quick categories">
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'All'}
              className={`${styles.categoryChip} ${selectedCategory === 'All' ? styles.categoryChipActive : ''}`}
              onClick={() => setSelectedCategory('All')}
            >
              All
            </button>
            {visibleCategories.map((cat) => {
              const catSlug = cat.slug || cat.id || cat;
              const isSelected = selectedCategory.toLowerCase() === catSlug.toLowerCase();
              return (
                <button
                  key={catSlug}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`${styles.categoryChip} ${isSelected ? styles.categoryChipActive : ''}`}
                  onClick={() => setSelectedCategory(cat.name || catSlug)}
                >
                  {cat.name || catSlug}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Search + Filter Row (1024px+) */}
        <div className={styles.desktopSearchRow}>
          <SearchBox
            search={search}
            onSearchChange={setSearch}
            onSubmit={handleSearchSubmit}
            isFocused={isSearchFocused}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            suggestions={suggestions}
            history={history}
            debouncedSearch={debouncedSearch}
            onPickSuggestion={handlePickSuggestion}
          />
        </div>

        {/* Main Two-Column Layout (1024px+) */}
        <div className={styles.mainLayout}>
          {/* Desktop Left Rail Filter Panel */}
          <aside className={styles.asideRail} aria-label="Produce filters">
            <FilterPanel
              value={filterValue}
              onChange={handleFilterChange}
              onReset={handleReset}
              categories={categoriesList}
              markets={marketsList}
              totalCount={productsList.length}
            />
          </aside>

          {/* Catalog Grid Area */}
          <main className={styles.gridArea} id="main-content">
            {/* Active Tags Row */}
            {activeTags.length > 0 && (
              <div className={styles.activeTagsRow} role="list" aria-label="Active filters">
                {activeTags.map((tag) => (
                  <button
                    key={tag.key}
                    type="button"
                    className={styles.activeTag}
                    onClick={tag.onRemove}
                    aria-label={tag.ariaLabel}
                  >
                    <span>{tag.label}</span>
                    <span className={styles.removeIcon} aria-hidden="true">
                      <X size={14} />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Results count & reset */}
            <div className={styles.summaryRow} aria-live="polite">
              <span className={styles.countText}>{resultsLabel}</span>
              {activeFilterCount > 0 && (
                <button type="button" className={styles.resetLink} onClick={handleReset}>
                  Clear all filters
                </button>
              )}
            </div>

            {/* Initial loading state */}
            {(loading || !hasLoadedInitial) && productsList.length === 0 && (
              <GridSkeleton count={8} columns="products" />
            )}

            {/* Empty state */}
            {!loading && hasLoadedInitial && productsList.length === 0 && (
              <EmptyState
                scene="farm-basket"
                title="No produce found"
                text={
                  activeFilterCount > 0
                    ? 'Try clearing some filters or search for something else.'
                    : 'No seasonal produce listed for this view today.'
                }
                actionLabel={activeFilterCount > 0 ? 'Clear all filters' : undefined}
                onAction={activeFilterCount > 0 ? handleReset : undefined}
              />
            )}

            {/* Produce Grid: minmax(0, 1fr) */}
            {productsList.length > 0 && (
              <div className={styles.catalogGrid}>
                {productsList.map((product) => (
                  <ProductCard
                    key={product.id || product._id}
                    product={product}
                    variant="grid"
                    audience={audience}
                  />
                ))}
              </div>
            )}

            {/* Cursor pagination loading tail */}
            {loading && productsList.length > 0 && (
              <div className={styles.tailGrid} aria-label="Loading more items">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
          </main>
        </div>

        {/* Mobile Filter Sheet (<1024px) */}
        <BottomSheet
          isOpen={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          title="Filter Produce"
          ariaLabel="Produce filters modal"
        >
          <FilterPanel
            value={filterValue}
            onChange={handleFilterChange}
            onReset={handleReset}
            categories={categoriesList}
            markets={marketsList}
            totalCount={productsList.length}
            isMobileSheet={true}
            onClose={() => setIsFilterSheetOpen(false)}
          />
        </BottomSheet>
      </div>
    </div>
  );
}

export default BrowseView;
