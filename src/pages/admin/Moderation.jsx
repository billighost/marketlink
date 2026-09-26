import { useState, useEffect, useCallback } from 'react';
import { getModerationFlags, resolveModerationFlag } from '../../api/admin';
import ConfirmStep from '../../components/ui/ConfirmStep';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAdmin } from '../../layouts/AdminLayout';
import styles from './Moderation.module.css';

export default function Moderation() {
  const toast = useToast();
  const { refreshCounts } = useAdmin();
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open'); // 'open' | 'all' | 'listing' | 'review'
  const [actionFlag, setActionFlag] = useState(null); // flag currently being acted upon
  const [actionType, setActionType] = useState(null); // 'remove' | 'dismiss'

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      const query = {};
      if (activeTab === 'open') {
        query.status = 'open';
      } else if (activeTab === 'listing' || activeTab === 'review') {
        query.targetType = activeTab;
      }
      const res = await getModerationFlags(query);
      setFlags(res.data || []);
    } catch (err) {
      toast.show(err.message || 'Failed to load moderation flags', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleResolve = async (reason = '') => {
    if (!actionFlag || !actionType) return;
    try {
      await resolveModerationFlag(actionFlag.id || actionFlag._id, {
        action: actionType,
        note: reason,
      });
      toast.show(
        actionType === 'remove'
          ? 'Item removed and flag resolved.'
          : 'Flag dismissed.',
        'success'
      );
      setActionFlag(null);
      setActionType(null);
      fetchFlags();
      if (refreshCounts) refreshCounts();
    } catch (err) {
      toast.show(err.message || 'Action failed', 'error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Moderation</h1>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'open' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('open')}
        >
          Open Queue
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'listing' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('listing')}
        >
          Listings
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'review' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('review')}
        >
          Reviews
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Flags
        </button>
      </div>

      {loading ? (
        <p>Loading flags...</p>
      ) : flags.length === 0 ? (
        <EmptyState
          illustration="basket"
          title="Nothing to review"
          text="Flagged items will appear here."
        />
      ) : (
        <div className={styles.flagsList}>
          {flags.map((flag) => {
            const isActing = actionFlag && (actionFlag.id || actionFlag._id) === (flag.id || flag._id);
            return (
              <div key={flag.id || flag._id} className={styles.flagCard}>
                <div className={styles.flagHeader}>
                  <div className={styles.flagMeta}>
                    <span className={styles.typeBadge}>{flag.targetType}</span>
                    <span className={styles.flagDate}>
                      Flagged {formatDate(flag.createdAt)}
                    </span>
                  </div>
                  <span className={styles.statusTag}>{flag.status}</span>
                </div>

                <div className={styles.flagReason}>
                  <strong>Reason:</strong> {flag.reason || 'Flagged for content violation'}
                </div>

                {/* Target preview */}
                <div className={styles.previewBlock}>
                  <div className={styles.previewTitle}>Flagged Target</div>
                  {flag.targetType === 'listing' && flag.preview && (
                    <div className={styles.listingPreview}>
                      {flag.preview.imageUrl ? (
                        <img
                          src={flag.preview.imageUrl}
                          alt={flag.preview.name}
                          className={styles.previewImg}
                        />
                      ) : (
                        <div className={styles.previewImg} style={{ display: 'grid', placeItems: 'center', fontSize: '1.5rem' }}>
                          🥬
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{flag.preview.name}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>
                          Farmer: {flag.preview.farmerName || 'Unknown stall'} ·{' '}
                          {formatCurrency(flag.preview.priceCents)}
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                          Status: {flag.preview.listed ? 'Active listing' : 'Delisted'}
                        </div>
                      </div>
                    </div>
                  )}

                  {flag.targetType === 'review' && flag.preview && (
                    <div>
                      <div className={styles.reviewStars}>
                        {'★'.repeat(flag.preview.rating || 5)}
                        {'☆'.repeat(5 - (flag.preview.rating || 5))}
                      </div>
                      <div className={styles.reviewComment}>
                        "{flag.preview.comment}"
                      </div>
                      <div className={styles.reviewAuthor}>
                        By {flag.preview.authorName || 'Customer'} on {flag.preview.stallName || 'Stall'}
                      </div>
                    </div>
                  )}

                  {!flag.preview && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>
                      Target preview unavailable or item was already removed.
                    </div>
                  )}
                </div>

                {/* Actions / Confirmation */}
                {flag.status === 'open' && (
                  <>
                    {isActing ? (
                      <ConfirmStep
                        title={actionType === 'remove' ? 'Remove Content' : 'Dismiss Flag'}
                        message={
                          actionType === 'remove'
                            ? 'Are you sure you want to remove this item? It will be delisted or hidden immediately.'
                            : 'Dismiss this report? The item will remain visible.'
                        }
                        confirmLabel={actionType === 'remove' ? 'Confirm Removal' : 'Confirm Dismiss'}
                        onConfirm={handleResolve}
                        onCancel={() => {
                          setActionFlag(null);
                          setActionType(null);
                        }}
                        showReason
                        reasonPlaceholder="Admin note (optional)..."
                        danger={actionType === 'remove'}
                      />
                    ) : (
                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.dismissBtn}
                          onClick={() => {
                            setActionFlag(flag);
                            setActionType('dismiss');
                          }}
                        >
                          Keep & Dismiss
                        </button>
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => {
                            setActionFlag(flag);
                            setActionType('remove');
                          }}
                        >
                          Remove Content
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
