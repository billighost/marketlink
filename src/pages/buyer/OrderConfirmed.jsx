import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import Button from '@/components/ui/Button';
import Page from '@/components/layout/Page';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './OrderConfirmed.module.css';

/**
 * Order confirmation page shown after placing a pre-order.
 */
export function OrderConfirmed({
  orderNumber = 'ML-1045',
  total = 21.50,
  pickupSlot = 'Sat 8 – 10 am',
  marketName = 'Elm Street Market',
  farmerNames = 'Riverbend Farm & Oak & Mill Bakery',
}) {
  const navigate = useNavigate();
  useDocumentTitle('Pre-order confirmed · MarketLink');

  const handleViewOrders = () => {
    navigate('/buyer/orders', { replace: true });
  };

  const handleKeepBrowsing = () => {
    navigate('/buyer', { replace: true });
  };

  return (
    <Page width="detail">
      <div className={styles.container}>
        {/* Animated Checkmark Icon */}
        <div className={styles.iconCircle}>
          <Check size={36} strokeWidth={2.5} className={styles.checkIcon} aria-hidden="true" />
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Pre-order placed.</h1>
          <p className={styles.orderNumber}>Order {orderNumber}</p>
        </div>

        {/* Pickup Summary Card */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <Calendar size={18} className={styles.metaIcon} aria-hidden="true" />
            <div className={styles.metaText}>
              <span className={styles.metaLabel}>Pickup window</span>
              <span className={styles.metaValue}>{pickupSlot}</span>
            </div>
          </div>

          <div className={styles.summaryRow}>
            <MapPin size={18} className={styles.metaIcon} aria-hidden="true" />
            <div className={styles.metaText}>
              <span className={styles.metaLabel}>{marketName}</span>
              <span className={styles.metaValue}>{farmerNames}</span>
            </div>
          </div>
        </div>

        {/* Helpful Guidance */}
        <p className={styles.guidance}>
          We've notified the farmers to harvest and pack your items. Remember, you pay{' '}
          <strong>{formatPrice(total)}</strong> directly at the stalls on Saturday.
        </p>

        {/* Actions */}
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            className={styles.primaryButton}
            onClick={handleViewOrders}
          >
            <span>View your orders</span>
            <ArrowRight size={18} aria-hidden="true" />
          </Button>

          <button
            type="button"
            className={styles.secondaryLink}
            onClick={handleKeepBrowsing}
          >
            Keep browsing the market
          </button>
        </div>
      </div>
    </Page>
  );
}

export default OrderConfirmed;
