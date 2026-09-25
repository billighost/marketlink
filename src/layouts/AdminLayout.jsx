import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  ShieldCheck,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAdminOverview } from '@/api/admin';
import { useVisibleInterval } from '@/hooks/useVisibleInterval';
import Button from '@/components/ui/Button';
import styles from './AdminLayout.module.css';

export const AdminContext = createContext({
  overview: null,
  pendingFarmers: 0,
  openFlags: 0,
  unhandledMessages: 0,
  refreshOverview: () => {},
});

export const useAdmin = () => useContext(AdminContext);

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/people', label: 'People', icon: Users, badgeKey: 'pendingFarmers' },
  { to: '/admin/markets', label: 'Markets', icon: MapPin },
  { to: '/admin/moderation', label: 'Moderation', icon: ShieldCheck, badgeKey: 'openFlags' },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings, badgeKey: 'unhandledMessages' },
];

export default function AdminLayout() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);

  const fetchOverview = useCallback(async () => {
    if (!isAuthenticated || !pollingActive) return;
    try {
      const res = await getAdminOverview();
      setOverview(res?.data || null);
    } catch (err) {
      if (err?.status === 401) setPollingActive(false);
    }
  }, [isAuthenticated, pollingActive]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useVisibleInterval(fetchOverview, 45000, pollingActive && isAuthenticated);

  const pendingFarmers = overview?.pendingFarmers ?? 0;
  const openFlags = overview?.openFlags ?? 0;
  const unhandledMessages = overview?.unhandledMessages ?? 0;

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const getBadgeValue = (key) => {
    if (key === 'pendingFarmers') return pendingFarmers;
    if (key === 'openFlags') return openFlags;
    if (key === 'unhandledMessages') return unhandledMessages;
    return 0;
  };

  return (
    <AdminContext.Provider
      value={{
        overview,
        pendingFarmers,
        openFlags,
        unhandledMessages,
        refreshOverview: fetchOverview,
      }}
    >
      <div className={styles.layout}>
        {/* Desktop Sidebar (>= 1024px) */}
        <aside className={styles.sidebar} aria-label="Admin sidebar navigation">
          <div className={styles.sidebarHeader}>
            <Link to="/admin" className={styles.brandLink}>
              <span className={styles.brandLogo}>MarketLink</span>
              <span className={styles.adminBadge}>Admin</span>
            </Link>
          </div>

          <nav className={styles.sidebarNav}>
            {ADMIN_NAV.map(({ to, label, icon: Icon, end, badgeKey }) => {
              const count = badgeKey ? getBadgeValue(badgeKey) : 0;
              const badgeText = count > 9 ? '9+' : count > 0 ? String(count) : null;
              const ariaLabel = badgeText ? `${label}, ${count} need attention` : label;

              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                  aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                  aria-label={ariaLabel}
                >
                  <Icon size={18} aria-hidden="true" className={styles.navIcon} />
                  <span className={styles.navLabel}>{label}</span>
                  {badgeText && (
                    <span className={styles.badge} aria-hidden="true">
                      {badgeText}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <Link to="/buyer" className={styles.switchLink}>
              <ExternalLink size={16} aria-hidden="true" />
              <span>Customer app</span>
            </Link>
            <button type="button" onClick={handleSignOut} className={styles.signOutBtn}>
              <LogOut size={16} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={styles.mainWrapper}>
          {/* Mobile Top Bar (< 1024px) */}
          <header className={styles.mobileTopBar}>
            <div className={styles.mobileBrand}>
              <span className={styles.mobileBrandText}>MarketLink</span>
              <span className={styles.adminBadge}>Admin</span>
            </div>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open administration menu"
              aria-expanded={isMenuOpen}
            >
              <Menu size={20} aria-hidden="true" />
              <span>Menu</span>
            </button>
          </header>

          {/* Mobile Drawer Navigation (< 1024px) */}
          {isMenuOpen && (
            <div className={styles.mobileDrawerOverlay} onClick={() => setIsMenuOpen(false)}>
              <div
                className={styles.mobileDrawer}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Administration menu"
              >
                <div className={styles.drawerHeader}>
                  <span className={styles.drawerTitle}>Administration</span>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className={styles.drawerCloseBtn}
                    aria-label="Close menu"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </div>

                <nav className={styles.drawerNav}>
                  {ADMIN_NAV.map(({ to, label, icon: Icon, end, badgeKey }) => {
                    const count = badgeKey ? getBadgeValue(badgeKey) : 0;
                    const badgeText = count > 9 ? '9+' : count > 0 ? String(count) : null;

                    return (
                      <NavLink
                        key={to}
                        to={to}
                        end={end}
                        onClick={() => setIsMenuOpen(false)}
                        className={({ isActive }) =>
                          `${styles.drawerNavItem} ${isActive ? styles.drawerNavItemActive : ''}`
                        }
                      >
                        <Icon size={20} aria-hidden="true" />
                        <span className={styles.drawerNavLabel}>{label}</span>
                        {badgeText && (
                          <span className={styles.badge} aria-hidden="true">
                            {badgeText}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>

                <div className={styles.drawerFooter}>
                  <Link
                    to="/buyer"
                    onClick={() => setIsMenuOpen(false)}
                    className={styles.switchLink}
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    <span>Customer app</span>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSignOut}
                    className={styles.drawerSignOutBtn}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    <span>Sign out</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main Outlet */}
          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
