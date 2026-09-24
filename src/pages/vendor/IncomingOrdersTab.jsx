import React from 'react';
import styles from './IncomingOrdersTab.module.css';

const IncomingOrdersTab = () => {
  return (
    <div className={styles.contentArea}>
      <div className={styles.cardPanel}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ fontSize: '1.5rem' }}>Incoming Pre-Orders</h3>
        </div>
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
            <tr>
              <td>
                <span className={styles.tdPrimary}>Marta Lin</span>
                <span className={styles.tdSecondary}>8:30 AM - 9:00 AM</span>
              </td>
              <td>
                <span className={styles.tdPrimary}>Fresh Ugu Leaves (3 Bunches)</span>
                <span className={styles.tdSecondary}>Order #ML-8821</span>
              </td>
              <td><span className={styles.tdPrimary}>₦1,500</span></td>
              <td><span className={`${styles.badge} ${styles.badgePending}`}>Pending</span></td>
              <td><button className={styles.btnPrimary}>Accept</button></td>
            </tr>
            <tr>
              <td>
                <span className={styles.tdPrimary}>David Chen</span>
                <span className={styles.tdSecondary}>9:00 AM - 9:30 AM</span>
              </td>
              <td>
                <span className={styles.tdPrimary}>Cherokee Purple Tomatoes (2kg)</span>
                <span className={styles.tdSecondary}>Order #ML-8820</span>
              </td>
              <td><span className={styles.tdPrimary}>₦4,200</span></td>
              <td><span className={`${styles.badge} ${styles.badgeAccepted}`}>Accepted</span></td>
              <td><button className={styles.btnOutline}>Mark Ready</button></td>
            </tr>
            <tr>
              <td>
                <span className={styles.tdPrimary}>Sarah Jenkins</span>
                <span className={styles.tdSecondary}>10:15 AM - 10:45 AM</span>
              </td>
              <td>
                <span className={styles.tdPrimary}>White Yams (5 Tubers)</span>
                <span className={styles.tdSecondary}>Order #ML-8819</span>
              </td>
              <td><span className={styles.tdPrimary}>₦12,500</span></td>
              <td><span className={`${styles.badge} ${styles.badgePending}`}>Pending</span></td>
              <td><button className={styles.btnPrimary}>Accept</button></td>
            </tr>
            <tr>
              <td>
                <span className={styles.tdPrimary}>James Robertson</span>
                <span className={styles.tdSecondary}>11:30 AM - 12:00 PM</span>
              </td>
              <td>
                <span className={styles.tdPrimary}>Lacinato Kale (4 Bunches)</span>
                <span className={styles.tdSecondary}>Order #ML-8818</span>
              </td>
              <td><span className={styles.tdPrimary}>₦3,000</span></td>
              <td><span className={`${styles.badge} ${styles.badgePending}`}>Pending</span></td>
              <td><button className={styles.btnPrimary}>Accept</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncomingOrdersTab;
