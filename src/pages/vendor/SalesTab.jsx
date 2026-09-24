import React from 'react';
import styles from './SalesTab.module.css';

const SalesTab = () => (
  <div className={styles.contentArea}>
    <div className={styles.cardPanel}>
      <h2 className={styles.cardTitle} style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Weekly Sales Insights</h2>
      {/* Empty placeholder to match screenshot */}
    </div>
  </div>
);

export default SalesTab;
