import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';
import { useAdmin } from '@/layouts/AdminLayout';
import { AdminPage } from '@/components/admin/AdminPage';
import { StatTile } from '@/components/admin/StatTile';
import { DataTable } from '@/components/admin/DataTable';
import { formatDate, formatTime } from '@/utils/format';
import styles from './Overview.module.css';

function formatFreshness(lastUpdated) {
  if (!lastUpdated) return 'updated just now';
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - new Date(lastUpdated).getTime()) / 1000));
  if (diffSec < 60) return 'updated just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return 'updated 1 minute ago';
  if (diffMin < 60) return `updated ${diffMin} minutes ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'updated 1 hour ago';
  return `updated ${diffHours} hours ago`;
}

function formatCurrentDay() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}

export default function Overview() {
  const {
    overview,
    pendingFarmers,
    openFlags,
    unhandledMessages,
    lastUpdated,
    loadingOverview,
    errorOverview,
    refreshOverview,
  } = useAdmin();

  const [refreshing, setRefreshing] = useState(false);
  const [, setTick] = useState(0);

  // Re-derive freshness text every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshOverview();
    } catch {
      // Handled via context errorOverview
    } finally {
      setRefreshing(false);
    }
  };

  const contextLine = useMemo(() => {
    const day = formatCurrentDay();
    const freshness = formatFreshness(lastUpdated);
    return `${day} · ${freshness}`;
  }, [lastUpdated]);

  const nf = useMemo(() => new Intl.NumberFormat('en-US'), []);

  // Action Queue items
  const queueItems = useMemo(() => {
    const items = [];
    if (pendingFarmers > 0) {
      items.push({
        id: 'pending-farmers',
        count: pendingFarmers,
        label: 'Farmers awaiting approval',
        to: '/admin/people?tab=farmers&status=pending',
        ariaLabel: `${pendingFarmers} farmers awaiting approval. Review`,
      });
    }
    if (openFlags > 0) {
      items.push({
        id: 'open-flags',
        count: openFlags,
        label: 'Flagged items in moderation',
        to: '/admin/moderation?status=open',
        ariaLabel: `${openFlags} flagged items in moderation. Review`,
      });
    }
    if (unhandledMessages > 0) {
      items.push({
        id: 'unhandled-messages',
        count: unhandledMessages,
        label: 'Unanswered support messages',
        to: '/admin/settings?tab=messages&status=open',
        ariaLabel: `${unhandledMessages} unanswered support messages. Review`,
      });
    }
    return items;
  }, [pendingFarmers, openFlags, unhandledMessages]);

  const activityRows = useMemo(() => {
    const list = overview?.recentActivity || [];
    return list.slice(0, 10).map((act, idx) => ({
      id: `act-${idx}`,
      when: act.at ? `${formatDate(act.at)} · ${formatTime(act.at)}` : '',
      text: act.text || 'System event recorded',
    }));
  }, [overview?.recentActivity]);

  const activityColumns = useMemo(
    () => [
      {
        key: 'when',
        header: 'When',
        width: '13rem',
        render: (val) => <span className={styles.activityTimeCell}>{val}</span>,
      },
      {
        key: 'text',
        header: 'Activity',
        render: (val) => <span className={styles.activityTextCell}>{val}</span>,
      },
    ],
    []
  );

  const farmersCount = overview?.totals?.farmers ?? 0;
  const customersCount = overview?.totals?.customers ?? 0;
  const marketsCount = overview?.totals?.markets ?? 0;
  const ordersCount = overview?.totals?.orders ?? 0;

  const refreshAction = (
    <button
      type="button"
      className={styles.refreshButton}
      onClick={handleRefresh}
      disabled={refreshing}
      aria-label="Refresh overview metrics"
    >
      <RefreshCw
        size={14}
        className={`${styles.refreshIcon} ${refreshing ? styles.spinning : ''}`}
        aria-hidden="true"
      />
      <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
    </button>
  );

  const isLoadingInitial = loadingOverview && !overview;
  const hasError = Boolean(errorOverview && !overview);

  return (
    <AdminPage title="Overview" context={contextLine} action={refreshAction}>
      <div className={styles.stack}>
        {/* Error State */}
        {hasError && (
          <div className={styles.errorPanel} role="alert">
            <div className={styles.errorLeft}>
              <AlertCircle size={20} className={styles.errorIcon} aria-hidden="true" />
              <div>
                <p className={styles.errorTitle}>Unable to load overview</p>
                <p className={styles.errorMessage}>{errorOverview}</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.retryButton}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Retry
            </button>
          </div>
        )}

        {/* Section 1: Needs your attention (Action Queue) */}
        <section className={styles.section} aria-labelledby="heading-attention">
          <h2 id="heading-attention" className={styles.sectionHeading}>
            Needs your attention
          </h2>

          {isLoadingInitial ? (
            <div className={styles.queueSkeletonBox}>
              <div className={styles.skeletonQueueRow} />
              <div className={styles.skeletonQueueRow} />
            </div>
          ) : queueItems.length > 0 ? (
            <ul className={styles.queueList}>
              {queueItems.map((item) => (
                <li key={item.id} className={styles.queueItem}>
                  <Link to={item.to} className={styles.queueLink} aria-label={item.ariaLabel}>
                    <div className={styles.queueLeft}>
                      <span className={styles.queueCount}>{nf.format(item.count)}</span>
                      <span className={styles.queueLabel}>{item.label}</span>
                    </div>
                    <div className={styles.queueRight}>
                      <span className={styles.queueActionText}>Review</span>
                      <ArrowRight size={16} className={styles.queueArrow} aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.queueQuietBox}>
              <p className={styles.queueQuietText}>Nothing needs attention right now.</p>
            </div>
          )}
        </section>

        {/* Section 2: Platform Metrics */}
        <section className={styles.section} aria-labelledby="heading-platform">
          <h2 id="heading-platform" className={styles.sectionHeading}>
            Platform
          </h2>

          {isLoadingInitial ? (
            <div className={styles.metricsGrid}>
              <div className={styles.skeletonTile} />
              <div className={styles.skeletonTile} />
              <div className={styles.skeletonTile} />
              <div className={styles.skeletonTile} />
            </div>
          ) : (
            <div className={styles.metricsGrid}>
              <StatTile
                value={nf.format(farmersCount)}
                label="Farmers"
                to="/admin/people?tab=farmers"
              />
              <StatTile
                value={nf.format(customersCount)}
                label="Customers"
                to="/admin/people?tab=customers"
              />
              <StatTile
                value={nf.format(marketsCount)}
                label="Markets"
                to="/admin/markets"
              />
              <StatTile
                value={nf.format(ordersCount)}
                label="Orders"
                to="/admin/reports"
              />
            </div>
          )}
        </section>

        {/* Section 3: Recent Activity (Only if feed exists) */}
        {!isLoadingInitial && activityRows.length > 0 && (
          <section className={styles.section} aria-labelledby="heading-activity">
            <div className={styles.sectionHeaderRow}>
              <h2 id="heading-activity" className={styles.sectionHeading}>
                Recent activity
              </h2>
              <Link to="/admin/reports" className={styles.seeReportsLink}>
                <span>See reports</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>

            <DataTable
              columns={activityColumns}
              rows={activityRows}
              rowKey="id"
              empty="No recent activity recorded."
            />
          </section>
        )}
      </div>
    </AdminPage>
  );
}
