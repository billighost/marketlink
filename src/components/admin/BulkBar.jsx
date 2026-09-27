import React from 'react';
import styles from './BulkBar.module.css';

/**
 * Bulk action bar. Appears when selected items exist. Sticky to the bottom of the content area.
 * Announced with role="status" so screen readers hear the selection change.
 *
 * @param {Array|number} selected  selected ids array or count
 * @param {Function}     onClear   callback to clear selection
 * @param {React.ReactNode} children  bulk action buttons
 */
export function BulkBar({ selected = 0, onClear, children }) {
  const count = Array.isArray(selected) ? selected.length : Number(selected) || 0;

  if (count <= 0) return null;

  return (
    <aside
      className={styles.container}
      role="status"
      aria-live="polite"
      aria-label="Bulk actions"
    >
      <div className={styles.leftGroup}>
        <span className={styles.selectedText}>
          {count} {count === 1 ? 'item' : 'items'} selected
        </span>
        {onClear && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
            aria-label="Clear selection"
          >
            Clear
          </button>
        )}
      </div>
      {children && <div className={styles.actionsGroup}>{children}</div>}
    </aside>
  );
}

export default BulkBar;
