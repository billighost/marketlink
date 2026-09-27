import React, { useState } from 'react';
import { Inbox } from 'lucide-react';
import styles from './IncomingOrdersTab.module.css';

const MOCK_ORDERS = [
  { id: 'ML-8821', customer: 'Marta Lin', slot: '8:30 AM - 9:00 AM', items: 'Fresh Ugu Leaves (3 Bunches)', total: '₦1,500', status: 'Pending' },
  { id: 'ML-8820', customer: 'David Chen', slot: '9:00 AM - 9:30 AM', items: 'Cherokee Purple Tomatoes (2kg)', total: '₦4,200', status: 'Accepted' },
  { id: 'ML-8819', customer: 'Sarah Jenkins', slot: '10:15 AM - 10:45 AM', items: 'White Yams (5 Tubers)', total: '₦12,500', status: 'Pending' },
  { id: 'ML-8818', customer: 'James Robertson', slot: '11:30 AM - 12:00 PM', items: 'Lacinato Kale (4 Bunches)', total: '₦3,000', status: 'Pending' },
];

const IncomingOrdersTab = () => {
  const [orders, setOrders] = useState(MOCK_ORDERS);

  return (
    <div className={styles.contentArea}>
      <div className={styles.cardPanel}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ fontSize: '1.5rem' }}>Incoming Pre-Orders</h3>
          {orders.length > 0 && (
            <button className={styles.btnOutline} onClick={() => setOrders([])}>Clear (Demo Empty State)</button>
          )}
        </div>
        
        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconBadge} aria-hidden="true">
              <Inbox size={28} strokeWidth={1.85} />
            </div>
            <h3 className={styles.emptyTitle}>No incoming orders yet</h3>
            <p className={styles.emptySub}>When customers place pre-orders, they will appear here.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>CUSTOMER & SLOT</th>
                <th>HARVEST ITEMS</th>
                <th>TOTAL</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className={styles.tdPrimary}>{order.customer}</span>
                    <span className={styles.tdSecondary}>{order.slot}</span>
                  </td>
                  <td>
                    <span className={styles.tdPrimary}>{order.items}</span>
                    <span className={styles.tdSecondary}>Order #{order.id}</span>
                  </td>
                  <td><span className={styles.tdPrimary}>{order.total}</span></td>
                  <td>
                    <span className={`${styles.badge} ${order.status === 'Pending' ? styles.badgePending : styles.badgeAccepted}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {order.status === 'Pending' ? (
                      <button className={styles.btnPrimary}>Accept</button>
                    ) : (
                      <button className={styles.btnOutline}>Mark Ready</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default IncomingOrdersTab;
