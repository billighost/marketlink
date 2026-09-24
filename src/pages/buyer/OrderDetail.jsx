import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, AlertCircle, ArrowLeft, RotateCcw, Star, Check } from 'lucide-react';
import { orders, getProduct, getMarket } from '@/data/placeholders';
import { formatPrice, formatDate, formatTime } from '@/utils/format';
import { useCart } from '@/context/CartContext';
import StatusDot from '@/components/ui/StatusDot';
import Illustration from '@/components/domain/Illustration';
import Stars from '@/components/ui/Stars';
import Button from '@/components/ui/Button';
import styles from './OrderDetail.module.css';

/**
 * Order detail view inside a modal bottom sheet (or full-page fallback).
 * Includes in-sheet cancel confirmation and review submission steps.
 */
export function OrderDetail({ inSheet = true, onClose }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();

  const [inSheetStep, setInSheetStep] = useState('detail'); // 'detail' | 'cancel_confirm' | 'review' | 'review_success'
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className={styles.notFound}>
        <h2>Order not found</h2>
        <p>This order may have been removed or does not exist.</p>
        <button type="button" className={styles.backLink} onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  const market = getMarket(order.marketId);
  const isCancellable = (order.status === 'Placed' || order.status === 'Accepted') && !cancelSuccess;
  const isCompleted = order.status === 'Completed';

  const handleBuyAgain = () => {
    if (order.items) {
      order.items.forEach((item) => {
        for (let i = 0; i < (item.quantity || 1); i++) {
          add(item.productId);
        }
      });
    }
    onClose?.();
    navigate('/buyer/cart');
  };

  const handleConfirmCancel = () => {
    setCancelSuccess(true);
    order.status = 'Cancelled';
    setInSheetStep('detail');
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setInSheetStep('review_success');
  };

  // Step: Cancel confirmation
  if (inSheetStep === 'cancel_confirm') {
    return (
      <div className={styles.stepContainer}>
        <div className={styles.warningCircle}>
          <AlertCircle size={32} aria-hidden="true" />
        </div>
        <h2 className={styles.stepTitle}>Cancel this pre-order?</h2>
        <p className={styles.stepDesc}>
          Are you sure you want to cancel order {order.number}? The farmers will be notified not to harvest or pack your items.
        </p>
        <div className={styles.stepActions}>
          <Button
            variant="danger"
            size="lg"
            className={styles.fullWidthButton}
            onClick={handleConfirmCancel}
          >
            Yes, cancel order
          </Button>
          <button
            type="button"
            className={styles.cancelLink}
            onClick={() => setInSheetStep('detail')}
          >
            Keep my order
          </button>
        </div>
      </div>
    );
  }

  // Step: Review form
  if (inSheetStep === 'review') {
    return (
      <form className={styles.stepContainer} onSubmit={handleSubmitReview}>
        <h2 className={styles.stepTitle}>Review your items</h2>
        <p className={styles.stepDesc}>
          How was the harvest from {order.farmerGroups?.map((g) => g.stallName).join(', ')}?
        </p>

        <div className={styles.starsWrapper}>
          <Stars rating={reviewRating} interactive onChange={setReviewRating} />
        </div>

        <div className={styles.reviewInputGroup}>
          <label htmlFor="review-text" className={styles.reviewLabel}>
            Your review (optional)
          </label>
          <textarea
            id="review-text"
            className={styles.reviewTextarea}
            rows={4}
            placeholder="Tell other market customers about the freshness, taste, and stall experience..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
        </div>

        <div className={styles.stepActions}>
          <Button variant="primary" size="lg" type="submit" className={styles.fullWidthButton}>
            Submit review
          </Button>
          <button
            type="button"
            className={styles.cancelLink}
            onClick={() => setInSheetStep('detail')}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  // Step: Review success
  if (inSheetStep === 'review_success') {
    return (
      <div className={styles.stepContainer}>
        <div className={styles.successCircle}>
          <Check size={32} aria-hidden="true" />
        </div>
        <h2 className={styles.stepTitle}>Thank you!</h2>
        <p className={styles.stepDesc}>
          Your feedback helps local growers and helps neighbours discover great harvests.
        </p>
        <Button
          variant="secondary"
          size="lg"
          className={styles.fullWidthButton}
          onClick={() => setInSheetStep('detail')}
        >
          Back to order details
        </Button>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${!inSheet ? styles.standalone : ''}`}>
      {/* Fallback top bar for standalone view */}
      {!inSheet && (
        <div className={styles.fallbackHeader}>
          <Link to="/buyer/orders" className={styles.backButton}>
            <ArrowLeft size={20} aria-hidden="true" />
            <span>Back to orders</span>
          </Link>
        </div>
      )}

      {/* Header Info */}
      <header className={styles.orderHeader}>
        <div className={styles.titleRow}>
          <h1 className={styles.orderTitle}>Order {order.number}</h1>
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
            <span className={styles.cardValue}>{order.pickupSlot}</span>
          </div>
        </div>

        <div className={styles.pickupRow}>
          <MapPin size={18} className={styles.cardIcon} aria-hidden="true" />
          <div className={styles.cardText}>
            <span className={styles.cardLabel}>{market?.name || 'Farmers Market'}</span>
            <span className={styles.cardSubValue}>{market?.address}</span>
            <div className={styles.stallsList}>
              {order.farmerGroups?.map((fg) => (
                <span key={fg.farmerId} className={styles.stallPill}>
                  {fg.stallName} ({fg.stallNumber})
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Status Timeline */}
      {order.timeline && order.timeline.length > 0 && (
        <section className={styles.timelineSection} aria-label="Order progress timeline">
          <h3 className={styles.sectionHeading}>Order progress</h3>
          <div className={styles.timeline}>
            {order.timeline.map((step, idx) => (
              <div key={idx} className={styles.timelineItem}>
                <div className={styles.timelinePoint} aria-hidden="true" />
                <div className={styles.timelineDetails}>
                  <span className={styles.timelineStatus}>{step.status}</span>
                  <span className={styles.timelineTime}>
                    {formatDate(step.at)} · {formatTime(step.at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cancelled Notice */}
      {order.status === 'Cancelled' && (
        <div className={styles.cancelNotice}>
          <AlertCircle size={18} className={styles.cancelIcon} aria-hidden="true" />
          <p className={styles.cancelText}>
            {order.cancelReason || 'This order was cancelled. You will not be charged.'}
          </p>
        </div>
      )}

      {/* Items Ordered List */}
      <section className={styles.itemsSection} aria-label="Items ordered">
        <h3 className={styles.sectionHeading}>Items</h3>
        <div className={styles.itemsList}>
          {order.items?.map((item, idx) => {
            const product = getProduct(item.productId);
            return (
              <div key={idx} className={styles.itemRow}>
                <div className={styles.itemVisual}>
                  <Illustration name={product?.art || 'basket'} size="sm" />
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemCalc}>
                    {item.quantity} × {formatPrice(item.price)} / {item.unit}
                  </span>
                </div>
                <span className={styles.itemTotal}>
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Total Summary */}
      <section className={styles.summarySection} aria-label="Payment summary">
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>{formatPrice(order.total)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Market fee</span>
          <span className={styles.freeBadge}>Free</span>
        </div>
        <div className={`${styles.summaryRow} ${styles.totalRow}`}>
          <span>Total to pay at pickup</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </section>

      {/* In-Sheet Order Action Buttons */}
      <footer className={styles.orderActions}>
        {isCompleted && (
          <button
            type="button"
            className={styles.reviewButton}
            onClick={() => setInSheetStep('review')}
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
            onClick={() => setInSheetStep('cancel_confirm')}
          >
            Cancel this order
          </button>
        )}
      </footer>
    </div>
  );
}

export default OrderDetail;
