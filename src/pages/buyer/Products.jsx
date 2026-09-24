import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { products, categories, farmers } from '@/data/placeholders';
import ProductCard from '@/components/domain/ProductCard';
import Chip from '@/components/ui/Chip';
import EmptyState from '@/components/ui/EmptyState';
import BottomSheet from '@/components/ui/BottomSheet';
import Toggle from '@/components/ui/Toggle';
import styles from './Products.module.css';

const DEFAULT_SUGGESTIONS = [
  'Heirloom tomatoes',
  'Sourdough',
  'Raw honey',
  'Fresh eggs',
  'Shiitake',
];

/**
 * Customer Browse / Products directory page.
 * Responsive 2-column product grid with search, category chips, and filter modal.
 */
export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const querySearch = searchParams.get('search') || '';
  const queryCategory = searchParams.get('category') || 'All';
  const queryFilter = searchParams.get('filter') || '';
  const queryStock = searchParams.get('stock') || '';
  const queryFarmer = searchParams.get('farmer') || searchParams.get('farmerId') || '';

  const [search, setSearch] = useState(querySearch);
  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [inStockOnly, setInStockOnly] = useState(queryStock === 'in');
  const [selectedFarmerId, setSelectedFarmerId] = useState(queryFarmer);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Recent searches persisted in sessionStorage
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = sessionStorage.getItem('marketlink_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep state synced with URL search params if navigated externally
  React.useEffect(() => {
    if (querySearch !== search) setSearch(querySearch);
    if (queryCategory !== selectedCategory) setSelectedCategory(queryCategory);
    if (queryFarmer !== selectedFarmerId) setSelectedFarmerId(queryFarmer);
    if (queryStock === 'in' && !inStockOnly) setInStockOnly(true);
  }, [querySearch, queryCategory, queryFarmer, queryStock]);

  // Hairline bottom border fades in on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const saveRecentSearch = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      try {
        sessionStorage.setItem('marketlink_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const handleApplySearch = (term) => {
    setSearch(term);
    saveRecentSearch(term);
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      sessionStorage.removeItem('marketlink_recent_searches');
    } catch {
      // ignore
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search term
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        const matchesCategory = product.category.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCategory) return false;
      }

      // Category
      if (selectedCategory !== 'All' && product.category !== selectedCategory) {
        return false;
      }

      // Stock
      if (inStockOnly && product.stock === 'out') {
        return false;
      }
      if (queryStock === 'low' && product.stock !== 'low') {
        return false;
      }

      // Farmer
      const targetFarmer = selectedFarmerId || queryFarmer;
      if (targetFarmer && product.farmerId !== targetFarmer) {
        return false;
      }

      // Special tags
      if (queryFilter === 'bestseller' && !product.tags?.includes('bestseller')) {
        return false;
      }
      if (queryFilter === 'featured' && !product.tags?.includes('bestseller') && !product.tags?.includes('featured')) {
        return false;
      }
      if (queryFilter === 'seasonal' && !product.tags?.includes('seasonal')) {
        return false;
      }
      if (queryFilter === 'new' && !product.tags?.includes('new')) {
        return false;
      }

      return true;
    });
  }, [search, selectedCategory, inStockOnly, selectedFarmerId, queryFarmer, queryFilter, queryStock]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setInStockOnly(false);
    setSelectedFarmerId('');
    setSearchParams({});
  };

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (selectedFarmerId ? 1 : 0) +
    (search ? 1 : 0) +
    (queryStock ? 1 : 0) +
    (queryFilter ? 1 : 0);

  return (
    <div className={styles.page}>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search all market stalls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveRecentSearch(search);
                }
              }}
              enterKeyHint="search"
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
          </div>

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

        {/* Suggestion Chips and Recent Searches when search is empty */}
        {!search && (
          <div className={styles.suggestionsRow} aria-label="Search suggestions">
            <span className={styles.suggestionsLabel}>Try:</span>
            {DEFAULT_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                className={styles.suggestionChip}
                onClick={() => handleApplySearch(sug)}
              >
                {sug}
              </button>
            ))}
            {recentSearches.length > 0 && (
              <>
                <span className={styles.suggestionsLabel} style={{ marginLeft: 'var(--space-2)' }}>Recent:</span>
                {recentSearches.map((rec) => (
                  <button
                    key={rec}
                    type="button"
                    className={styles.suggestionChip}
                    onClick={() => handleApplySearch(rec)}
                  >
                    {rec}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.clearRecentBtn}
                  onClick={handleClearRecent}
                  aria-label="Clear recent searches"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        )}

        {/* Category Horizontal Chips */}
        <div className={styles.categoriesScroll} role="tablist" aria-label="Product categories">
          <Chip
            selected={selectedCategory === 'All'}
            onClick={() => handleCategoryChange('All')}
          >
            All
          </Chip>
          {categories.map((cat) => (
            <Chip
              key={cat}
              selected={selectedCategory === cat}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </Chip>
          ))}
        </div>

        {/* Results summary line */}
        <div className={styles.resultsSummary}>
          <span className={styles.countText}>
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
          </span>
          {activeFilterCount > 0 && (
            <button
              type="button"
              className={styles.clearAllLink}
              onClick={handleClearFilters}
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* ── Products Grid ─────────────────────────────────────────────── */}
      {filteredProducts.length > 0 ? (
        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="grid"
            />
          ))}
        </div>
      ) : (
        <EmptyState
          illustration="empty-crate-soldout"
          title="No products found"
          text="Try adjusting your search terms or clearing your selected filters."
          actionLabel="Clear all filters"
          onAction={handleClearFilters}
        />
      )}

      {/* ── Filter Sheet Overlay ──────────────────────────────────────── */}
      <BottomSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filter products"
        size="tall"
        footer={
          <div className={styles.sheetFooter}>
            <button
              type="button"
              className={styles.sheetReset}
              onClick={handleClearFilters}
            >
              Reset all
            </button>
            <button
              type="button"
              className={styles.sheetApply}
              onClick={() => setIsFilterSheetOpen(false)}
            >
              Show {filteredProducts.length} items
            </button>
          </div>
        }
      >
        <div className={styles.filterSheetContent}>
          {/* Availability Toggle */}
          <div className={styles.filterSection}>
            <h4 className={styles.filterTitle}>Availability</h4>
            <div className={styles.toggleRow}>
              <span>In stock items only</span>
              <Toggle
                checked={inStockOnly}
                onChange={setInStockOnly}
                label="In stock items only"
              />
            </div>
          </div>

          {/* Farmer Stall Filter */}
          <div className={styles.filterSection}>
            <h4 className={styles.filterTitle}>Farmer Stall</h4>
            <div className={styles.farmerPills}>
              <Chip
                selected={!selectedFarmerId}
                onClick={() => setSelectedFarmerId('')}
              >
                All farmers
              </Chip>
              {farmers.map((farmer) => (
                <Chip
                  key={farmer.id}
                  selected={selectedFarmerId === farmer.id}
                  onClick={() => setSelectedFarmerId(farmer.id)}
                >
                  {farmer.stallName}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

export default Products;
