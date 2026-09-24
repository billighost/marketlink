import React from 'react';
import { Download } from 'lucide-react';
import styles from './SalesTab.module.css';

const SalesTab = () => {
  return (
    <div className={styles.contentArea}>
      <div className={styles.topBar}>
        <h1 className={styles.mainTitle}>Market Link | Sales & Insights</h1>
        <button className={styles.btnPrimary} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} /> Export Report
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>TOTAL REVENUE (30 DAYS)</div>
          <h2 className={styles.statValue}>₦262,700</h2>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>HARVEST SPOILAGE</div>
          <h2 className={styles.statValue}>4.2%</h2>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>RETURNING BUYERS</div>
          <h2 className={styles.statValue}>68%</h2>
        </div>
      </div>

      <div className={styles.dashboardSplit}>
        <div className={styles.cardPanel}>
          <h3 className={styles.cardTitle}>Recent Market Runs</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>DATE</th>
                <th>ORDERS</th>
                <th>REVENUE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Oct 14, 2026</td>
                <td>42</td>
                <td>₦84,500</td>
                <td><span className={`${styles.badge} ${styles.badgeCleared}`}>Cleared</span></td>
              </tr>
              <tr>
                <td>Oct 07, 2026</td>
                <td>38</td>
                <td>₦76,200</td>
                <td><span className={`${styles.badge} ${styles.badgeSurplus}`}>Surplus</span></td>
              </tr>
              <tr>
                <td>Sep 30, 2026</td>
                <td>51</td>
                <td>₦102,000</td>
                <td><span className={`${styles.badge} ${styles.badgeCleared}`}>Cleared</span></td>
              </tr>
              <tr>
                <td>Sep 23, 2026</td>
                <td>45</td>
                <td>₦91,400</td>
                <td><span className={`${styles.badge} ${styles.badgeCleared}`}>Cleared</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.cardPanel}>
          <h3 className={styles.cardTitle}>Top Harvests</h3>
          
          <div className={styles.harvestList}>
            <div className={styles.harvestItem}>
              <div className={styles.harvestInfo}>
                <div className={styles.harvestName}>Cherokee Purple Tomatoes</div>
                <div className={styles.harvestUnit}>per kg</div>
              </div>
              <div className={styles.harvestQty}>142</div>
            </div>
            
            <div className={styles.harvestItem}>
              <div className={styles.harvestInfo}>
                <div className={styles.harvestName}>Fresh Lacinato Kale</div>
                <div className={styles.harvestUnit}>per bunch</div>
              </div>
              <div className={styles.harvestQty}>85</div>
            </div>
            
            <div className={styles.harvestItem}>
              <div className={styles.harvestInfo}>
                <div className={styles.harvestName}>White Puna Yam</div>
                <div className={styles.harvestUnit}>per tuber</div>
              </div>
              <div className={styles.harvestQty}>64</div>
            </div>
            
            <div className={styles.harvestItem}>
              <div className={styles.harvestInfo}>
                <div className={styles.harvestName}>Sweet Bell Peppers</div>
                <div className={styles.harvestUnit}>per basket</div>
              </div>
              <div className={styles.harvestQty}>48</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTab;
