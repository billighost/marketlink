import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck, ShoppingBag, ArrowRight } from 'lucide-react';
import { orders } from '@/data/placeholders';
import OrderRow from '@/components/domain/OrderRow';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import styles from './Orders.module.css';

/**
 * Customer Orders & Order History page.
 * Displays active pre-orders with live Saturday status and previous orders with one-click re-order.
 */
export function Orders() {
  const [tab, setTab] = useState('active');
  const navigate = useNavigate();

  const activeOrders = orders.filter(
    (o) => o.status !== 'Completed' && o.status !== 'Cancelled'
  );
  const pastOrders = orders.filter(
    (o) => o.status === 'Completed' || o.status === 'Cancelled'
  );

  const displayedOrders = tab === 'active' ? activeOrders : pastOrders;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Your Market Orders</h1>
            <p className={styles.subtitle}>
              Saturday pre-orders are packed fresh and held for you at each farmer stall.
            </p>
          </div>
          <SegmentedControl
            name="orders-tab"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'active', label: `Active Orders (${activeOrders.length})` },
              { value: 'past', label: `Order History (${pastOrders.length})` },
            ]}
          />
        </div>

        {/* Helpful Cutoff & Pickup Reminder Banner */}
        <div className={styles.infoBanner}>
          <div className={styles.infoIconWrap}>
            <Clock size={16} />
          </div>
          <div className={styles.infoText}>
            <span>
              <strong>Harvest Cutoff Policy:</strong> Pre-orders can be modified or cancelled before <strong>Friday at 6:00 PM</strong>.
              Payment is completed in person at each stall when picking up.
            </span>
          </div>
        </div>
      </header>

      {/* Orders List */}
      <div className={styles.ordersList}>
        {displayedOrders.length > 0 ? (
          displayedOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onReorder={() => navigate('/buyer/cart')}
            />
          ))
        ) : (
          <EmptyState
            illustration="basket-tomatoes"
            title={tab === 'active' ? 'No active orders for this Saturday' : 'No past order history yet'}
            text={
              tab === 'active'
                ? 'Reserve your fresh farm produce, artisan bread, and pantry goods before Friday 6:00 PM.'
                : 'Purchases you make will appear here for simple one-tap re-ordering and reviewing.'
            }
            actionLabel="Browse Saturday Market"
            onAction={() => navigate('/buyer')}
          />
        )}
      </div>
    </div>
  );
}

export default Orders;
