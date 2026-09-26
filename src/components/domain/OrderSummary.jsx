import React from 'react';
import { formatPrice } from '@/utils/format';
import styles from './OrderSummary.module.css';

/**
 * Order summary block: item lines, hairline divider, "Pay at the stall" total, and cash notice.
 * Strictly adheres to MarketLink scope rules: cash in person at the stall.
 *
 * @param {Array}   items       [{ name, quantity, unitPriceCents, lineTotalCents, priceCents }]
 * @param {number}  totalCents  total in cents
 * @param {boolean} showNotice  whether to show "Nothing is charged now..." box
 * @param {boolean} isStale     dim total while re-quoting
 * @param {string}  [className]
 */
export function OrderSummary({
  items = [],
  totalCents = 0,
  showNotice = true,
  isStale = false,
  className = '',
}) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className={`${styles.summary} ${className}`}>
      {/* Item lines */}
      <div className={styles.linesList}>
        {safeItems.map((item, idx) => {
          const qty = item.quantity || 1;
          const lineTotal = item.lineTotalCents != null
            ? item.lineTotalCents
            : (item.priceCents || item.unitPriceCents || 0) * qty;

          return (
            <div key={item.productId || item.id || idx} className={styles.lineRow}>
              <span className={styles.lineName}>
                {item.name} <span className={styles.multiplier}>× {qty}</span>
              </span>
              <span className={styles.linePrice}>
                {formatPrice(lineTotal)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total section */}
      <div className={styles.totalSection}>
        <div className={styles.totalHeaderRow}>
          <div className={styles.totalLabelCol}>
            <span className={styles.totalLabel}>Pay at the stall</span>
            <span className={styles.totalContext}>Cash, in person, when you collect.</span>
          </div>
          <span
            className={styles.totalAmount}
            data-stale={isStale}
          >
            {formatPrice(totalCents)}
          </span>
        </div>
      </div>

      {/* Plain notice box */}
      {showNotice && (
        <div className={styles.noticeBox} role="note">
          <p className={styles.noticeText}>
            Nothing is charged now. Bring cash to the stall.
          </p>
        </div>
      )}
    </div>
  );
}

export default OrderSummary;
