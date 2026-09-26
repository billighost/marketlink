import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getFarmerOrders,
  acceptFarmerOrder,
  readyFarmerOrder,
  completeFarmerOrder,
} from '@/api/farmer';
import { useVendor } from '@/layouts/VendorLayout';
import { formatPrice } from '@/utils/format';
import Button from '@/components/ui/Button';
import StatusDot from '@/components/ui/StatusDot';
import Skeleton from '@/components/ui/Skeleton';
import BottomSheet from '@/components/ui/BottomSheet';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Toast from '@/components/ui/Toast';
import OrderDetail from './OrderDetail';
import PickList from './PickList';
import {
  ClipboardList,
  ChevronRight,
  Package,
  ListChecks,
  Search,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Sparkles,
  ArrowRight,
  Calendar,
  Check,
  ShoppingBag,
} from 'lucide-react';
import styles from './Orders.module.css';

const STATUS_TABS = [
  { id: 'placed', label: 'New Requests' },
  { id: 'accepted', label: 'In Packing' },
  { id: 'ready', label: 'Ready for Pickup' },
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

  // Quick Action in progress
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Search by customer or order number
  const [searchTerm, setSearchTerm] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Selected Order for Sheet Modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  // Pick List sheet open state
  const [isPickListOpen, setIsPickListOpen] = useState(false);

  // Check URL params for direct opening (e.g. from Overview or link)
  useEffect(() => {
    const id = searchParams.get('id');
    const tab = searchParams.get('status');
    if (tab && STATUS_TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
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
          limit: 30,
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

  // 1-Click Fast Status Transitions right on the order row!
  const handleQuickStatusTransition = async (e, order, newStatus) => {
    e.stopPropagation();
    setActionInProgressId(order.id);

    try {
      if (newStatus === 'accepted') {
        await acceptFarmerOrder(order.id);
        setToastMessage(`Order ${order.orderNumber} accepted & moved to packing.`);
      } else if (newStatus === 'ready') {
        await readyFarmerOrder(order.id);
        setToastMessage(`Order ${order.orderNumber} marked ready for customer pickup.`);
      } else if (newStatus === 'completed') {
        await completeFarmerOrder(order.id);
        setToastMessage(`Order ${order.orderNumber} fulfilled & completed!`);
      }

      setToastType('success');
      // Optimistically remove from current tab list
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      refreshCounts();
      fetchOrders();
    } catch (err) {
      setToastMessage(`Action failed: ${err?.message || 'Could not update order.'}`);
      setToastType('error');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Filter orders by search term (customer name, order number, items)
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase().trim();

    return orders.filter((ord) => {
      const numMatch = ord.orderNumber?.toLowerCase().includes(term);
      const nameMatch = ord.customerName?.toLowerCase().includes(term);
      const phoneMatch = ord.customerPhone?.includes(term);
      const itemsMatch = (ord.items || []).some((it) => it.name?.toLowerCase().includes(term));
      return numMatch || nameMatch || phoneMatch || itemsMatch;
    });
  }, [orders, searchTerm]);

  // Aggregate operations telemetry
  const telemetry = useMemo(() => {
    const placedCount = getTabCount('placed');
    const acceptedCount = getTabCount('accepted');
    const readyCount = getTabCount('ready');
    const totalActive = placedCount + acceptedCount + readyCount;

    // Total value of currently listed orders
    const tabTotalCents = filteredOrders.reduce((sum, o) => sum + (o.totalCents || 0), 0);

    return {
      placedCount,
      acceptedCount,
      readyCount,
      totalActive,
      tabTotalCents,
    };
  }, [counts, filteredOrders]);

  return (
    <div className={styles.container}>
      {/* Toast notifications */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onDismiss={() => setToastMessage('')}
        />
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeRow}>
            <span className={styles.liveBadge}>
              <span className={styles.pulseDot} /> Live Orders Pipeline
            </span>
            {telemetry.placedCount > 0 && (
              <span className={styles.urgentBadge}>
                {telemetry.placedCount} need confirmation
              </span>
            )}
          </div>
          <h1 className={styles.title}>Pre-Orders & Fulfillment</h1>
          <p className={styles.subtitle}>
            Review customer orders, transition packing states, and execute market pick-ups.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.pickListBtn}
            onClick={() => setIsPickListOpen(true)}
            title="Open aggregated harvest and packing list"
          >
            <ListChecks size={16} aria-hidden="true" />
            <span>Fulfillment Pick List</span>
          </button>
        </div>
      </header>

      {/* Telemetry Strip */}
      <section className={styles.telemetryRow} aria-label="Pipeline overview">
        <div
          className={`${styles.telemetryCard} ${activeTab === 'placed' ? styles.telemetryCardSelected : ''}`}
          onClick={() => setActiveTab('placed')}
          role="button"
          tabIndex={0}
        >
          <div className={styles.cardTop}>
            <span className={styles.cardLabel}>New Unconfirmed</span>
            <span className={`${styles.statusPill} ${telemetry.placedCount > 0 ? styles.pillUrgent : ''}`}>
              {telemetry.placedCount}
            </span>
          </div>
          <span className={styles.cardDesc}>Requires farmer acceptance</span>
        </div>

        <div
          className={`${styles.telemetryCard} ${activeTab === 'accepted' ? styles.telemetryCardSelected : ''}`}
          onClick={() => setActiveTab('accepted')}
          role="button"
          tabIndex={0}
        >
          <div className={styles.cardTop}>
            <span className={styles.cardLabel}>In Packing</span>
            <span className={styles.statusPill}>{telemetry.acceptedCount}</span>
          </div>
          <span className={styles.cardDesc}>Being gathered from field/stall</span>
        </div>

        <div
          className={`${styles.telemetryCard} ${activeTab === 'ready' ? styles.telemetryCardSelected : ''}`}
          onClick={() => setActiveTab('ready')}
          role="button"
          tabIndex={0}
        >
          <div className={styles.cardTop}>
            <span className={styles.cardLabel}>Ready for Pickup</span>
            <span className={`${styles.statusPill} ${styles.pillSuccess}`}>
              {telemetry.readyCount}
            </span>
          </div>
          <span className={styles.cardDesc}>Bagged and waiting at stall</span>
        </div>

        <div className={styles.telemetryCard}>
          <div className={styles.cardTop}>
            <span className={styles.cardLabel}>Stage Revenue</span>
            <span className={styles.stageValue}>{formatPrice(telemetry.tabTotalCents)}</span>
          </div>
          <span className={styles.cardDesc}>{filteredOrders.length} orders in view</span>
        </div>
      </section>

      {/* Search Input for Fast Market Lookups */}
      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Look up order by customer name, #ML-XXXX, phone, or crop..."
          className={styles.searchInput}
          aria-label="Search orders"
        />
        {searchTerm && (
          <button
            type="button"
            className={styles.clearSearchBtn}
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Segmented Status Tabs with Dynamic Badges */}
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
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm('');
              }}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={`${styles.tabBadge} ${tab.id === 'placed' && count > 0 ? styles.tabBadgeUrgent : ''}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className={styles.loadingBox}>
          <Skeleton height="88px" />
          <Skeleton height="88px" />
          <Skeleton height="88px" />
        </div>
      ) : error ? (
        <ErrorState title="Couldn't load orders" text={error} onRetry={() => fetchOrders()} />
      ) : filteredOrders.length === 0 ? (
        <div className={styles.emptyContainer}>
          <EmptyState
            illustration="basket"
            title={searchTerm ? 'No orders match your search' : `No ${STATUS_TABS.find((t) => t.id === activeTab)?.label || ''} Orders`}
            text={
              searchTerm
                ? `No orders matching "${searchTerm}". Try checking the customer's last name or order number.`
                : activeTab === 'placed'
                ? 'All incoming customer orders have been accepted! Check "In Packing".'
                : 'Orders in this stage will appear here as customers place pre-orders.'
            }
          />
        </div>
      ) : (
        <div className={styles.orderList}>
          {filteredOrders.map((order) => {
            const isProcessing = actionInProgressId === order.id;
            const items = order.items || [];
            const customerInitials = order.customerName
              ? order.customerName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'CU';

            return (
              <div
                key={order.id}
                className={styles.orderCard}
                onClick={() => setSelectedOrderId(order.id)}
                role="button"
                tabIndex={0}
                aria-label={`View order ${order.orderNumber} for ${order.customerName}`}
              >
                {/* Left: Customer Avatar & Basic Info */}
                <div className={styles.cardMain}>
                  <div className={styles.avatarWrap}>{customerInitials}</div>

                  <div className={styles.infoCol}>
                    <div className={styles.orderHeaderRow}>
                      <span className={styles.orderNumber}>{order.orderNumber}</span>
                      <span className={styles.bullet}>•</span>
                      <strong className={styles.customerName}>{order.customerName}</strong>
                      {order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.phoneLink}
                          title={`Call ${order.customerPhone}`}
                        >
                          <Phone size={12} />
                        </a>
                      )}
                    </div>

                    {/* Items chips */}
                    <div className={styles.itemsSummaryRow}>
                      {items.slice(0, 3).map((it, idx) => (
                        <span key={idx} className={styles.itemTag}>
                          <strong>{it.quantity}x</strong> {it.name}
                        </span>
                      ))}
                      {items.length > 3 && (
                        <span className={styles.itemMoreTag}>+{items.length - 3} more</span>
                      )}
                    </div>

                    {/* Pickup Slot & Status Details */}
                    <div className={styles.slotRow}>
                      <div className={styles.pickupPill}>
                        <Clock size={12} className={styles.slotClockIcon} />
                        <span>
                          {order.pickup?.windowLabel || order.pickup?.dayLabel || 'Market pickup scheduled'}
                        </span>
                      </div>
                      {order.notes && (
                        <span className={styles.notesPill} title={order.notes}>
                          Note: {order.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Total Price & 1-Click Operations */}
                <div className={styles.cardActionsCol}>
                  <div className={styles.priceTag}>
                    <span className={styles.totalAmount}>{formatPrice(order.totalCents)}</span>
                    <span className={styles.itemsCount}>{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                  </div>

                  <div className={styles.actionButtonsRow}>
                    {/* Direct 1-Click Action for Placed Orders */}
                    {activeTab === 'placed' && (
                      <button
                        type="button"
                        className={styles.quickAcceptBtn}
                        onClick={(e) => handleQuickStatusTransition(e, order, 'accepted')}
                        disabled={isProcessing}
                        title="Accept order into packing pipeline"
                      >
                        <Check size={14} />
                        <span>{isProcessing ? 'Accepting...' : 'Accept Order'}</span>
                      </button>
                    )}

                    {/* Direct 1-Click Action for Accepted Orders */}
                    {activeTab === 'accepted' && (
                      <button
                        type="button"
                        className={styles.quickReadyBtn}
                        onClick={(e) => handleQuickStatusTransition(e, order, 'ready')}
                        disabled={isProcessing}
                        title="Mark packed & ready at stall"
                      >
                        <Package size={14} />
                        <span>{isProcessing ? 'Updating...' : 'Mark Ready'}</span>
                      </button>
                    )}

                    {/* Direct 1-Click Action for Ready Orders */}
                    {activeTab === 'ready' && (
                      <button
                        type="button"
                        className={styles.quickCompleteBtn}
                        onClick={(e) => handleQuickStatusTransition(e, order, 'completed')}
                        disabled={isProcessing}
                        title="Confirm handed to customer"
                      >
                        <CheckCircle size={14} />
                        <span>{isProcessing ? 'Completing...' : 'Complete Pickup'}</span>
                      </button>
                    )}

                    {/* View Details chevron button */}
                    <button
                      type="button"
                      className={styles.detailsIconBtn}
                      onClick={() => setSelectedOrderId(order.id)}
                      aria-label="View full order details"
                      title="View details"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
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
          title="Customer Order Details"
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
          title="Harvest & Packing Pick List"
        >
          <PickList />
        </BottomSheet>
      )}
    </div>
  );
}

export default Orders;
