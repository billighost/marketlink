import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  Store,
  MoreHorizontal,
  LogOut,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getFarmerOrders, getFarmerProfile } from '@/api/farmer';
import { useVisibleInterval } from '@/hooks/useVisibleInterval';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import VerifyEmailBanner from '@/components/layout/VerifyEmailBanner';
import styles from './VendorLayout.module.css';

export const VendorContext = createContext({
  newOrdersCount: 0,
  stallInfo: null,
  isPending: false,
  isSuspended: false,
  refreshCounts: () => {},
  refreshProfile: () => {},
});

export const useVendor = () => useContext(VendorContext);

const NAV_ITEMS = [
  { to: '/vendor', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/vendor/stock', label: 'Stock', icon: Package },
  { to: '/vendor/orders', label: 'Orders', icon: ClipboardList, hasBadge: true },
  { to: '/vendor/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/vendor/insights', label: 'Insights', icon: TrendingUp },
  { to: '/vendor/stall', label: 'My stall', icon: Store },
];

export default function VendorLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [stallInfo, setStallInfo] = useState(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);

  // Load Stall Profile
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getFarmerProfile();
      setStallInfo(res?.data || null);
    } catch (err) {
      if (err?.status === 401) setPollingActive(false);
    }
  }, [isAuthenticated]);

  // Poll new orders count
  const fetchCounts = useCallback(async () => {
    if (!isAuthenticated || !pollingActive) return;
    try {
      const res = await getFarmerOrders({ status: 'placed', limit: 1 });
      const placed = res?.meta?.counts?.placed ?? 0;
      setNewOrdersCount(placed);
    } catch (err) {
      if (err?.status === 401) {
        setPollingActive(false);
      }
    }
  }, [isAuthenticated, pollingActive]);

  useEffect(() => {
    fetchProfile();
    fetchCounts();
  }, [fetchProfile, fetchCounts]);

  // Poll every 45s while visible
  useVisibleInterval(fetchCounts, 45000, pollingActive && isAuthenticated);

  const isPending = stallInfo?.approvalStatus === 'pending' || user?.status === 'pending';
  const isSuspended = stallInfo?.approvalStatus === 'suspended' || user?.status === 'suspended';

  const handleSignOut = async () => {
    setIsMoreOpen(false);
    await logout();
    navigate('/login');
  };

  const badgeText = newOrdersCount > 9 ? '9+' : newOrdersCount > 0 ? String(newOrdersCount) : null;
  const badgeAria = newOrdersCount > 0 ? `Orders, ${newOrdersCount} new` : 'Orders';

  return (
    <VendorContext.Provider
      value={{
        newOrdersCount,
        stallInfo,
        isPending,
        isSuspended,
        refreshCounts: fetchCounts,
        refreshProfile: fetchProfile,
      }}
    >
      <div className={styles.layout}>
        {/* Desktop Sidebar (>= 1024px) */}
        <aside className={styles.sidebar} aria-label="Farmer navigation">
          <div className={styles.sidebarHeader}>
            <Link to="/vendor" className={styles.brandLink}>
              <span className={styles.brandLogo}>MarketLink</span>
              <span className={styles.farmerBadge}>Farmer</span>
            </Link>
            <div className={styles.stallMeta}>
              <span className={styles.stallName} title={stallInfo?.stallName || 'My Stall'}>
                {stallInfo?.stallName || 'My Stall'}
              </span>
              {isPending && (
                <span className={styles.pendingTag}>
                  <AlertCircle size={12} aria-hidden="true" /> Waiting for approval
                </span>
              )}
            </div>
          </div>

          <nav className={styles.sidebarNav}>
            {NAV_ITEMS.map(({ to, label, icon: Icon, end, hasBadge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                aria-label={hasBadge && badgeText ? badgeAria : label}
              >
                <Icon size={18} aria-hidden="true" className={styles.navIcon} />
                <span className={styles.navLabel}>{label}</span>
                {hasBadge && badgeText && (
                  <span className={styles.badge} aria-hidden="true">
                    {badgeText}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
            <Link
              to={stallInfo?.id || stallInfo?._id ? `/farmers/${stallInfo.id || stallInfo._id}` : '/farmers'}
              target="_blank"
              rel="noreferrer"
              className={styles.switchLink}
              title="View your public stall storefront"
            >
              <Store size={16} aria-hidden="true" />
              <span>Public Storefront</span>
            </Link>
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
          <VerifyEmailBanner />
          {/* Mobile Top Bar (< 1024px) */}
          <header className={styles.mobileTopBar}>
            <div className={styles.mobileStallInfo}>
              <span className={styles.mobileStallTitle}>{stallInfo?.stallName || 'My Stall'}</span>
              {isPending && <span className={styles.mobileStatusBadge}>Pending</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                to={stallInfo?.id || stallInfo?._id ? `/farmers/${stallInfo.id || stallInfo._id}` : '/farmers'}
                target="_blank"
                rel="noreferrer"
                className={styles.mobileSwitchBtn}
                aria-label="View Public Stall"
                title="View Public Stall"
              >
                <Store size={16} aria-hidden="true" />
              </Link>
              <Link to="/buyer" className={styles.mobileSwitchBtn} aria-label="Open Customer App">
                <ExternalLink size={16} aria-hidden="true" />
              </Link>
            </div>
          </header>

          {/* Page View */}
          <main className={styles.content}>
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation (< 1024px) */}
          <nav className={styles.bottomNav} aria-label="Mobile navigation">
            <NavLink
              to="/vendor"
              end
              className={({ isActive }) =>
                `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
              }
            >
              <LayoutDashboard size={20} aria-hidden="true" />
              <span>Overview</span>
            </NavLink>

            <NavLink
              to="/vendor/stock"
              className={({ isActive }) =>
                `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
              }
            >
              <Package size={20} aria-hidden="true" />
              <span>Stock</span>
            </NavLink>

            <NavLink
              to="/vendor/orders"
              className={({ isActive }) =>
                `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
              }
              aria-label={badgeAria}
            >
              <div className={styles.iconWithBadge}>
                <ClipboardList size={20} aria-hidden="true" />
                {badgeText && (
                  <span className={styles.bottomNavBadge} aria-hidden="true">
                    {badgeText}
                  </span>
                )}
              </div>
              <span>Orders</span>
            </NavLink>

            <NavLink
              to="/vendor/reviews"
              className={({ isActive }) =>
                `${styles.bottomNavItem} ${isActive ? styles.bottomNavItemActive : ''}`
              }
            >
              <MessageSquare size={20} aria-hidden="true" />
              <span>Reviews</span>
            </NavLink>

            <button
              type="button"
              className={`${styles.bottomNavItem} ${isMoreOpen ? styles.bottomNavItemActive : ''}`}
              onClick={() => setIsMoreOpen(true)}
              aria-label="More options"
              aria-expanded={isMoreOpen}
            >
              <MoreHorizontal size={20} aria-hidden="true" />
              <span>More</span>
            </button>
          </nav>

          {/* More Peek Sheet on Phone */}
          <BottomSheet
            isOpen={isMoreOpen}
            onClose={() => setIsMoreOpen(false)}
            size="peek"
            title="Farmer options"
          >
            <div className={styles.moreSheetContent}>
              <Link
                to="/vendor/insights"
                onClick={() => setIsMoreOpen(false)}
                className={styles.moreSheetLink}
              >
                <TrendingUp size={20} aria-hidden="true" />
                <span>Sales insights</span>
              </Link>
              <Link
                to="/vendor/stall"
                onClick={() => setIsMoreOpen(false)}
                className={styles.moreSheetLink}
              >
                <Store size={20} aria-hidden="true" />
                <span>My stall settings</span>
              </Link>
              <Link
                to="/buyer"
                onClick={() => setIsMoreOpen(false)}
                className={styles.moreSheetLink}
              >
                <ExternalLink size={20} aria-hidden="true" />
                <span>Switch to Customer app</span>
              </Link>
              <div className={styles.moreSheetDivider} />
              <Button
                type="button"
                variant="ghost"
                onClick={handleSignOut}
                className={styles.moreSignOutBtn}
              >
                <LogOut size={18} aria-hidden="true" />
                <span>Sign out</span>
              </Button>
            </div>
          </BottomSheet>
        </div>
      </div>
    </VendorContext.Provider>
  );
}
