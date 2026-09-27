import React, { useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import styles from './DataTable.module.css';

/**
 * Admin data table. Responsive: a real <table> at 768px and up, stacked cards below.
 *
 * @param {Array}  columns   [{ key, header, width, align, render?, sortable?, hideBelow? }]
 * @param {Array}  rows      data; each needs a stable `id`
 * @param {string} rowKey    defaults to 'id'
 * @param {boolean} loading  renders a skeleton matching the column layout
 * @param {React.ReactNode} empty  what to show when rows is empty
 * @param {object} sort      { key, direction } — controlled
 * @param {Function} onSort  (key) => void
 * @param {Array}  selected  ids, when selection is enabled
 * @param {Function} onSelect  (ids) => void; omit to disable selection
 * @param {Function} onRowClick  optional; makes rows activatable
 */
export function DataTable({
  columns = [],
  rows = [],
  rowKey = 'id',
  loading = false,
  empty = 'No data available',
  sort = null,
  onSort,
  selected = [],
  onSelect,
  onRowClick,
  footer = null,
}) {
  const headerCheckboxRef = useRef(null);
  const isSelectable = typeof onSelect === 'function';
  const hasRows = rows && rows.length > 0;
  const selectedCount = selected ? selected.length : 0;
  const allSelected = hasRows && selectedCount === rows.length;
  const someSelected = hasRows && selectedCount > 0 && selectedCount < rows.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const handleSelectAll = (e) => {
    if (!onSelect) return;
    if (e.target.checked) {
      onSelect(rows.map((r) => r[rowKey]));
    } else {
      onSelect([]);
    }
  };

  const handleSelectRow = (e, id) => {
    e.stopPropagation();
    if (!onSelect) return;
    if (selected.includes(id)) {
      onSelect(selected.filter((item) => item !== id));
    } else {
      onSelect([...selected, id]);
    }
  };

  const getAriaSort = (col) => {
    if (!col.sortable) return undefined;
    if (sort?.key === col.key) {
      if (sort.direction === 'asc' || sort.direction === 'ascending') return 'ascending';
      if (sort.direction === 'desc' || sort.direction === 'descending') return 'descending';
    }
    return 'none';
  };

  return (
    <div className={styles.container}>
      {/* ── Desktop & Tablet: Real <table> (>= 768px) ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              {isSelectable && (
                <th scope="col" className={`${styles.th} ${styles.thCheckbox}`}>
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                    className={styles.checkboxInput}
                    disabled={loading || !hasRows}
                  />
                </th>
              )}
              {columns.map((col) => {
                const ariaSort = getAriaSort(col);
                const isSorted = sort?.key === col.key;
                const isAsc = isSorted && (sort.direction === 'asc' || sort.direction === 'ascending');
                const isDesc = isSorted && (sort.direction === 'desc' || sort.direction === 'descending');
                const alignClass =
                  col.align === 'right'
                    ? styles.thRight
                    : col.align === 'center'
                    ? styles.thCenter
                    : '';

                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`${styles.th} ${alignClass}`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={() => onSort?.(col.key)}
                        aria-label={`Sort by ${col.header}`}
                      >
                        <span>{col.header}</span>
                        {isAsc ? (
                          <ArrowUp size={14} className={styles.sortIconActive} aria-hidden="true" />
                        ) : isDesc ? (
                          <ArrowDown size={14} className={styles.sortIconActive} aria-hidden="true" />
                        ) : (
                          <ArrowUpDown size={14} className={styles.sortIconInactive} aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-row-${rIdx}`} className={styles.tr}>
                  {isSelectable && (
                    <td className={`${styles.td} ${styles.tdCheckbox}`}>
                      <div className={styles.skeletonBar} style={{ width: '1rem' }} />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td
                      key={`skeleton-cell-${cIdx}`}
                      className={`${styles.td} ${
                        col.align === 'right'
                          ? styles.tdRight
                          : col.align === 'center'
                          ? styles.tdCenter
                          : ''
                      }`}
                    >
                      <div
                        className={styles.skeletonBar}
                        style={{ width: `${Math.max(40, 85 - cIdx * 15)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : !hasRows ? (
              <tr>
                <td
                  colSpan={columns.length + (isSelectable ? 1 : 0)}
                  className={styles.emptyState}
                >
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = row[rowKey];
                const isRowSelected = selected.includes(id);

                return (
                  <tr
                    key={id}
                    className={`${styles.tr} ${isRowSelected ? styles.trSelected : ''} ${
                      onRowClick ? styles.trClickable : ''
                    }`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {isSelectable && (
                      <td
                        className={`${styles.td} ${styles.tdCheckbox}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={(e) => handleSelectRow(e, id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select row ${row.name || row.stallName || id}`}
                          className={styles.checkboxInput}
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'right'
                          ? styles.tdRight
                          : col.align === 'center'
                          ? styles.tdCenter
                          : '';

                      return (
                        <td key={col.key} className={`${styles.td} ${alignClass}`}>
                          {col.render
                            ? (col.render.length === 1 && typeof row[col.key] === 'undefined'
                                ? col.render(row)
                                : col.render(row[col.key], row))
                            : row[col.key]}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
          {footer && !loading && hasRows && (
            <tfoot className={styles.tfoot}>
              <tr className={styles.trFooter}>
                {isSelectable && <td className={`${styles.td} ${styles.tdCheckbox}`} />}
                {columns.map((col) => {
                  const alignClass =
                    col.align === 'right'
                      ? styles.tdRight
                      : col.align === 'center'
                      ? styles.tdCenter
                      : '';
                  return (
                    <td key={`foot-${col.key}`} className={`${styles.td} ${styles.tdFooter} ${alignClass}`}>
                      {typeof footer[col.key] !== 'undefined' ? footer[col.key] : ''}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Mobile: Stacked Cards (< 768px) ── */}
      <div className={styles.cardsWrapper}>
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={`skeleton-card-${idx}`} className={styles.card}>
              <div className={styles.skeletonBar} style={{ width: '40%', height: '1.25rem' }} />
              <div className={styles.skeletonBar} style={{ width: '70%' }} />
              <div className={styles.skeletonBar} style={{ width: '55%' }} />
            </div>
          ))
        ) : !hasRows ? (
          <div className={styles.emptyState}>{empty}</div>
        ) : (
          <>
            {rows.map((row) => {
              const id = row[rowKey];
              const isRowSelected = selected.includes(id);

              // Columns not hidden below 768px
              const visibleCols = columns.filter(
                (c) => !(c.hideBelow && Number(c.hideBelow) >= 768)
              );

              return (
                <div
                  key={`card-${id}`}
                  className={`${styles.card} ${isRowSelected ? styles.cardSelected : ''}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {isSelectable && (
                    <div className={styles.cardHeader}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--weight-medium)',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={(e) => handleSelectRow(e, id)}
                          aria-label={`Select row ${row.name || row.stallName || id}`}
                          className={styles.checkboxInput}
                        />
                        <span>Select</span>
                      </label>
                    </div>
                  )}
                  {visibleCols.map((col) => (
                    <div key={`card-cell-${col.key}`} className={styles.cardRow}>
                      <span className={styles.cardLabel}>{col.header}</span>
                      <span className={styles.cardValue}>
                        {col.render
                          ? (col.render.length === 1 && typeof row[col.key] === 'undefined'
                              ? col.render(row)
                              : col.render(row[col.key], row))
                          : row[col.key]}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
            {footer && (
              <div className={`${styles.card} ${styles.cardFooter}`}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardFooterTitle}>Total Summary</span>
                </div>
                {columns
                  .filter((c) => !(c.hideBelow && Number(c.hideBelow) >= 768))
                  .map((col) => {
                    if (typeof footer[col.key] === 'undefined' || footer[col.key] === '') return null;
                    return (
                      <div key={`card-foot-${col.key}`} className={styles.cardRow}>
                        <span className={styles.cardLabel}>{col.header}</span>
                        <span className={`${styles.cardValue} ${styles.cardFooterValue}`}>
                          {footer[col.key]}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DataTable;
