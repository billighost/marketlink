import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, User, Store, Users, Sparkles, Info, PhoneCall, LogIn } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import { useAuth } from '@/context/AuthContext';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import styles from './TopBar.module.css';

/**
 * Guest TopBar — public, unauthenticated header.
 *
 * Desktop (≥1024px): Logo · five nav links · Search · Sign in · Sign up
 * Mobile (<1024px):  Logo · Search · Sign in · Hamburger
 *
 * Providers (AuthProvider, CartProvider) are always present in App.jsx —
 * the try/catch guards were removed because they silently swallowed context errors.
 * If a provider is ever removed, React will throw explicitly, which is correct behaviour.
 *
 * No cart, no saved, no MarketDropdown — these are signed-in features.
 * If useCart() returns a count for a guest that is a bug, not a feature.
 */
export function TopBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const closeButtonRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, role } = useAuth();

  const isAuthPage = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/unauthorized',
  ].includes(location.pathname);

  const isBuyer = isAuthenticated && (role === 'buyer' || role === 'customer');
  const profilePath = isBuyer ? (PATHS.BUYER_PROFILE || '/buyer/profile') : (PATHS.LOGIN || '/login');

  // Five nav items: logo is the home link
  const navItems = [
    { name: 'Home', path: PATHS.HOME || '/', icon: Store },
    { name: 'Markets', path: PATHS.MARKETS || '/markets', icon: Store },
    { name: 'Stalls', path: PATHS.FARMERS || '/farmers', icon: Users },
    { name: 'Produce', path: PATHS.PRODUCTS || '/products', icon: Sparkles },
    { name: 'About', path: PATHS.ABOUT || '/about', icon: Info },
    { name: 'Contact', path: PATHS.CONTACT || '/contact', icon: PhoneCall },
  ];

  const isActive = (path) => {
    const p = location.pathname;
    if (path === '/home') return p === '/';
    if (path === '/markets') return p === '/markets' || p.startsWith('/markets/');
    if (path === '/farmers') return p === '/farmers' || p.startsWith('/farmers/');
    if (path === '/products') return p === '/products' || p.startsWith('/products/');
    return p === path || p.startsWith(path + '/');
  };

  // Border appears only when scrolled — box height never changes (border is transparent at rest)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  // Body scroll lock + keyboard handling (Esc + Tab trap)
  useEffect(() => {
    if (!isOpen) {
      document.body.classList.remove('noScroll');
      return;
    }
    document.body.classList.add('noScroll');

    // Move focus to close button when drawer opens
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const els = drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); document.body.classList.remove('noScroll'); };
  }, [isOpen]);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => { setIsOpen(false); menuButtonRef.current?.focus(); };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${PATHS.PRODUCTS || '/products'}?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.barInner}>
          {/* Logo = home link */}
          <Link to={PATHS.HOME} className={styles.logoLink} aria-label="MarketLink home" data-tour="guest-brand">
            <MarketLinkLogo size="md" />
          </Link>

          {/* Desktop nav (≥1024) */}
          <nav className={styles.desktopNav} aria-label="Main navigation" data-tour="guest-nav">
            <ul className={styles.navList} role="list">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const tourAttr =
                  item.name === 'Markets'
                    ? 'guest-markets'
                    : item.name === 'Stalls'
                    ? 'guest-stalls'
                    : item.name === 'Produce'
                    ? 'guest-produce'
                    : undefined;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                      aria-current={active ? 'page' : undefined}
                      data-tour={tourAttr}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right actions */}
          <div className={styles.actions} data-tour="guest-auth">
            {/* Search — desktop only */}
            {/* <button
              type="button"
              className={`${styles.iconBtn} ${styles.searchBtn}`}
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              aria-label="Search produce"
            >
              <Search size={18} strokeWidth={1.8} aria-hidden="true" />
            </button> */}

            {/* Sign in — hidden only when already on the login page */}
            {location.pathname !== (PATHS.LOGIN || '/login') && (
              <Link to={PATHS.LOGIN || '/login'} className={styles.signInLink}>
                Sign in
              </Link>
            )}

            {/* Sign up — hidden only when already on the register page */}
            {location.pathname !== (PATHS.REGISTER || '/register') && (
              <Link to={PATHS.REGISTER || '/register'} className={styles.signUpBtn}>
                Sign up
              </Link>
            )}

            {/* Hamburger — mobile only */}
            <button
              ref={menuButtonRef}
              type="button"
              className={styles.menuBtn}
              onClick={openDrawer}
              aria-expanded={isOpen}
              aria-controls="guest-nav-drawer"
              aria-label="Open menu"
            >
              <Menu size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer backdrop */}
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={closeDrawer}
          aria-hidden="true"
        // background inert: all interactables are in the drawer
        />
      )}

      {/* Mobile drawer */}
      {isOpen && (
        <div
          id="guest-nav-drawer"
          ref={drawerRef}
          className={styles.drawer}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        // inert on background handled by backdrop pointer-events + body scroll lock
        >
          {/* Drawer header */}
          <div className={styles.drawerHead}>
            <MarketLinkLogo size="sm" />
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.drawerCloseBtn}
              onClick={closeDrawer}
              aria-label="Close menu"
            >
              <X size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className={styles.drawerSearch}>
            <Search size={16} className={styles.drawerSearchIcon} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search produce..."
              className={styles.drawerSearchInput}
              aria-label="Search produce"
            />
          </form>

          {/* Nav links */}
          <nav className={styles.drawerNav} aria-label="Mobile navigation">
            <ul className={styles.drawerList} role="list">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={`${styles.drawerLink} ${active ? styles.drawerLinkActive : ''}`}
                      onClick={closeDrawer}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Account CTAs */}
          <div className={styles.drawerAccount}>
            <p className={styles.drawerAccountText}>
              See what is on the stalls before you go.
            </p>
            <div className={styles.drawerAccountBtns}>
              <Link to={PATHS.LOGIN || '/login'} className={styles.drawerSignIn} onClick={closeDrawer}>
                <LogIn size={16} aria-hidden="true" />
                <span>Sign in</span>
              </Link>
              <Link to={PATHS.REGISTER || '/register'} className={styles.drawerSignUp} onClick={closeDrawer}>
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TopBar;
