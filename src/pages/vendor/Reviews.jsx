import React, { useState, useEffect, useCallback } from 'react';
import {
  getFarmerReviews,
  replyFarmerReview,
  deleteFarmerReviewReply,
  reportReview,
} from '@/api/farmer';
import Stars from '@/components/ui/Stars';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Skeleton from '@/components/ui/Skeleton';
import BottomSheet from '@/components/ui/BottomSheet';
import ConfirmStep from '@/components/ui/ConfirmStep';
import Toast from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { MessageSquare, Flag, Trash2, Edit2, MessageCircle } from 'lucide-react';
import { formatDateShort } from '@/utils/format';
import styles from './Reviews.module.css';

export function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterUnanswered, setFilterUnanswered] = useState(false);

  // Active review for reply or report
  const [activeReview, setActiveReview] = useState(null);
  const [modalMode, setModalMode] = useState('none'); // 'none' | 'reply' | 'report' | 'delete-reply'
  const [replyText, setReplyText] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = {};
      if (filterUnanswered) {
        query.hasReply = 'false';
      }
      const res = await getFarmerReviews(query);
      setReviews(res?.data || []);
      if (res?.meta?.summary) {
        setSummary(res.meta.summary);
      }
    } catch (err) {
      setError(err?.message || 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [filterUnanswered]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleOpenReply = (review) => {
    setActiveReview(review);
    setReplyText(review.reply?.text || review.reply?.body || '');
    setModalError('');
    setModalMode('reply');
  };

  const handleSaveReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim()) {
      setModalError('Please enter your reply text.');
      return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      await replyFarmerReview(activeReview.id, replyText.trim());
      setToastMessage('Reply posted successfully.');
      setToastType('success');
      setModalMode('none');
      fetchReviews();
    } catch (err) {
      setModalError(err?.message || 'Failed to post reply.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteReply = async () => {
    setModalLoading(true);
    setModalError('');
    try {
      await deleteFarmerReviewReply(activeReview.id);
      setToastMessage('Reply removed.');
      setToastType('success');
      setModalMode('none');
      fetchReviews();
    } catch (err) {
      setModalError(err?.message || 'Could not delete reply.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleReport = async (reason) => {
    setModalLoading(true);
    setModalError('');
    try {
      await reportReview(activeReview.id, reason);
      setToastMessage('Review reported for administrative moderation.');
      setToastType('success');
      setModalMode('none');
    } catch (err) {
      setModalError(err?.message || 'Failed to report review.');
    } finally {
      setModalLoading(false);
    }
  };

  const breakdown = summary?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalReviews = summary?.ratingCount || 0;
  const ratingAvg = summary?.ratingAvg ? Number(summary.ratingAvg).toFixed(1) : '0.0';

  return (
    <div className={styles.container}>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onDismiss={() => setToastMessage('')}
        />
      )}

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Reviews</h1>
      </div>

      {/* Rating Summary & 5-Bar Breakdown */}
      <section className={styles.summaryCard} aria-label="Rating breakdown">
        <div className={styles.scoreCol}>
          <span className={styles.scoreNumber}>{ratingAvg}</span>
          <Stars rating={Number(ratingAvg)} size={18} />
          <span className={styles.scoreCount}>
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        <div className={styles.barsCol}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown[star] || 0;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={star} className={styles.barRow}>
                <span className={styles.starLabel}>{star}★</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${pct}%` }}
                    aria-label={`${count} reviews with ${star} stars`}
                  />
                </div>
                <span className={styles.barCount}>{count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Filter Chips */}
      <div className={styles.chipRow}>
        <Chip
          label="All reviews"
          selected={!filterUnanswered}
          onClick={() => setFilterUnanswered(false)}
        />
        <Chip
          label="Unanswered"
          selected={filterUnanswered}
          onClick={() => setFilterUnanswered(true)}
        />
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className={styles.loadingBox}>
          <Skeleton height="90px" />
          <Skeleton height="90px" />
        </div>
      ) : error ? (
        <ErrorState title="Couldn't load this" text={error} onRetry={fetchReviews} />
      ) : reviews.length === 0 ? (
        <EmptyState
          illustration="basket"
          title="No reviews yet"
          text="They appear after Customers collect orders."
        />
      ) : (
        <div className={styles.reviewList}>
          {reviews.map((rev) => {
            const hasReply = Boolean(rev.reply?.text || rev.reply?.body);

            return (
              <article key={rev.id} className={styles.reviewItem}>
                <div className={styles.itemHeader}>
                  <div className={styles.headerLeft}>
                    <Stars rating={rev.rating} size={15} />
                    <span className={styles.author}>{rev.customerName || 'Verified Customer'}</span>
                  </div>
                  <span className={styles.date}>
                    {rev.createdAt ? formatDateShort(rev.createdAt) : ''}
                  </span>
                </div>

                {rev.comment && <p className={styles.comment}>{rev.comment}</p>}

                {/* Farmer Reply Block */}
                {hasReply && (
                  <div className={styles.replyBox}>
                    <div className={styles.replyHeader}>
                      <strong>Your reply:</strong>
                      <div className={styles.replyActions}>
                        <button
                          type="button"
                          onClick={() => handleOpenReply(rev)}
                          className={styles.iconActionBtn}
                          aria-label="Edit reply"
                        >
                          <Edit2 size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReview(rev);
                            setModalMode('delete-reply');
                          }}
                          className={styles.iconActionBtn}
                          aria-label="Delete reply"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <p className={styles.replyText}>{rev.reply.text || rev.reply.body}</p>
                  </div>
                )}

                {/* Action Row */}
                <div className={styles.itemActions}>
                  {!hasReply && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenReply(rev)}
                    >
                      <MessageSquare size={14} aria-hidden="true" />
                      <span>Reply</span>
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveReview(rev);
                      setModalMode('report');
                    }}
                    className={styles.reportBtn}
                  >
                    <Flag size={14} aria-hidden="true" />
                    <span>Report</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Reply Sheet */}
      {modalMode === 'reply' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setModalMode('none')}
          size="peek"
          title={activeReview?.reply ? 'Edit Reply' : 'Reply to Customer'}
        >
          <form onSubmit={handleSaveReply} className={styles.replyForm}>
            {modalError && (
              <div className={styles.errorBox} role="alert">
                {modalError}
              </div>
            )}
            <div className={styles.textareaWrapper}>
              <div className={styles.counterRow}>
                <label htmlFor="farmer-reply-text" className={styles.replyLabel}>
                  Your message (public)
                </label>
                <span className={styles.charCounter}>{replyText.length} / 500</span>
              </div>
              <textarea
                id="farmer-reply-text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Thank the customer or address feedback..."
                className={styles.replyTextarea}
                disabled={modalLoading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={modalLoading || !replyText.trim()}
              loading={modalLoading}
              className={styles.submitReplyBtn}
            >
              Post reply
            </Button>
          </form>
        </BottomSheet>
      )}

      {/* Delete Reply Confirmation */}
      {modalMode === 'delete-reply' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setModalMode('none')}
          size="peek"
          title="Delete Reply"
        >
          <ConfirmStep
            title="Remove your reply?"
            message="Your public reply will be removed from this customer review."
            confirmLabel="Delete reply"
            confirmVariant="danger"
            cancelLabel="Cancel"
            onConfirm={handleDeleteReply}
            onCancel={() => setModalMode('none')}
            isLoading={modalLoading}
            error={modalError}
          />
        </BottomSheet>
      )}

      {/* Report Review Confirmation */}
      {modalMode === 'report' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setModalMode('none')}
          size="peek"
          title="Report Review"
        >
          <ConfirmStep
            title="Report review"
            message="Flag this review if it contains inappropriate content, profanity, or spam."
            confirmLabel="Submit report"
            confirmVariant="danger"
            cancelLabel="Cancel"
            requireReason={true}
            reasonLabel="Reason for reporting"
            reasonPlaceholder="e.g. Abusive language, false order claims..."
            onConfirm={handleReport}
            onCancel={() => setModalMode('none')}
            isLoading={modalLoading}
            error={modalError}
          />
        </BottomSheet>
      )}
    </div>
  );
}

export default Reviews;
