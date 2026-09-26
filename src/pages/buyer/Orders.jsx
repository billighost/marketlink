import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getOrders } from '@/api/orders';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import OrderRow from '@/components/domain/OrderRow';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Orders.module.css';

/**
 * Customer Orders index page (/buyer/orders).
 * Shows Active and Past tabs, persisted in the URL query string (?tab=past).
 * Zero beet elements — navigation and inspection only.
 */
export function Orders() {
  useDocumentTitle('Orders · MarketLink');
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'past' ? 'past' : 'active';

  const [orders, setOrders] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [counts, setCounts] = useState({ active: 0, past: 0 });

  // Load counts for both tabs
  useEffect(() => {
    let active = true;
    Promise.all([
      getOrders({ tab: 'active', limit: 50 }).catch(() => ({ data: [] })),
      getOrders({ tab: 'past', limit: 50 }).catch(() => ({ data: [] })),
    ]).then(([activeRes, pastRes]) => {
      if (active) {
        setCounts({
          active: activeRes?.data?.length ?? 0,
          past: pastRes?.data?.length ?? 0,
        });
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Fetch page of orders for current tab
  const fetchTabOrders = useCallback(async (tab, cursor = null, append = false) => {
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await getOrders({ tab, cursor: cursor || undefined, limit: 10 });
      const newOrders = res.data || [];
      const nextC = res.meta?.nextCursor || null;

      if (append) {
        setOrders((prev) => [...prev, ...newOrders]);
      } else {
        setOrders(newOrders);
      }
      setNextCursor(nextC);
    } catch {
      if (!append) setOrders([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchTabOrders(currentTab);
  }, [currentTab, fetchTabOrders]);

  const handleTabChange = (newTab) => {
    if (newTab === currentTab) return;
    setSearchParams(newTab === 'past' ? { tab: 'past' } : {}, { replace: true });
    setOrders([]);
    setNextCursor(null);
  };

  const handleLoadMore = () => {
    if (!nextCursor || loadingMore) return;
    fetchTabOrders(currentTab, nextCursor, true);
  };

  const subtitle = `${counts.active} active · ${counts.past} past`;

  return (
    <Page width="detail" className={styles.page}>
      <PageTitle
        title="Orders"
        context={subtitle}
      />

      <div className={styles.tabsWrap}>
        <SegmentedControl
          name="orders-tab"
          value={currentTab}
          onChange={handleTabChange}
          options={[
            { value: 'active', label: `Active (${counts.active})` },
            { value: 'past', label: `Past (${counts.past})` },
          ]}
        />
      </div>

      <div className={styles.listSection}>
        {loading ? (
          <div className={styles.skeletonList}>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </div>
        ) : orders.length > 0 ? (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}

            {nextCursor && (
              <div className={styles.loadMoreRow}>
                <button
                  type="button"
                  className={styles.loadMoreBtn}
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading…' : 'Show older orders'}
                </button>
              </div>
            )}
          </div>
        ) : currentTab === 'active' ? (
          <div className={styles.emptyWrap}>
            <EmptyState
              scene="no-orders-yet"
              title="No orders waiting"
              text="Reserve produce from a stall and it will appear here."
              actionLabel="Browse produce"
              actionTo="/buyer/products"
            />
          </div>
        ) : (
          <div className={styles.emptyWrap}>
            <EmptyState
              scene="no-orders-yet"
              title="No past orders yet"
              text="Collected and cancelled orders will appear here."
            />
          </div>
        )}
      </div>
    </Page>
  );
}

export default Orders;
