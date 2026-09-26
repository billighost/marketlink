import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/me';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import { useNotifications } from '@/context/NotificationContext';
import { useToast } from '@/context/ToastContext';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import EmptyState from '@/components/ui/EmptyState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './ProfileNotifications.module.css';

function getTimeGroup(dateStr) {
  if (!dateStr) return 'Earlier';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Earlier';

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return 'Earlier';
}

function formatNotificationTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function ProfileNotifications() {
  useDocumentTitle('Notifications · MarketLink');

  const navigate = useNavigate();
  const { setCount, refetchCount } = useNotificationCount();
  const { markAllAsRead: markContextAllRead } = useNotifications();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ limit: 50 });
      const items = res?.data || (Array.isArray(res) ? res : []);
      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.readAt && n.unread !== false).length;
  }, [notifications]);

  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString(), unread: false }))
    );
    setCount(0);
    markContextAllRead();

    try {
      await markAllNotificationsRead();
      refetchCount();
      showToast({ message: 'All notifications marked as read.' });
    } catch {
      // rollback or ignore
    }
  };

  const handleItemClick = async (notif) => {
    const id = notif.id || notif._id;
    const isUnread = !notif.readAt && notif.unread !== false;

    if (isUnread && id) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, readAt: new Date().toISOString(), unread: false } : n))
      );
      try {
        await markNotificationRead(id);
        refetchCount();
      } catch {
        // ignore
      }
    }

    // Determine target route
    const target =
      notif.link ||
      (notif.orderId ? `/buyer/orders/${notif.orderId}` : null) ||
      (notif.productId ? `/buyer/products/${notif.productId}` : null) ||
      (notif.farmerId ? `/buyer/stalls/${notif.farmerId}` : null) ||
      (notif.marketId ? `/buyer/markets/${notif.marketId}` : null) ||
      '/buyer';

    navigate(target);
  };

  // Group notifications into Today, Yesterday, Earlier
  const grouped = useMemo(() => {
    const groups = { Today: [], Yesterday: [], Earlier: [] };
    notifications.forEach((notif) => {
      const g = getTimeGroup(notif.createdAt);
      if (groups[g]) {
        groups[g].push(notif);
      } else {
        groups.Earlier.push(notif);
      }
    });
    return groups;
  }, [notifications]);

  const hasAny = notifications.length > 0;

  return (
    <Page width="read">
      <PageTitle
        title="Notifications"
        context="In-app alerts for order updates and market schedules."
        backTo="/buyer"
        backLabel="Back to today"
      />

      <div className={styles.container}>
        {hasAny && (
          <div className={styles.topActions}>
            <span className={styles.unreadCount}>
              {unreadCount > 0 ? `${unreadCount} new` : 'All caught up'}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAllBtn}
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className={styles.panel}>
            <div style={{ height: 80, background: 'var(--color-canvas-soft)' }} />
          </div>
        ) : !hasAny ? (
          <EmptyState
            scene="no-notifications"
            title="Nothing new"
            text="Order updates and restock alerts will appear here."
            actionLabel="Browse produce"
            actionTo="/buyer/products"
          />
        ) : (
          <div>
            {['Today', 'Yesterday', 'Earlier'].map((groupTitle) => {
              const items = grouped[groupTitle];
              if (!items || items.length === 0) return null;

              return (
                <section key={groupTitle} className={styles.group} aria-label={groupTitle}>
                  <h2 className={styles.groupHeading}>{groupTitle}</h2>
                  <div className={styles.panel}>
                    {items.map((notif) => {
                      const id = notif.id || notif._id;
                      const isUnread = !notif.readAt && notif.unread !== false;

                      return (
                        <div
                          key={id}
                          className={styles.item}
                          onClick={() => handleItemClick(notif)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleItemClick(notif);
                          }}
                        >
                          <div className={styles.itemHeader}>
                            <div className={styles.titleRow}>
                              {isUnread && <span className={styles.unreadDot} aria-hidden="true" />}
                              <span
                                className={`${styles.itemTitle} ${isUnread ? styles.itemTitleUnread : ''}`}
                              >
                                {notif.title}
                              </span>
                            </div>
                            <span className={styles.itemTime}>
                              {formatNotificationTime(notif.createdAt)}
                            </span>
                          </div>
                          {notif.message && (
                            <p className={styles.itemMessage}>{notif.message}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
}

export default ProfileNotifications;
