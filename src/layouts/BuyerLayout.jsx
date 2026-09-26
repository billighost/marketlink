import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import BuyerTopBar from '@/components/layout/BuyerTopBar';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import VerifyEmailBanner from '@/components/layout/VerifyEmailBanner';
import BottomNav from '@/components/layout/BottomNav';
import CartBar from '@/components/layout/CartBar';
import styles from './BuyerLayout.module.css';

/**
 * Clean application frame for Customer (buyer) pages.
 * Responsive navigation:
 *  - Below 1024px: Mobile/Tablet bottom nav (5 items), slim top bar
 *  - 1024px and up: Desktop top navigation, no bottom nav
 * Bottom stack:
 *  - Safe area inset -> Bottom nav -> CartBar -> Toast
 *  - --stack-bottom CSS token coordinates vertical offset
 */
export function BuyerLayout() {
  const { count } = useCart();
  const location = useLocation();
  const scrollPositionsRef = useRef({});
  const prevPathRef = useRef(location.pathname);

  const isCartVisible = count > 0 && location.pathname !== '/buyer/basket';

  // Preserve scroll positions per tab across tab switches
  useEffect(() => {
    // Save previous tab scroll position
    const prevPath = prevPathRef.current;
    if (prevPath && prevPath !== location.pathname) {
      scrollPositionsRef.current[prevPath] = window.scrollY;
    }

    prevPathRef.current = location.pathname;

    // Restore saved scroll position for current tab (or 0 for fresh navigation)
    const savedY = scrollPositionsRef.current[location.pathname] || 0;
    window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className={styles.appShell} data-cart-visible={isCartVisible ? 'true' : 'false'}>
      {/* Skip Link */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      {/* Top Bar Header */}
      <BuyerTopBar />

      {/* Slim site announcements */}
      <AnnouncementBar />
      <VerifyEmailBanner />

      {/* Main Page Area */}
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>

      {/* Floating Cart Pill */}
      <CartBar />

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default BuyerLayout;
