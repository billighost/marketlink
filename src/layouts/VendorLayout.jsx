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
  QrCode,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getFarmerOrders, getFarmerProfile, readyFarmerOrder, completeFarmerOrder } from '@/api/farmer';
import { useVisibleInterval } from '@/hooks/useVisibleInterval';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import VerifyEmailBanner from '@/components/layout/VerifyEmailBanner';
import Toast from '@/components/ui/Toast';
import FloatingActions from '@/components/ui/FloatingActions';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import styles from './VendorLayout.module.css';

export const VendorContext = createContext({
  newOrdersCount: 0,
  stallInfo: null,
  isPending: false,
  isSuspended: false,
  refreshCounts: () => {},
  refreshProfile: () => {},
  openPickupCodeModal: () => {},
});

export const useVendor = () => useContext(VendorContext);

const NAV_ITEMS = [
  { to: '/vendor', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/vendor/stock', label: 'Stock Catalog', icon: Package },
  { to: '/vendor/orders', label: 'Orders', icon: ClipboardList, hasBadge: true },
  { to: '/vendor/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/vendor/insights', label: 'Insights', icon: TrendingUp },
  { to: '/vendor/stall', label: 'My Stall', icon: Store },
];

export default function VendorLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [stallInfo, setStallInfo] = useState(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);

  // Pickup Code Lookup Modal State
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [codeSearching, setCodeSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState(null);
  const [codeError, setCodeError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  const handleOpenCodeLookup = () => {
    setPickupCodeInput('');
    setFoundOrder(null);
    setCodeError('');
    setIsCodeModalOpen(true);
  };

  const handleSearchPickupCode = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = pickupCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setCodeSearching(true);
    setCodeError('');
    setFoundOrder(null);

    try {
      const res = await getFarmerOrders({ search: cleanCode, limit: 10 });
      const matches = res?.data || [];
      const match = matches.find((o) => (o.pickupCode || '').toUpperCase() === cleanCode) || matches[0];
      if (match) {
        setFoundOrder(match);
      } else {
        setCodeError(`No order found matching pickup code "${cleanCode}".`);
      }
    } catch (err) {
      setCodeError(err?.message || 'Failed to search order.');
    } finally {
      setCodeSearching(false);
    }
  };

  const handleFulfillOrder = async (orderId) => {
    setActionLoading(true);
    try {
      await completeFarmerOrder(orderId);
      setToastMessage('Order completed & handed off!');
      fetchCounts();
      setIsCodeModalOpen(false);
    } catch (err) {
      setCodeError(err?.message || 'Failed to complete order.');
    } finally {
      setActionLoading(false);
    }
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
        openPickupCodeModal: handleOpenCodeLookup,
      }}
    >
      <div className={styles.layout}>
        {toastMessage && (
          <Toast message={toastMessage} type="success" onClose={() => setToastMessage('')} />
        )}

        {/* Desktop Sidebar (>= 1024px) */}
        <aside className={styles.sidebar} aria-label="Farmer navigation">
          <div className={styles.sidebarHeader}>
            <Link to="/vendor" className={styles.brandLink}>
              <MarketLinkLogo size="sm" />
              <span className={styles.farmerBadge} title="Farmer Stall Portal" aria-label="Farmer Stall Portal">
                <Store size={14} strokeWidth={2.3} aria-hidden="true" />
              </span>
            </Link>

            <Link
              to="/vendor/stall?action=create"
              className={styles.stallCardHeader}
              title={stallInfo?.stallName ? 'Configure your stall' : 'Create your farm stall'}
            >
              <div className={styles.stallMeta}>
                <span className={styles.stallName} title={stallInfo?.stallName || 'Create Your Stall'}>
                  {stallInfo?.stallName ? (
                    stallInfo.stallName
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={13} aria-hidden="true" />
                      <span>Create Your Stall</span>
                    </span>
                  )}
                </span>
                <div className={styles.stallStatusRow}>
                  <span className={styles.livePulseDot} />
                  <span className={styles.stallStatusText}>
                    {stallInfo?.stallName
                      ? isPending
                        ? 'Pending Approval'
                        : 'Stall Active'
                      : 'Setup Required'}
                  </span>
                </div>
              </div>
            </Link>

            {/* Sidebar Quick Action Bar */}
            <div className={styles.sidebarQuickActions}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className={styles.quickCodeBtn}
                onClick={handleOpenCodeLookup}
              >
                <QrCode size={15} aria-hidden="true" />
                <span>Pickup Code</span>
              </Button>
              <Link to="/vendor/stock?action=new" className={styles.quickAddLink}>
                <Plus size={15} aria-hidden="true" />
                <span>Add Item</span>
              </Link>
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
              <span>Customer View</span>
            </Link>
            <button type="button" onClick={handleSignOut} className={styles.signOutBtn}>
              <LogOut size={16} aria-hidden="true" />
              <span>Sign Out</span>
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
              <span className={styles.livePulseDot} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className={styles.mobileCodeBtn}
                onClick={handleOpenCodeLookup}
                aria-label="Lookup Pickup Code"
                title="Verify Pickup Code"
              >
                <QrCode size={18} aria-hidden="true" />
              </button>
              <Link
                to={stallInfo?.id || stallInfo?._id ? `/farmers/${stallInfo.id || stallInfo._id}` : '/farmers'}
                target="_blank"
                rel="noreferrer"
                className={styles.mobileSwitchBtn}
                aria-label="View Public Stall"
              >
                <Store size={16} aria-hidden="true" />
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
            title="Farmer Options"
          >
            <div className={styles.moreSheetContent}>
              <button
                type="button"
                onClick={() => {
                  setIsMoreOpen(false);
                  handleOpenCodeLookup();
                }}
                className={styles.moreSheetLinkBtn}
              >
                <QrCode size={20} aria-hidden="true" />
                <span>Verify Pickup Code</span>
              </button>
              <Link
                to="/vendor/insights"
                onClick={() => setIsMoreOpen(false)}
                className={styles.moreSheetLink}
              >
                <TrendingUp size={20} aria-hidden="true" />
                <span>Sales Insights</span>
              </Link>
              <Link
                to="/vendor/stall"
                onClick={() => setIsMoreOpen(false)}
                className={styles.moreSheetLink}
              >
                <Store size={20} aria-hidden="true" />
                <span>My Stall Settings</span>
              </Link>
              <Link
                to="/buyer"
                onClick={() => setIsMoreOpen(false)}
                className={styles.moreSheetLink}
              >
                <ExternalLink size={20} aria-hidden="true" />
                <span>Switch to Customer View</span>
              </Link>
              <div className={styles.moreSheetDivider} />
              <Button
                type="button"
                variant="ghost"
                onClick={handleSignOut}
                className={styles.moreSignOutBtn}
              >
                <LogOut size={18} aria-hidden="true" />
                <span>Sign Out</span>
              </Button>
            </div>
          </BottomSheet>

          {/* Pickup Code Lookup BottomSheet */}
          <BottomSheet
            isOpen={isCodeModalOpen}
            onClose={() => setIsCodeModalOpen(false)}
            size="peek"
            title="Verify Customer Pickup Code"
          >
            <div className={styles.codeModalBody}>
              <p className={styles.codeModalSub}>
                Enter the 6-character code presented by the customer at your stall.
              </p>

              <form onSubmit={handleSearchPickupCode} className={styles.codeSearchForm}>
                <div className={styles.codeInputWrap}>
                  <QrCode size={20} className={styles.codeSearchIcon} />
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="e.g. K79M2X"
                    value={pickupCodeInput}
                    onChange={(e) => setPickupCodeInput(e.target.value.toUpperCase())}
                    className={styles.codeInput}
                    autoFocus
                  />
                </div>
                <Button type="submit" variant="primary" loading={codeSearching} className={styles.codeSearchBtn}>
                  Search
                </Button>
              </form>

              {codeError && <div className={styles.codeErrorMsg}>{codeError}</div>}

              {foundOrder && (
                <div className={styles.foundOrderCard}>
                  <div className={styles.foundOrderHeader}>
                    <div>
                      <span className={styles.foundOrderNum}>{foundOrder.orderNumber}</span>
                      <span className={styles.foundCustomerName}>{foundOrder.customerName || 'Customer'}</span>
                    </div>
                    <span className={styles.foundStatusBadge}>{foundOrder.status}</span>
                  </div>

                  <div className={styles.foundItemsList}>
                    {(foundOrder.items || []).map((item, idx) => (
                      <div key={idx} className={styles.foundItemRow}>
                        <span>{item.quantity}x {item.productName || item.name}</span>
                        <span>${((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.foundOrderFooter}>
                    <div className={styles.foundTotal}>
                      <span>Total Price:</span>
                      <strong>${((foundOrder.totalCents || 0) / 100).toFixed(2)}</strong>
                    </div>

                    {foundOrder.status === 'completed' ? (
                      <div className={styles.completedTag}>
                        <CheckCircle2 size={16} /> Completed
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        loading={actionLoading}
                        onClick={() => handleFulfillOrder(foundOrder.id || foundOrder._id)}
                      >
                        <CheckCircle2 size={16} /> Complete & Hand Off
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </BottomSheet>

          {/* Floating AI & Back to Top Actions */}
          <FloatingActions showTopAfter={350} />
        </div>
      </div>
    </VendorContext.Provider>
  );
}

