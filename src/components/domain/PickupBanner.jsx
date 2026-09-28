import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatusDot from '@/components/ui/StatusDot';
import styles from './PickupBanner.module.css';

export function PickupBanner({ order }) {
  if (!order) return null;

  const isReady = order.status === 'ready';
  const statusLabel = isReady ? 'Ready for pickup' : (order.statusLabel || 'Order placed');
  const description = isReady
    ? `Packed and waiting at ${order.farmer?.stallName || order.stallName || 'the stall'}.`
    : `Scheduled pickup: ${order.pickup?.label || order.pickupWindowLabel || 'next market window'}.`;

  return (
    <section className={styles.banner} aria-label="Active order notification">
      <div className={styles.content}>
        <div className={styles.statusRow}>
          <StatusDot label={statusLabel} tone={isReady ? 'success' : 'neutral'} />
          {order.orderNumber && (
            <span className={styles.orderNumber}>{order.orderNumber}</span>
          )}
        </div>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.actions}>
        <Link
          to="/buyer/route"
          className={styles.viewLink}
          aria-label="View market pickup route"
        >
          <span>Market Route</span>
        </Link>
        <Link
          to={`/buyer/orders/${order.id}`}
          className={styles.viewLink}
          aria-label={`View order ${order.orderNumber || ''} details`}
        >
          <span>View order</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export default PickupBanner;
