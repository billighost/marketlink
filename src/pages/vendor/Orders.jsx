import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFarmerOrders } from '@/api/farmer';
import { useVendor } from '@/layouts/VendorLayout';
import { formatPrice } from '@/utils/format';
import Button from '@/components/ui/Button';
import StatusDot from '@/components/ui/StatusDot';
import Skeleton from '@/components/ui/Skeleton';
import BottomSheet from '@/components/ui/BottomSheet';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import OrderDetail from './OrderDetail';
import PickList from './PickList';
import { ClipboardList, ChevronRight, Package, ListChecks } from 'lucide-react';
import styles from './Orders.module.css';

const STATUS_TABS = [
  { id: 'placed', label: 'New' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'ready', label: 'Ready for pickup' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshCounts } = useVendor();

  const [activeTab, setActiveTab] = useState('placed');
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  // Selected Order for Sheet Modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  // Pick List sheet open state
  const [isPickListOpen, setIsPickListOpen] = useState(false);

  // Check URL params for direct opening (e.g. from Overview or link)
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSelectedOrderId(id);
    }
  }, [searchParams]);

  const fetchOrders = useCallback(
    async (cursor = null, isLoadMore = false) => {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);
      setError('');

      try {
        const query = {
          status: activeTab,
          limit: 20,
        };
        if (cursor) query.cursor = cursor;

        const res = await getFarmerOrders(query);
        const list = res?.data || [];
        const meta = res?.meta || {};

        setOrders((prev) => (isLoadMore ? [...prev, ...list] : list));
        setNextCursor(meta.nextCursor || null);
        setHasMore(Boolean(meta.hasMore));
        if (meta.counts) {
          setCounts(meta.counts);
        }
      } catch (err) {
        setError(err?.message || 'Failed to load pre-orders.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCloseOrderSheet = () => {
    setSelectedOrderId(null);
    if (searchParams.get('id')) {
      setSearchParams({}, { replace: true });
    }
  };

  const getTabCount = (tabId) => {
    if (!counts) return 0;
    if (tabId === 'cancelled') {
      return (counts.cancelled || 0) + (counts.declined || 0);
    }
    return counts[tabId] || 0;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Orders</h1>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setIsPickListOpen(true)}
          className={styles.pickListBtn}
        >
          <ListChecks size={16} aria-hidden="true" />
          <span>Pick list</span>
        </Button>
      </div>

      {/* Segmented Status Tabs with Counts */}
      <div className={styles.tabsContainer} role="tablist" aria-label="Order status categories">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = getTabCount(tab.id);

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
              {count > 0 && <span className={styles.tabBadge}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className={styles.loadingBox}>
          <Skeleton height="72px" />
          <Skeleton height="72px" />
          <Skeleton height="72px" />
        </div>
      ) : error ? (
        <ErrorState title="Couldn't load this" text={error} onRetry={() => fetchOrders()} />
      ) : orders.length === 0 ? (
        <EmptyState
          illustration="basket"
          title="Nothing here"
          text="Orders in this stage will appear here."
        />
      ) : (
        <div className={styles.orderList}>
          {orders.map((order) => {
            const itemsSummary = (order.items || [])
              .map((it) => `${it.quantity}x ${it.name}`)
              .join(', ');

            return (
              <div
                key={order.id}
                className={styles.orderRow}
                onClick={() => setSelectedOrderId(order.id)}
                role="button"
                tabIndex={0}
                aria-label={`View order ${order.orderNumber} for ${order.customerName}`}
              >
                <div className={styles.orderLeft}>
                  <div className={styles.orderIdRow}>
                    <strong className={styles.orderNumber}>{order.orderNumber}</strong>
                    <span className={styles.customerName}>{order.customerName}</span>
                  </div>

                  <div className={styles.summaryText} title={itemsSummary}>
                    {itemsSummary}
                  </div>

                  <div className={styles.slotRow}>
                    <StatusDot status={order.status === 'declined' ? 'cancelled' : order.status} />
                    <span>
                      {order.pickup?.windowLabel || order.pickup?.dayLabel || 'Scheduled pickup'}
                    </span>
                  </div>
                </div>

                <div className={styles.orderRight}>
                  <span className={styles.total}>{formatPrice(order.totalCents)}</span>
                  <ChevronRight size={18} className={styles.chevron} aria-hidden="true" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className={styles.loadMoreWrapper}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => fetchOrders(nextCursor, true)}
            loading={loadingMore}
            disabled={loadingMore}
          >
            Load more orders
          </Button>
        </div>
      )}

      {/* Order Detail Sheet */}
      {selectedOrderId && (
        <BottomSheet
          isOpen={Boolean(selectedOrderId)}
          onClose={handleCloseOrderSheet}
          size="tall"
          title="Order Details"
        >
          <OrderDetail
            orderId={selectedOrderId}
            onClose={handleCloseOrderSheet}
            onUpdated={() => {
              fetchOrders();
              refreshCounts();
            }}
          />
        </BottomSheet>
      )}

      {/* Pick List Sheet */}
      {isPickListOpen && (
        <BottomSheet
          isOpen={isPickListOpen}
          onClose={() => setIsPickListOpen(false)}
          size="tall"
          title="Fulfillment Pick List"
        >
          <PickList />
        </BottomSheet>
      )}
    </div>
  );
}

export default Orders;
