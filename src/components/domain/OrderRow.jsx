import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import { getProduct } from '@/data/placeholders';
import { useCart } from '@/context/CartContext';
import StatusDot from '@/components/ui/StatusDot';
import Illustration from '@/components/domain/Illustration';
import styles from './OrderRow.module.css';

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

  const isPast = order.status === 'Completed' || order.status === 'Cancelled';
  const farmerNames = order.farmerGroups?.map((fg) => fg.stallName).join(', ') || 'Local Farmer';
  const totalItemCount = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  const handleBuyAgain = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (order.items) {
      order.items.forEach((item) => {
        for (let i = 0; i < (item.quantity || 1); i++) {
          add(item.productId);
        }
      });
    }

    onReorder?.(order);
  };

  return (
    <article
      className={`${styles.card} ${className}`}
      aria-label={`Order ${order.number}, ${order.status}, ${formatPrice(order.total)}`}
    >
      <Link
        to={orderSheetPath}
        state={linkState}
        className={styles.stretchedLink}
        tabIndex={0}
        aria-label={`View order ${order.number}`}
      />

      <div className={styles.header}>
        <div className={styles.numberStatus}>
          <span className={styles.orderNumber}>{order.number}</span>
          <StatusDot label={order.status} />
        </div>
        <span className={styles.total}>{formatPrice(order.total)}</span>
      </div>

      <div className={styles.farmers}>
        <span className={styles.farmerNames}>{farmerNames}</span>
      </div>

      <div className={styles.slotRow}>
        <span className={styles.slot}>{order.pickupSlot}</span>
        <span className={styles.dot} aria-hidden="true">·</span>
        <span className={styles.count}>{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</span>
      </div>

      {/* Bottom row: product thumbnails (>=480px) and Buy again button */}
      <div className={styles.bottomRow}>
        <div className={styles.productTiles} aria-hidden="true">
          {order.items?.slice(0, 4).map((item, idx) => {
            const product = getProduct(item.productId);
            return (
              <div key={idx} className={styles.tile}>
                <Illustration name={product?.art || 'basket'} size="sm" />
              </div>
            );
          })}
          {order.items?.length > 4 && (
            <div className={styles.moreTile}>
              +{order.items.length - 4}
            </div>
          )}
        </div>

        {isPast && (
          <button
            type="button"
            className={styles.buyAgainButton}
            onClick={handleBuyAgain}
            aria-label={`Buy items from order ${order.number} again`}
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
