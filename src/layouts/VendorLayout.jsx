import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart2, 
  Settings, 
  ChevronLeft, 
  Bell, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical,
  Edit2,
  Plus,
  ChevronRight
} from 'lucide-react';
import styles from './VendorLayout.module.css';

// --- COMPONENTS ---

const DashboardTab = () => (
  <div className={styles.contentArea}>
    <div className={styles.dashboardHeader}>
      <h1 className={styles.greeting}>Good morning, Farmer Ayomide</h1>
      <p className={styles.subGreeting}>Market Link • Next Fulfillment: Saturday Grandview Market (Cutoff in 14h 22m)</p>
    </div>

    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statHeader}>
          <span>TOTAL ORDERS</span>
          <ShoppingCart size={18} />
        </div>
        <h2 className={styles.statValue}>42</h2>
        <div className={`${styles.statSubtext} ${styles.textGreen}`}>↗ +18% vs previous market</div>
      </div>
      
      <div className={styles.statCard}>
        <div className={styles.statHeader}>
          <span>PENDING REVIEW</span>
          <Clock size={18} className={styles.textOrange} />
        </div>
        <h2 className={styles.statValue}>8</h2>
        <div className={`${styles.statSubtext} ${styles.textOrange}`}>Needs action before cutoff</div>
      </div>
      
      <div className={styles.statCard}>
        <div className={styles.statHeader}>
          <span>RESERVED VALUE</span>
          <BarChart2 size={18} />
        </div>
        <h2 className={styles.statValue}>₦425,500</h2>
        <div className={`${styles.statSubtext} ${styles.textGray}`}>Pay-at-pickup on Saturday</div>
      </div>
      
      <div className={styles.statCard}>
        <div className={styles.statHeader}>
          <span>ACTIVE INVENTORY</span>
          <Package size={18} className={styles.textOrange} />
        </div>
        <h2 className={styles.statValue}>16</h2>
        <div className={`${styles.statSubtext} ${styles.textOrange}`}>3 Low Stock warnings</div>
      </div>
    </div>

    <div className={styles.dashboardSplit}>
      <div className={styles.cardPanel}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Incoming Pre-Orders</h3>
          <button className={styles.btnOutline}>View All</button>
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

      <div className={styles.cardPanel}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Top Selling Harvest</h3>
        </div>
        <div className={styles.progressItem}>
          <div className={styles.progressItemHeader}>
            <span className={styles.progressLabel}>Cherokee Purple Tomatoes</span>
            <span className={styles.progressValue}>45 / 50 kg</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div className={`${styles.progressBarFill} ${styles.fillOrange}`} style={{ width: '90%' }}></div>
          </div>
        </div>
        <div className={styles.progressItem}>
          <div className={styles.progressItemHeader}>
            <span className={styles.progressLabel}>White Yams</span>
            <span className={styles.progressValue}>38 / 40 tubers</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div className={`${styles.progressBarFill} ${styles.fillOrange}`} style={{ width: '95%' }}></div>
          </div>
        </div>
        <div className={styles.progressItem}>
          <div className={styles.progressItemHeader}>
            <span className={styles.progressLabel}>Fresh Ugu Leaves</span>
            <span className={styles.progressValue}>60 / 100 bunches</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div className={`${styles.progressBarFill} ${styles.fillGreen}`} style={{ width: '60%' }}></div>
          </div>
        </div>
        <div className={styles.progressItem}>
          <div className={styles.progressItemHeader}>
            <span className={styles.progressLabel}>Sweet Bell Peppers</span>
            <span className={styles.progressValue}>24 / 30 kg</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div className={`${styles.progressBarFill} ${styles.fillGreen}`} style={{ width: '80%' }}></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const IncomingOrdersTab = () => {
  return (
    <div className={styles.contentArea}>
      <div className={styles.cardPanel}>
        <div className={styles.actionHeader}>
          <h2 className={styles.cardTitle} style={{ fontSize: '1.5rem' }}>Order History</h2>
          <div className={styles.searchLayout}>
            <div className={styles.searchBox}>
              <Search size={18} className={styles.searchIcon} />
              <input type="text" placeholder="Search order ID, customer..." className={styles.searchInput} />
            </div>
            <button className={styles.btnFilter}>
              <Filter size={18} /> Filters
            </button>
          </div>
        </div>
        
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>DATE</th>
              <th>CUSTOMER NAME</th>
              <th>ITEMS ORDERED</th>
              <th>TOTAL AMOUNT</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={styles.tdPrimary}>ORD-1042</td>
              <td>Oct 24, 2026</td>
              <td className={styles.tdPrimary}>Adeola Johnson</td>
              <td>Assorted Veggie Basket</td>
              <td className={styles.tdPrimary}>₦12,500</td>
              <td><span className={`${styles.badge} ${styles.badgeDelivered}`}>Delivered</span></td>
              <td><button className={styles.iconButton}><MoreVertical size={18} /></button></td>
            </tr>
            <tr>
              <td className={styles.tdPrimary}>ORD-1041</td>
              <td>Oct 24, 2026</td>
              <td className={styles.tdPrimary}>Chuks Emmanuel</td>
              <td>Unripe Plantains (1 Dozen)</td>
              <td className={styles.tdPrimary}>₦3,800</td>
              <td><span className={`${styles.badge} ${styles.badgeDelivered}`}>Delivered</span></td>
              <td><button className={styles.iconButton}><MoreVertical size={18} /></button></td>
            </tr>
            <tr>
              <td className={styles.tdPrimary}>ORD-1040</td>
              <td>Oct 23, 2026</td>
              <td className={styles.tdPrimary}>Fatima Bello</td>
              <td>Organic Carrots (5kg)</td>
              <td className={styles.tdPrimary}>₦5,200</td>
              <td><span className={`${styles.badge} ${styles.badgeCancelled}`}>Cancelled</span></td>
              <td><button className={styles.iconButton}><MoreVertical size={18} /></button></td>
            </tr>
            <tr>
              <td className={styles.tdPrimary}>ORD-1039</td>
              <td>Oct 23, 2026</td>
              <td className={styles.tdPrimary}>Green Grocers Ltd</td>
              <td>Wholesale Yams (50 Tubers)</td>
              <td className={styles.tdPrimary}>₦110,000</td>
              <td><span className={`${styles.badge} ${styles.badgeDelivered}`}>Delivered</span></td>
              <td><button className={styles.iconButton}><MoreVertical size={18} /></button></td>
            </tr>
            <tr>
              <td className={styles.tdPrimary}>ORD-1038</td>
              <td>Oct 22, 2026</td>
              <td className={styles.tdPrimary}>Tobi Bakre</td>
              <td>Fresh Spinach (10 Bunches)</td>
              <td className={styles.tdPrimary}>₦4,500</td>
              <td><span className={`${styles.badge} ${styles.badgeDelivered}`}>Delivered</span></td>
              <td><button className={styles.iconButton}><MoreVertical size={18} /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

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

const SalesTab = () => (
  <div className={styles.contentArea}>
    <div className={styles.cardPanel}>
      <h2 className={styles.cardTitle} style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Weekly Sales Insights</h2>
      {/* Empty placeholder to match screenshot */}
    </div>
  </div>
);

const StoreSettingsTab = () => (
  <div className={styles.contentArea}>
    <div className={styles.cardPanel}>
      <h2 className={styles.cardTitle} style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Stall Settings</h2>
    </div>
  </div>
);

// --- MAIN APPLICATION SHELL ---

export default function VendorLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'orders': return <IncomingOrdersTab />;
      case 'inventory': return <FarmInventoryTab />;
      case 'sales': return <SalesTab />;
      case 'settings': return <StoreSettingsTab />;
      default: return <DashboardTab />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'orders': return 'Incoming Orders';
      case 'inventory': return 'Farm Inventory';
      case 'sales': return 'Sales Insights';
      case 'settings': return 'Stall Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <div className={styles.appContainer}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.brand}>
          <div className={styles.logoIcon}>M</div>
          {!isCollapsed && <span>Market Link</span>}
        </div>
        
        <nav className={styles.navMenu}>
          <button 
            className={`${styles.navButton} ${activeTab === 'dashboard' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('dashboard')}
            title="Dashboard"
          >
            <LayoutDashboard size={20} /> {!isCollapsed && <span>Dashboard</span>}
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'orders' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('orders')}
            title="Incoming Orders"
          >
            <ShoppingCart size={20} /> {!isCollapsed && <span>Incoming Orders</span>}
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'inventory' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('inventory')}
            title="Farm Inventory"
          >
            <Package size={20} /> {!isCollapsed && <span>Farm Inventory</span>}
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'sales' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('sales')}
            title="Sales Insights"
          >
            <BarChart2 size={20} /> {!isCollapsed && <span>Sales Insights</span>}
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'settings' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('settings')}
            title="Stall Settings"
          >
            <Settings size={20} /> {!isCollapsed && <span>Stall Settings</span>}
          </button>
        </nav>

        <div className={styles.collapseMenu}>
          <button 
            className={styles.collapseButton} 
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />} 
            {!isCollapsed && <span>Collapse Menu</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainArea}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <h2 className={styles.pageTitle}>{getPageTitle()}</h2>
          <div className={styles.headerRight}>
            <div className={styles.bellIcon}>
              <Bell size={20} />
              <div className={styles.notificationDot}></div>
            </div>
            <div className={styles.userProfile}>
              <div className={styles.userInfo}>
                <div className={styles.userName}>Farmer Ayomide</div>
                <div className={styles.userRole}>Farm Producer</div>
              </div>
              <div className={styles.avatar}>FA</div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        {renderContent()}
      </div>
    </div>
  );
}