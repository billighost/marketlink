import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orders } from '@/data/placeholders';
import OrderRow from '@/components/domain/OrderRow';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import styles from './Orders.module.css';

/**
 * Customer Orders page with Active and Past tabs.
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
        <h1 className={styles.title}>Your orders</h1>
        <SegmentedControl
          name="orders-tab"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'active', label: `Active (${activeOrders.length})` },
            { value: 'past', label: `Past (${pastOrders.length})` },
          ]}
        />
      </header>

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
            title={tab === 'active' ? 'No active orders' : 'No past orders yet'}
            text={
              tab === 'active'
                ? 'Pre-order before Friday 6 pm to pick up fresh produce on Saturday.'
                : 'Items you order will appear here for easy one-tap re-ordering.'
            }
            actionLabel="Browse Saturday market"
            onAction={() => navigate('/buyer')}
          />
        )}
      </div>
    </div>
  );
}

export default Orders;
