import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '@/utils/format';
import styles from './OrderRow.module.css';

/**
 * Normalizes backend order status to display label strictly matching SRS vocabulary
 */
function toStatusLabel(status) {
  if (!status) return 'Placed';
  const s = String(status).toLowerCase();
  switch (s) {
    case 'placed':
      return 'Placed';
    case 'accepted':
      return 'Accepted';
    case 'ready':
      return 'Ready for pickup';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'declined':
      return 'Declined';
    default:
      return status;
  }
}

/**
 * Resolves semantic tone class for StatusDot
 */
function toStatusClass(statusLabel) {
  switch (statusLabel) {
    case 'Ready for pickup':
      return styles.statusReady;
    case 'Placed':
    case 'Accepted':
    case 'Completed':
      return styles.statusNeutral;
    case 'Cancelled':
    case 'Declined':
      return styles.statusFaint;
    default:
      return styles.statusNeutral;
  }
}

/**
 * Order row card for the Orders list (Active / Past).
 * Full-width white card with hairline, linking to /buyer/orders/:id.
 * Active rows show collection code inline in small tabular type.
 */
export function OrderRow({ order, className = '' }) {
  if (!order) return null;

  const statusLabel = toStatusLabel(order.status);
  const statusToneClass = toStatusClass(statusLabel);
  const isActive = ['placed', 'accepted', 'ready'].includes(String(order.status).toLowerCase());

  const farmerNames =
    order.farmer?.stallName ||
    order.farmerNames ||
    order.farmerGroups?.map((fg) => fg.stallName).join(', ') ||
    'Local Stall';

  const totalItemCount =
    order.itemCount != null
      ? order.itemCount
      : order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  const displayTotal = order.totalCents != null ? order.totalCents : order.total;
  const pickupSlotLabel = order.pickup?.label || order.pickupSlotLabel || order.pickupSlot || 'Pickup window';
  const orderNum = order.orderNumber || order.number || 'MK-ORDER';

  return (
    <article
      className={`${styles.card} ${className}`}
      aria-label={`Order ${orderNum}, ${statusLabel}, ${formatPrice(displayTotal)} to pay at the stall`}
    >
      <Link
        to={`/buyer/orders/${order.id}`}
        className={styles.stretchedLink}
        aria-label={`View order ${orderNum}`}
      />

      <div className={styles.topRow}>
        <div className={styles.statusGroup}>
          <span className={`${styles.dot} ${statusToneClass}`} aria-hidden="true" />
          <span className={`${styles.statusLabel} ${statusToneClass}`}>{statusLabel}</span>
        </div>
        <span className={styles.orderNumber}>{orderNum}</span>
      </div>

      <div className={styles.middleRow}>
        <span className={styles.farmerAndSlot}>
          {farmerNames} · {pickupSlotLabel}
        </span>
      </div>

      <div className={styles.bottomRow}>
        <span className={styles.itemsAndPay}>
          {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} · {formatPrice(displayTotal)} to pay at the stall
        </span>

        {isActive && order.pickupCode && (
          <span
            className={styles.inlineCode}
            aria-label={`Collection code ${order.pickupCode.split('').join(' ')}`}
          >
            {order.pickupCode}
          </span>
        )}
      </div>
    </article>
  );
}

export default OrderRow;
