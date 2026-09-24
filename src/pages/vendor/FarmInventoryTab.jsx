import React from 'react';
import { Search, Plus, Edit2 } from 'lucide-react';
import styles from './FarmInventoryTab.module.css';

const FarmInventoryTab = () => {
  return (
    <div className={styles.contentArea}>
      <div className={styles.actionHeader}>
        <h2 className={styles.cardTitle} style={{ fontSize: '1.5rem' }}>Farm Inventory</h2>
        <div className={styles.searchLayout}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input type="text" placeholder="Search produce..." className={styles.searchInput} />
          </div>
          <button className={styles.btnPrimary} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Harvest
          </button>
        </div>
      </div>
      
      <div className={styles.inventoryGrid}>
        <div className={styles.inventoryCard}>
          <div className={styles.inventoryHeader}>
            <div>
              <h3 className={styles.inventoryTitle}>White Yams</h3>
              <span className={styles.inventoryCategory}>Tubers</span>
            </div>
            <Edit2 size={16} className={styles.editIcon} />
          </div>
          <div className={styles.inventoryFooter}>
            <div>
              <span className={styles.inventoryQuantity}>120</span>
              <span className={styles.inventoryUnit}> Tubers</span>
            </div>
            <span className={`${styles.badge} ${styles.badgeGood}`}>Good</span>
          </div>
        </div>

        <div className={styles.inventoryCard}>
          <div className={styles.inventoryHeader}>
            <div>
              <h3 className={styles.inventoryTitle}>Cherokee Purple Tomatoes</h3>
              <span className={styles.inventoryCategory}>Vegetables</span>
            </div>
            <Edit2 size={16} className={styles.editIcon} />
          </div>
          <div className={styles.inventoryFooter}>
            <div>
              <span className={styles.inventoryQuantity}>4</span>
              <span className={styles.inventoryUnit}> Baskets</span>
            </div>
            <span className={`${styles.badge} ${styles.badgeLow}`}>Low Stock</span>
          </div>
        </div>

        <div className={styles.inventoryCard}>
          <div className={styles.inventoryHeader}>
            <div>
              <h3 className={styles.inventoryTitle}>Fresh Ugu Leaves</h3>
              <span className={styles.inventoryCategory}>Leafy Greens</span>
            </div>
            <Edit2 size={16} className={styles.editIcon} />
          </div>
          <div className={styles.inventoryFooter}>
            <div>
              <span className={styles.inventoryQuantity}>45</span>
              <span className={styles.inventoryUnit}> Bunches</span>
            </div>
            <span className={`${styles.badge} ${styles.badgeGood}`}>Good</span>
          </div>
        </div>

        <div className={styles.inventoryCard}>
          <div className={styles.inventoryHeader}>
            <div>
              <h3 className={styles.inventoryTitle}>Sweet Bell Peppers</h3>
              <span className={styles.inventoryCategory}>Vegetables</span>
            </div>
            <Edit2 size={16} className={styles.editIcon} />
          </div>
          <div className={styles.inventoryFooter}>
            <div>
              <span className={styles.inventoryQuantity}>2</span>
              <span className={styles.inventoryUnit}> kg</span>
            </div>
            <span className={`${styles.badge} ${styles.badgeCritical}`}>Critical</span>
          </div>
        </div>

        <div className={styles.inventoryCard}>
          <div className={styles.inventoryHeader}>
            <div>
              <h3 className={styles.inventoryTitle}>Unripe Plantains</h3>
              <span className={styles.inventoryCategory}>Fruits</span>
            </div>
            <Edit2 size={16} className={styles.editIcon} />
          </div>
          <div className={styles.inventoryFooter}>
            <div>
              <span className={styles.inventoryQuantity}>20</span>
              <span className={styles.inventoryUnit}> Bunches</span>
            </div>
            <span className={`${styles.badge} ${styles.badgeGood}`}>Good</span>
          </div>
        </div>

        <div className={styles.inventoryCard}>
          <div className={styles.inventoryHeader}>
            <div>
              <h3 className={styles.inventoryTitle}>Raw Wildflower Honey</h3>
              <span className={styles.inventoryCategory}>Pantry</span>
            </div>
            <Edit2 size={16} className={styles.editIcon} />
          </div>
          <div className={styles.inventoryFooter}>
            <div>
              <span className={styles.inventoryQuantity}>15</span>
              <span className={styles.inventoryUnit}> Jars</span>
            </div>
            <span className={`${styles.badge} ${styles.badgeGood}`}>Good</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmInventoryTab;
