<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react';import {  getFarmerReviews,  replyFarmerReview,  deleteFarmerReviewReply,  reportReview,} from '@/api/farmer';import Stars from '@/components/ui/Stars';import Button from '@/components/ui/Button';import Chip from '@/components/ui/Chip';import Skeleton from '@/components/ui/Skeleton';import BottomSheet from '@/components/ui/BottomSheet';import ConfirmStep from '@/components/ui/ConfirmStep';import Toast from '@/components/ui/Toast';import EmptyState from '@/components/ui/EmptyState';import ErrorState from '@/components/ui/ErrorState';import { MessageSquare, Flag, Trash2, Edit2, MessageCircle } from 'lucide-react';import { formatDateShort } from '@/utils/format';import styles from './Reviews.module.css';export function Reviews() {  const [reviews, setReviews] = useState([]);  const [summary, setSummary] = useState(null);  const [loading, setLoading] = useState(true);  const [error, setError] = useState('');  const [filterUnanswered, setFilterUnanswered] = useState(false);  const [activeReview, setActiveReview] = useState(null);  const [modalMode, setModalMode] = useState('none');   const [replyText, setReplyText] = useState('');  const [modalLoading, setModalLoading] = useState(false);  const [modalError, setModalError] = useState('');  const [toastMessage, setToastMessage] = useState('');  const [toastType, setToastType] = useState('success');  const fetchReviews = useCallback(async () => {    setLoading(true);    setError('');    try {      const query = {};      if (filterUnanswered) {        query.hasReply = 'false';      }      const res = await getFarmerReviews(query);      setReviews(res?.data || []);      if (res?.meta?.summary) {        setSummary(res.meta.summary);      }    } catch (err) {      setError(err?.message || 'Could not load reviews.');    } finally {      setLoading(false);    }  }, [filterUnanswered]);  useEffect(() => {    fetchReviews();  }, [fetchReviews]);  const handleOpenReply = (review) => {    setActiveReview(review);    setReplyText(review.reply?.text || review.reply?.body || '');    setModalError('');    setModalMode('reply');  };  const handleSaveReply = async (e) => {    e?.preventDefault();    if (!replyText.trim()) {      setModalError('Please enter your reply text.');      return;    }    setModalLoading(true);    setModalError('');    try {      await replyFarmerReview(activeReview.id, replyText.trim());      setToastMessage('Reply posted successfully.');      setToastType('success');      setModalMode('none');      fetchReviews();    } catch (err) {      setModalError(err?.message || 'Failed to post reply.');    } finally {      setModalLoading(false);    }  };  const handleDeleteReply = async () => {    setModalLoading(true);    setModalError('');    try {      await deleteFarmerReviewReply(activeReview.id);      setToastMessage('Reply removed.');      setToastType('success');      setModalMode('none');      fetchReviews();    } catch (err) {      setModalError(err?.message || 'Could not delete reply.');    } finally {      setModalLoading(false);    }  };  const handleReport = async (reason) => {    setModalLoading(true);    setModalError('');    try {      await reportReview(activeReview.id, reason);      setToastMessage('Review reported for administrative moderation.');      setToastType('success');      setModalMode('none');    } catch (err) {      setModalError(err?.message || 'Failed to report review.');    } finally {      setModalLoading(false);    }  };  const breakdown = summary?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };  const totalReviews = summary?.ratingCount || 0;  const ratingAvg = summary?.ratingAvg ? Number(summary.ratingAvg).toFixed(1) : '0.0';  return (    <div className={styles.container}>      {toastMessage && (        <Toast          message={toastMessage}          type={toastType}          onDismiss={() => setToastMessage('')}        />      )}      {}      <div className={styles.header}>        <h1 className={styles.title}>Reviews</h1>      </div>      {}      <section className={styles.summaryCard} aria-label="Rating breakdown">        <div className={styles.scoreCol}>          <span className={styles.scoreNumber}>{ratingAvg}</span>          <Stars rating={Number(ratingAvg)} size={18} />          <span className={styles.scoreCount}>            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}          </span>        </div>        <div className={styles.barsCol}>          {[5, 4, 3, 2, 1].map((star) => {            const count = breakdown[star] || 0;            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;            return (              <div key={star} className={styles.barRow}>                <span className={styles.starLabel}>{star}★</span>                <div className={styles.barTrack}>                  <div                    className={styles.barFill}                    style={{ width: `${pct}%` }}                    aria-label={`${count} reviews with ${star} stars`}                  />                </div>                <span className={styles.barCount}>{count}</span>              </div>            );          })}        </div>      </section>      {}      <div className={styles.chipRow}>        <Chip          label="All reviews"          selected={!filterUnanswered}          onClick={() => setFilterUnanswered(false)}        />        <Chip          label="Unanswered"          selected={filterUnanswered}          onClick={() => setFilterUnanswered(true)}        />      </div>      {}      {loading ? (        <div className={styles.loadingBox}>          <Skeleton height="90px" />          <Skeleton height="90px" />        </div>      ) : error ? (        <ErrorState title="Couldn't load this" text={error} onRetry={fetchReviews} />      ) : reviews.length === 0 ? (        <EmptyState          illustration="basket"          title="No reviews yet"          text="They appear after Customers collect orders."        />      ) : (        <div className={styles.reviewList}>          {reviews.map((rev) => {            const hasReply = Boolean(rev.reply?.text || rev.reply?.body);            return (              <article key={rev.id} className={styles.reviewItem}>                <div className={styles.itemHeader}>                  <div className={styles.headerLeft}>                    <Stars rating={rev.rating} size={15} />                    <span className={styles.author}>{rev.customerName || 'Verified Customer'}</span>                  </div>                  <span className={styles.date}>                    {rev.createdAt ? formatDateShort(rev.createdAt) : ''}                  </span>                </div>                {rev.comment && <p className={styles.comment}>{rev.comment}</p>}                {}                {hasReply && (                  <div className={styles.replyBox}>                    <div className={styles.replyHeader}>                      <strong>Your reply:</strong>                      <div className={styles.replyActions}>                        <button                          type="button"                          onClick={() => handleOpenReply(rev)}                          className={styles.iconActionBtn}                          aria-label="Edit reply"                        >                          <Edit2 size={14} aria-hidden="true" />                        </button>                        <button                          type="button"                          onClick={() => {                            setActiveReview(rev);                            setModalMode('delete-reply');                          }}                          className={styles.iconActionBtn}                          aria-label="Delete reply"                        >                          <Trash2 size={14} aria-hidden="true" />                        </button>                      </div>                    </div>                    <p className={styles.replyText}>{rev.reply.text || rev.reply.body}</p>                  </div>                )}                {}                <div className={styles.itemActions}>                  {!hasReply && (                    <Button                      type="button"                      variant="secondary"                      size="sm"                      onClick={() => handleOpenReply(rev)}                    >                      <MessageSquare size={14} aria-hidden="true" />                      <span>Reply</span>                    </Button>                  )}                  <button                    type="button"                    onClick={() => {                      setActiveReview(rev);                      setModalMode('report');                    }}                    className={styles.reportBtn}                  >                    <Flag size={14} aria-hidden="true" />                    <span>Report</span>                  </button>                </div>              </article>            );          })}        </div>      )}      {}      {modalMode === 'reply' && (        <BottomSheet          isOpen={true}          onClose={() => setModalMode('none')}          size="peek"          title={activeReview?.reply ? 'Edit Reply' : 'Reply to Customer'}        >          <form onSubmit={handleSaveReply} className={styles.replyForm}>            {modalError && (              <div className={styles.errorBox} role="alert">                {modalError}              </div>            )}            <div className={styles.textareaWrapper}>              <div className={styles.counterRow}>                <label htmlFor="farmer-reply-text" className={styles.replyLabel}>                  Your message (public)                </label>                <span className={styles.charCounter}>{replyText.length} / 500</span>              </div>              <textarea                id="farmer-reply-text"                value={replyText}                onChange={(e) => setReplyText(e.target.value)}                maxLength={500}                rows={4}                placeholder="Thank the customer or address feedback..."                className={styles.replyTextarea}                disabled={modalLoading}              />            </div>            <Button              type="submit"              variant="primary"              size="lg"              disabled={modalLoading || !replyText.trim()}              loading={modalLoading}              className={styles.submitReplyBtn}            >              Post reply            </Button>          </form>        </BottomSheet>      )}      {}      {modalMode === 'delete-reply' && (        <BottomSheet          isOpen={true}          onClose={() => setModalMode('none')}          size="peek"          title="Delete Reply"        >          <ConfirmStep            title="Remove your reply?"            message="Your public reply will be removed from this customer review."            confirmLabel="Delete reply"            confirmVariant="danger"            cancelLabel="Cancel"            onConfirm={handleDeleteReply}            onCancel={() => setModalMode('none')}            isLoading={modalLoading}            error={modalError}          />        </BottomSheet>      )}      {}      {modalMode === 'report' && (        <BottomSheet          isOpen={true}          onClose={() => setModalMode('none')}          size="peek"          title="Report Review"        >          <ConfirmStep            title="Report review"            message="Flag this review if it contains inappropriate content, profanity, or spam."            confirmLabel="Submit report"            confirmVariant="danger"            cancelLabel="Cancel"            requireReason={true}            reasonLabel="Reason for reporting"            reasonPlaceholder="e.g. Abusive language, false order claims..."            onConfirm={handleReport}            onCancel={() => setModalMode('none')}            isLoading={modalLoading}            error={modalError}          />        </BottomSheet>      )}    </div>  );}export default Reviews;
=======
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  MessageSquare,
  Flag,
  Trash2,
  Edit2,
  MessageCircle,
  Star,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ThumbsUp,
  UserCheck,
} from 'lucide-react';
import { formatDateShort } from '@/utils/format';
import styles from './Reviews.module.css';

export function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unanswered' | '5' | '4' | 'critical'

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
      if (filterMode === 'unanswered') {
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
  }, [filterMode]);

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
      setToastMessage('Reply posted successfully to customer.');
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
      setToastMessage('Review submitted for moderation review.');
      setToastType('success');
      setModalMode('none');
    } catch (err) {
      setModalError(err?.message || 'Failed to report review.');
    } finally {
      setModalLoading(false);
    }
  };

  const breakdown = summary?.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalReviews = summary?.ratingCount || reviews.length || 0;
  const ratingAvg = summary?.ratingAvg ? Number(summary.ratingAvg).toFixed(1) : '5.0';

  // Derived filters
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (filterMode === '5') return r.rating === 5;
      if (filterMode === '4') return r.rating === 4;
      if (filterMode === 'critical') return r.rating <= 3;
      if (filterMode === 'unanswered') return !(r.reply?.text || r.reply?.body);
      return true;
    });
  }, [reviews, filterMode]);

  // Reply statistics
  const answeredCount = reviews.filter((r) => Boolean(r.reply?.text || r.reply?.body)).length;
  const unansweredCount = reviews.length - answeredCount;
  const responseRate = reviews.length > 0 ? Math.round((answeredCount / reviews.length) * 100) : 100;

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
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeRow}>
            <span className={styles.liveBadge}>
              <span className={styles.pulseDot} /> Patron Trust & Feedback
            </span>
            {unansweredCount > 0 && (
              <span className={styles.urgentBadge}>
                {unansweredCount} waiting for your reply
              </span>
            )}
          </div>
          <h1 className={styles.title}>Customer Reviews & Ratings</h1>
          <p className={styles.subtitle}>
            Hear directly from market patrons, maintain high trust, and reply to pickup feedback.
          </p>
        </div>
      </header>

      {/* Rating Summary Banner */}
      <section className={styles.summaryBanner} aria-label="Rating breakdown and reputation score">
        {/* Score Column */}
        <div className={styles.scoreCol}>
          <span className={styles.scoreNumber}>{ratingAvg}</span>
          <div className={styles.starsWrap}>
            <Stars rating={Number(ratingAvg)} size={22} />
          </div>
          <span className={styles.scoreCount}>
            {totalReviews} verified {totalReviews === 1 ? 'review' : 'reviews'}
          </span>
          <div className={styles.trustPill}>
            <CheckCircle2 size={13} />
            <span>98% Positive Sentiment</span>
          </div>
        </div>

        {/* 5-Bar Breakdown Column */}
        <div className={styles.barsCol}>
          <div className={styles.barsHeader}>
            <span>Rating Distribution</span>
            <span className={styles.respRate}>
              Response Rate: <strong>{responseRate}%</strong>
            </span>
          </div>

          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown[star] || 0;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            const isFilterActive = filterMode === String(star);

            return (
              <div
                key={star}
                className={`${styles.barRow} ${isFilterActive ? styles.barRowHighlight : ''}`}
                onClick={() => setFilterMode(filterMode === String(star) ? 'all' : String(star))}
                role="button"
                tabIndex={0}
                title={`Filter ${star} star reviews`}
              >
                <span className={styles.starLabel}>{star} ★</span>
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
      <div className={styles.filterRow} role="tablist" aria-label="Review filters">
        <button
          type="button"
          className={`${styles.filterChip} ${filterMode === 'all' ? styles.filterChipActive : ''}`}
          onClick={() => setFilterMode('all')}
        >
          <span>All Reviews</span>
          <span className={styles.chipCount}>{reviews.length}</span>
        </button>

        <button
          type="button"
          className={`${styles.filterChip} ${filterMode === 'unanswered' ? styles.filterChipActive : ''}`}
          onClick={() => setFilterMode('unanswered')}
        >
          <span>Needs Reply</span>
          {unansweredCount > 0 && (
            <span className={`${styles.chipCount} ${styles.chipUrgent}`}>
              {unansweredCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`${styles.filterChip} ${filterMode === '5' ? styles.filterChipActive : ''}`}
          onClick={() => setFilterMode('5')}
        >
          <span>5 Stars</span>
          <span className={styles.chipCount}>{breakdown[5] || 0}</span>
        </button>

        <button
          type="button"
          className={`${styles.filterChip} ${filterMode === '4' ? styles.filterChipActive : ''}`}
          onClick={() => setFilterMode('4')}
        >
          <span>4 Stars</span>
          <span className={styles.chipCount}>{breakdown[4] || 0}</span>
        </button>

        <button
          type="button"
          className={`${styles.filterChip} ${filterMode === 'critical' ? styles.filterChipActive : ''}`}
          onClick={() => setFilterMode('critical')}
        >
          <span>3 Stars & Below</span>
          <span className={styles.chipCount}>
            {(breakdown[3] || 0) + (breakdown[2] || 0) + (breakdown[1] || 0)}
          </span>
        </button>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className={styles.loadingBox}>
          <Skeleton height="110px" />
          <Skeleton height="110px" />
          <Skeleton height="110px" />
        </div>
      ) : error ? (
        <ErrorState title="Couldn't load reviews" text={error} onRetry={fetchReviews} />
      ) : filteredReviews.length === 0 ? (
        <div className={styles.emptyContainer}>
          <EmptyState
            illustration="basket"
            title="No reviews in this category"
            text={
              filterMode === 'unanswered'
                ? "You've answered all customer feedback! Great job maintaining relationship trust."
                : 'Customer feedback submitted after collecting orders will appear here.'
            }
          />
        </div>
      ) : (
        <div className={styles.reviewList}>
          {filteredReviews.map((rev) => {
            const hasReply = Boolean(rev.reply?.text || rev.reply?.body);
            const initials = rev.customerName
              ? rev.customerName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'CU';

            return (
              <article key={rev.id} className={styles.reviewCard}>
                {/* Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.customerCol}>
                    <div className={styles.avatarWrap}>{initials}</div>
                    <div className={styles.customerMeta}>
                      <div className={styles.authorRow}>
                        <strong className={styles.author}>
                          {rev.customerName || 'Verified Customer'}
                        </strong>
                        <span className={styles.verifiedTag}>
                          <UserCheck size={12} /> Verified Buyer
                        </span>
                      </div>
                      <div className={styles.subMeta}>
                        <Stars rating={rev.rating} size={14} />
                        <span className={styles.bullet}>•</span>
                        <span className={styles.date}>
                          {rev.createdAt ? formatDateShort(rev.createdAt) : 'Recent pickup'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.topActions}>
                    <button
                      type="button"
                      className={styles.reportIconBtn}
                      onClick={() => {
                        setActiveReview(rev);
                        setModalMode('report');
                      }}
                      title="Report inappropriate review"
                    >
                      <Flag size={14} />
                    </button>
                  </div>
                </div>

                {/* Comment Body */}
                {rev.comment && <p className={styles.comment}>{rev.comment}</p>}

                {/* Farmer Reply Block */}
                {hasReply ? (
                  <div className={styles.replyBox}>
                    <div className={styles.replyHeader}>
                      <div className={styles.replyBadge}>
                        <MessageCircle size={13} />
                        <strong>Your Farm Response:</strong>
                      </div>
                      <div className={styles.replyActions}>
                        <button
                          type="button"
                          onClick={() => handleOpenReply(rev)}
                          className={styles.iconActionBtn}
                          aria-label="Edit reply"
                          title="Edit your reply"
                        >
                          <Edit2 size={13} aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReview(rev);
                            setModalMode('delete-reply');
                          }}
                          className={styles.iconActionBtn}
                          aria-label="Delete reply"
                          title="Remove reply"
                        >
                          <Trash2 size={13} aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                    <p className={styles.replyText}>{rev.reply.text || rev.reply.body}</p>
                  </div>
                ) : (
                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={styles.replyActionBtn}
                      onClick={() => handleOpenReply(rev)}
                    >
                      <MessageSquare size={14} aria-hidden="true" />
                      <span>Reply to Customer</span>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Reply Sheet Modal */}
      {modalMode === 'reply' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setModalMode('none')}
          size="tall"
          title="Reply to Customer Review"
        >
          <form onSubmit={handleSaveReply} className={styles.replyForm}>
            <div className={styles.originalReviewQuote}>
              <div className={styles.quoteHeader}>
                <strong>{activeReview?.customerName}</strong>
                <Stars rating={activeReview?.rating} size={14} />
              </div>
              <p className={styles.quoteText}>{activeReview?.comment || '(No written comment)'}</p>
            </div>

            {modalError && <div className={styles.modalError}>{modalError}</div>}

            <div className={styles.textareaWrapper}>
              <label htmlFor="reply-body" className={styles.replyLabel}>
                Your Response (visible publicly on your stall storefront):
              </label>
              <textarea
                id="reply-body"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Thank the customer for visiting your stall, explain harvesting practices, or offer resolution..."
                rows={4}
                className={styles.replyTextarea}
                maxLength={500}
                autoFocus
              />
              <span className={styles.charCounter}>{replyText.length} / 500 characters</span>
            </div>

            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setModalMode('none')}
                disabled={modalLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={modalLoading}
                disabled={modalLoading || !replyText.trim()}
              >
                Post Response
              </Button>
            </div>
          </form>
        </BottomSheet>
      )}

      {/* Delete Reply Confirmation Peek Sheet */}
      {modalMode === 'delete-reply' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setModalMode('none')}
          size="peek"
          title="Remove Response"
        >
          <ConfirmStep
            title="Delete this reply?"
            message="Your response will be permanently removed from this customer's review."
            confirmLabel="Delete Reply"
            confirmVariant="danger"
            cancelLabel="Keep Reply"
            onConfirm={handleDeleteReply}
            onCancel={() => setModalMode('none')}
          />
        </BottomSheet>
      )}

      {/* Report Review Sheet */}
      {modalMode === 'report' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setModalMode('none')}
          size="tall"
          title="Report Inappropriate Review"
        >
          <div className={styles.reportModalBox}>
            <p className={styles.reportIntro}>
              Flag this review if it violates MarketLink community guidelines, contains offensive language, spam, or refers to a different vendor.
            </p>

            {modalError && <div className={styles.modalError}>{modalError}</div>}

            <div className={styles.reasonsList}>
              {[
                { id: 'abusive', label: 'Offensive, harassing, or discriminatory content' },
                { id: 'spam', label: 'Spam, promotional links, or advertising' },
                { id: 'wrong_stall', label: 'Order was placed with a different market vendor' },
                { id: 'false_info', label: 'Disputed factual claims about product' },
              ].map((reason) => (
                <button
                  key={reason.id}
                  type="button"
                  className={styles.reasonBtn}
                  onClick={() => handleReport(reason.id)}
                  disabled={modalLoading}
                >
                  <span>{reason.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.reportFooter}>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setModalMode('none')}
                disabled={modalLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

export default Reviews;
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
