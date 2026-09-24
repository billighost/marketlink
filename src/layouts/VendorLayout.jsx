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

import DashboardTab from '../pages/vendor/DashboardTab';
import IncomingOrdersTab from '../pages/vendor/IncomingOrdersTab';
import HistoryTab from '../pages/vendor/HistoryTab';
import FarmInventoryTab from '../pages/vendor/FarmInventoryTab';
import SalesTab from '../pages/vendor/SalesTab';
import StoreSettingsTab from '../pages/vendor/StoreSettingsTab';
import ProfileTab from '../pages/vendor/ProfileTab';

// --- MAIN APPLICATION SHELL ---

export default function VendorLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'orders': return <IncomingOrdersTab />;
      case 'history': return <HistoryTab />;
      case 'inventory': return <FarmInventoryTab />;
      case 'sales': return <SalesTab />;
      case 'settings': return <StoreSettingsTab />;
      case 'profile': return <ProfileTab />;
      default: return <DashboardTab />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'orders': return 'Incoming Orders';
      case 'history': return 'Order History';
      case 'inventory': return 'Farm Inventory';
      case 'sales': return 'Sales Insights';
      case 'settings': return 'Stall Settings';
      case 'profile': return 'My Profile';
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
            className={`${styles.navButton} ${activeTab === 'history' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('history')}
            title="Order History"
          >
            <Clock size={20} /> {!isCollapsed && <span>Order History</span>}
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
            <div 
              className={styles.userProfile} 
              onClick={() => setActiveTab('profile')}
              role="button"
              tabIndex={0}
            >
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