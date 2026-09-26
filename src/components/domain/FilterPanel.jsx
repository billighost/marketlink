import React from 'react';
import Toggle from '@/components/ui/Toggle';
import styles from './FilterPanel.module.css';

const SORT_OPTIONS = [
  { label: 'Featured', val: 'featured' },
  { label: 'Price low to high', val: 'price_asc' },
  { label: 'Price high to low', val: 'price_desc' },
  { label: 'Newest', val: 'newest' },
  { label: 'Most popular', val: 'popular' },
];

const DAY_OPTIONS = [
  { label: 'Any', val: '' },
  { label: 'Sun', val: 'sun' },
  { label: 'Mon', val: 'mon' },
  { label: 'Tue', val: 'tue' },
  { label: 'Wed', val: 'wed' },
  { label: 'Thu', val: 'thu' },
  { label: 'Fri', val: 'fri' },
  { label: 'Sat', val: 'sat' },
];

const PRICE_OPTIONS = [
  { label: 'Any', id: 'any', minPrice: undefined, maxPrice: undefined, maxCents: null },
  { label: 'Under £2', id: 'under-2', minPrice: undefined, maxPrice: 200, maxCents: 200 },
  { label: '£2–£5', id: '2-5', minPrice: 200, maxPrice: 500, maxCents: 500 },
  { label: '£5–£10', id: '5-10', minPrice: 500, maxPrice: 1000, maxCents: 1000 },
  { label: 'Over £10', id: 'over-10', minPrice: 1000, maxPrice: undefined, maxCents: 1001 },
];

/**
 * The complete produce filter UI. Container-agnostic: rendered inside a BottomSheet
 * below 1024px and inside a persistent <aside> rail at 1024px and up.
 *
 * All state is owned by the parent page so the URL stays the single source of truth.
 *
 * @param {object}   value       { inStockOnly, sort, category, marketId, day, maxPriceCents, priceRange }
 * @param {Function} onChange    (patch) => void — merges into value
 * @param {Function} onReset     () => void
 * @param {Array}    categories  Categories list
 * @param {Array}    markets     Markets list
 * @param {'sheet'|'rail'} layout Container variant
 * @param {number}   resultCount Total items count for sheet button
 * @param {Function} onClose     Called when sheet Apply button is pressed
 */
export function FilterPanel({
  value = {},
  onChange,
  onReset,
  categories = [],
  markets = [],
  layout = 'rail',
  resultCount = 0,
  onClose,
}) {
  const currentCategory = value.category || 'All';
  const currentSort = value.sort || 'featured';
  const currentMarket = value.marketId || '';
  const currentDay = value.day || '';
  const currentPriceRange =
    value.priceRange ||
    (value.maxPriceCents === 200
      ? 'under-2'
      : value.maxPriceCents === 500
      ? '2-5'
      : value.maxPriceCents === 1000
      ? '5-10'
      : value.maxPriceCents === 1001 || (value.minPriceCents && value.minPriceCents >= 1000)
      ? 'over-10'
      : 'any');

  const isAnyFilterActive = Boolean(
    value.inStockOnly ||
    (currentSort && currentSort !== 'featured') ||
    (currentCategory && currentCategory !== 'All') ||
    currentMarket ||
    currentDay ||
    (currentPriceRange && currentPriceRange !== 'any') ||
    value.maxPriceCents
  );

  return (
    <div className={`${styles.container} ${layout === 'rail' ? styles.rail : styles.sheet}`}>
      {/* 1. Availability */}
      <section className={styles.group}>
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>In stock only</span>
          <Toggle
            checked={Boolean(value.inStockOnly)}
            onChange={(checked) => onChange({ inStockOnly: checked })}
            label="In stock only"
          />
        </div>
      </section>

      {/* 2. Sort */}
      <section className={styles.group}>
        <h4 className={styles.groupTitle}>Sort</h4>
        <div className={styles.chipGrid} role="radiogroup" aria-label="Sort options">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = currentSort === opt.val;
            return (
              <button
                key={opt.val}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.filterChip} ${isSelected ? styles.filterChipActive : ''}`}
                onClick={() => onChange({ sort: opt.val })}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Category */}
      <section className={styles.group}>
        <h4 className={styles.groupTitle}>Category</h4>
        <div className={styles.chipGrid} role="radiogroup" aria-label="Category options">
          <button
            type="button"
            role="radio"
            aria-checked={currentCategory === 'All'}
            className={`${styles.filterChip} ${currentCategory === 'All' ? styles.filterChipActive : ''}`}
            onClick={() => onChange({ category: 'All' })}
          >
            All
          </button>
          {categories.map((cat) => {
            const catName = typeof cat === 'string' ? cat : cat.name;
            const isSelected = currentCategory.toLowerCase() === catName.toLowerCase();
            return (
              <button
                key={cat.id || cat.slug || catName}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.filterChip} ${isSelected ? styles.filterChipActive : ''}`}
                onClick={() => onChange({ category: catName })}
              >
                {catName}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Market */}
      {markets.length > 0 && (
        <section className={styles.group}>
          <h4 className={styles.groupTitle}>Market</h4>
          <div className={styles.chipGrid} role="radiogroup" aria-label="Market options">
            <button
              type="button"
              role="radio"
              aria-checked={!currentMarket}
              className={`${styles.filterChip} ${!currentMarket ? styles.filterChipActive : ''}`}
              onClick={() => onChange({ marketId: '' })}
            >
              All markets
            </button>
            {markets.map((m) => {
              const isSelected = currentMarket === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.filterChip} ${isSelected ? styles.filterChipActive : ''}`}
                  onClick={() => onChange({ marketId: m.id })}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Market day */}
      <section className={styles.group}>
        <h4 className={styles.groupTitle}>Market day</h4>
        <div className={styles.chipGrid} role="radiogroup" aria-label="Market day options">
          {DAY_OPTIONS.map((d) => {
            const isSelected = currentDay === d.val;
            return (
              <button
                key={d.label}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.filterChip} ${isSelected ? styles.filterChipActive : ''}`}
                onClick={() => onChange({ day: d.val })}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Price */}
      <section className={styles.group}>
        <h4 className={styles.groupTitle}>Price</h4>
        <div className={styles.chipGrid} role="radiogroup" aria-label="Price range options">
          {PRICE_OPTIONS.map((p) => {
            const isSelected = currentPriceRange === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`${styles.filterChip} ${isSelected ? styles.filterChipActive : ''}`}
                onClick={() =>
                  onChange({
                    priceRange: p.id,
                    maxPriceCents: p.maxCents,
                    minPriceCents: p.minPrice,
                  })
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Rail reset link */}
      {layout === 'rail' && isAnyFilterActive && (
        <div className={styles.railResetRow}>
          <button type="button" className={styles.resetButton} onClick={onReset}>
            Reset filters
          </button>
        </div>
      )}

      {/* Sheet sticky footer button */}
      {layout === 'sheet' && (
        <div className={styles.sheetFooter}>
          <button
            type="button"
            className={styles.sheetApplyButton}
            onClick={onClose}
            aria-label={`Apply filters and show ${resultCount} items`}
          >
            {`Show ${resultCount} ${resultCount === 1 ? 'item' : 'items'}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default FilterPanel;
