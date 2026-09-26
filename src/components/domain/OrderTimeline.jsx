import React from 'react';
import { formatDate, formatTime } from '@/utils/format';
import styles from './OrderTimeline.module.css';

const STEPS = [
  { key: 'placed', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Collected' },
];

const STATUS_ORDER = {
  placed: 0,
  accepted: 1,
  ready: 2,
  completed: 3,
};

function formatStepTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return `${formatDate(d, { weekday: 'short', day: 'numeric', month: 'short' })}, ${formatTime(d)}`;
  } catch {
    return '—';
  }
}

/**
 * Four-step rail for order status (Placed -> Accepted -> Ready -> Collected),
 * or a single clear block when cancelled/declined.
 *
 * @param {string} status       current status ('placed'|'accepted'|'ready'|'completed'|'cancelled'|'declined')
 * @param {Array}  timeline     raw timeline from backend: [{ status, at, note }]
 * @param {string} cancelReason optional cancel reason
 * @param {string} [className]
 */
export function OrderTimeline({ status = 'placed', timeline = [], cancelReason, className = '' }) {
  const normStatus = String(status).toLowerCase();
  const isCancelled = normStatus === 'cancelled' || normStatus === 'declined';

  if (isCancelled) {
    const cancelEntry = timeline.find((t) => t.status === 'cancelled' || t.status === 'declined');
    const cancelTime = cancelEntry?.at ? formatStepTime(cancelEntry.at) : '';
    const cancelText = cancelTime
      ? `Cancelled ${cancelTime} · Nothing was charged.`
      : 'Cancelled · Nothing was charged.';

    return (
      <div className={`${styles.cancelledBlock} ${className}`} role="status">
        <p className={styles.cancelledText}>{cancelText}</p>
        {(cancelReason || cancelEntry?.note) && (
          <p className={styles.cancelledReason}>{cancelReason || cancelEntry?.note}</p>
        )}
      </div>
    );
  }

  const currentIdx = STATUS_ORDER[normStatus] ?? 0;

  // Build map of timestamps from timeline
  const timestampMap = {};
  if (Array.isArray(timeline)) {
    for (const t of timeline) {
      if (t.status && t.at) {
        timestampMap[t.status.toLowerCase()] = t.at;
      }
    }
  }

  return (
    <ol className={`${styles.timeline} ${className}`} aria-label="Order status timeline">
      {STEPS.map((step, idx) => {
        const isReached = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        const timeIso = timestampMap[step.key];
        const timeFormatted = isReached ? formatStepTime(timeIso) : '—';
        const isSegmentDone = idx < currentIdx;

        return (
          <li
            key={step.key}
            className={[
              styles.step,
              isReached ? styles.reached : styles.unreached,
              isCurrent ? styles.current : '',
              isSegmentDone ? styles.segmentDone : '',
            ].filter(Boolean).join(' ')}
          >
            {/* Visual marker */}
            <div className={styles.markerCol} aria-hidden="true">
              <span className={styles.dot} />
              {idx < STEPS.length - 1 && <span className={styles.rail} />}
            </div>

            {/* Content */}
            <div className={styles.stepContent}>
              <div className={styles.labelRow}>
                <span className={styles.label}>{step.label}</span>
                <span className="visuallyHidden">
                  {isCurrent ? '(current step)' : isReached ? '(completed)' : '(not yet reached)'}
                </span>
              </div>
              <span className={styles.timestamp}>{timeFormatted}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default OrderTimeline;
