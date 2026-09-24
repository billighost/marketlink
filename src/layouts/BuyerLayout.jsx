import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import BuyerTopBar from '@/components/layout/BuyerTopBar';
import BottomNav from '@/components/layout/BottomNav';
import CartBar from '@/components/layout/CartBar';
import styles from './BuyerLayout.module.css';

/**
 * Mobile-first application frame for Customer (buyer) pages.
 * Features:
 *  - Skip to content accessibility link
 *  - Sticky top bar with market switcher and user profile avatar
 *  - Mobile bottom navigation (5 items)
 *  - Floating CartBar when cart has items
 *  - Scroll-to-top on forward/push navigation
 *  - Safe area inset padding for mobile notch/home bars
 */
export function BuyerLayout() {
  const location = useLocation();
  const scrollPositionsRef = useRef({});
  const prevPathRef = useRef(location.pathname);

  // Preserve scroll positions per tab across tab switches
  useEffect(() => {
    // If a background location exists, this is a sheet opening over the page; do not touch underlying page scroll
    if (location.state?.background) return;

    // Save previous tab scroll position
    const prevPath = prevPathRef.current;
    if (prevPath && prevPath !== location.pathname) {
      scrollPositionsRef.current[prevPath] = window.scrollY;
    }

    prevPathRef.current = location.pathname;

    // Restore saved scroll position for current tab (or 0 for fresh navigation)
    const savedY = scrollPositionsRef.current[location.pathname] || 0;
    window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
  }, [location.pathname, location.state?.background]);

  return (
    <div className={styles.appShell}>
      {/* Skip Link */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      {/* Top Bar Header */}
      <BuyerTopBar />

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
