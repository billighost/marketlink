import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Search,
  Bookmark,
  ShoppingBag,
  User,
  Home,
  Store,
  Users,
  Info,
  PhoneCall,
  ChevronRight,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import MarketDropdown from '@/components/layout/MarketDropdown';
import styles from './TopBar.module.css';

/**
 * TopBar navigation header.
 * - Desktop (>=1024px): Logo, centered Nav Links, MarketDropdown, Saved, Cart, Profile
 * - Tablet & Mobile (<1024px): Logo, compact Market selector, Cart, Profile, Hamburger Menu
 * - Enhanced Mobile Drawer with quick search, icon list, shortcuts, and account CTA
 */
export function TopBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [drawerSearchQuery, setDrawerSearchQuery] = useState('');
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  let authContext = {};
  try {
    authContext = useAuth() || {};
  } catch {
    authContext = {};
  }
  const { isAuthenticated, user } = authContext;

  let cartContext = {};
  try {
    cartContext = useCart() || {};
  } catch {
    cartContext = {};
  }
  const { count = 0 } = cartContext;

  const navItems = [
    { name: 'Home', path: PATHS.HOME || '/', icon: Home },
    { name: 'Markets', path: PATHS.MARKETS || '/markets', icon: Store },
    { name: 'Farmers', path: PATHS.FARMERS || '/farmers', icon: Users },
    { name: 'Products', path: PATHS.PRODUCTS || '/products', icon: Sparkles },
    { name: 'About', path: PATHS.ABOUT || '/about', icon: Info },
    { name: 'Contact', path: PATHS.CONTACT || '/contact', icon: PhoneCall },
  ];

  const isItemActive = (item) => {
    const pathname = location.pathname;

    if (item.name === 'Home') {
      return pathname === '/' || pathname === '';
    }

    if (item.name === 'Markets') {
      return (
        pathname === '/markets' ||
        pathname.startsWith('/markets/') ||
        pathname.startsWith('/buyer/markets')
      );
    }

    if (item.name === 'Farmers') {
      return (
        pathname === '/farmers' ||
        pathname.startsWith('/farmers/') ||
        pathname.startsWith('/buyer/farmers')
      );
    }

    if (item.name === 'Products') {
      return (
        pathname === '/products' ||
        pathname.startsWith('/products/') ||
        pathname.startsWith('/buyer/products')
      );
    }

    if (item.name === 'About') {
      return (
        pathname === '/about' ||
        pathname.startsWith('/about/')
      );
    }

    if (item.name === 'Contact') {
      return (
        pathname === '/contact' ||
        pathname.startsWith('/contact/')
      );
    }

    return false;
  };

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Lock body scroll and handle keyboard events
  useEffect(() => {
    if (!isOpen) {
      document.body.classList.remove('noScroll');
      return;
    }

    document.body.classList.add('noScroll');

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableEls = drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableEls.length === 0) return;

        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('noScroll');
    };
  }, [isOpen]);

  const toggleMenu = () => {
    if (isOpen) {
      setIsOpen(false);
      menuButtonRef.current?.focus();
    } else {
      setIsOpen(true);
    }
  };

  const handleDrawerSearch = (e) => {
    e.preventDefault();
    if (drawerSearchQuery.trim()) {
      navigate(`${PATHS.BUYER_PRODUCTS || '/products'}?search=${encodeURIComponent(drawerSearchQuery.trim())}`);
      setIsOpen(false);
      setDrawerSearchQuery('');
    }
  };

  const isBuyer = isAuthenticated && (authContext.role === 'buyer' || authContext.role === 'customer');
  const profilePath = isBuyer ? (PATHS.BUYER_PROFILE || '/buyer/profile') : (PATHS.LOGIN || '/login');

  return (
    <>
      <header className={styles.header}>
        <div className={styles.barInner}>
          {/* Brand Logo - flex-shrink: 0 prevents any crunching */}
          <Link to={PATHS.HOME} className={styles.logoLink} aria-label="MarketLink Home">
            <span className={styles.logoDesktop}>
              <MarketLinkLogo size="md" />
            </span>
            <span className={styles.logoMobile}>
              <MarketLinkLogo size="sm" />
            </span>
          </Link>

          {/* Desktop Navigation (>=1024px only) */}
          <nav className={styles.desktopNav} aria-label="Main Navigation">
            <ul className={styles.navList} role="list">
              {navItems.map((item) => {
                const active = isItemActive(item);
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right Actions */}
          <div className={styles.actionsGroup}>
            {/* Market Selector Dropdown */}
            <div className={styles.marketWrapper}>
              <MarketDropdown variant="guest" align="right" />
            </div>

            {/* Bookmark / Saved Items */}
            <Link
              to={PATHS.BUYER_FAVORITES || '/buyer/favorites'}
              className={`${styles.iconBtn} ${styles.bookmarkBtn}`}
              aria-label="Saved favorites"
            >
              <Bookmark size={18} strokeWidth={1.8} aria-hidden="true" />
            </Link>

            {/* Shopping Bag / Cart */}
            <Link
              to={PATHS.BUYER_CART || '/buyer/cart'}
              className={`${styles.iconBtn} ${styles.cartBtn}`}
              aria-label={`Shopping bag${count > 0 ? ` with ${count} items` : ''}`}
            >
              <ShoppingBag size={18} strokeWidth={1.8} aria-hidden="true" />
              {count > 0 && <span className={styles.cartBadge}>{count > 9 ? '9+' : count}</span>}
            </Link>

            {/* User Profile */}
            <Link
              to={profilePath}
              className={styles.profileBtn}
              aria-label={isBuyer ? 'Your Profile' : 'Sign In'}
            >
              <User size={16} strokeWidth={2.2} aria-hidden="true" />
            </Link>

            {/* Mobile Menu Button (<1024px) */}
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuButton}
              onClick={toggleMenu}
              aria-expanded={isOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? (
                <X size={20} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Menu size={20} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile App Style Drawer Sheet */}
      {isOpen && (
        <div
          id="mobile-nav-drawer"
          ref={drawerRef}
          className={styles.drawer}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          {/* Drawer Top Bar */}
          <div className={styles.drawerHeader}>
            <div className={styles.drawerBrand}>
              <MarketLinkLogo size="sm" />
            </div>
            <button
              type="button"
              className={styles.drawerCloseBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>

          {/* Quick Search in Drawer */}
          <form onSubmit={handleDrawerSearch} className={styles.drawerSearchForm}>
            <Search size={16} className={styles.drawerSearchIcon} aria-hidden="true" />
            <input
              type="search"
              value={drawerSearchQuery}
              onChange={(e) => setDrawerSearchQuery(e.target.value)}
              placeholder="Search farm fresh produce..."
              className={styles.drawerSearchInput}
              aria-label="Search produce"
            />
            {drawerSearchQuery && (
              <button
                type="button"
                className={styles.drawerSearchClear}
                onClick={() => setDrawerSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Navigation Links */}
          <nav className={styles.drawerNav} aria-label="Mobile Navigation">
            <ul className={styles.drawerList} role="list">
              {navItems.map((item) => {
                const active = isItemActive(item);
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`${styles.drawerNavLink} ${active ? styles.drawerNavLinkActive : ''}`}
                      onClick={() => setIsOpen(false)}
                      aria-current={active ? 'page' : undefined}
                    >
                      <div className={styles.drawerNavIconWrap}>
                        <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                      </div>
                      <span className={styles.drawerNavLabel}>{item.name}</span>
                      <ChevronRight size={16} className={styles.drawerNavChevron} aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Quick Shortcuts: Saved & Bag */}
          <div className={styles.drawerShortcuts}>
            <Link
              to={PATHS.BUYER_FAVORITES || '/buyer/favorites'}
              className={styles.shortcutBtn}
              onClick={() => setIsOpen(false)}
            >
              <Bookmark size={16} strokeWidth={1.8} />
              <span>Saved Items</span>
            </Link>

            <Link
              to={PATHS.BUYER_CART || '/buyer/cart'}
              className={styles.shortcutBtn}
              onClick={() => setIsOpen(false)}
            >
              <ShoppingBag size={16} strokeWidth={1.8} />
              <span>Basket</span>
              {count > 0 && <span className={styles.shortcutBadge}>{count}</span>}
            </Link>
          </div>

          <div className={styles.drawerDivider} />

          {/* Account Footer Card */}
          <div className={styles.drawerAccountArea}>
            {isBuyer ? (
              <Link
                to={profilePath}
                className={styles.drawerProfileCard}
                onClick={() => setIsOpen(false)}
              >
                <div className={styles.drawerAvatar}>
                  <User size={18} strokeWidth={2} />
                </div>
                <div className={styles.drawerUserInfo}>
                  <strong className={styles.drawerUserName}>
                    {user?.name || user?.firstName || 'My Account'}
                  </strong>
                  <span className={styles.drawerUserRole}>Customer Member</span>
                </div>
                <ChevronRight size={16} className={styles.drawerNavChevron} />
              </Link>
            ) : (
              <div className={styles.drawerAuthCta}>
                <p className={styles.drawerAuthText}>
                  Shop directly from independent local producers.
                </p>
                <div className={styles.drawerAuthBtnGroup}>
                  <Link
                    to={PATHS.LOGIN || '/login'}
                    className={styles.drawerSignInBtn}
                    onClick={() => setIsOpen(false)}
                  >
                    <LogIn size={16} />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to={PATHS.REGISTER || '/register'}
                    className={styles.drawerRegisterBtn}
                    onClick={() => setIsOpen(false)}
                  >
                    <span>Create Account</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default TopBar;

