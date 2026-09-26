import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
import { getOrders } from '@/api/orders';
import { updateReview, deleteReview } from '@/api/reviews';
import { useToast } from '@/context/ToastContext';
import Stars from '@/components/ui/Stars';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmStep from '@/components/ui/ConfirmStep';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import { formatDate } from '@/utils/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Reviews.module.css';

export function Reviews() {
  useDocumentTitle('Your reviews · MarketLink');
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [awaitingOrders, setAwaitingOrders] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  // Edit review state
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete review state
  const [deletingId, setDeletingId] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Load reviews and orders
  useEffect(() => {
    let active = true;
    setLoading(true);

    getOrders({ tab: 'past', limit: 20 })
      .then((res) => {
        if (!active) return;
        const pastOrders = res?.data || (Array.isArray(res) ? res : []);
        // Completed orders that have not been reviewed yet
        const awaiting = pastOrders.filter((o) => o.status === 'completed' && !o.reviewed);
        setAwaitingOrders(awaiting);

        // Gather existing reviews attached to past orders or localStorage cache
        const extractedReviews = [];
        pastOrders.forEach((o) => {
          if (o.reviews && Array.isArray(o.reviews)) {
            extractedReviews.push(...o.reviews);
          }
        });

        try {
          const cached = JSON.parse(localStorage.getItem('marketlink_my_reviews') || '[]');
          if (Array.isArray(cached)) {
            cached.forEach((cr) => {
              if (!extractedReviews.some((r) => r.id === cr.id)) {
                extractedReviews.push(cr);
              }
            });
          }
        } catch {
          // ignore
        }

        setMyReviews(extractedReviews);
      })
      .catch(() => {
        if (!active) return;
        setAwaitingOrders([]);
        setMyReviews([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleStartEdit = (review) => {
    setEditingId(review.id);
    setEditRating(review.rating || 5);
    setEditComment(review.comment || review.text || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRating(5);
    setEditComment('');
  };

  const handleSaveEdit = async (reviewId) => {
    setSavingEdit(true);
    try {
      await updateReview(reviewId, {
        rating: editRating,
        comment: editComment.trim() || undefined,
      });

      setMyReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, rating: editRating, comment: editComment.trim() } : r
        )
      );

      // Update localStorage cache
      try {
        const cached = JSON.parse(localStorage.getItem('marketlink_my_reviews') || '[]');
        const updated = cached.map((r) =>
          r.id === reviewId ? { ...r, rating: editRating, comment: editComment.trim() } : r
        );
        localStorage.setItem('marketlink_my_reviews', JSON.stringify(updated));
      } catch {
        // ignore
      }

      showToast({ message: 'Review updated.' });
      handleCancelEdit();
    } catch (err) {
      showToast({ message: err?.message || 'Could not update review.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!deletingId) return;
    setDeletingLoading(true);

    try {
      await deleteReview(deletingId);
      setMyReviews((prev) => prev.filter((r) => r.id !== deletingId));

      try {
        const cached = JSON.parse(localStorage.getItem('marketlink_my_reviews') || '[]');
        const updated = cached.filter((r) => r.id !== deletingId);
        localStorage.setItem('marketlink_my_reviews', JSON.stringify(updated));
      } catch {
        // ignore
      }

      showToast({ message: 'Review deleted.' });
      setDeletingId(null);
    } catch (err) {
      showToast({ message: err?.message || 'Could not delete review.' });
    } finally {
      setDeletingLoading(false);
    }
  };

  const hasContent = awaitingOrders.length > 0 || myReviews.length > 0;

  return (
    <Page width="read">
      <PageTitle
        title="Your reviews"
        context="Feedback on collected harvest orders and market stalls."
        backTo="/buyer/profile"
        backLabel="Back to you"
      />

      <div className={styles.container}>
        {loading ? (
          <div className={styles.panel}>
            <div style={{ height: 80, background: 'var(--color-canvas-soft)' }} />
          </div>
        ) : !hasContent ? (
          <EmptyState
            scene="first-review"
            title="No reviews yet"
            text="Reviews appear after you collect an order."
            actionLabel="Browse produce"
            actionTo="/buyer/products"
          />
        ) : (
          <>
            {/* Awaiting your review section */}
            {awaitingOrders.length > 0 && (
              <section className={styles.section} aria-label="Awaiting your review">
                <h2 className={styles.sectionTitle}>Awaiting your review</h2>
                <div className={styles.panel}>
                  {awaitingOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/buyer/orders/${order.id}`}
                      className={styles.awaitingRow}
                    >
                      <div className={styles.awaitingMain}>
                        <span className={styles.awaitingStall}>
                          {order.farmerName || order.farmer?.stallName || 'Market Stall'}
                        </span>
                        <span className={styles.awaitingMeta}>
                          Order #{order.orderNumber} · Collected {formatDate(order.pickup?.slotEnd || order.updatedAt)}
                        </span>
                      </div>
                      <div className={styles.awaitingAction}>
                        <span>Leave review</span>
                        <ChevronRight size={16} aria-hidden="true" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Completed reviews section */}
            {myReviews.length > 0 && (
              <section className={styles.section} aria-label="Your past reviews">
                <h2 className={styles.sectionTitle}>Reviews you left</h2>
                <div className={styles.panel}>
                  {myReviews.map((review) => {
                    const isEditing = editingId === review.id;
                    const isDeleting = deletingId === review.id;

                    return (
                      <article key={review.id} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <div>
                            <div className={styles.targetName}>
                              {review.targetName || review.productName || review.farmerName || 'Stall item'}
                            </div>
                            <span className={styles.reviewDate}>
                              {formatDate(review.createdAt || review.date)}
                            </span>
                          </div>

                          {!isEditing && (
                            <div className={styles.ratingAndActions}>
                              <Stars rating={review.rating} size="sm" />
                              <div className={styles.itemActions}>
                                <button
                                  type="button"
                                  className={styles.textBtn}
                                  onClick={() => handleStartEdit(review)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className={`${styles.textBtn} ${styles.textBtnDanger}`}
                                  onClick={() => setDeletingId(review.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Inline editing mode */}
                        {isEditing ? (
                          <div className={styles.editForm}>
                            <div className={styles.starPicker} role="group" aria-label="Rating">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  className={styles.starBtn}
                                  onClick={() => setEditRating(star)}
                                  aria-label={`${star} stars`}
                                >
                                  <Star
                                    size={20}
                                    fill={editRating >= star ? 'var(--color-ink)' : 'none'}
                                    strokeWidth={1.5}
                                  />
                                </button>
                              ))}
                            </div>

                            <textarea
                              className={styles.textarea}
                              rows={3}
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              placeholder="Update your review..."
                            />

                            <div className={styles.editActions}>
                              <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={handleCancelEdit}
                                disabled={savingEdit}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className={styles.saveEditBtn}
                                onClick={() => handleSaveEdit(review.id)}
                                disabled={savingEdit}
                              >
                                {savingEdit ? 'Saving...' : 'Save review'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {review.comment && (
                              <p className={styles.comment}>{review.comment}</p>
                            )}

                            {review.reply && (
                              <div className={styles.replyBox}>
                                <span className={styles.replyAuthor}>
                                  Response from {review.reply.farmerName || 'Farmer'}
                                </span>
                                <p className={styles.replyText}>{review.reply.comment || review.reply.text}</p>
                              </div>
                            )}

                            {isDeleting && (
                              <ConfirmStep
                                title="Delete this review?"
                                message="This cannot be undone. You will not be able to re-review this past order."
                                confirmLabel="Delete review"
                                confirmVariant="danger"
                                onConfirm={handleDeleteReview}
                                onCancel={() => setDeletingId(null)}
                                isLoading={deletingLoading}
                              />
                            )}
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Page>
  );
}

export default Reviews;
