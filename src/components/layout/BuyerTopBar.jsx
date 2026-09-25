import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ShoppingBag,
  Bell,
  MapPin,
  Check,
  Package,
  Sparkles,
  Store,
  X,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useNotifications } from '@/context/NotificationContext';
import { homeMarket, getMarket } from '@/data/placeholders';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import GlobalSearchModal from '@/components/domain/GlobalSearchModal';
import styles from './BuyerTopBar.module.css';

/**
 * Top bar for the signed-in Customer interface.
 * Matches the MarketLink editorial aesthetic with:
 *  - Prominent MarketLink brand logo
 *  - Primary pickup market indicator with live Saturday status
 *  - Full customer navigation (Market, Produce, Farmers, Orders, Favorites)
 *  - Real-time Notifications bell & dropdown panel
 *  - Cart bag with live count badge
 *  - User avatar with profile access
 */
export function BuyerTopBar() {
  const { user } = useAuth();
  const { count } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 4;
      setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  // Close notifications on route change
  useEffect(() => {
    setIsNotifOpen(false);
  }, [location.pathname]);

  const currentMarket = (user?.homeMarketId ? getMarket(user.homeMarketId) : null) || homeMarket;
  const currentPath = location.state?.background?.pathname || location.pathname;

  const getInitials = () => {
    if (user?.firstName && user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return user.firstName[0].toUpperCase();
    }
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      return parts.map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    }
    return 'GA';
  };

  const handleOpenCart = () => {
    navigate('/buyer/cart', {
      state: { background: location.state?.background || location },
    });
  };

  const handleOpenMarkets = () => {
    navigate('/buyer/markets');
  };

  const handleNotifClick = (notif) => {
    markAsRead(notif.id);
    setIsNotifOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`} role="banner">
      <div className={styles.container}>
        {/* Left: Brand logo & Home Market indicator */}
        <div className={styles.leftGroup}>
          <Link to="/buyer" className={styles.brand} aria-label="MarketLink Customer Home">
            <MarketLinkLogo size="sm" />
          </Link>

          {/* Primary Market selector button */}
          <button
            type="button"
            onClick={handleOpenMarkets}
            className={styles.marketSelector}
            aria-label={`Current market: ${currentMarket.name}. Click to change market.`}
            title="Change primary pickup market"
          >
            <div className={styles.marketBadgePill}>
              <span className={styles.livePulse} aria-hidden="true" />
              <MapPin size={13} className={styles.pinIcon} aria-hidden="true" />
              <span className={styles.marketName}>{currentMarket.name}</span>
              <ChevronDown size={13} className={styles.chevron} aria-hidden="true" />
            </div>
          </button>
        </div>

        {/* Center: Desktop Navigation Links (>=1024px) */}
        <nav className={styles.desktopNav} aria-label="Customer navigation">
          <Link
            to="/buyer"
            className={`${styles.navLink} ${currentPath === '/buyer' ? styles.navLinkActive : ''}`}
          >
            Dashboard
          </Link>
          <Link
            to="/buyer/markets"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/markets') ? styles.navLinkActive : ''}`}
          >
            Markets
          </Link>
          <Link
            to="/buyer/products"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/products') ? styles.navLinkActive : ''}`}
          >
            Produce
          </Link>
          <Link
            to="/buyer/farmers"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/farmers') ? styles.navLinkActive : ''}`}
          >
            Farmers
          </Link>
          <Link
            to="/buyer/orders"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/orders') ? styles.navLinkActive : ''}`}
          >
            Orders
          </Link>
          <Link
            to="/buyer/favorites"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/favorites') ? styles.navLinkActive : ''}`}
          >
            Favorites
          </Link>
          <Link
            to="/buyer/reviews"
            className={`${styles.navLink} ${currentPath.startsWith('/buyer/reviews') ? styles.navLinkActive : ''}`}
          >
            Reviews
          </Link>
        </nav>

        {/* Right: Actions Group */}
        <div className={styles.actions}>
          {/* Global Search Button */}
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search produce, farmers, and markets"
            title="Search MarketLink"
          >
            <Search size={19} strokeWidth={1.8} aria-hidden="true" />
          </button>

          {/* Notifications Bell Dropdown */}
          <div className={styles.notifWrapper} ref={notifRef}>
            <button
              type="button"
              className={`${styles.iconButton} ${isNotifOpen ? styles.iconButtonActive : ''}`}
              onClick={() => setIsNotifOpen((prev) => !prev)}
              aria-label={`Notifications, ${unreadCount} unread`}
              aria-expanded={isNotifOpen}
            >
              <Bell size={19} strokeWidth={1.8} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className={styles.notifBadge} aria-hidden="true">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {isNotifOpen && (
              <div className={styles.notifDropdown} role="dialog" aria-label="Notifications panel">
                <div className={styles.notifHeader}>
                  <div className={styles.notifHeaderLeft}>
                    <span className={styles.notifHeaderTitle}>Notifications</span>
                    {unreadCount > 0 && (
                      <span className={styles.notifCountPill}>{unreadCount} new</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className={styles.markAllReadBtn}
                      onClick={markAllAsRead}
                    >
                      Mark all
                    </button>
                  )}
                </div>

                <div className={styles.notifList}>
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`${styles.notifItem} ${notif.unread ? styles.notifUnread : ''}`}
                        onClick={() => handleNotifClick(notif)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className={styles.notifItemIcon}>
                          {notif.type === 'order' && <Package size={16} />}
                          {notif.type === 'restock' && <Sparkles size={16} />}
                          {notif.type === 'market' && <Store size={16} />}
                        </div>
                        <div className={styles.notifItemContent}>
                          <div className={styles.notifItemHeader}>
                            <span className={styles.notifItemTitle}>{notif.title}</span>
                            <span className={styles.notifItemTime}>{notif.time}</span>
                          </div>
                          <p className={styles.notifItemMessage}>{notif.message}</p>
                        </div>
                        {notif.unread && <span className={styles.unreadDot} />}
                      </div>
                    ))
                  ) : (
                    <div className={styles.notifEmpty}>
                      <Bell size={24} className={styles.notifEmptyIcon} />
                      <p>You're all caught up!</p>
                    </div>
                  )}
                </div>

                <div className={styles.notifFooter}>
                  <Link
                    to="/buyer/notifications"
                    className={styles.notifSettingsLink}
                    onClick={() => setIsNotifOpen(false)}
                  >
                    View all notifications & preferences
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Cart Bag Button */}
          <button
            type="button"
            onClick={handleOpenCart}
            className={styles.cartButton}
            aria-label={`Shopping bag with ${count} items`}
            data-cart-target-desktop
          >
            <ShoppingBag size={19} strokeWidth={1.8} aria-hidden="true" />
            <span className={styles.cartText}>Bag</span>
            {count > 0 && (
              <span className={styles.cartBadge} data-cart-badge aria-hidden="true">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {/* User Profile Avatar Link */}
          <Link
            to="/buyer/profile"
            className={styles.avatarButton}
            aria-label={`Your account profile, ${user?.name || 'Customer'}`}
            title="Account & Profile"
          >
            <span className={styles.avatarText}>{getInitials()}</span>
          </Link>
        </div>
      </div>

      {/* Global Multi-Type Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
}

export default BuyerTopBar;
