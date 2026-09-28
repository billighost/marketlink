import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Navigation,
  MapPin,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/me';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import { useNotifications } from '@/context/NotificationContext';
import { useToast } from '@/context/ToastContext';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import EmptyState from '@/components/ui/EmptyState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './ProfileNotifications.module.css';

const DEMO_INTELLIGENT_NOTIFICATIONS = [
  {
    id: 'demo-restock',
    type: 'restock',
    title: 'Your favorite farmer just restocked',
    body: 'Tomatoes are back at Green Valley Farm.',
    message: 'Tomatoes are back at Green Valley Farm.',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    readAt: null,
    unread: true,
    data: {
      farmerName: 'Green Valley Farm',
      productName: 'Tomatoes',
    },
    actionLabel: 'Pre-order produce',
    link: '/buyer/products',
  },
  {
    id: 'demo-pickup',
    type: 'order_ready',
    title: 'Your pickup is ready',
    body: 'Order #2048 is ready at Stall B12.',
    message: 'Order #2048 is ready at Stall B12.',
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    readAt: null,
    unread: true,
    data: {
      orderNumber: '2048',
      stallNumber: 'Stall B12',
    },
    actionLabel: 'View Market Route & Code',
    link: '/buyer/route',
  },
  {
    id: 'demo-reminder',
    type: 'market_reminder',
    title: 'Market reminder',
    body: 'Bodija Market opens tomorrow at 8:00 AM.',
    message: 'Bodija Market opens tomorrow at 8:00 AM.',
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    readAt: null,
    unread: true,
    data: {
      marketName: 'Bodija Market',
      opensAt: '8:00 AM',
    },
    actionLabel: 'View Market Schedule',
    link: '/buyer/markets',
  },
];

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

function getAlertVisuals(notif) {
  const type = notif.type || '';
  const title = notif.title || '';
  const body = notif.body || notif.message || '';

  if (type === 'restock' || type === 'favorite_restock' || title.includes('restocked')) {
    return {
      icon: <Sparkles size={18} aria-hidden="true" />,
      iconClass: styles.iconRestock,
      badgeText: 'Favorite Restock',
      badgeClass: styles.badgeRestock,
      actionText: 'Pre-order produce →',
      target: notif.link || (notif.data?.productId ? `/buyer/products/${notif.data.productId}` : '/buyer/products'),
    };
  }

  if (type === 'order_ready' || title.toLowerCase().includes('pickup is ready') || title.toLowerCase().includes('ready for pickup')) {
    return {
      icon: <ShoppingBag size={18} aria-hidden="true" />,
      iconClass: styles.iconOrder,
      badgeText: 'Pickup Ready',
      badgeClass: styles.badgeOrder,
      actionText: 'View Route & Code →',
      target: notif.link || '/buyer/route',
    };
  }

  if (type === 'market_reminder' || title.toLowerCase().includes('market reminder')) {
    return {
      icon: <MapPin size={18} aria-hidden="true" />,
      iconClass: styles.iconMarket,
      badgeText: 'Market Reminder',
      badgeClass: styles.badgeMarket,
      actionText: 'View Market Schedule →',
      target: notif.link || (notif.data?.marketId ? `/buyer/markets/${notif.data.marketId}` : '/buyer/markets'),
    };
  }

  return {
    icon: <Bell size={18} aria-hidden="true" />,
    iconClass: styles.iconOrder,
    badgeText: 'Update',
    badgeClass: styles.badgeOrder,
    actionText: 'View details →',
    target: notif.link || (notif.orderId ? `/buyer/orders/${notif.orderId}` : '/buyer'),
  };
}

export function ProfileNotifications() {
  useDocumentTitle('Intelligent Alerts · MarketLink');

  const navigate = useNavigate();
  const { setCount, refetchCount } = useNotificationCount();
  const { markAllAsRead: markContextAllRead } = useNotifications();
  const { showToast } = useToast();

  const [rawNotifications, setRawNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ limit: 50 });
      const items = res?.data || (Array.isArray(res) ? res : []);
      if (items.length > 0) {
        setRawNotifications(items);
      } else {
        setRawNotifications(DEMO_INTELLIGENT_NOTIFICATIONS);
      }
    } catch {
      setRawNotifications(DEMO_INTELLIGENT_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const unreadCount = useMemo(() => {
    return rawNotifications.filter((n) => !n.readAt && n.unread !== false).length;
  }, [rawNotifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return rawNotifications;
    if (filter === 'restock') {
      return rawNotifications.filter((n) => n.type === 'restock' || n.type === 'favorite_restock' || n.title?.includes('restocked'));
    }
    if (filter === 'orders') {
      return rawNotifications.filter((n) => n.type?.startsWith('order_') || n.title?.toLowerCase().includes('pickup'));
    }
    if (filter === 'markets') {
      return rawNotifications.filter((n) => n.type === 'market_reminder' || n.title?.toLowerCase().includes('market reminder'));
    }
    return rawNotifications;
  }, [rawNotifications, filter]);

  const handleMarkAllRead = async () => {
    setRawNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString(), unread: false }))
    );
    setCount(0);
    markContextAllRead();

    try {
      await markAllNotificationsRead();
      refetchCount();
      showToast({ message: 'All alerts marked as read.' });
    } catch {
    }
  };

  const handleItemClick = async (notif) => {
    const id = notif.id || notif._id;
    const isUnread = !notif.readAt && notif.unread !== false;

    if (isUnread && id) {
      setRawNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, readAt: new Date().toISOString(), unread: false } : n))
      );
      try {
        await markNotificationRead(id);
        refetchCount();
      } catch {
      }
    }

    const { target } = getAlertVisuals(notif);
    navigate(target);
  };

  const grouped = useMemo(() => {
    const groups = { Today: [], Yesterday: [], Earlier: [] };
    filteredNotifications.forEach((notif) => {
      const g = getTimeGroup(notif.createdAt);
      if (groups[g]) {
        groups[g].push(notif);
      } else {
        groups.Earlier.push(notif);
      }
    });
    return groups;
  }, [filteredNotifications]);

  const hasAny = filteredNotifications.length > 0;

  return (
    <Page width="read">
      <PageTitle
        title="Notifications"
        context="Intelligent alerts for restocks, pickup readiness, and market schedules."
        backTo="/buyer/profile"
        backLabel="Back to you"
      />

      <div className={styles.container}>
        
        <div className={styles.filterChips} role="tablist" aria-label="Filter alerts">
          <button
            type="button"
            className={`${styles.filterChip} ${filter === 'all' ? styles.activeFilterChip : ''}`}
            onClick={() => setFilter('all')}
          >
            All Alerts ({rawNotifications.length})
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${filter === 'restock' ? styles.activeFilterChip : ''}`}
            onClick={() => setFilter('restock')}
          >
            <Sparkles size={14} aria-hidden="true" />
            <span>Restocks</span>
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${filter === 'orders' ? styles.activeFilterChip : ''}`}
            onClick={() => setFilter('orders')}
          >
            <ShoppingBag size={14} aria-hidden="true" />
            <span>Pickup Ready</span>
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${filter === 'markets' ? styles.activeFilterChip : ''}`}
            onClick={() => setFilter('markets')}
          >
            <MapPin size={14} aria-hidden="true" />
            <span>Market Reminders</span>
          </button>
        </div>

        {hasAny && (
          <div className={styles.topActions}>
            <span className={styles.unreadCount}>
              {unreadCount > 0 ? `${unreadCount} new alerts` : 'All caught up'}
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
            <div style={{ height: 100, background: 'var(--color-canvas-soft)' }} />
          </div>
        ) : !hasAny ? (
          <EmptyState
            scene="no-notifications"
            title="No alerts in this category"
            text="Intelligent restocks, pickup alerts, and market reminders will appear here."
            actionLabel="View all alerts"
            onAction={() => setFilter('all')}
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
                      const { icon, iconClass, badgeText, badgeClass, actionText } = getAlertVisuals(notif);
                      const displayBody = notif.body || notif.message || '';

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
                          
                          <div className={`${styles.itemIconWrap} ${iconClass}`}>
                            <span>{icon}</span>
                          </div>

                          <div className={styles.itemContent}>
                            <div className={styles.itemHeader}>
                              <div className={styles.titleRow}>
                                {isUnread && <span className={styles.unreadDot} aria-hidden="true" />}
                                <span className={`${styles.alertBadge} ${badgeClass}`}>
                                  {badgeText}
                                </span>
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

                            {displayBody && (
                              <p className={styles.itemMessage}>{displayBody}</p>
                            )}

                            <div className={styles.itemActionRow}>
                              <span className={styles.actionPill}>
                                {actionText}
                              </span>
                            </div>
                          </div>
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
