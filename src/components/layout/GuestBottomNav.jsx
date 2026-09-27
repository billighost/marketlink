import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Users, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { PATHS } from '@/routes/paths';
import styles from './GuestBottomNav.module.css';

/**
 * GuestBottomNav — Mobile app style persistent bottom bar for guest/public visitors.
 * Displayed exclusively on mobile devices (<768px) to provide a native mobile app feel.
 * Features:
 * - 5 touch-optimized tabs with active state indicators
 * - Cart item badge on Shopping Bag
 * - Safe area inset support (iPhone Home bar, Android navigation bar)
 * - Micro-animations on press
 */
export function GuestBottomNav() {
  const location = useLocation();
  const { count = 0 } = useCart() || {};
  const { isAuthenticated, role } = useAuth() || {};

  const pathname = location.pathname;

  const isHomeActive = pathname === '/' || pathname === '';
  const isMarketsActive = pathname === '/markets' || pathname.startsWith('/markets/');
  const isFarmersActive = pathname === '/farmers' || pathname.startsWith('/farmers/');
  const isProductsActive = pathname === '/products' || pathname.startsWith('/products/');

  const isBuyer = isAuthenticated && (role === 'buyer' || role === 'customer');
  const accountPath = isBuyer ? (PATHS.BUYER_PROFILE || '/buyer/profile') : (PATHS.LOGIN || '/login');
  const isAccountActive = pathname.startsWith('/buyer/profile') || pathname === '/login' || pathname === '/register';

  return (
    <nav className={styles.bottomBar} aria-label="Mobile Navigation">
      <div className={styles.navContainer}>
        {/* Tab 1: Home */}
        <Link
          to={PATHS.HOME || '/'}
          className={`${styles.tabBtn} ${isHomeActive ? styles.tabBtnActive : ''}`}
          aria-current={isHomeActive ? 'page' : undefined}
        >
          <div className={styles.iconWrap}>
            <Home size={21} strokeWidth={isHomeActive ? 2.2 : 1.75} />
            {isHomeActive && <span className={styles.activePill} />}
          </div>
          <span className={styles.tabLabel}>Home</span>
        </Link>

        {/* Tab 2: Markets */}
        <Link
          to={PATHS.MARKETS || '/markets'}
          className={`${styles.tabBtn} ${isMarketsActive ? styles.tabBtnActive : ''}`}
          aria-current={isMarketsActive ? 'page' : undefined}
        >
          <div className={styles.iconWrap}>
            <Store size={21} strokeWidth={isMarketsActive ? 2.2 : 1.75} />
            {isMarketsActive && <span className={styles.activePill} />}
          </div>
          <span className={styles.tabLabel}>Markets</span>
        </Link>

        {/* Tab 3: Farmers */}
        <Link
          to={PATHS.FARMERS || '/farmers'}
          className={`${styles.tabBtn} ${isFarmersActive ? styles.tabBtnActive : ''}`}
          aria-current={isFarmersActive ? 'page' : undefined}
        >
          <div className={styles.iconWrap}>
            <Users size={21} strokeWidth={isFarmersActive ? 2.2 : 1.75} />
            {isFarmersActive && <span className={styles.activePill} />}
          </div>
          <span className={styles.tabLabel}>Farmers</span>
        </Link>

        {/* Tab 4: Products / Catalog */}
        <Link
          to={PATHS.PRODUCTS || '/products'}
          className={`${styles.tabBtn} ${isProductsActive ? styles.tabBtnActive : ''}`}
          aria-current={isProductsActive ? 'page' : undefined}
        >
          <div className={styles.iconWrap}>
            <ShoppingBag size={21} strokeWidth={isProductsActive ? 2.2 : 1.75} />
            {count > 0 && <span className={styles.badge}>{count > 9 ? '9+' : count}</span>}
            {isProductsActive && <span className={styles.activePill} />}
          </div>
          <span className={styles.tabLabel}>Produce</span>
        </Link>

        {/* Tab 5: Account */}
        <Link
          to={accountPath}
          className={`${styles.tabBtn} ${isAccountActive ? styles.tabBtnActive : ''}`}
          aria-current={isAccountActive ? 'page' : undefined}
        >
          <div className={styles.iconWrap}>
            <User size={21} strokeWidth={isAccountActive ? 2.2 : 1.75} />
            {isAccountActive && <span className={styles.activePill} />}
          </div>
          <span className={styles.tabLabel}>{isBuyer ? 'Profile' : 'Sign In'}</span>
        </Link>
      </div>
    </nav>
  );
}

export default GuestBottomNav;
