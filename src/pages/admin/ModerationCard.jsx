import React from 'react';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatDateShort } from '@/utils/format';
import { ExternalLink, Star } from 'lucide-react';
import styles from './Moderation.module.css';

function formatRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffSec = Math.floor((now - past) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDateShort(date);
}

export function ModerationCard({ flag, activeTab, isBusy, onRemove, onKeep }) {
  const isReview = flag.targetType === 'review';
  const isResolved = activeTab === 'resolved';

  return (
    <article
      className={`${styles.flagCard} ${isResolved ? styles.flagCardResolved : ''}`}
    >
      
      <div className={styles.cardHeader}>
        <div className={styles.metaGroup}>
          <Badge tone={isReview ? 'neutral' : 'warning'}>
            {isReview ? 'Review' : 'Product listing'}
          </Badge>
          <Badge tone="warning">
            Flagged: {flag.reason || 'Guidelines violation'}
          </Badge>
          {isResolved && (
            <Badge tone={flag.status === 'removed' ? 'danger' : 'success'}>
              {flag.status === 'removed' ? 'Removed' : 'Kept'}
            </Badge>
          )}
        </div>
        <span
          className={styles.timestamp}
          title={flag.createdAt ? new Date(flag.createdAt).toLocaleString() : ''}
        >
          {formatRelativeTime(flag.createdAt)}
        </span>
      </div>

      <div className={styles.evidenceSection}>
        {isReview ? (
          <>
            <blockquote className={styles.quoteBlock}>
              &ldquo;{flag.preview?.comment || '(No comment text provided)'}&rdquo;
            </blockquote>
            <div className={styles.evidenceMeta}>
              {flag.preview?.rating && (
                <span className={styles.ratingStars} aria-label={`${flag.preview.rating} stars`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Star size={11} fill="currentColor" aria-hidden="true" />
                  <span>{flag.preview.rating}</span>
                </span>
              )}
              <span>by {flag.preview?.customerName || 'Customer'}</span>
              {flag.preview?.status && (
                <span>· Status: {flag.preview.status}</span>
              )}
            </div>
          </>
        ) : (
          <div className={styles.productPreview}>
            {flag.preview?.imageUrl ? (
              <img
                src={flag.preview.imageUrl}
                alt=""
                className={styles.productImage}
              />
            ) : null}
            <div className={styles.productInfo}>
              <h4 className={styles.productTitle}>
                {flag.preview?.name || 'Product Listing'}
              </h4>
              <span className={styles.productPrice}>
                {formatCurrency((flag.preview?.priceCents || 0) / 100)}
              </span>
              {flag.preview?.farmerName && (
                <span className={styles.productFarmer}>
                  Stall: {flag.preview.farmerName}
                </span>
              )}
              <span className={styles.productFarmer}>
                Catalogue status: {flag.preview?.listed ? 'Listed' : 'Delisted'}
              </span>
            </div>
          </div>
        )}
      </div>

      {flag.note && !isResolved && (
        <div className={styles.flaggerNotes}>
          <span className={styles.flaggerNotesTitle}>Reporter Note</span>
          <p className={styles.flaggerNotesText}>{flag.note}</p>
        </div>
      )}

      {isResolved && (
        <div className={styles.auditBlock}>
          <strong>Resolution Outcome: {flag.status === 'removed' ? 'Content Removed' : 'Flag Dismissed (Kept)'}</strong>
          {flag.note && <span>Note: {flag.note}</span>}
        </div>
      )}

      {!isResolved && (
        <div className={styles.cardActions}>
          <div className={styles.decisionGroup}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              onClick={() => onRemove(flag)}
              disabled={isBusy}
            >
              {isReview ? 'Remove review' : 'Remove listing'}
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={() => onKeep(flag)}
              disabled={isBusy}
            >
              Keep it
            </button>
          </div>
          <a
            href={isReview ? `/stalls/${flag.targetId}` : `/products/${flag.targetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.contextLink}
          >
            <span>View in context</span>
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
      )}
    </article>
  );
}

export default ModerationCard;
