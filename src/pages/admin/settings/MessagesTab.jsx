import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminMessages, handleAdminMessage, deleteAdminMessage } from '@/api/admin';
import { useAdmin } from '@/layouts/AdminLayout';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { formatDateShort } from '@/utils/format';
import { Trash2 } from 'lucide-react';
import styles from './MessagesTab.module.css';

export default function MessagesTab() {
  const { showToast } = useToast();
  const { refreshOverview } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = searchParams.get('status') === 'handled' ? 'handled' : 'open';
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyInputs, setReplyInputs] = useState({});
  const [handlingId, setHandlingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMessagesList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminMessages();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setMessages(list);
    } catch (err) {
      showToast(err.message || 'Failed to load support messages', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMessagesList();
  }, [fetchMessagesList]);

  const openMessages = messages.filter((m) => m.status !== 'handled');
  const handledMessages = messages.filter((m) => m.status === 'handled');
  const activeList = statusParam === 'handled' ? handledMessages : openMessages;

  const handleSubTabChange = (status) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'messages');
        next.set('status', status);
        return next;
      },
      { replace: true }
    );
  };

  const handleReplyChange = (id, text) => {
    setReplyInputs((prev) => ({ ...prev, [id]: text }));
  };

  const handleMarkHandled = async (msg) => {
    const reply = replyInputs[msg.id] || '';
    setHandlingId(msg.id);
    try {
      await handleAdminMessage(msg.id, reply);
      showToast('Message handled.', 'success');
      setReplyInputs((prev) => {
        const copy = { ...prev };
        delete copy[msg.id];
        return copy;
      });
      // CRITICAL: Refresh overview so sidebar badge drops without reload!
      if (refreshOverview) {
        await refreshOverview();
      }
      await fetchMessagesList();
    } catch (err) {
      showToast(err.message || 'Failed to handle message', 'error');
    } finally {
      setHandlingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminMessage(deleteTarget.id);
      showToast('Support message deleted.', 'success');
      setDeleteTarget(null);
      if (refreshOverview) {
        await refreshOverview();
      }
      await fetchMessagesList();
    } catch (err) {
      showToast(err.message || 'Failed to delete message', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.subTabs} role="tablist" aria-label="Support message status">
        <button
          type="button"
          role="tab"
          aria-selected={statusParam === 'open'}
          className={`${styles.subTabBtn} ${statusParam === 'open' ? styles.subTabBtnActive : ''}`}
          onClick={() => handleSubTabChange('open')}
        >
          <span>Open</span>
          <span className={styles.badgeCount}>{openMessages.length}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusParam === 'handled'}
          className={`${styles.subTabBtn} ${statusParam === 'handled' ? styles.subTabBtnActive : ''}`}
          onClick={() => handleSubTabChange('handled')}
        >
          <span>Handled</span>
          <span className={styles.badgeCount}>{handledMessages.length}</span>
        </button>
      </div>

      <div className={styles.messageList} role="list" aria-label={`${statusParam} support messages`}>
        {loading ? (
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--text-sm)' }}>Loading messages...</p>
        ) : activeList.length === 0 ? (
          <p style={{ color: 'var(--color-ink-soft)', fontSize: 'var(--text-sm)' }}>
            No {statusParam} messages at this time.
          </p>
        ) : (
          activeList.map((msg) => (
            <div key={msg.id} className={styles.card} role="listitem">
              <div className={styles.header}>
                <div className={styles.senderInfo}>
                  <span className={styles.senderName}>{msg.name}</span>
                  <span>·</span>
                  <span>{msg.email}</span>
                  <span>·</span>
                  <span>{formatDateShort(msg.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  {msg.orderNumber && <span className={styles.orderBadge}>Order #{msg.orderNumber}</span>}
                  <span className={styles.topicBadge}>{msg.topic || 'General'}</span>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => setDeleteTarget(msg)}
                    title="Delete message"
                    aria-label={`Delete message from ${msg.name}`}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <p className={styles.body}>{msg.message}</p>

              {statusParam === 'open' ? (
                <div className={styles.replySection}>
                  <textarea
                    className={styles.replyTextarea}
                    placeholder="Type an internal resolution note or reply to record..."
                    value={replyInputs[msg.id] || ''}
                    onChange={(e) => handleReplyChange(msg.id, e.target.value)}
                  />
                  <p className={styles.emailTruthNotice}>
                    Note: Resolution notes are recorded in the platform audit log but not emailed to the sender.
                  </p>
                  <div className={styles.replyActions}>
                    <a
                      href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.topic || 'MarketLink Support'}`)}`}
                      className={styles.mailtoLink}
                    >
                      Email {msg.email} directly
                    </a>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={handlingId === msg.id}
                      onClick={() => handleMarkHandled(msg)}
                    >
                      Record reply & mark handled
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={styles.handledMeta}>
                  <span className={styles.handledByText}>
                    Handled {msg.handledAt ? formatDateShort(msg.handledAt) : 'previously'}
                  </span>
                  {msg.reply && <div className={styles.handledNote}>Recorded Note: {msg.reply}</div>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          title="Delete Support Inquiry?"
          body={`Are you sure you want to permanently delete this message from ${deleteTarget.name} (${deleteTarget.email})?`}
          confirmLabel="Delete Message"
          variant="danger"
          isLoading={deleting}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
