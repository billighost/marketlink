import React from 'react';
import styles from './PickupWindows.module.css';

/**
 * Pickup window chips plus the cutoff sentence. Used on the Stall page and at checkout/basket.
 *
 * @param {Array}    windows      [{ id, label, startsAt, endsAt, available, remaining }]
 * @param {string}   cutoffLabel  e.g. "Reserve by Friday 18:00"
 * @param {string}   selectedId   currently selected window id (e.g. slot start ISO)
 * @param {Function} onSelect     omit for a read-only display: (windowId) => void
 * @param {boolean}  disabled     disable all interactions (e.g. past cutoff)
 * @param {string}   className
 */
export function PickupWindows({
  windows = [],
  cutoffLabel,
  selectedId,
  onSelect,
  disabled = false,
  className = '',
}) {
  const safeWindows = Array.isArray(windows) ? windows : [];

  if (safeWindows.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        {cutoffLabel && <p className={styles.cutoff}>{cutoffLabel}</p>}
        <p className={styles.empty}>No pickup windows open yet for this stall.</p>
      </div>
    );
  }

  const isInteractive = typeof onSelect === 'function' && !disabled;

  return (
    <div className={`${styles.container} ${disabled ? styles.disabledGroup : ''} ${className}`}>
      {cutoffLabel && <p className={styles.cutoff}>{cutoffLabel}</p>}

      <div
        className={styles.chipRow}
        role={isInteractive ? 'radiogroup' : 'group'}
        aria-label="Pickup windows"
      >
        {safeWindows.map((win) => {
          const id = win.id || win.startsAt;
          const isSelected = selectedId === id || selectedId === win.startsAt;
          const isAvail = win.available !== false && (win.remaining == null || win.remaining > 0);
          const rawLabel = win.label || (win.startsAt ? `${win.startsAt}` : 'Pickup slot');
          const chipLabel = !isAvail && !rawLabel.includes('full') ? `${rawLabel} · full` : rawLabel;

          if (!isInteractive) {
            return (
              <span
                key={id}
                className={[
                  styles.chip,
                  styles.readOnly,
                  isSelected ? styles.selected : '',
                  !isAvail ? styles.unavailable : '',
                ].filter(Boolean).join(' ')}
              >
                {chipLabel}
              </span>
            );
          }

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled || !isAvail}
              aria-disabled={disabled || !isAvail}
              onClick={() => {
                if (isAvail && onSelect) onSelect(id);
              }}
              className={[
                styles.chip,
                styles.button,
                isSelected ? styles.selected : '',
                !isAvail ? styles.unavailable : '',
              ].filter(Boolean).join(' ')}
            >
              {chipLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PickupWindows;
