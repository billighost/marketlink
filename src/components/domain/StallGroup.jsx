import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/utils/format';
import QuantityStepper from '@/components/ui/QuantityStepper';
import Illustration from '@/components/domain/Illustration';
import PickupWindows from '@/components/domain/PickupWindows';
import styles from './StallGroup.module.css';

/**
 * Accurately pluralises produce units (e.g. 1 bunch -> 6 bunches, 1 box -> 2 boxes).
 */
function pluraliseUnit(count, unit) {
  if (!unit) return '';
  const clean = unit.trim().toLowerCase();
  if (count === 1) return clean;
  if (clean === 'leaf') return 'leaves';
  if (clean === 'loaf') return 'loaves';
  if (clean.endsWith('ch') || clean.endsWith('sh') || clean.endsWith('ss') || clean.endsWith('x')) {
    return `${clean}es`;
  }
  return `${clean}s`;
}

/**
 * One stall's basket panel: stall header, its items, its pickup windows, its subtotal.
 * Renders the per-stall cutoff because each stall has its own deadline.
 *
 * @param {object}   group            one entry from POST /cart/quote groups[]
 * @param {string}   selectedWindowId selected slot start/id
 * @param {Function} onSelectWindow   (windowId) => void
 * @param {Function} onChangeQty      (productId, qty) => void
 * @param {Function} onRemove         (productId, productName) => void
 * @param {boolean}  isStale          true while re-quoting
 */
export function StallGroup({
  group,
  selectedWindowId,
  onSelectWindow,
  onChangeQty,
  onRemove,
  isStale = false,
}) {
  if (!group) return null;

  const farmer = group.farmer || {};
  const farmerId = group.farmerId || farmer.id;
  const stallName = farmer.stallName || farmer.name || 'Local Stall';
  const marketName = farmer.marketName || 'Market';

  // Check if past cutoff
  const hasPastCutoffIssue = group.issues?.some((i) => i.code === 'PAST_CUTOFF');
  const cutoffTime = group.cutoffAt ? new Date(group.cutoffAt).getTime() : null;
  const isPastCutoff = hasPastCutoffIssue || (cutoffTime !== null && cutoffTime <= Date.now());

  let cutoffDisplay = group.cutoffLabel || 'Reserve in advance';
  if (isPastCutoff) {
    const rawDeadline = group.cutoffLabel
      ? group.cutoffLabel.replace(/^Reserve by\s+/i, '')
      : 'Passed';
    cutoffDisplay = `Cutoff passed · ${rawDeadline}`;
  }

  const lines = group.lines || [];

  return (
    <section
      id={`stall-${farmerId}`}
      className={`${styles.panel} ${isPastCutoff ? styles.pastCutoff : ''}`}
      aria-label={`${stallName} basket`}
    >
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.avatar} aria-hidden="true">
          {stallName
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase()}
        </div>
        <div className={styles.headerMeta}>
          <Link to={`/buyer/stalls/${farmerId}`} className={styles.stallTitle}>
            <h3 className={styles.stallHeading}>{stallName}</h3>
          </Link>
          <p className={styles.subline}>
            <span>{marketName}</span>
            <span className={styles.dot} aria-hidden="true">·</span>
            <span className={isPastCutoff ? styles.cutoffDanger : styles.cutoffText}>
              {cutoffDisplay}
            </span>
          </p>
        </div>
      </header>

      {/* Items list */}
      <div className={styles.itemsList}>
        {lines.map((line) => {
          const pid = line.productId;
          const unit = line.unit || 'item';
          const maxAvailable = typeof line.quantityAvailable === 'number' ? line.quantityAvailable : 20;
          const isAtCap = line.quantity >= maxAvailable && maxAvailable > 0;
          const isSoldOut = line.availability === 'out' || maxAvailable <= 0;

          // Inline issues from item or group
          const itemIssues = (line.issues || []).concat(
            (group.issues || []).filter((gi) => gi.productId === pid)
          );

          // Availability sentence
          let availabilitySentence = '';
          if (isSoldOut) {
            availabilitySentence = 'Sold out since you added it.';
          } else if (line.availability === 'low' || maxAvailable <= 5) {
            availabilitySentence = `${maxAvailable} ${pluraliseUnit(maxAvailable, unit)} left today`;
          } else {
            availabilitySentence = `${maxAvailable} available`;
          }

          return (
            <div key={pid} className={`${styles.itemRow} ${isSoldOut ? styles.itemSoldOut : ''}`}>
              <div className={styles.artTile} aria-hidden="true">
                <Illustration name={line.art || 'basket'} size="sm" />
              </div>

              <div className={styles.itemMain}>
                <div className={styles.itemTitleRow}>
                  <Link to={`/buyer/products/${pid}`} className={styles.productLink}>
                    <h4 className={styles.productName}>{line.name}</h4>
                  </Link>
                  <span className={styles.unitPrice}>
                    {formatPrice(line.unitPriceCents)} / {unit}
                  </span>
                </div>

                <div className={styles.stockNote}>
                  <span className={isSoldOut ? styles.stockNoteOut : styles.stockNoteIn}>
                    {availabilitySentence}
                  </span>
                </div>

                {itemIssues.length > 0 && (
                  <div className={styles.issuesBlock} role="alert">
                    {itemIssues.map((issue, idx) => (
                      <span key={idx} className={styles.issueText}>
                        {issue.message}
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.controlsRow}>
                  <div className={styles.stepperWrap}>
                    <QuantityStepper
                      value={line.quantity}
                      min={1}
                      max={Math.max(1, maxAvailable)}
                      onChange={(newQty) => onChangeQty?.(pid, newQty)}
                      productName={line.name}
                      compact
                    />
                    {isAtCap && !isSoldOut && (
                      <span className={styles.capWarning}>
                        Only {maxAvailable} available
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => onRemove?.(pid, line.name)}
                    aria-label={`Remove ${line.name} from basket`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pickup Windows */}
      <div className={styles.windowsSection}>
        <span className={styles.windowsLabel}>Collect from this stall</span>
        <PickupWindows
          windows={group.pickupWindows || []}
          selectedId={selectedWindowId}
          onSelect={onSelectWindow}
          disabled={isPastCutoff}
        />
      </div>

      {/* Stall Subtotal */}
      <footer className={styles.footer}>
        <span className={styles.subtotalLabel}>Stall subtotal</span>
        <span
          className={styles.subtotalAmount}
          data-stale={isStale}
        >
          {formatPrice(group.subtotalCents || 0)}
        </span>
      </footer>
    </section>
  );
}

export default StallGroup;
