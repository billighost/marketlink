import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { createOrderReview } from '@/api/orders';
import Button from '@/components/ui/Button';
import styles from './ReviewForm.module.css';

/**
 * Post-collection review form using keyboard-accessible radio inputs.
 *
 * @param {string} orderId
 * @param {object} farmer   { id, stallName }
 * @param {Array}  [items]  order items
 * @param {Function} [onSuccess] callback when review submitted
 * @param {boolean} [alreadyReviewed]
 * @param {object} [existingReview]
 * @param {string} [className]
 */
export function ReviewForm({
  orderId,
  farmer = {},
  items = [],
  onSuccess,
  alreadyReviewed = false,
  existingReview = null,
  className = '',
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(alreadyReviewed);

  const farmerId = farmer.id || farmer._id;
  const stallName = farmer.stallName || 'the stall';

  const MAX_CHARS = 500;
  const charsRemaining = MAX_CHARS - comment.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await createOrderReview(orderId, {
        farmer: {
          rating: Number(rating),
          comment: comment.trim() || undefined,
        },
      });
      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Unable to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`${styles.successCard} ${className}`} role="status">
        <h4 className={styles.successHeading}>Thank you. Your review is published.</h4>
        {farmerId ? (
          <Link to={`/buyer/stalls/${farmerId}`} className={styles.stallLink}>
            Visit {stallName} →
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form className={`${styles.form} ${className}`} onSubmit={handleSubmit}>
      <h4 className={styles.heading}>How was your order from {stallName}?</h4>

      {/* 1–5 Star Rating via real radio inputs */}
      <div className={styles.ratingGroup}>
        <span className={styles.label}>Your rating</span>
        <fieldset
          className={styles.starFieldset}
          role="radiogroup"
          aria-label="Rating out of 5 stars"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className={styles.starLabel}>
              <input
                type="radio"
                name={`order-rating-${orderId}`}
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className={styles.srOnly}
              />
              <Star
                size={28}
                strokeWidth={1.5}
                className={n <= rating ? styles.starFilled : styles.starEmpty}
                fill={n <= rating ? 'currentColor' : 'none'}
                aria-hidden="true"
              />
              <span className={styles.srOnly}>
                {n} star{n > 1 ? 's' : ''}
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      {/* Optional comment */}
      <div className={styles.commentGroup}>
        <div className={styles.commentHeader}>
          <label htmlFor={`review-comment-${orderId}`} className={styles.label}>
            Comments (optional)
          </label>
          <span className={styles.charCount} aria-live="polite">
            {charsRemaining} left
          </span>
        </div>
        <textarea
          id={`review-comment-${orderId}`}
          className={styles.textarea}
          rows={3}
          maxLength={MAX_CHARS}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell other shoppers about freshness, collection, or favourite items..."
          disabled={submitting}
        />
      </div>

      {error && (
        <div className={styles.errorBox} role="alert">
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <Button
          type="submit"
          variant="secondary"
          size="md"
          disabled={submitting}
          className={styles.submitBtn}
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </Button>
      </div>
    </form>
  );
}

export default ReviewForm;
