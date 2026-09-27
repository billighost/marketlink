import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import styles from './FilterBar.module.css';

/**
 * Search + filter row above a DataTable. All state is owned by the page and mirrored
 * into the URL, so a filtered admin view is linkable and survives a refresh.
 *
 * @param {string} search · @param {Function} onSearchChange   (debounced by the page, 250ms)
 * @param {Array}  filters  [{ key, label, options:[{value,label}], value }]
 * @param {Function} onFilterChange  (key, value) => void
 * @param {number} resultCount · @param {Function} onReset
 * @param {React.ReactNode} trailing  e.g. an export button
 */
export function FilterBar({
  search = '',
  onSearchChange,
  filters = [],
  onFilterChange,
  resultCount,
  onReset,
  trailing,
}) {
  const hasActiveFilters = Boolean(
    search || filters.some((f) => f.value && f.value !== '' && f.value !== 'all')
  );

  return (
    <div className={styles.container}>
      <div className={styles.leftControls}>
        {/* Search Input */}
        {onSearchChange && (
          <div className={styles.searchGroup}>
            <label htmlFor="admin-search-input" className={styles.searchLabel}>
              Search
            </label>
            <div className={styles.searchInputWrapper}>
              <Search size={16} className={styles.searchIcon} aria-hidden="true" />
              <input
                id="admin-search-input"
                type="search"
                className={styles.searchInput}
                placeholder="Search..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Filter Selects */}
        {filters.map((filter) => (
          <div key={filter.key} className={styles.filterGroup}>
            <label htmlFor={`filter-${filter.key}`} className={styles.filterLabel}>
              {filter.label}
            </label>
            <select
              id={`filter-${filter.key}`}
              className={styles.filterSelect}
              value={filter.value ?? ''}
              onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
            >
              {filter.options.map((opt) => (
                <option key={String(opt.value)} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className={styles.rightControls}>
        {/* Result Count */}
        {resultCount !== undefined && (
          <span className={styles.countText}>
            {resultCount === 1 ? '1 result' : `${resultCount.toLocaleString()} results`}
          </span>
        )}

        {/* Reset Button */}
        {onReset && hasActiveFilters && (
          <button
            type="button"
            className={styles.resetButton}
            onClick={onReset}
            aria-label="Reset all filters"
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>Reset</span>
          </button>
        )}

        {/* Trailing Slot (e.g. Export) */}
        {trailing && <div className={styles.trailingSlot}>{trailing}</div>}
      </div>
    </div>
  );
}

export default FilterBar;
