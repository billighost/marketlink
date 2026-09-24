import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  ShieldCheck,
  BarChart3,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import styles from './AdminLayout.module.css';

const NAV_ITEMS = [
  { key: '',           label: 'Dashboard',   icon: LayoutDashboard },
  { key: 'people',     label: 'Users',       icon: Users },
  { key: 'markets',    label: 'Markets',     icon: MapPin },
  { key: 'moderation', label: 'Moderation',  icon: ShieldCheck },
  { key: 'reports',    label: 'Analytics',   icon: BarChart3 },
  { key: 'settings',   label: 'Settings',    icon: Settings },
];

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL
  const currentPath = location.pathname.replace('/admin', '').replace(/^\//, '');
  const activeKey = NAV_ITEMS.find(n => n.key && currentPath.startsWith(n.key))?.key || '';

  const handleNav = (key) => {
    navigate(`/admin${key ? `/${key}` : ''}`);
  };

  const getPageTitle = () => {
    const item = NAV_ITEMS.find(n => n.key === activeKey);
    return item ? item.label : 'Dashboard';
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
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`${styles.navButton} ${activeKey === key ? styles.activeTab : ''}`}
              onClick={() => handleNav(key)}
              title={label}
            >
              <Icon size={20} /> {!isCollapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        <div className={styles.collapseMenu}>
          <button
            className={styles.collapseButton}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Menu' : 'Collapse Menu'}
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
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search..."
                className={styles.searchInput}
              />
            </div>
            <div className={styles.bellIcon}>
              <Bell size={20} />
              <div className={styles.notificationDot}></div>
            </div>
            <div className={styles.userProfile}>
              <div className={styles.userInfo}>
                <div className={styles.userName}>Admin</div>
                <div className={styles.userRole}>Platform Manager</div>
              </div>
              <div className={styles.avatar}>A</div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className={styles.contentArea}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
