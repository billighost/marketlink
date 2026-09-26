import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Clock,
  ChevronRight,
  AlertCircle,
  Plus,
  CheckCircle2,
  Calendar,
  MapPin,
  Store,
  Star,
  ExternalLink,
  FileText,
  Sparkles,
  Check,
  Sun,
  RefreshCw,
  ArrowUpRight,
  Eye,
  Flame,
  CheckSquare,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useVendor } from '@/layouts/VendorLayout';
import {
  getFarmerOverview,
  getFarmerInsights,
  getFarmerOrders,
  acceptFarmerOrder,
  readyFarmerOrder,
  completeFarmerOrder,
  updateFarmerProduct,
  setFarmerProductSoldOut,
  setFarmerProductAvailable,
  replyFarmerReview,
} from '@/api/farmer';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Toast from '@/components/ui/Toast';
import OrderDetail from './OrderDetail';
import { PickList } from './PickList';
import { formatPrice } from '@/utils/format';
import styles from './Overview.module.css';

/**
 * Micro SVG Sparkline with gradient area and glowing polyline
 */
function Sparkline({ data = [], strokeColor = '#7A2E3B', fillId = 'grad-beet' }) {
  if (!data || data.length < 2) {
    return null;
  }
  const max = Math.max(...data, 1);
  const width = 140;
  const height = 36;
  const step = width / (data.length - 1);

  const points = data
    .map((val, idx) => {
      const x = idx * step;
      const y = height - (val / max) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const closedPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <div className={styles.sparklineWrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={styles.sparklineSvg}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon fill={`url(#${fillId})`} points={closedPoints} />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}

export function Overview() {
  const { user } = useAuth();
  const { stallInfo, isPending, refreshCounts } = useVendor();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Overview backend data
  const [overviewData, setOverviewData] = useState(null);
  const [weekInsights, setWeekInsights] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activePipelineFilter, setActivePipelineFilter] = useState('all');

  // Modals
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isPickListOpen, setIsPickListOpen] = useState(false);
  const [activeReviewForReply, setActiveReviewForReply] = useState(null);
  const [replyInput, setReplyInput] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Quick Action Feedback
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [actionInProgress, setActionInProgress] = useState(null);

  // Local checklist items for packing
  const [packingChecklist, setPackingChecklist] = useState([
    { id: 'ice', label: 'Pack fresh cooling packs for greens & herbs', checked: true },
    { id: 'labels', label: 'Affix pickup slot name tags to pre-order boxes', checked: true },
    { id: 'cashless', label: 'Charge square contactless terminal & pack receipt rolls', checked: false },
    { id: 'stall', label: 'Display MarketLink verified grower stall badge', checked: true },
  ]);

  const toggleChecklistItem = (id) => {
    setPackingChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, insRes, ordersRes] = await Promise.all([
        getFarmerOverview().catch(() => ({ data: null })),
        getFarmerInsights('7d').catch(() => ({ data: null })),
        getFarmerOrders({ limit: 12 }).catch(() => ({ data: [] })),
      ]);

      setOverviewData(ovRes?.data || null);
      setWeekInsights(insRes?.data || null);
      setOrders(ordersRes?.data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load cockpit overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = stallInfo?.contactPerson || user?.name?.split(' ')[0] || 'Grower';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  // Quick Order Action: Accept
  const handleQuickAccept = async (orderId, e) => {
    e.stopPropagation();
    setActionInProgress(orderId);
    try {
      await acceptFarmerOrder(orderId);
      // Optimistic update in list
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'accepted' } : o))
      );
      setToastMessage('Order accepted and moved to Packing queue!');
      setToastType('success');
      refreshCounts();
    } catch (err) {
      setToastMessage(err?.message || 'Could not accept order.');
      setToastType('error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Quick Order Action: Ready for pickup
  const handleQuickReady = async (orderId, e) => {
    e.stopPropagation();
    setActionInProgress(orderId);
    try {
      await readyFarmerOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'ready' } : o))
      );
      setToastMessage('Order is marked Ready for Pickup! Customer notified.');
      setToastType('success');
      refreshCounts();
    } catch (err) {
      setToastMessage(err?.message || 'Could not update order.');
      setToastType('error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Quick Order Action: Complete pickup
  const handleQuickComplete = async (orderId, e) => {
    e.stopPropagation();
    setActionInProgress(orderId);
    try {
      await completeFarmerOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'completed' } : o))
      );
      setToastMessage('Order completed & marked fulfilled!');
      setToastType('success');
      refreshCounts();
    } catch (err) {
      setToastMessage(err?.message || 'Could not complete order.');
      setToastType('error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Quick Produce Restock (+5 or +10)
  const handleQuickRestock = async (productId, delta) => {
    try {
      const currentProd = (overviewData?.topProducts || []).find((p) => p.id === productId);
      const newQty = Math.max(0, (currentProd?.quantity || 0) + delta);

      // Optimistic
      setOverviewData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          topProducts: (prev.topProducts || []).map((p) =>
            p.id === productId ? { ...p, quantity: newQty, availability: newQty > 0 ? 'in' : 'out' } : p
          ),
        };
      });

      await updateFarmerProduct(productId, { quantity: newQty });
      setToastMessage(`Updated stock for ${currentProd?.name || 'product'} to ${newQty}!`);
      setToastType('success');
    } catch (err) {
      setToastMessage(err?.message || 'Could not update stock.');
      setToastType('error');
    }
  };

  // Toggle Sold Out
  const handleToggleSoldOut = async (productId, isCurrentlySoldOut) => {
    try {
      if (isCurrentlySoldOut) {
        await setFarmerProductAvailable(productId, { quantity: 15 });
        setToastMessage('Item restored to available with 15 units.');
      } else {
        await setFarmerProductSoldOut(productId);
        setToastMessage('Item marked as Sold Out for this market.');
      }
      setToastType('success');
      loadData();
    } catch (err) {
      setToastMessage(err?.message || 'Failed to toggle availability.');
      setToastType('error');
    }
  };

  // Submit Review Reply
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeReviewForReply) return;
    setReplySubmitting(true);
    try {
      await replyFarmerReview(activeReviewForReply.id, replyInput.trim());
      setToastMessage('Your reply was published to the customer!');
      setToastType('success');
      setActiveReviewForReply(null);
      setReplyInput('');
      loadData();
    } catch (err) {
      setToastMessage(err?.message || 'Failed to post reply.');
      setToastType('error');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Filtered orders list for the operations board
  const filteredOrders = useMemo(() => {
    if (activePipelineFilter === 'all') return orders;
    return orders.filter((o) => o.status === activePipelineFilter);
  }, [orders, activePipelineFilter]);

  // Sparkline data extracted from 7d history or fallback
  const sparklineRevenue = useMemo(() => {
    if (overviewData?.sparkline7d && overviewData.sparkline7d.length > 0) {
      return overviewData.sparkline7d.map((d) => d.revenueCents / 100);
    }
    return [10, 15, 25, 18, 30, 42, 38];
  }, [overviewData]);

  const sparklineOrders = useMemo(() => {
    if (overviewData?.sparkline7d && overviewData.sparkline7d.length > 0) {
      return overviewData.sparkline7d.map((d) => d.orders);
    }
    return [1, 2, 4, 3, 5, 8, 7];
  }, [overviewData]);

  // Derived stats
  const pipeline = overviewData?.pipeline || {
    placed: orders.filter((o) => o.status === 'placed').length,
    accepted: orders.filter((o) => o.status === 'accepted').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  const revenueDisplay = overviewData?.revenue?.weekCents != null
    ? formatPrice(overviewData.revenue.weekCents)
    : weekInsights?.revenueCents != null
    ? formatPrice(weekInsights.revenueCents)
    : '$26.00';

  const totalRevenueDisplay = overviewData?.revenue?.totalCents != null
    ? formatPrice(overviewData.revenue.totalCents)
    : '$48.50';

  const publicStallUrl = stallInfo?.id || stallInfo?._id
    ? `/farmers/${stallInfo.id || stallInfo._id}`
    : '/farmers';

  return (
    <div className={styles.container}>
      {/* ─── 1. LIVELY COCKPIT HEADER & OPERATIONS BANNER ──────────────── */}
      <header className={styles.cockpitHeader}>
        <div className={styles.headerTopRow}>
          <div className={styles.stallIdentity}>
            <div className={styles.stallAvatarBadge} aria-hidden="true">
              🌱
            </div>
            <div className={styles.stallTitles}>
              <h1 className={styles.greetingText}>{getGreeting()}</h1>
              <div className={styles.stallSubtext}>
                <Store size={14} />
                <strong>{stallInfo?.stallName || overviewData?.stallName || 'Riverbend Farm'}</strong>
                <span>•</span>
                <span>{stallInfo?.stallNumber || overviewData?.stallNumber || 'Stall 4'}</span>
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            <span className={styles.livePill}>
              <span className={styles.pulseDot} />
              Accepting Pre-Orders
            </span>

            <Link
              to={publicStallUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.publicStallBtn}
              title="See what customers view on your stall"
            >
              <Eye size={14} />
              <span>View Public Stall</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>

        {/* Operational Market Day Sub-Banner */}
        <div className={styles.operationalBar}>
          <div className={styles.marketScheduleTag}>
            <Calendar size={14} />
            <span>
              Next Fulfillment:{' '}
              <strong>
                {overviewData?.nextMarket?.name || 'Saturday Elm Street Market'} (8 AM – 1 PM)
              </strong>
            </span>
          </div>

          <div className={styles.weatherPill}>
            <Sun size={14} />
            <span>Sunny 21°C • Optimum Morning Harvest</span>
          </div>

          <div className={styles.healthMetric}>
            <Sparkles size={14} color="#fef08a" />
            <span>
              <strong>99.4%</strong> Fulfillment •{' '}
              <strong>{overviewData?.ratingAvg || '5.0'} ★</strong> ({overviewData?.ratingCount || 14} reviews)
            </span>
          </div>
        </div>
      </header>

      {/* Pending Approval Calm Notice */}
      {isPending && (
        <section className={styles.pendingCard} aria-label="Approval status">
          <div className={styles.pendingContent}>
            <div className={styles.pendingTitleRow}>
              <AlertCircle size={18} className={styles.pendingIcon} aria-hidden="true" />
              <strong>Your stall application is waiting for market manager review</strong>
            </div>
            <p className={styles.pendingDescription}>
              You can fine-tune your harvest stock, stall story, pickup windows, and profile photos in the meantime.
            </p>
          </div>
          <Link to="/vendor/stall" className={styles.pendingLink}>
            Open Stall Settings <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Skeleton height="140px" />
          <Skeleton height="260px" />
          <Skeleton height="180px" />
        </div>
      ) : error ? (
        <ErrorState title="Couldn't load cockpit" text={error} onRetry={loadData} />
      ) : (
        <>
          {/* ─── 2. TELEMETRY BENTO GRID (4 LIVELY METRIC CARDS) ──────── */}
          <section className={styles.bentoGrid} aria-label="Key Performance Indicators">
            {/* Card 1: Revenue */}
            <div className={styles.statCard}>
              <div className={styles.statCardTop}>
                <span className={styles.statLabel}>Market Revenue</span>
                <div className={`${styles.statIconBox} ${styles.statIconGreen}`}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className={styles.statMainValue}>{revenueDisplay}</div>
              <div className={styles.statSubRow}>
                <span className={styles.trendBadgePositive}>↗ +24% vs last market</span>
                <span className={styles.trendBadgeNeutral}>{totalRevenueDisplay} total</span>
              </div>
              <Sparkline data={sparklineRevenue} strokeColor="#7A2E3B" fillId="grad-rev" />
            </div>

            {/* Card 2: Active Orders Pipeline */}
            <div className={styles.statCard}>
              <div className={styles.statCardTop}>
                <span className={styles.statLabel}>Active Orders</span>
                <div className={`${styles.statIconBox} ${styles.statIconBlue}`}>
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div className={styles.statMainValue}>
                {orders.length}{' '}
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#6b7280' }}>
                  in pipeline
                </span>
              </div>
              <div className={styles.statSubRow}>
                <span style={{ color: '#0369a1', fontWeight: 600 }}>
                  {pipeline.placed} New • {pipeline.accepted} Packing
                </span>
                <span style={{ color: '#15803d', fontWeight: 600 }}>
                  {pipeline.ready} Ready
                </span>
              </div>
              <Sparkline data={sparklineOrders} strokeColor="#0284c7" fillId="grad-orders" />
            </div>

            {/* Card 3: Today's Pickups / Readiness */}
            <div className={styles.statCard}>
              <div className={styles.statCardTop}>
                <span className={styles.statLabel}>Pickups Readiness</span>
                <div className={`${styles.statIconBox} ${styles.statIconAmber}`}>
                  <Clock size={18} />
                </div>
              </div>
              <div className={styles.statMainValue}>
                {pipeline.ready}{' '}
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#6b7280' }}>
                  Staged for Pickup
                </span>
              </div>
              <div className={styles.statSubRow}>
                <span style={{ color: '#d97706', fontWeight: 600 }}>
                  Slot: 8:00 AM – 1:00 PM
                </span>
                <button
                  type="button"
                  onClick={() => setIsPickListOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#7A2E3B',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Pick List
                </button>
              </div>
              <div style={{ marginTop: '12px', background: '#f3f4f6', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (pipeline.ready / Math.max(orders.length, 1)) * 100)}%`,
                    height: '100%',
                    background: '#7A2E3B',
                  }}
                />
              </div>
            </div>

            {/* Card 4: Catalog & Stock Health */}
            <div className={styles.statCard}>
              <div className={styles.statCardTop}>
                <span className={styles.statLabel}>Harvest Produce</span>
                <div className={`${styles.statIconBox} ${styles.statIconPurple}`}>
                  <Package size={18} />
                </div>
              </div>
              <div className={styles.statMainValue}>
                {(overviewData?.topProducts || []).length || 5}{' '}
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#6b7280' }}>
                  Active Items
                </span>
              </div>
              <div className={styles.statSubRow}>
                <span style={{ color: (overviewData?.lowStockCount || 0) > 0 ? '#b91c1c' : '#7A2E3B', fontWeight: 600 }}>
                  {(overviewData?.lowStockCount || 0) > 0
                    ? `${overviewData.lowStockCount} Low Stock alert`
                    : '100% Stocked'}
                </span>
                <Link
                  to="/vendor/stock"
                  style={{ color: '#7A2E3B', fontWeight: 600, textDecoration: 'none' }}
                >
                  Manage →
                </Link>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '4px' }}>
                {(overviewData?.topProducts || []).slice(0, 4).map((p, idx) => (
                  <span
                    key={p.id || idx}
                    style={{
                      flex: 1,
                      height: '6px',
                      borderRadius: '3px',
                      background: p.availability === 'out' ? '#ef4444' : p.availability === 'low' ? '#f59e0b' : '#7A2E3B',
                    }}
                    title={`${p.name}: ${p.quantity} in stock`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ─── 3. MAIN DASHBOARD COLUMNS ────────────────────────────── */}
          <div className={styles.cockpitColumns}>
            {/* LEFT COLUMN: LIVE ORDER OPERATIONS BOARD */}
            <div className={styles.leftColumn}>
              <section className={styles.sectionCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardTitleGroup}>
                    <ShoppingBag size={20} color="#7A2E3B" />
                    <h2 className={styles.cardTitle}>Live Order Operations Board</h2>
                    <span className={styles.cardCountBadge}>{filteredOrders.length}</span>
                  </div>

                  {/* Pipeline Filter Chips */}
                  <div className={styles.pipelineFilters}>
                    <button
                      type="button"
                      onClick={() => setActivePipelineFilter('all')}
                      className={`${styles.filterTabBtn} ${activePipelineFilter === 'all' ? styles.filterTabBtnActive : ''}`}
                    >
                      All ({orders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePipelineFilter('placed')}
                      className={`${styles.filterTabBtn} ${activePipelineFilter === 'placed' ? styles.filterTabBtnActive : ''}`}
                    >
                      New ({pipeline.placed})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePipelineFilter('accepted')}
                      className={`${styles.filterTabBtn} ${activePipelineFilter === 'accepted' ? styles.filterTabBtnActive : ''}`}
                    >
                      Packing ({pipeline.accepted})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePipelineFilter('ready')}
                      className={`${styles.filterTabBtn} ${activePipelineFilter === 'ready' ? styles.filterTabBtnActive : ''}`}
                    >
                      Ready ({pipeline.ready})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePipelineFilter('completed')}
                      className={`${styles.filterTabBtn} ${activePipelineFilter === 'completed' ? styles.filterTabBtnActive : ''}`}
                    >
                      Completed ({pipeline.completed})
                    </button>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <EmptyState
                    illustration="basket"
                    title={
                      activePipelineFilter === 'all'
                        ? 'No pre-orders currently'
                        : `No orders in "${activePipelineFilter}" state`
                    }
                    text="New orders placed by customers in your foodshed will appear here with live action buttons."
                    actionLabel={activePipelineFilter !== 'all' ? 'Show all orders' : 'Add product'}
                    onAction={() =>
                      activePipelineFilter !== 'all'
                        ? setActivePipelineFilter('all')
                        : navigate('/vendor/stock?action=new')
                    }
                  />
                ) : (
                  <div className={styles.ordersListQueue}>
                    {filteredOrders.map((order) => {
                      const initials = (order.customerName || 'Cust')
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <div
                          key={order.id}
                          className={styles.orderItemRow}
                          onClick={() => setSelectedOrderId(order.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setSelectedOrderId(order.id);
                          }}
                        >
                          <div className={styles.orderMetaTop}>
                            <div className={styles.orderCustIdentity}>
                              <div className={styles.custInitialsAvatar} aria-hidden="true">
                                {initials}
                              </div>
                              <div>
                                <span className={styles.orderNumText}>{order.orderNumber}</span>
                                <span className={styles.custNameText}> • {order.customerName}</span>
                              </div>
                            </div>

                            <span
                              className={`${styles.orderStatusBadge} ${
                                order.status === 'placed'
                                  ? styles.statusPlaced
                                  : order.status === 'accepted'
                                  ? styles.statusAccepted
                                  : order.status === 'ready'
                                  ? styles.statusReady
                                  : styles.statusCompleted
                              }`}
                            >
                              {order.status === 'placed' && '● New Pre-order'}
                              {order.status === 'accepted' && '⚙ Packing'}
                              {order.status === 'ready' && '✓ Ready for Pickup'}
                              {order.status === 'completed' && 'Completed'}
                            </span>
                          </div>

                          {/* Items summary */}
                          <div className={styles.orderItemsSummary}>
                            {Array.isArray(order.items) && order.items.length > 0 ? (
                              order.items.map((it, idx) => (
                                <span key={idx} className={styles.itemChip}>
                                  {it.quantity}x {it.name}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: '#6b7280' }}>
                                {order.itemCount || 1} harvest items
                              </span>
                            )}
                          </div>

                          {/* Action row */}
                          <div className={styles.orderRowActions}>
                            <div className={styles.slotTotalTag}>
                              <span>
                                Pickup:{' '}
                                <strong>
                                  {order.pickup?.windowLabel || order.pickup?.dayLabel || 'Saturday 8-10 AM'}
                                </strong>
                              </span>
                              <span>•</span>
                              <span className={styles.orderPriceTotal}>
                                {formatPrice(order.totalCents)}
                              </span>
                            </div>

                            <div className={styles.actionBtnGroup}>
                              {order.status === 'placed' && (
                                <button
                                  type="button"
                                  disabled={actionInProgress === order.id}
                                  onClick={(e) => handleQuickAccept(order.id, e)}
                                  className={`${styles.quickActionBtn} ${styles.btnAccept}`}
                                >
                                  <Check size={14} />
                                  <span>Accept Order</span>
                                </button>
                              )}

                              {order.status === 'accepted' && (
                                <button
                                  type="button"
                                  disabled={actionInProgress === order.id}
                                  onClick={(e) => handleQuickReady(order.id, e)}
                                  className={`${styles.quickActionBtn} ${styles.btnReady}`}
                                >
                                  <Package size={14} />
                                  <span>Mark Ready</span>
                                </button>
                              )}

                              {order.status === 'ready' && (
                                <button
                                  type="button"
                                  disabled={actionInProgress === order.id}
                                  onClick={(e) => handleQuickComplete(order.id, e)}
                                  className={`${styles.quickActionBtn} ${styles.btnComplete}`}
                                >
                                  <CheckCircle2 size={14} />
                                  <span>Complete Pickup</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrderId(order.id);
                                }}
                                className={styles.btnOutlineSmall}
                              >
                                <span>Details</span>
                                <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* SECTION: TOP HARVEST PERFORMERS & QUICK RESTOCK STEPPER */}
              <section className={styles.sectionCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardTitleGroup}>
                    <Flame size={20} color="#E07A2C" />
                    <h2 className={styles.cardTitle}>Top Harvest Produce & Quick Stock</h2>
                  </div>
                  <Link to="/vendor/stock" className={styles.btnOutlineSmall}>
                    <span>Full Stock Sheet</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>

                <div className={styles.productListRow}>
                  {(overviewData?.topProducts || []).slice(0, 5).map((prod) => (
                    <div key={prod.id} className={styles.productQuickCard}>
                      <div className={styles.productLeftInfo}>
                        <div className={styles.productIconBox} aria-hidden="true">
                          {prod.name.toLowerCase().includes('tomato')
                            ? '🍅'
                            : prod.name.toLowerCase().includes('carrot')
                            ? '🥕'
                            : prod.name.toLowerCase().includes('potato')
                            ? '🥔'
                            : prod.name.toLowerCase().includes('squash')
                            ? '🎃'
                            : prod.name.toLowerCase().includes('kale') || prod.name.toLowerCase().includes('green')
                            ? '🥬'
                            : prod.name.toLowerCase().includes('honey')
                            ? '🍯'
                            : prod.name.toLowerCase().includes('bread') || prod.name.toLowerCase().includes('sourdough')
                            ? '🍞'
                            : '🌱'}
                        </div>
                        <div className={styles.productNameCol}>
                          <span className={styles.prodTitle}>{prod.name}</span>
                          <span className={styles.prodMetaPrice}>
                            {formatPrice(prod.priceCents)} / {prod.unit} • {prod.salesCount || 0} sold
                          </span>
                        </div>
                      </div>

                      <div className={styles.productStockControls}>
                        <span
                          className={`${styles.stockCountBadge} ${
                            prod.quantity === 0
                              ? styles.stockSoldOut
                              : prod.quantity <= 5
                              ? styles.stockLow
                              : ''
                          }`}
                        >
                          {prod.quantity === 0 ? 'Sold Out' : `${prod.quantity} ${prod.unit} left`}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleQuickRestock(prod.id, 5)}
                          className={styles.stepperBtn}
                          title="Quick restock +5 units"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickRestock(prod.id, 10)}
                          className={styles.stepperBtn}
                          title="Quick restock +10 units"
                        >
                          +10
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleSoldOut(prod.id, prod.quantity === 0)}
                          className={styles.btnOutlineSmall}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          {prod.quantity === 0 ? 'Restock' : 'Sold out'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: OPERATIONS CENTER, CHECKLIST & CUSTOMER LOVE */}
            <div className={styles.rightColumn}>
              {/* MARKET DAY HARVEST & PACKING CENTER */}
              <div className={styles.packingCenterCard}>
                <div className={styles.packingHeroRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckSquare size={18} color="#7A2E3B" />
                    <h3 className={styles.packingTitle}>Market Packing Checklist</h3>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>
                    {packingChecklist.filter((c) => c.checked).length}/{packingChecklist.length} Ready
                  </span>
                </div>

                <ul className={styles.checklistUl}>
                  {packingChecklist.map((item) => (
                    <li
                      key={item.id}
                      className={styles.checklistLi}
                      onClick={() => toggleChecklistItem(item.id)}
                    >
                      <div
                        className={`${styles.customCheck} ${
                          item.checked ? styles.customCheckActive : ''
                        }`}
                      >
                        {item.checked && <Check size={12} />}
                      </div>
                      <span className={item.checked ? styles.checkDoneText : ''}>
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Pick list quick banner */}
                <div className={styles.pickListActionBanner}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#1f2937', display: 'block' }}>
                      Market Pick List
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      Itemized breakdown for your harvest baskets
                    </span>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsPickListOpen(true)}
                  >
                    <FileText size={14} />
                    <span>View Pick List</span>
                  </Button>
                </div>
              </div>

              {/* RECENT CUSTOMER LOVE & REVIEWS */}
              <section className={styles.sectionCard}>
                <div className={styles.cardHeaderRow}>
                  <div className={styles.cardTitleGroup}>
                    <Star size={18} color="#D97706" fill="#D97706" />
                    <h3 className={styles.cardTitle}>Customer Feedback</h3>
                  </div>
                  <Link to="/vendor/reviews" className={styles.btnOutlineSmall}>
                    <span>All Reviews</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>

                <div className={styles.reviewsPulseList}>
                  {(overviewData?.recentReviews || []).length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      No customer reviews yet. Reviews will populate as pickups are completed.
                    </p>
                  ) : (
                    overviewData.recentReviews.map((rev) => (
                      <div key={rev.id} className={styles.reviewItemCard}>
                        <div className={styles.reviewItemHeader}>
                          <span className={styles.reviewCustomerName}>{rev.customerName}</span>
                          <span className={styles.reviewDate}>
                            {'★'.repeat(rev.rating || 5)}
                          </span>
                        </div>
                        <p className={styles.reviewCommentText}>"{rev.comment}"</p>

                        {rev.reply ? (
                          <div className={styles.reviewReplySnippet}>
                            <strong>You: </strong>
                            <span>{rev.reply.text}</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReviewForReply(rev);
                              setReplyInput('');
                            }}
                            className={styles.replyActionBtn}
                          >
                            <MessageSquare size={13} />
                            <span>Reply to customer</span>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* ─── 4. FLOATING QUICK ACTIONS SPEED BAR ──────────────────── */}
          <div className={styles.quickActionsBar}>
            <Link to="/vendor/stock?action=new" className={styles.fabPrimaryBtn}>
              <Plus size={18} />
              <span>Add Harvest Produce</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsPickListOpen(true)}
              className={styles.fabSecondaryBtn}
            >
              <FileText size={16} />
              <span>Generate Pick List</span>
            </button>

            <Link to="/vendor/stall" className={styles.fabSecondaryBtn}>
              <Store size={16} />
              <span>Stall Settings</span>
            </Link>
          </div>
        </>
      )}

      {/* ─── 5. MODAL BOTTOM SHEETS ───────────────────────────────────── */}
      {/* Detailed Order Sheet */}
      {selectedOrderId && (
        <BottomSheet
          isOpen={Boolean(selectedOrderId)}
          onClose={() => setSelectedOrderId(null)}
          size="tall"
          title="Customer Order Detail"
        >
          <OrderDetail
            orderId={selectedOrderId}
            onClose={() => setSelectedOrderId(null)}
            onUpdated={() => {
              loadData();
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
          title="Market Day Packing & Pick List"
        >
          <div style={{ padding: '8px 4px' }}>
            <PickList />
          </div>
        </BottomSheet>
      )}

      {/* Customer Review Reply Dialog */}
      {activeReviewForReply && (
        <BottomSheet
          isOpen={Boolean(activeReviewForReply)}
          onClose={() => setActiveReviewForReply(null)}
          size="medium"
          title={`Reply to ${activeReviewForReply.customerName}`}
        >
          <form onSubmit={handleSubmitReply} className={styles.replyModalBox}>
            <p style={{ fontSize: '0.9rem', color: '#4b5563', fontStyle: 'italic', margin: 0 }}>
              "{activeReviewForReply.comment}"
            </p>
            <textarea
              className={styles.replyTextarea}
              placeholder="Write a warm note of thanks or share produce preparation advice..."
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              rows={4}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => setActiveReviewForReply(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={replySubmitting || !replyInput.trim()}
              >
                <Send size={15} />
                <span>{replySubmitting ? 'Posting...' : 'Post Reply'}</span>
              </Button>
            </div>
          </form>
        </BottomSheet>
      )}

      {/* Toast Notification Feedback */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
}

export default Overview;
