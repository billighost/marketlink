import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  AlertCircle,
  Clock,
  Plus,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useVendor } from '@/layouts/VendorLayout';
import {
  getFarmerOverview,
  getFarmerInsights,
  getFarmerOrders,
  getFarmerProducts,
} from '@/api/farmer';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import OrderDetail from './OrderDetail';
import { formatPrice } from '@/utils/format';
import styles from './Overview.module.css';

export function Overview() {
  const { user } = useAuth();
  const { stallInfo, isPending, refreshCounts } = useVendor();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [overviewData, setOverviewData] = useState(null);
  const [weekInsights, setWeekInsights] = useState(null);
  const [newOrders, setNewOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // Selected order for sheet
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, insRes, ordersRes, stockRes] = await Promise.all([
        getFarmerOverview().catch(() => ({ data: null })),
        getFarmerInsights('7d').catch(() => ({ data: null })),
        getFarmerOrders({ status: 'placed', limit: 5 }).catch(() => ({ data: [] })),
        getFarmerProducts({ availability: 'low', limit: 5 }).catch(() => ({ data: [] })),
      ]);

      setOverviewData(ovRes?.data || null);
      setWeekInsights(insRes?.data || null);
      setNewOrders(ordersRes?.data || []);
      setLowStockProducts(stockRes?.data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard overview.');
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
    const name = stallInfo?.contactPerson || user?.name?.split(' ')[0] || 'Farmer';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  // Subtitle with stall market and status
  const getSubtitle = () => {
    if (stallInfo?.address) {
      return stallInfo.address;
    }
    return 'Manage orders, inventory, and your market stall.';
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.header}>
        <h1 className={styles.greeting}>{getGreeting()}</h1>
        <p className={styles.subtitle}>{getSubtitle()}</p>
      </header>

      {/* Pending Approval Calm Card */}
      {isPending && (
        <section className={styles.pendingCard} aria-label="Approval status">
          <div className={styles.pendingContent}>
            <div className={styles.pendingTitleRow}>
              <AlertCircle size={18} className={styles.pendingIcon} aria-hidden="true" />
              <strong>Your stall is waiting for approval</strong>
            </div>
            <p className={styles.pendingDescription}>
              You can set up your stall profile, pickup windows, and location while our team reviews your application.
            </p>
          </div>
          <Link to="/vendor/stall" className={styles.pendingLink}>
            Set up My stall <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}

      {loading ? (
        <div className={styles.skeletonContainer}>
          <Skeleton height="80px" />
          <Skeleton height="140px" />
          <Skeleton height="100px" />
        </div>
      ) : error ? (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={loadData}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          {/* New Orders Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>New orders</h2>
              <Link to="/vendor/orders" className={styles.seeAllLink}>
                See all
              </Link>
            </div>

            {newOrders.length === 0 ? (
              <div className={styles.emptyCard}>
                <ShoppingBag size={20} className={styles.emptyIcon} aria-hidden="true" />
                <span>No new pre-orders waiting for acceptance.</span>
              </div>
            ) : (
              <div className={styles.listCard}>
                {newOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    className={styles.orderRow}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <div className={styles.orderLeft}>
                      <span className={styles.orderNumber}>{order.orderNumber}</span>
                      <span className={styles.customerName}>{order.customerName}</span>
                    </div>
                    <div className={styles.orderRight}>
                      <span className={styles.orderSlot}>
                        {order.pickup?.windowLabel || order.pickup?.dayLabel || 'Upcoming'}
                      </span>
                      <span className={styles.orderTotal}>
                        {formatPrice(order.totalCents)}
                      </span>
                      <ChevronRight size={16} className={styles.chevron} aria-hidden="true" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* This Week Section (3 numbers, no boxes) */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>This week</h2>
            <div className={styles.quickNumbersRow}>
              <div className={styles.quickNumberCol}>
                <span className={styles.quickNumLabel}>Orders</span>
                <span className={styles.quickNumValue}>
                  {weekInsights?.totalOrders ?? 0}
                </span>
              </div>
              <div className={styles.quickNumberCol}>
                <span className={styles.quickNumLabel}>Pending</span>
                <span className={styles.quickNumValue}>
                  {overviewData?.pendingOrders ?? weekInsights?.pendingOrders ?? 0}
                </span>
              </div>
              <div className={styles.quickNumberCol}>
                <span className={styles.quickNumLabel}>Revenue</span>
                <span className={styles.quickNumValue}>
                  {formatPrice(weekInsights?.revenueCents ?? 0)}
                </span>
              </div>
            </div>
          </section>

          {/* Low Stock Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Low stock</h2>
              <Link to="/vendor/stock" className={styles.seeAllLink}>
                Manage stock
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className={styles.emptyCard}>
                <Package size={20} className={styles.emptyIcon} aria-hidden="true" />
                <span>All listed items are well stocked.</span>
              </div>
            ) : (
              <div className={styles.listCard}>
                {lowStockProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/vendor/stock?edit=${product.id}`}
                    className={styles.stockRow}
                  >
                    <span className={styles.productName}>{product.name}</span>
                    <div className={styles.stockRight}>
                      <span className={styles.stockRemaining}>
                        {product.quantity} left
                      </span>
                      <ChevronRight size={16} className={styles.chevron} aria-hidden="true" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Primary Action Button (Hidden when pending) */}
          {!isPending && (
            <div className={styles.primaryActionContainer}>
              <Button
                as={Link}
                to="/vendor/stock?action=new"
                variant="primary"
                size="lg"
                className={styles.addBtn}
              >
                <Plus size={18} aria-hidden="true" />
                <span>Add a product</span>
              </Button>
            </div>
          )}
        </>
      )}

      {/* Order Detail Sheet */}
      {selectedOrderId && (
        <BottomSheet
          isOpen={Boolean(selectedOrderId)}
          onClose={() => setSelectedOrderId(null)}
          size="tall"
          title="Order Details"
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
    </div>
  );
}

export default Overview;
