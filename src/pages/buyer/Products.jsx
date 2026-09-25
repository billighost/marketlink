import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, History, Sparkles } from 'lucide-react';
import {
  getProducts,
  getCategories,
  getMarkets,
  getFarmers,
  getSearchSuggestions,
  getSearchHistory,
  recordSearchHistory,
} from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/domain/ProductCard';
import Chip from '@/components/ui/Chip';
import EmptyState from '@/components/ui/EmptyState';
import BottomSheet from '@/components/ui/BottomSheet';
import Toggle from '@/components/ui/Toggle';
import Button from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import styles from './Products.module.css';

/**
 * Customer Browse / Products directory page.
 * Minimal UI specifications:
 *  - Server-side search debounced 250ms with URL sync
 *  - Suggestions & history dropdown
 *  - Categories from GET /categories
 *  - Cursor-based endless list with skeleton tail
 *  - Filter sheet with server parameters
 */
export function Products() {
  const { selectedMarketId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const querySearch = searchParams.get('search') || '';
  const queryCategory = searchParams.get('category') || 'All';
  const queryStock = searchParams.get('stock') || '';
  const queryFarmer = searchParams.get('farmer') || searchParams.get('farmerId') || '';
  const querySort = searchParams.get('sort') || 'featured';

  const [search, setSearch] = useState(querySearch);
  const debouncedSearch = useDebouncedValue(search, 250);

  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [inStockOnly, setInStockOnly] = useState(queryStock === 'in');
  const [selectedFarmerId, setSelectedFarmerId] = useState(queryFarmer);
  const [selectedSort, setSelectedSort] = useState(querySort);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Products and cursor pagination
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const inFlightRef = useRef(false);
  const sentinelRef = useRef(null);

  // Categories & metadata from API
  const { data: categoriesData } = useQuery(['categories'], ({ signal }) => getCategories(signal));
  const categoriesList = categoriesData || [];

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
        market: selectedMarketId || undefined,
        sort: selectedSort || 'featured',
        cursor: nextCursor || undefined,
        limit: 20,
      });

      const items = res?.data || [];
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
  }, [debouncedSearch, selectedCategory, inStockOnly, selectedFarmerId, selectedSort, selectedMarketId]);

  // Refetch when filters or search change
  useEffect(() => {
    fetchProductsBatch(null, true);
  }, [fetchProductsBatch]);

  // Keep URL parameters in sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
    if (inStockOnly) params.set('stock', 'in');
    if (selectedFarmerId) params.set('farmer', selectedFarmerId);
    if (selectedSort && selectedSort !== 'featured') params.set('sort', selectedSort);

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedCategory, inStockOnly, selectedFarmerId, selectedSort, setSearchParams]);

  // Scroll detection for sticky header hairline
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setInStockOnly(false);
    setSelectedFarmerId('');
    setSelectedSort('featured');
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
    (selectedSort !== 'featured' ? 1 : 0);

  const visibleCategories = categoriesList.slice(0, 5);

  return (
    <div className={styles.page}>
      {/* ── Sticky Search & Filter Header ───────────────────────────── */}
      <div className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.searchRow}>
          <form className={styles.searchWrapper} onSubmit={handleSearchSubmit} role="search">
            <Search size={18} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search all market products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
              aria-label="Search all market products"
            />
            {search && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => setSearch('')}
                aria-label="Clear search text"
              >
                <X size={16} />
              </button>
            )}

            {/* Suggestions & Search History dropdown */}
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
            className={`${styles.filterButton} ${activeFilterCount > 0 ? styles.filterActive : ''}`}
            onClick={() => setIsFilterSheetOpen(true)}
            aria-label="Open filter settings"
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            <span className={styles.filterText}>Filters</span>
            {activeFilterCount > 0 && (
              <span className={styles.filterBadge}>{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Exactly one Category Chip Row (max 7 chips) */}
        <div className={styles.categoriesScroll} role="tablist" aria-label="Product categories">
          <Chip
            selected={selectedCategory === 'All'}
            onClick={() => handleCategoryChange('All')}
          >
            All
          </Chip>
          {visibleCategories.map((cat) => (
            <Chip
              key={cat.id || cat.slug || cat.name}
              selected={selectedCategory.toLowerCase() === (cat.name || cat).toLowerCase()}
              onClick={() => handleCategoryChange(cat.name || cat)}
            >
              {cat.name || cat}
            </Chip>
          ))}
          {categoriesList.length > 5 && (
            <Chip
              selected={categoriesList.slice(5).some((c) => (c.name || c).toLowerCase() === selectedCategory.toLowerCase())}
              onClick={() => setIsFilterSheetOpen(true)}
            >
              More
            </Chip>
          )}
        </div>

        {/* Results summary line */}
        <div className={styles.resultsSummary}>
          <span className={styles.countText}>
            {productsList.length} {productsList.length === 1 ? 'product' : 'products'}
          </span>
          {activeFilterCount > 0 && (
            <button
              type="button"
              className={styles.clearAllLink}
              onClick={handleClearFilters}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Products Grid ─────────────────────────────────────────────── */}
      <div className={styles.contentWrap}>
        {productsList.length > 0 ? (
          <div className={styles.grid}>
            {productsList.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="grid"
              />
            ))}
          </div>
        ) : !loading ? (
          <EmptyState
            title="No products found"
            description="Try changing your search keywords or resetting your filter criteria."
            actionLabel="Reset filters"
            onAction={handleClearFilters}
          />
        ) : null}

        {/* Loading Skeleton tail */}
        {loading && (
          <div className={styles.skeletonGrid} aria-label="Loading products">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Keyset scroll sentinel */}
        <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      </div>

      {/* ── Filter BottomSheet ────────────────────────────────────────── */}
      <BottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filter Products"
        size="tall"
      >
        <div className={styles.filterSheetContent}>
          {/* Availability Toggle */}
          <div className={styles.filterGroup}>
            <div className={styles.filterRow}>
              <span className={styles.filterLabel}>In-stock items only</span>
              <Toggle
                checked={inStockOnly}
                onChange={setInStockOnly}
                aria-label="In-stock only filter"
              />
            </div>
          </div>

          {/* Sort Selection */}
          <div className={styles.filterGroup}>
            <h4 className={styles.filterGroupTitle}>Sort By</h4>
            <div className={styles.chipGrid}>
              {[
                { label: 'Featured', val: 'featured' },
                { label: 'Price: Low to High', val: 'price_asc' },
                { label: 'Price: High to Low', val: 'price_desc' },
                { label: 'Newest Arrivals', val: 'newest' },
                { label: 'Most Popular', val: 'popular' },
              ].map((s) => (
                <Chip
                  key={s.val}
                  selected={selectedSort === s.val}
                  onClick={() => setSelectedSort(s.val)}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* All Categories Selection */}
          <div className={styles.filterGroup}>
            <h4 className={styles.filterGroupTitle}>Category</h4>
            <div className={styles.chipGrid}>
              <Chip
                selected={selectedCategory === 'All'}
                onClick={() => setSelectedCategory('All')}
              >
                All Categories
              </Chip>
              {categoriesList.map((cat) => (
                <Chip
                  key={cat.id || cat.slug || cat.name}
                  selected={selectedCategory.toLowerCase() === (cat.name || cat).toLowerCase()}
                  onClick={() => setSelectedCategory(cat.name || cat)}
                >
                  {cat.name || cat}
                </Chip>
              ))}
            </div>
          </div>

          {/* Action button */}
          <div className={styles.sheetActions}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setIsFilterSheetOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

export default Products;
