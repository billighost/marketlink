import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, AlertCircle, RotateCcw, Star, Check, Clock } from 'lucide-react';
import { getOrderDetail, cancelOrder, createOrderReview, getReorderPreview } from '@/api/orders';
import { formatPrice, formatDate, formatTime, formatCountdown } from '@/utils/format';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import StatusDot from '@/components/ui/StatusDot';
import Illustration from '@/components/domain/Illustration';
import Stars from '@/components/ui/Stars';
import Button from '@/components/ui/Button';
import { MapView } from '@/components/domain/MapView';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './OrderDetail.module.css';

/**
 * Order detail page.
 * Connected to real backend GET /orders/:id, cancellation, and reviews.
 */
export function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [orderStep, setOrderStep] = useState('detail'); // 'detail' | 'cancel_confirm' | 'review' | 'review_success'
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useDocumentTitle(`Order ${order?.orderNumber || ''} · MarketLink`);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getOrderDetail(id)
      .then((data) => {
        if (active) {
          setOrder(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Order not found');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Page width="detail">
        <div className={styles.container}>
          <div style={{ padding: 'var(--space-8) var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ height: 28, width: '40%', background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-sm)' }} />
            <div style={{ height: 140, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-md)' }} />
            <div style={{ height: 120, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
      </Page>
    );
  }

  if (error || !order) {
    return (
      <Page width="detail">
        <div className={styles.notFound}>
          <h2>Order not found</h2>
          <p>{error || 'This order may have been removed or does not exist.'}</p>
          <Link to="/buyer/orders" className={styles.backLink}>
            Back to orders
          </Link>
        </div>
      </Page>
    );
  }

  const isCancellable = order.canCancel && order.status !== 'cancelled' && order.status !== 'declined';
  const isCompleted = order.status === 'completed';

  const handleBuyAgain = async () => {
    try {
      const preview = await getReorderPreview(order.id);
      const previewItems = preview?.items || order.items || [];
      let addedCount = 0;

      previewItems.forEach((item) => {
        if (item.available !== false) {
          for (let i = 0; i < (item.quantity || 1); i++) {
            add(item.productId, { farmerId: order.farmer?.id });
          }
          addedCount += item.quantity || 1;
        }
      });

      showToast({
        message: `Added ${addedCount} items from this order to basket`,
        action: 'View Basket',
        onAction: () => navigate('/buyer/basket'),
      });
    } catch {
      // Fallback: direct re-add from local order items
      if (order.items) {
        order.items.forEach((item) => {
          for (let i = 0; i < (item.quantity || 1); i++) {
            add(item.productId, { farmerId: order.farmer?.id });
          }
        });
        showToast({
          message: 'Added items back to basket',
          action: 'View Basket',
          onAction: () => navigate('/buyer/basket'),
        });
      }
    }
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      const updated = await cancelOrder(order.id, cancelReason);
      setOrder(updated);
      setOrderStep('detail');
      showToast({
        message: 'Pre-order cancelled.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        message: err.message || 'Unable to cancel order.',
        type: 'danger',
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!order.farmer?.id) return;

    setSubmittingReview(true);
    try {
      await createOrderReview(order.id, {
        rating: reviewRating,
        text: reviewText.trim() || undefined,
        farmerId: order.farmer.id,
      });
      setOrder((prev) => ({ ...prev, reviewed: true }));
      setOrderStep('review_success');
    } catch (err) {
      showToast({
        message: err.message || 'Unable to submit review.',
        type: 'danger',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Step: Cancel confirmation
  if (orderStep === 'cancel_confirm') {
    return (
      <Page width="detail">
        <PageTitle
          title="Cancel pre-order"
          backTo="/buyer/orders"
          backLabel="Back to orders"
        />
        <div className={styles.stepContainer}>
          <div className={styles.warningCircle}>
            <AlertCircle size={32} aria-hidden="true" />
          </div>
          <h2 className={styles.stepTitle}>Cancel this pre-order?</h2>
          <p className={styles.stepDesc}>
            Are you sure you want to cancel order {order.orderNumber}? The farmers will be notified not to harvest or pack your items.
          </p>

          <div className={styles.reviewInputGroup} style={{ width: '100%' }}>
            <label htmlFor="cancel-reason" className={styles.reviewLabel}>
              Reason for cancellation (optional)
            </label>
            <input
              id="cancel-reason"
              type="text"
              className={styles.reviewTextarea}
              style={{ height: 'var(--control-h)', minHeight: 'unset' }}
              maxLength={200}
              placeholder="E.g., Plans changed, unable to attend..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div className={styles.stepActions}>
            <Button
              variant="danger"
              size="lg"
              className={styles.fullWidthButton}
              onClick={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Yes, cancel order'}
            </Button>
            <button
              type="button"
              className={styles.cancelLink}
              onClick={() => setOrderStep('detail')}
              disabled={cancelling}
            >
              Keep my order
            </button>
          </div>
        </div>
      </Page>
    );
  }

  // Step: Review form
  if (orderStep === 'review') {
    return (
      <Page width="detail">
        <PageTitle
          title="Review harvest"
          backTo="/buyer/orders"
          backLabel="Back to orders"
        />
        <form className={styles.stepContainer} onSubmit={handleSubmitReview}>
          <h2 className={styles.stepTitle}>Review your harvest</h2>
          <p className={styles.stepDesc}>
            How was the produce from {order.farmer?.stallName || 'the farmer'}?
          </p>

          <div className={styles.starsWrapper}>
            <Stars rating={reviewRating} interactive onChange={setReviewRating} />
          </div>

          <div className={styles.reviewInputGroup} style={{ width: '100%' }}>
            <label htmlFor="review-text" className={styles.reviewLabel}>
              Your thoughts (optional)
            </label>
            <textarea
              id="review-text"
              className={styles.reviewTextarea}
              rows={3}
              maxLength={300}
              placeholder="E.g., The berries were super sweet and fresh..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          <div className={styles.stepActions}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className={styles.fullWidthButton}
              disabled={submittingReview}
            >
              {submittingReview ? 'Submitting...' : 'Submit review'}
            </Button>
            <button
              type="button"
              className={styles.cancelLink}
              onClick={() => setOrderStep('detail')}
              disabled={submittingReview}
            >
              Back to order
            </button>
          </div>
        </form>
      </Page>
    );
  }

  // Step: Review success
  if (orderStep === 'review_success') {
    return (
      <Page width="detail">
        <PageTitle
          title="Review submitted"
          backTo="/buyer/orders"
          backLabel="Back to orders"
        />
        <div className={styles.stepContainer}>
          <div className={styles.successCircle}>
            <Check size={32} aria-hidden="true" />
          </div>
          <h2 className={styles.stepTitle}>Review submitted.</h2>
          <p className={styles.stepDesc}>
            Your feedback helps local growers and helps neighbours discover great harvests.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className={styles.fullWidthButton}
            onClick={() => setOrderStep('detail')}
          >
            Back to order details
          </Button>
        </div>
      </Page>
    );
  }

  const market = order.market;
  const coords = market?.location || market?.coordinates;
  const hasCoordinates = Boolean(coords?.lat && coords?.lng);
  const displayTotal = order.totalCents != null ? order.totalCents : order.total;

  return (
    <Page width="detail">
      <PageTitle
        title={`Order ${order.orderNumber}`}
        backTo="/buyer/orders"
        backLabel="Back to orders"
      />
      <div className={styles.container}>
        {/* Header Info */}
        <header className={styles.orderHeader}>
          <div className={styles.titleRow}>
            <h2 className={styles.orderTitle}>Order {order.orderNumber}</h2>
            <StatusDot label={order.status} />
          </div>
          {order.timeline?.[0] && (
            <span className={styles.placedDate}>
              Placed on {formatDate(order.timeline[0].at)} at {formatTime(order.timeline[0].at)}
            </span>
          )}
        </header>

        {/* Pickup Window Card */}
        <section className={styles.pickupCard} aria-label="Pickup window and stalls">
          <div className={styles.pickupRow}>
            <Calendar size={18} className={styles.cardIcon} aria-hidden="true" />
            <div className={styles.cardText}>
              <span className={styles.cardLabel}>Pickup window</span>
              <span className={styles.cardValue}>{order.pickup?.label || 'Pickup window'}</span>
            </div>
          </div>

          <div className={styles.pickupRow}>
            <MapPin size={18} className={styles.cardIcon} aria-hidden="true" />
            <div className={styles.cardText}>
              <span className={styles.cardLabel}>Pickup stalls</span>
              <span className={styles.cardValue}>
                {order.farmerNames || order.farmer?.stallName || 'Attending stalls'}
                {order.farmer?.stallNumber && ` (Stall ${order.farmer.stallNumber})`}
              </span>
            </div>
          </div>
        </section>

        {/* Status Timeline */}
        {order.timeline && order.timeline.length > 0 && (
          <section className={styles.timelineSection} aria-label="Order status timeline">
            <h3 className={styles.sectionHeading}>Order Status</h3>
            <div className={styles.timelineList}>
              {order.timeline.map((event, idx) => (
                <div key={idx} className={styles.timelineItem}>
                  <div className={styles.timelineBullet} />
                  <div className={styles.timelineBody}>
                    <div className={styles.timelineTitleRow}>
                      <span className={styles.timelineStatus}>{event.status}</span>
                      <span className={styles.timelineTime}>
                        {formatTime(event.at)}
                      </span>
                    </div>
                    {event.note && (
                      <p className={styles.timelineNote}>{event.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Items in Pre-order */}
        <section className={styles.itemsSection} aria-label="Items in order">
          <h3 className={styles.sectionHeading}>
            Pre-ordered items ({order.items?.length || 0})
          </h3>
          <div className={styles.itemsList}>
            {(order.items || []).map((item, idx) => {
              const art = item.art || item.productArt || 'basket';
              const itemTotal = item.lineTotalCents != null ? item.lineTotalCents : (item.price * item.quantity);
              return (
                <div key={idx} className={styles.itemRow}>
                  <div className={styles.itemVisual}>
                    <Illustration name={art} size="sm" />
                  </div>
                  <div className={styles.itemDetails}>
                    <span className={styles.itemName}>{item.name || item.productName}</span>
                    <span className={styles.itemQuantity}>
                      Qty: {item.quantity} {item.unit ? `· per ${item.unit}` : ''}
                    </span>
                    {item.stallName && (
                      <span className={styles.itemStall}>{item.stallName}</span>
                    )}
                  </div>
                  <span className={styles.itemPrice}>{formatPrice(itemTotal)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pickup Location Map Card */}
        {market && (
          <section className={styles.locationSection} aria-label="Market pickup location">
            <h3 className={styles.sectionHeading}>Market Location</h3>
            <div className={styles.marketCard}>
              <div className={styles.marketInfo}>
                <span className={styles.marketName}>{market.name}</span>
                <span className={styles.marketAddress}>{market.address}</span>
              </div>
              {hasCoordinates && (
                <div className={styles.mapContainer}>
                  <MapView
                    markers={[
                      {
                        id: market.id || 'market-loc',
                        lat: coords.lat,
                        lng: coords.lng,
                        label: market.name,
                      },
                    ]}
                    selectedId={market.id || 'market-loc'}
                    height="160px"
                    showDirectionsLink={true}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Note from Buyer */}
        {order.notes && (
          <section className={styles.notesSection}>
            <h3 className={styles.sectionHeading}>Note for Farmers</h3>
            <p className={styles.noteContent}>"{order.notes}"</p>
          </section>
        )}

        {/* Total Summary */}
        <section className={styles.summarySection} aria-label="Payment summary">
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatPrice(displayTotal)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Market fee</span>
            <span className={styles.freeBadge}>Free</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Total to pay at pickup</span>
            <span>{formatPrice(displayTotal)}</span>
          </div>
        </section>

        {/* Order Action Buttons */}
        <footer className={styles.orderActions}>
          {isCompleted && !order.reviewed && (
            <button
              type="button"
              className={styles.reviewButton}
              onClick={() => setOrderStep('review')}
            >
              <Star size={16} aria-hidden="true" />
              <span>Write a review</span>
            </button>
          )}

          <button
            type="button"
            className={styles.buyAgainButton}
            onClick={handleBuyAgain}
          >
            <RotateCcw size={16} aria-hidden="true" />
            <span>Buy these items again</span>
          </button>

          {isCancellable && (
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setOrderStep('cancel_confirm')}
            >
              Cancel this order
            </button>
          )}
        </footer>
      </div>
    </Page>
  );
}

export default OrderDetail;
