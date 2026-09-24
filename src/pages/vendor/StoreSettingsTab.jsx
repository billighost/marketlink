import React from 'react';
import styles from './StoreSettingsTab.module.css';

const StoreSettingsTab = () => (
  <div className={styles.contentArea}>
    <div className={styles.cardPanel}>
      <h2 className={styles.cardTitle} style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Stall Settings</h2>
    </div>
  </div>
);

export default StoreSettingsTab;
