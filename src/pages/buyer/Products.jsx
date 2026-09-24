import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { products, categories, farmers } from '@/data/placeholders';
import ProductCard from '@/components/domain/ProductCard';
import Chip from '@/components/ui/Chip';
import EmptyState from '@/components/ui/EmptyState';
import BottomSheet from '@/components/ui/BottomSheet';
import Toggle from '@/components/ui/Toggle';
import Button from '@/components/ui/Button';
import styles from './Products.module.css';

/**
 * Customer Browse / Products directory page.
 * Minimal UI specifications:
 *  - Sticky search field with "Filters" text button (stacked on <480px, inline on >=480px)
 *  - Exactly one category chip row (max 7 chips, trailing "More" chip)
 *  - Results grid: 2 columns on phones, 3 on tablets and desktop
 *  - Filter sheet with wrapping chips and single primary action
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

  // Sync state with URL search params
  useEffect(() => {
    if (querySearch !== search) setSearch(querySearch);
    if (queryCategory !== selectedCategory) setSelectedCategory(queryCategory);
    if (queryFarmer !== selectedFarmerId) setSelectedFarmerId(queryFarmer);
    if (queryStock === 'in' && !inStockOnly) setInStockOnly(true);
  }, [querySearch, queryCategory, queryFarmer, queryStock]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesCategory = product.category.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory) return false;
      }

      if (selectedCategory !== 'All' && product.category !== selectedCategory) {
        return false;
      }

      if (inStockOnly && product.stock === 'out') {
        return false;
      }

      if (selectedFarmerId && product.farmerId !== selectedFarmerId) {
        return false;
      }

      if (queryStock === 'low' && product.stock !== 'low') {
        return false;
      }

      if (queryFilter === 'featured' && !product.tags?.includes('bestseller')) {
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
  }, [search, selectedCategory, inStockOnly, selectedFarmerId, queryFilter, queryStock]);

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

  // Maximum 7 chips visible in row: 'All' + first 5 categories + 'More'
  const visibleCategories = categories.slice(0, 5);

  return (
    <div className={styles.page}>
      {/* ── Sticky Search & Filter Header ───────────────────────────── */}
      <div className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search all market products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              key={cat}
              selected={selectedCategory === cat}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </Chip>
          ))}
          <Chip
            selected={categories.slice(5).includes(selectedCategory)}
            onClick={() => setIsFilterSheetOpen(true)}
          >
            More
          </Chip>
        </div>

        {/* Results summary line */}
        <div className={styles.resultsSummary}>
          <span className={styles.countText}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
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
      </div>

      {/* ── Filter Sheet Overlay ──────────────────────────────────────── */}
      <BottomSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
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
            <Button
              variant="primary"
              size="md"
              className={styles.sheetApply}
              onClick={() => setIsFilterSheetOpen(false)}
            >
              Show {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
            </Button>
          </div>
        }
      >
        <div className={styles.filterSheetContent}>
          <h1 className={styles.sheetTitle}>Filters</h1>

          {/* All Categories wrapping */}
          <div className={styles.filterSection}>
            <h2 className={styles.filterSectionTitle}>Category</h2>
            <div className={styles.chipWrapGroup}>
              <Chip
                selected={selectedCategory === 'All'}
                onClick={() => handleCategoryChange('All')}
              >
                All categories
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
          </div>

          {/* Availability Toggle */}
          <div className={styles.filterSection}>
            <h2 className={styles.filterSectionTitle}>Availability</h2>
            <div className={styles.toggleRow}>
              <span>In stock items only</span>
              <Toggle
                checked={inStockOnly}
                onChange={setInStockOnly}
                label="In stock items only"
              />
            </div>
          </div>

          {/* Farmer Stall Filter wrapping */}
          <div className={styles.filterSection}>
            <h2 className={styles.filterSectionTitle}>Farmer Stall</h2>
            <div className={styles.chipWrapGroup}>
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
