import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import { useCart } from '@/context/CartContext';
import StatusDot from '@/components/ui/StatusDot';
import Illustration from '@/components/domain/Illustration';
import styles from './OrderRow.module.css';

/**
 * Normalizes backend order status to display label
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
    case 'declined':
      return 'Cancelled';
    default:
      return status;
  }
}

/**
 * Order row card for the Orders list (Active / Past).
 * Minimal design system specifications:
 *  - Order number, Farmer name, pickup time, status dot, total
 *  - Product thumbnails hidden below 480px
 *  - 44px touch targets with no overlapping interactive elements
 */
export function OrderRow({
  order,
  onReorder,
  className = '',
}) {
  const location = useLocation();
  const { add } = useCart();

  if (!order) return null;

  const orderSheetPath = `/buyer/orders/${order.id}`;
  const linkState = { background: location.state?.background || location };

  const statusLabel = toStatusLabel(order.status);
  const isPast = statusLabel === 'Completed' || statusLabel === 'Cancelled';
  
  const farmerNames =
    order.farmerNames ||
    order.farmer?.stallName ||
    order.farmerGroups?.map((fg) => fg.stallName).join(', ') ||
    'Local Farmer';

  const totalItemCount =
    order.itemCount != null
      ? order.itemCount
      : order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  const displayTotal = order.totalCents != null ? order.totalCents : order.total;
  const pickupSlotLabel = order.pickup?.label || order.pickupSlotLabel || order.pickupSlot || 'Pickup window';
  const previewItems = order.itemsPreview || order.items || [];

  const handleBuyAgain = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (order.items) {
      order.items.forEach((item) => {
        for (let i = 0; i < (item.quantity || 1); i++) {
          add(item.productId || item.id);
        }
      });
    }

    onReorder?.(order);
  };

  return (
    <article
      className={`${styles.card} ${className}`}
      aria-label={`Order ${order.orderNumber || order.number}, ${statusLabel}, ${formatPrice(displayTotal)}`}
    >
      <Link
        to={orderSheetPath}
        state={linkState}
        className={styles.stretchedLink}
        tabIndex={0}
        aria-label={`View order ${order.orderNumber || order.number}`}
      />

      <div className={styles.header}>
        <div className={styles.numberStatus}>
          <span className={styles.orderNumber}>{order.orderNumber || order.number}</span>
          <StatusDot label={statusLabel} />
        </div>
        <span className={styles.total}>{formatPrice(displayTotal)}</span>
      </div>

      <div className={styles.farmers}>
        <span className={styles.farmerNames}>{farmerNames}</span>
      </div>

      <div className={styles.slotRow}>
        <span className={styles.slot}>{pickupSlotLabel}</span>
        <span className={styles.dot} aria-hidden="true">·</span>
        <span className={styles.count}>{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</span>
      </div>

      {/* Bottom row: product thumbnails (>=480px) and Buy again button */}
      <div className={styles.bottomRow}>
        <div className={styles.productTiles} aria-hidden="true">
          {previewItems.slice(0, 4).map((item, idx) => {
            const art = item.art || item.productArt || 'basket';
            return (
              <div key={idx} className={styles.tile}>
                <Illustration name={art} size="sm" />
              </div>
            );
          })}
          {previewItems.length > 4 && (
            <div className={styles.moreTile}>
              +{previewItems.length - 4}
            </div>
          )}
        </div>

        {isPast && (
          <button
            type="button"
            className={styles.buyAgainButton}
            onClick={handleBuyAgain}
            aria-label={`Buy items from order ${order.orderNumber || order.number} again`}
          >
            <RotateCcw size={16} aria-hidden="true" />
            <span>Buy again</span>
          </button>
        )}
      </div>
    </article>
  );
}

export default OrderRow;
