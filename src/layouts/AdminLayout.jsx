import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
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
import { MarketLinkLeaf } from '@/components/ui/MarketLinkLogo';
import Button from '@/components/ui/Button';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import styles from './AdminLayout.module.css';

export const AdminContext = createContext({
  overview: null,
  pendingFarmers: 0,
  openFlags: 0,
  unhandledMessages: 0,
  lastUpdated: null,
  loadingOverview: false,
  errorOverview: null,
  refreshOverview: async () => {},
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
  const { logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [errorOverview, setErrorOverview] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);

  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const mainWrapperRef = useRef(null);

  const fetchOverview = useCallback(async () => {
    if (!isAuthenticated || !pollingActive) return;
    setLoadingOverview(true);
    try {
      const res = await getAdminOverview();
      setOverview(res?.data || null);
      setLastUpdated(new Date());
      setErrorOverview(null);
      return res?.data;
    } catch (err) {
      if (err?.status === 401) setPollingActive(false);
      setErrorOverview(err?.message || 'Could not load platform overview.');
    } finally {
      setLoadingOverview(false);
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
    try {
      sessionStorage.setItem('marketlink_signed_out_notice', 'You have been signed out successfully.');
    } catch {
      // ignore
    }
    await logout();
    navigate('/login', {
      state: { signedOut: true, message: 'You have been signed out successfully.' },
    });
  };

  const getBadgeValue = (key) => {
    if (key === 'pendingFarmers') return pendingFarmers;
    if (key === 'openFlags') return openFlags;
    if (key === 'unhandledMessages') return unhandledMessages;
    return 0;
  };

  // Mobile drawer accessibility & focus management
  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus to close button
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    // Apply inert to main wrapper behind drawer if supported
    if (mainWrapperRef.current) {
      mainWrapperRef.current.setAttribute('aria-hidden', 'true');
      if ('inert' in mainWrapperRef.current) {
        mainWrapperRef.current.inert = true;
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsMenuOpen(false);
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      if (mainWrapperRef.current) {
        mainWrapperRef.current.removeAttribute('aria-hidden');
        if ('inert' in mainWrapperRef.current) {
          mainWrapperRef.current.inert = false;
        }
      }
      window.removeEventListener('keydown', handleKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [isMenuOpen]);

  return (
    <AdminContext.Provider
      value={{
        overview,
        pendingFarmers,
        openFlags,
        unhandledMessages,
        lastUpdated,
        loadingOverview,
        errorOverview,
        refreshOverview: fetchOverview,
      }}
    >
      <div className={styles.layout}>
        {/* Desktop Sidebar (>= 1024px) */}
        <aside className={styles.sidebar} aria-label="Admin sidebar navigation">
          <div className={styles.sidebarHeader}>
            <Link to="/admin" className={styles.brandLink}>
              <div className={styles.brandRow}>
                <MarketLinkLeaf size={24} className={styles.brandIcon} color="var(--color-primary)" />
                <span className={styles.brandLogo}>MarketLink</span>
              </div>
              <span className={styles.adminSubtitle}>Admin</span>
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
            <div className={styles.signedInAs}>
              <span className={styles.signedInLabel}>Signed in as</span>
              <span className={styles.signedInName}>{user?.name || 'Administrator'}</span>
              <span className={styles.signedInEmail}>{user?.email || 'admin@marketlink.test'}</span>
            </div>
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
        <div className={styles.mainWrapper} ref={mainWrapperRef}>
          {/* Mobile Top Bar (< 1024px) */}
          <header className={styles.mobileTopBar}>
            <Link to="/admin" className={styles.mobileBrand}>
              <MarketLinkLeaf size={22} className={styles.brandIcon} color="var(--color-primary)" />
              <div className={styles.mobileBrandInfo}>
                <span className={styles.mobileBrandText}>MarketLink</span>
                <span className={styles.mobileAdminSubtitle}>Admin</span>
              </div>
            </Link>
            
            <div className={styles.mobileTopActions}>
              {(pendingFarmers > 0 || openFlags > 0) && (
                <Link
                  to={pendingFarmers > 0 ? '/admin/people?status=pending' : '/admin/moderation'}
                  className={styles.mobileAttentionPill}
                  title="Items needing review"
                >
                  <span className={styles.attentionDot} />
                  <span>{pendingFarmers + openFlags} alert{(pendingFarmers + openFlags) !== 1 ? 's' : ''}</span>
                </Link>
              )}
              <button
                ref={menuButtonRef}
                type="button"
                className={styles.menuButton}
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open administration menu"
                aria-expanded={isMenuOpen}
              >
                <div className={styles.menuBtnInner}>
                  <Menu size={18} aria-hidden="true" />
                  <span>Menu</span>
                  {(pendingFarmers + openFlags + unhandledMessages) > 0 && (
                    <span className={styles.mobileMenuBadge}>
                      {pendingFarmers + openFlags + unhandledMessages}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </header>

          {/* Main Outlet */}
          <main className={styles.content}>
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation (< 1024px) */}
          <nav className={styles.mobileBottomNav} aria-label="Mobile admin quick navigation">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
              }
            >
              <LayoutDashboard size={20} aria-hidden="true" />
              <span className={styles.bottomNavLabel}>Overview</span>
            </NavLink>

            <NavLink
              to="/admin/people"
              className={({ isActive }) =>
                `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
              }
            >
              <div className={styles.bottomNavIconWrap}>
                <Users size={20} aria-hidden="true" />
                {pendingFarmers > 0 && (
                  <span className={styles.bottomNavBadge}>
                    {pendingFarmers > 9 ? '9+' : pendingFarmers}
                  </span>
                )}
              </div>
              <span className={styles.bottomNavLabel}>People</span>
            </NavLink>

            <NavLink
              to="/admin/moderation"
              className={({ isActive }) =>
                `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
              }
            >
              <div className={styles.bottomNavIconWrap}>
                <ShieldCheck size={20} aria-hidden="true" />
                {openFlags > 0 && (
                  <span className={styles.bottomNavBadge}>
                    {openFlags > 9 ? '9+' : openFlags}
                  </span>
                )}
              </div>
              <span className={styles.bottomNavLabel}>Moderate</span>
            </NavLink>

            <NavLink
              to="/admin/markets"
              className={({ isActive }) =>
                `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
              }
            >
              <MapPin size={20} aria-hidden="true" />
              <span className={styles.bottomNavLabel}>Markets</span>
            </NavLink>

            <button
              type="button"
              className={`${styles.bottomNavItem} ${isMenuOpen ? styles.bottomNavItemActive : ''}`}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open full admin menu"
            >
              <div className={styles.bottomNavIconWrap}>
                <Menu size={20} aria-hidden="true" />
                {unhandledMessages > 0 && (
                  <span className={styles.bottomNavBadge}>
                    {unhandledMessages > 9 ? '9+' : unhandledMessages}
                  </span>
                )}
              </div>
              <span className={styles.bottomNavLabel}>More</span>
            </button>
          </nav>
        </div>

        {/* Mobile Drawer Navigation (< 1024px) */}
        {isMenuOpen && (
          <div
            className={styles.mobileDrawerOverlay}
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          >
            <div
              ref={drawerRef}
              className={styles.mobileDrawer}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Administration menu"
            >
              <div className={styles.drawerHeader}>
                <span className={styles.drawerTitle}>Administration</span>
                <button
                  ref={closeButtonRef}
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
                <div className={styles.signedInAs}>
                  <span className={styles.signedInLabel}>Signed in as</span>
                  <span className={styles.signedInName}>{user?.name || 'Administrator'}</span>
                  <span className={styles.signedInEmail}>{user?.email || 'admin@marketlink.test'}</span>
                </div>
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
      </div>
    </AdminContext.Provider>
  );
}
