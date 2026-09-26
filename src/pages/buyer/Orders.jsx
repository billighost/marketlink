import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '@/api/orders';
import OrderRow from '@/components/domain/OrderRow';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import styles from './Orders.module.css';

/**
 * Customer Orders page with Active and Past tabs.
 * Connected to live backend keyset pagination.
 */
export function Orders() {
  const [tab, setTab] = useState('active');
  const [orders, setOrders] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchOrdersPage = useCallback(async (tabValue, cursor = null, append = false) => {
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const res = await getOrders({ tab: tabValue, cursor: cursor || undefined, limit: 10 });
      const newOrders = res.data || [];
      const cursorVal = res.meta?.nextCursor || null;

      if (append) {
        setOrders((prev) => [...prev, ...newOrders]);
      } else {
        setOrders(newOrders);
      }
      setNextCursor(cursorVal);
    } catch (err) {
      setError(err.message || 'Unable to load orders');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchOrdersPage(tab);
  }, [tab, fetchOrdersPage]);

  const handleTabChange = (newTab) => {
    if (newTab === tab) return;
    setTab(newTab);
    setOrders([]);
    setNextCursor(null);
  };

  const handleLoadMore = () => {
    if (!nextCursor || loadingMore) return;
    fetchOrdersPage(tab, nextCursor, true);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your orders</h1>
        <SegmentedControl
          name="orders-tab"
          value={tab}
          onChange={handleTabChange}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'past', label: 'Past' },
          ]}
        />
      </header>

      <div className={styles.ordersList}>
        {loading ? (
          <>
            <div className={styles.orderSkeleton} />
            <div className={styles.orderSkeleton} />
          </>
        ) : orders.length > 0 ? (
          <>
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onReorder={() => navigate('/buyer/basket')}
              />
            ))}
            {nextCursor && (
              <button
                type="button"
                className={styles.loadMoreButton}
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading more orders...' : 'Load more orders'}
              </button>
            )}
          </>
        ) : (
          <EmptyState
            illustration="basket-tomatoes"
            title={tab === 'active' ? 'No active orders' : 'No past orders yet'}
            text={
              tab === 'active'
                ? 'When you place a pre-order it shows up here.'
                : 'Collected orders will appear here.'
            }
            actionLabel={tab === 'active' ? 'Browse the market' : undefined}
            onAction={tab === 'active' ? () => navigate('/buyer/products') : undefined}
          />
        )}
      </div>
    </div>
  );
}

export default Orders;
