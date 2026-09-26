import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrderDetail } from '@/api/orders';
import { formatPrice } from '@/utils/format';
import Page from '@/components/layout/Page';
import Scene from '@/components/domain/Scene/Scene';
import PickupCode from '@/components/domain/PickupCode';
import Button from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './OrderConfirmed.module.css';

/**
 * Order confirmation page (/buyer/orders/:id/confirmed).
 * Displays collection code, collection instructions, and order total.
 */
export function OrderConfirmed() {
  const { id } = useParams();
  const navigate = useNavigate();
  useDocumentTitle('Reserved · MarketLink');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) {
      navigate('/buyer/orders', { replace: true });
      return;
    }

    let active = true;
    getOrderDetail(id)
      .then((data) => {
        if (active) {
          setOrder(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          navigate('/buyer/orders', { replace: true });
        }
      });

    return () => {
      active = false;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <Page width="detail" className={styles.page}>
        <div className={styles.loadingBox}>
          <div className={styles.skeletonLine} />
        </div>
      </Page>
    );
  }

  if (!order) return null;

  const totalCents = order.totalCents != null ? order.totalCents : order.total;
  const farmerName = order.farmer?.stallName || order.farmerNames || 'Market Stall';
  const pickupLabel = order.pickup?.label || order.pickupSlotLabel || 'Market pickup';
  const orderNumber = order.orderNumber || order.number || 'MK-ORDER';

  return (
    <Page width="detail" className={styles.page}>
      <div className={styles.container}>
        {/* Decorative Scene */}
        <div className={styles.sceneWrap} aria-hidden="true">
          <Scene name="no-orders-yet" size="md" />
        </div>

        {/* Heading & Subtitle */}
        <div className={styles.header}>
          <h1 className={styles.title}>Reserved</h1>
          <p className={styles.subtitle}>
            Collect {pickupLabel} at {farmerName}.
          </p>
        </div>

        {/* Physical Handoff Artifact: Collection Code */}
        {order.pickupCode && (
          <div className={styles.codeWrap}>
            <PickupCode code={order.pickupCode} size="lg" />
          </div>
        )}

        {/* Order Identifier & Total to pay at the stall */}
        <p className={styles.orderMeta}>
          Order {orderNumber} · {formatPrice(totalCents)} to pay at the stall
        </p>

        {/* Actions: View order is the ONE beet element */}
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            to={`/buyer/orders/${order.id}`}
            className={styles.viewOrderBtn}
          >
            View order
          </Button>

          <Link to="/buyer" className={styles.backLink}>
            Back to today
          </Link>
        </div>
      </div>
    </Page>
  );
}

export default OrderConfirmed;
