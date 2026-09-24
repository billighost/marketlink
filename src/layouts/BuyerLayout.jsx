import React, { useEffect } from 'react';
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
  const navType = useNavigationType();

  // Scroll to top on navigation, except when popping (back button) or when opening a sheet
  useEffect(() => {
    // If a background location exists, this is a sheet opening over the page; do not scroll the underlying page
    if (location.state?.background) return;

    if (navType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname, location.state?.background, navType]);

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
