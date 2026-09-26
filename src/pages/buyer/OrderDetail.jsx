import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrderDetail, cancelOrder, getReorderPreview } from '@/api/orders';
import { formatDate } from '@/utils/format';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import PickupCode from '@/components/domain/PickupCode';
import OrderTimeline from '@/components/domain/OrderTimeline';
import OrderSummary from '@/components/domain/OrderSummary';
import ReviewForm from '@/components/domain/ReviewForm';
import ConfirmStep from '@/components/ui/ConfirmStep';
import Button from '@/components/ui/Button';
import { MapView } from '@/components/domain/MapView';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './OrderDetail.module.css';

/**
 * Normalizes backend order status to SRS vocabulary
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
 * Order page (/buyer/orders/:id)
 * Shows collection code, status timeline, pickup point map, reserved produce, and actions.
 */
export function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);

  useDocumentTitle(`Order ${order?.orderNumber || ''} · MarketLink`);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await getOrderDetail(id);
      setOrder(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Order not found.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading) {
    return (
      <Page width="detail" className={styles.page}>
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonHeading} />
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      </Page>
    );
  }

  if (error || !order) {
    return (
      <Page width="detail" className={styles.page}>
        <PageTitle
          title="Order not found"
          backTo="/buyer/orders"
          backLabel="Back to orders"
        />
        <div className={styles.errorCard}>
          <p className={styles.errorText}>
            {error || 'This order does not exist or may have been removed.'}
          </p>
          <Link to="/buyer/orders" className={styles.backLink}>
            Return to your orders
          </Link>
        </div>
      </Page>
    );
  }

  const statusLabel = toStatusLabel(order.status);
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled' || order.status === 'declined';
  const isActive = !isCompleted && !isCancelled;

  // Cutoff checks
  const cutoffTime = order.cutoffAt ? new Date(order.cutoffAt).getTime() : null;
  const isBeforeCutoff = order.canCancel && (cutoffTime == null || cutoffTime > Date.now());
  const cutoffFormatted = order.cutoffAt
    ? formatDate(new Date(order.cutoffAt), { weekday: 'long', hour: '2-digit', minute: '2-digit' })
    : 'Friday 18:00';

  // Format reserved date for header context
  const createdDate = order.createdAt ? new Date(order.createdAt) : null;
  const reservedDateLabel = createdDate
    ? formatDate(createdDate, { weekday: 'short', day: 'numeric', month: 'short' })
    : 'recently';
  const statusContext = `${statusLabel} · reserved ${reservedDateLabel}`;

  // Stall info
  const farmer = order.farmer || {};
  const stallName = farmer.stallName || farmer.name || 'Local Stall';
  const stallNumber = farmer.stallNumber ? `Stall ${farmer.stallNumber}` : '';
  const stallLocationText = [stallName, stallNumber].filter(Boolean).join(' · ');
  const pickupLabel = order.pickup?.label || 'Pickup window';

  // Map markers
  const market = order.market || {};
  let mapMarkers = [];
  if (market.location?.coordinates && market.location.coordinates.length === 2) {
    mapMarkers = [
      {
        id: market.id || 'market',
        lat: market.location.coordinates[1],
        lng: market.location.coordinates[0],
        title: market.name || stallName,
        subtitle: market.address || stallLocationText,
      },
    ];
  } else if (typeof market.lat === 'number' && typeof market.lng === 'number') {
    mapMarkers = [
      {
        id: market.id || 'market',
        lat: market.lat,
        lng: market.lng,
        title: market.name || stallName,
        subtitle: market.address || stallLocationText,
      },
    ];
  }

  // Handle Cancel
  const handleConfirmCancel = async (reason) => {
    setCancelling(true);
    try {
      await cancelOrder(order.id, reason);
      showToast({ message: 'Cancelled. Nothing was charged.' });
      setShowCancelConfirm(false);
      await fetchOrder();
    } catch (err) {
      showToast({
        message: err.message || 'Unable to cancel order.',
        type: 'danger',
      });
    } finally {
      setCancelling(false);
    }
  };

  // Handle Reorder
  const handleReorder = async () => {
    if (reordering) return;
    setReordering(true);
    try {
      const preview = await getReorderPreview(order.id);
      const previewItems = preview?.items || order.items || [];
      let added = 0;
      let soldOut = 0;

      for (const item of previewItems) {
        if (item.availability === 'out' || item.quantityAvailable <= 0) {
          soldOut++;
        } else {
          const qty = item.quantity || 1;
          for (let q = 0; q < qty; q++) {
            add(item.productId || item.id, { farmerId: farmer.id });
          }
          added++;
        }
      }

      let toastText = `${added} ${added === 1 ? 'item' : 'items'} added.`;
      if (soldOut > 0) {
        toastText += ` ${soldOut} ${soldOut === 1 ? 'is' : 'are'} sold out.`;
      }
      showToast({ message: toastText });
      navigate('/buyer/basket');
    } catch (err) {
      showToast({
        message: err.message || 'Unable to reorder items.',
        type: 'danger',
      });
    } finally {
      setReordering(false);
    }
  };

  return (
    <Page width="detail" className={styles.page}>
      <PageTitle
        title={`Order ${order.orderNumber}`}
        context={statusContext}
        backTo="/buyer/orders"
        backLabel="Back to orders"
      />

      <div className={styles.layout}>
        {/* Left Column: Timeline, What you reserved, Review form */}
        <div className={styles.leftCol}>
          {/* Collection Code shown here on mobile if below fold */}
          <div className={styles.mobileCodeBlock}>
            <PickupCode code={order.pickupCode} size="lg" />
          </div>

          {/* Timeline */}
          <section className={styles.section} aria-labelledby="heading-timeline">
            <h2 id="heading-timeline" className={styles.sectionHeading}>
              Status
            </h2>
            <OrderTimeline
              status={order.status}
              timeline={order.timeline || []}
              cancelReason={order.cancelReason}
            />
          </section>

          {/* What you reserved */}
          <section className={styles.section} aria-labelledby="heading-reserved">
            <h2 id="heading-reserved" className={styles.sectionHeading}>
              What you reserved
            </h2>
            <OrderSummary
              items={order.items || []}
              totalCents={order.totalCents != null ? order.totalCents : order.total}
              showNotice={true}
            />
          </section>

          {/* Review form (renders only when completed) */}
          {isCompleted && (
            <section className={styles.section} aria-labelledby="heading-review">
              <h2 id="heading-review" className={styles.sectionHeading}>
                How was it?
              </h2>
              <ReviewForm
                orderId={order.id}
                farmer={farmer}
                items={order.items || []}
                alreadyReviewed={order.reviewed}
                onSuccess={fetchOrder}
              />
            </section>
          )}
        </div>

        {/* Right Sticky Column: Code, Collect-from with map, Actions */}
        <aside className={styles.rightCol}>
          {/* Physical handoff artifact: Collection code */}
          <div className={styles.desktopCodeBlock}>
            <PickupCode code={order.pickupCode} size="lg" />
          </div>

          {/* Collect from block */}
          <div className={styles.collectFromCard}>
            <h3 className={styles.collectHeading}>Collect from</h3>
            <p className={styles.stallLine}>{stallLocationText}</p>
            <p className={styles.pickupTimeLine}>{pickupLabel}</p>

            {mapMarkers.length > 0 && (
              <div className={styles.mapWrap}>
                <MapView
                  markers={mapMarkers}
                  height="200px"
                  zoom={15}
                  interactive={false}
                  showDirectionsLink={true}
                  ariaLabel={`Map of pickup location for ${stallName}`}
                />
              </div>
            )}
          </div>

          {/* Order Actions */}
          <div className={styles.actionsCard}>
            {/* Active order: Cancel before cutoff */}
            {isActive && (
              <div className={styles.cancelBlock}>
                {isBeforeCutoff ? (
                  <>
                    <p className={styles.cutoffGuidance}>
                      You can change or cancel until {cutoffFormatted}.
                    </p>

                    {!showCancelConfirm ? (
                      <button
                        type="button"
                        className={styles.cancelTextBtn}
                        onClick={() => setShowCancelConfirm(true)}
                      >
                        Cancel order
                      </button>
                    ) : (
                      <ConfirmStep
                        title="Cancel this order?"
                        message="Nothing will be charged. The farmer will be notified to return items to stock."
                        confirmLabel="Yes, cancel order"
                        confirmVariant="danger"
                        cancelLabel="Keep order"
                        onConfirm={handleConfirmCancel}
                        onCancel={() => setShowCancelConfirm(false)}
                        isLoading={cancelling}
                      />
                    )}
                  </>
                ) : (
                  <p className={styles.cutoffPassed}>
                    The cutoff has passed. Speak to the stall on market day.
                  </p>
                )}
              </div>
            )}

            {/* Completed or Cancelled: Reorder these items is the ONE beet element */}
            {(isCompleted || isCancelled) && (
              <Button
                variant="primary"
                size="lg"
                className={styles.reorderBtn}
                onClick={handleReorder}
                disabled={reordering}
              >
                {reordering ? 'Adding…' : 'Reorder these items'}
              </Button>
            )}
          </div>
        </aside>
      </div>
    </Page>
  );
}

export default OrderDetail;
