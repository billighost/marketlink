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
import styles from './Products.module.css';

/**
 * Customer Browse / Products directory page (Stage 6).
 * Follows white-first design system specifications:
 *  - Persistent left rail filter panel on desktop (>=1024px)
 *  - BottomSheet container below 1024px
 *  - Single chip row on mobile/tablet that never wraps
 *  - Active category chip is strictly ink-filled, never beet
 *  - 2 columns <768px, 3 columns at 768px, 4 columns at 1024px
 */
export function Products() {
  const { selectedMarketId } = useAuth();
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
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const inFlightRef = useRef(false);
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

  const { data: historyData } = useQuery(
    ['search-history'],
    ({ signal }) => getSearchHistory(signal),
    { enabled: Boolean(isSearchFocused && !debouncedSearch) }
  );

  // Active market display name
  const currentMarketName = useMemo(() => {
    if (!Array.isArray(marketsList)) return '';
    const market = marketsList.find((m) => m && (m.id === selectedMarketIdState || m._id === selectedMarketIdState));
    return market?.name || '';
  }, [marketsList, selectedMarketIdState]);

  // Fetch products batch
  const fetchProductsBatch = useCallback(async (nextCursor = null, isFresh = false) => {
    if (inFlightRef.current) return;
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
      });

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
    } catch (err) {
      console.error('[Products] Error fetching products:', err);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
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

  const visibleCategories = categoriesList.slice(0, 5);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── Desktop Page Header (1024px+) ───────────────────────── */}
        <header className={styles.desktopHeader}>
          <h1 className={styles.pageTitle}>Browse produce</h1>
          <p className={styles.pageContext}>
            {productsList.length} {productsList.length === 1 ? 'item' : 'items'}
            {currentMarketName ? ` at ${currentMarketName}` : ''}
          </p>
        </header>

        {/* ── Mobile/Tablet Header (<1024px) ───────────────────────── */}
        <div className={styles.mobileHeader}>
          <div className={styles.searchRow}>
            <form className={styles.searchForm} onSubmit={handleSearchSubmit} role="search">
              <Search size={18} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search produce..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                aria-label="Search produce"
              />
              {search && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearch('')}
                  aria-label="Clear search text"
                >
                  <X size={16} />
                </button>
              )}

              {/* Suggestions & History dropdown */}
              {isSearchFocused && (suggestionsData?.products?.length > 0 || historyData?.length > 0) && (
                <div className={styles.searchDropdown} role="listbox">
                  {suggestionsData?.products?.length > 0 && (
                    <div className={styles.dropdownSection}>
                      <span className={styles.dropdownTitle}>
                        <Sparkles size={13} /> Suggestions
                      </span>
                      {suggestionsData.products.slice(0, 4).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => {
                            setSearch(p.name);
                            setIsSearchFocused(false);
                          }}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {!debouncedSearch && historyData?.length > 0 && (
                    <div className={styles.dropdownSection}>
                      <span className={styles.dropdownTitle}>
                        <History size={13} /> Recent Searches
                      </span>
                      {historyData.slice(0, 4).map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => {
                            setSearch(item.term || item);
                            setIsSearchFocused(false);
                          }}
                        >
                          {item.term || item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>

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
              <form className={styles.searchForm} onSubmit={handleSearchSubmit} role="search">
                <Search size={18} className={styles.searchIcon} aria-hidden="true" />
                <input
                  type="search"
                  className={styles.searchInput}
                  placeholder="Search produce..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                  aria-label="Search produce"
                />
                {search && (
                  <button
                    type="button"
                    className={styles.clearSearchBtn}
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}

                {/* Suggestions & History dropdown for desktop */}
                {isSearchFocused && (suggestionsData?.products?.length > 0 || historyData?.length > 0) && (
                  <div className={styles.searchDropdown} role="listbox">
                    {suggestionsData?.products?.length > 0 && (
                      <div className={styles.dropdownSection}>
                        <span className={styles.dropdownTitle}>
                          <Sparkles size={13} /> Suggestions
                        </span>
                        {suggestionsData.products.slice(0, 4).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => {
                              setSearch(p.name);
                              setIsSearchFocused(false);
                            }}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {!debouncedSearch && historyData?.length > 0 && (
                      <div className={styles.dropdownSection}>
                        <span className={styles.dropdownTitle}>
                          <History size={13} /> Recent Searches
                        </span>
                        {historyData.slice(0, 4).map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => {
                              setSearch(item.term || item);
                              setIsSearchFocused(false);
                            }}
                          >
                            {item.term || item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Results count & Reset link */}
            <div className={styles.summaryRow}>
              <span className={styles.countText}>
                {productsList.length} {productsList.length === 1 ? 'item' : 'items'}
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className={styles.resetLink}
                  onClick={handleReset}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Removable active filter tags */}
            {activeFilterCount > 0 && (
              <div className={styles.activeTagsRow} aria-label="Active filters">
                {selectedCategory !== 'All' && (
                  <button
                    type="button"
                    className={styles.activeTag}
                    onClick={() => setSelectedCategory('All')}
                    aria-label={`Remove category filter ${selectedCategory}`}
                  >
                    <span>{selectedCategory}</span>
                    <X size={14} className={styles.removeIcon} />
                  </button>
                )}
                {inStockOnly && (
                  <button
                    type="button"
                    className={styles.activeTag}
                    onClick={() => setInStockOnly(false)}
                    aria-label="Remove in stock filter"
                  >
                    <span>In stock</span>
                    <X size={14} className={styles.removeIcon} />
                  </button>
                )}
                {selectedDay && (
                  <button
                    type="button"
                    className={styles.activeTag}
                    onClick={() => setSelectedDay('')}
                    aria-label={`Remove day filter ${selectedDay}`}
                  >
                    <span>Day: {selectedDay.toUpperCase()}</span>
                    <X size={14} className={styles.removeIcon} />
                  </button>
                )}
                {selectedMaxPriceCents && (
                  <button
                    type="button"
                    className={styles.activeTag}
                    onClick={() => setSelectedMaxPriceCents(null)}
                    aria-label="Remove price ceiling filter"
                  >
                    <span>Up to £{(selectedMaxPriceCents / 100).toFixed(0)}</span>
                    <X size={14} className={styles.removeIcon} />
                  </button>
                )}
                {selectedMarketIdState && (
                  <button
                    type="button"
                    className={styles.activeTag}
                    onClick={() => setSelectedMarketIdState('')}
                    aria-label="Remove market filter"
                  >
                    <span>{currentMarketName || 'Market'}</span>
                    <X size={14} className={styles.removeIcon} />
                  </button>
                )}
              </div>
            )}

            {/* Produce Grid or Empty State */}
            {loading && productsList.length === 0 ? (
              <GridSkeleton count={8} />
            ) : productsList.length > 0 ? (
              <div className={styles.catalogGrid}>
                {productsList.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="grid"
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                scene="walk-to-market"
                title="Nothing matches that"
                text="Try fewer filters or a different word."
                actionLabel="Clear filters"
                onAction={handleReset}
              />
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
