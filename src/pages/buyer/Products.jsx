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
import { useSmartBasket } from '@/context/SmartBasketContext';
import styles from './Products.module.css';

/**
 * Search input + suggestions/history dropdown. Rendered once inside the
 * mobile header and once inside the desktop search row; only one copy is
 * ever visible at a time (CSS controls that per breakpoint), and both
 * share the same lifted state so they always agree.
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
                  key={p.id}
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
 * Customer Browse / Products directory page.
 * Follows the white-first design system:
 *  - Persistent left rail filter panel on desktop (>=1024px)
 *  - BottomSheet container below 1024px
 *  - Single chip row on mobile/tablet that never wraps
 *  - Active category chip is strictly ink-filled, never beet
 *  - 1 column down to ~300px, 2 at 380px, 3 at 768px, 4 at 1024px, 5 at 1440px
 */
export function Products() {
  const { selectedMarketId } = useAuth();
  const { openSmartBasket } = useSmartBasket();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial filter values from URL params
  const querySearch = searchParams.get('search') || searchParams.get('q') || '';
  const queryCategory = searchParams.get('category') || 'All';
  const queryStock = searchParams.get('stock') || (searchParams.get('includeSoldOut') === 'false' ? 'in' : '');
  const queryFarmer = searchParams.get('farmer') || searchParams.get('farmerId') || '';
  const querySort = searchParams.get('sort') || 'featured';
  const queryMarket = searchParams.get('market') || selectedMarketId || '';
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
    ['search-suggestions', debouncedSearch],
    ({ signal }) => (debouncedSearch ? getSearchSuggestions(debouncedSearch, signal) : Promise.resolve(null)),
    { enabled: Boolean(debouncedSearch && isSearchFocused) }
  );
  const suggestions = suggestionsData?.products || [];

  const { data: historyData } = useQuery(
    ['search-history'],
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
      console.error('[Products] Error fetching products:', err);
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

  // Removable filter tags, driven by data instead of five near-identical blocks
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
        {/* ── Desktop Page Header (1024px+) ───────────────────────── */}
        <header className={styles.desktopHeader}>
          <div className={styles.headerTitles}>
            <h1 className={styles.pageTitle}>Browse produce</h1>
            <p className={styles.pageContext}>
              {resultsLabel}
              {currentMarketName ? ` at ${currentMarketName}` : ''}
            </p>
          </div>

          <button
            type="button"
            className={styles.smartBasketHeaderBtn}
            onClick={() => openSmartBasket({ marketId: selectedMarketIdState })}
            aria-label="Build Smart Basket"
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>Smart Basket</span>
          </button>
        </header>

        {/* ── Mobile/Tablet Header (<1024px) ───────────────────────── */}
        <div className={styles.mobileHeader}>
          <div className={styles.searchRow}>
            <SearchBox
              search={search}
              onSearchChange={setSearch}
              onSubmit={handleSearchSubmit}
              isFocused={isSearchFocused}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
              suggestions={suggestions}
              history={history}
              debouncedSearch={debouncedSearch}
              onPickSuggestion={handlePickSuggestion}
            />

            <button
              type="button"
              className={styles.smartBasketMobileBtn}
              onClick={() => openSmartBasket({ marketId: selectedMarketIdState })}
              aria-label="Smart Basket"
              title="Build Smart Basket"
            >
              <Sparkles size={16} aria-hidden="true" />
              <span className={styles.smartBasketMobileText}>Smart Basket</span>
            </button>

            <button
              type="button"
              className={`${styles.filterTriggerBtn} ${activeFilterCount > 0 ? styles.filterTriggerActive : ''}`}
              onClick={() => setIsFilterSheetOpen(true)}
              aria-label={`Open filter sheet${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              <span className={styles.filterTriggerText}>Filters</span>
              {activeFilterCount > 0 && (
                <span className={styles.activeBadge}>{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Exactly one horizontal chip row on mobile/tablet — never wraps */}
          <div className={styles.chipRow} role="tablist" aria-label="Product categories">
            <button
              type="button"
              className={`${styles.categoryChip} ${selectedCategory === 'All' ? styles.categoryChipActive : ''}`}
              onClick={() => setSelectedCategory('All')}
            >
              All
            </button>
            {visibleCategories.map((cat) => {
              const name = cat.name || cat;
              const isSelected = selectedCategory.toLowerCase() === name.toLowerCase();
              return (
                <button
                  key={cat.id || cat.slug || name}
                  type="button"
                  className={`${styles.categoryChip} ${isSelected ? styles.categoryChipActive : ''}`}
                  onClick={() => setSelectedCategory(name)}
                >
                  {name}
                </button>
              );
            })}
            {categoriesList.length > 5 && (
              <button
                type="button"
                className={styles.categoryChip}
                onClick={() => setIsFilterSheetOpen(true)}
              >
                More
              </button>
            )}
          </div>
        </div>

        {/* ── Main Two-Column Layout (1024px+) ────────────────────── */}
        <div className={styles.mainLayout}>
          {/* Left Persistent Filter Rail (1024px+) */}
          <aside className={styles.asideRail} aria-label="Catalog filters">
            <FilterPanel
              value={filterValue}
              onChange={handleFilterChange}
              onReset={handleReset}
              categories={categoriesList}
              markets={marketsList}
              layout="rail"
              resultCount={productsList.length}
            />
          </aside>

          {/* Right Product Grid Area */}
          <section className={styles.gridArea} aria-label="Produce results">
            {/* Desktop Search Row */}
            <div className={styles.desktopSearchRow}>
              <SearchBox
                search={search}
                onSearchChange={setSearch}
                onSubmit={handleSearchSubmit}
                isFocused={isSearchFocused}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                suggestions={suggestions}
                history={history}
                debouncedSearch={debouncedSearch}
                onPickSuggestion={handlePickSuggestion}
              />
            </div>

            {/* Results count & Reset link */}
            <div className={styles.summaryRow}>
              <span className={styles.countText}>{resultsLabel}</span>
              {activeFilterCount > 0 && (
                <button type="button" className={styles.resetLink} onClick={handleReset}>
                  Reset
                </button>
              )}
            </div>

            {/* Removable active filter tags */}
            {activeTags.length > 0 && (
              <div className={styles.activeTagsRow} aria-label="Active filters">
                {activeTags.map((tag) => (
                  <button
                    key={tag.key}
                    type="button"
                    className={styles.activeTag}
                    onClick={tag.onRemove}
                    aria-label={tag.ariaLabel}
                  >
                    <span>{tag.label}</span>
                    <X size={14} className={styles.removeIcon} />
                  </button>
                ))}
              </div>
            )}

            {/* Produce Grid or Empty State */}
            {(loading || !hasLoadedInitial) && productsList.length === 0 ? (
              <GridSkeleton count={8} />
            ) : productsList.length > 0 ? (
              <div className={styles.catalogGrid}>
                {productsList.map((product) => (
                  <ProductCard key={product.id} product={product} variant="grid" />
                ))}
              </div>
            ) : (
              <div>
                <EmptyState
                  scene="walk-to-market"
                  title={debouncedSearch ? `No produce matching "${debouncedSearch}"` : 'No produce found'}
                  text={
                    debouncedSearch
                      ? `We couldn't find any fresh harvest matching "${debouncedSearch}"${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}. Check spelling or try a staple.`
                      : 'No items match your active filter combination. Try clearing your filters or choosing a different category.'
                  }
                  actionLabel="Clear all filters & search"
                  onAction={handleReset}
                />
                <div className={styles.emptySuggestionsWrap}>
                  <span className={styles.emptySuggestionsLabel}>Try searching for popular staples:</span>
                  <div className={styles.emptyPillsRow}>
                    {['Apples', 'Sourdough', 'Eggs', 'Raw Honey', 'Carrots', 'Tomatoes'].map((term) => (
                      <button
                        key={term}
                        type="button"
                        className={styles.emptyPillBtn}
                        onClick={() => {
                          setSearch(term);
                          setSelectedCategory('All');
                        }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Infinite pagination loading tail */}
            {loading && productsList.length > 0 && (
              <div className={styles.tailGrid} aria-label="Loading more produce">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}

            <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
          </section>
        </div>

        {/* ── Filter BottomSheet (<1024px) ────────────────────────── */}
        <BottomSheet
          open={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          title="Filter Produce"
          size="tall"
        >
          <FilterPanel
            value={filterValue}
            onChange={handleFilterChange}
            onReset={handleReset}
            categories={categoriesList}
            markets={marketsList}
            layout="sheet"
            resultCount={productsList.length}
            onClose={() => setIsFilterSheetOpen(false)}
          />
        </BottomSheet>
      </div>
    </div>
  );
}

export default Products;