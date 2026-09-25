  import React, { useState, useEffect, useRef } from 'react';
  import { Link, useLocation, useNavigate } from 'react-router-dom';
  import { Menu, X, Search, Bookmark, ShoppingBag, User } from 'lucide-react';
  import { PATHS } from '@/routes/paths';
  import { useAuth } from '@/context/AuthContext';
  import { useCart } from '@/context/CartContext';
  import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
  import MarketDropdown from '@/components/layout/MarketDropdown';
  import styles from './TopBar.module.css';

  /**
   * TopBar navigation header.
   * Matches the MarketLink header design:
   * Left: Logo badge with screen.png + "MarketLink" text
   * Center: Markets (active pill), Farmers, Products, About Us, Contact
   * Right: Search, Saved/Bookmark, Shopping Bag, User profile button
   */
  export function TopBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);
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
    const { isAuthenticated } = authContext;

    let cartContext = {};
    try {
      cartContext = useCart() || {};
    } catch {
      cartContext = {};
    }
    const { count = 0 } = cartContext;

    const navItems = [
      { name: 'Home', path: PATHS.HOME || '/' },
      { name: 'Markets', path: PATHS.MARKETS || '/markets' },
      { name: 'Farmers', path: PATHS.FARMERS || '/farmers' },
      { name: 'Products', path: PATHS.PRODUCTS || '/products' },
      { name: 'About', path: PATHS.ABOUT || '/about' },
      { name: 'Contact', path: PATHS.CONTACT || '/contact' },
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

    // Close drawer & search on route change
    useEffect(() => {
      setIsOpen(false);
      setIsSearchOpen(false);
    }, [location.pathname]);

    // Focus search input when opened
    useEffect(() => {
      if (isSearchOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isSearchOpen]);

    // Lock body scroll and handle keyboard events (Escape and focus trap)
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
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

      const timer = setTimeout(() => {
        if (drawerRef.current) {
          const firstFocusable = drawerRef.current.querySelector('a, button');
          firstFocusable?.focus();
        }
      }, 50);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.classList.remove('noScroll');
        clearTimeout(timer);
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

    const handleSearchSubmit = (e) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`${PATHS.BUYER_PRODUCTS || '/buyer/products'}?search=${encodeURIComponent(searchQuery.trim())}`);
        setIsSearchOpen(false);
        setSearchQuery('');
      } else {
        navigate(PATHS.BUYER_PRODUCTS || '/buyer/products');
        setIsSearchOpen(false);
      }
    };

    const isBuyer = isAuthenticated && (authContext.role === 'buyer' || authContext.role === 'customer');
    const profilePath = isBuyer ? (PATHS.BUYER_PROFILE || '/buyer/profile') : (PATHS.LOGIN || '/login');

    return (
      <header className={styles.header}>
        <div className={styles.barInner}>
          {/* Brand Logo */}
          <Link to={PATHS.HOME} className={styles.logoLink} aria-label="MarketLink Home">
            <MarketLinkLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
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
            {/* Search Action
            <div className={styles.searchWrapper}>
              {isSearchOpen && (
                <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) setIsSearchOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsSearchOpen(false);
                    }}
                    placeholder="Search products..."
                    className={styles.searchInput}
                    aria-label="Search products"
                  />
                </form>
              )}
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => {
                  if (isSearchOpen && searchQuery.trim()) {
                    handleSearchSubmit({ preventDefault: () => { } });
                  } else {
                    setIsSearchOpen((prev) => !prev);
                  }
                }}
                aria-label="Search"
              >
                <Search size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div> */}

            {/* Market Selector Dropdown */}
            <MarketDropdown variant="guest" align="right" />

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
              className={styles.iconBtn}
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

            {/* Mobile Menu Button (<768px) */}
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
                <X size={18} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Menu size={18} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isOpen && (
          <div
            id="mobile-nav-drawer"
            ref={drawerRef}
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            <nav className={styles.drawerNav} aria-label="Mobile Navigation">
              <ul className={styles.drawerList} role="list">
                {navItems.map((item) => {
                  const active = isItemActive(item);
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        className={`${styles.drawerNavLink} ${active ? styles.drawerNavLinkActive : ''}`}
                        onClick={() => setIsOpen(false)}
                        aria-current={active ? 'page' : undefined}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className={styles.drawerDivider} />

              <div className={styles.drawerActions}>
                <Link
                  to={profilePath}
                  className={styles.drawerProfileLink}
                  onClick={() => setIsOpen(false)}
                >
                  <User size={18} strokeWidth={2} />
                  <span>{isBuyer ? 'My Profile' : 'Sign in / Register'}</span>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    );
  }

  export default TopBar;
