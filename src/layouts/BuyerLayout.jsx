<<<<<<< HEAD
import React, { useEffect, useRef } from 'react';import { Outlet, useLocation } from 'react-router-dom';import { useCart } from '@/context/CartContext';import BuyerTopBar from '@/components/layout/BuyerTopBar';import AnnouncementBar from '@/components/layout/AnnouncementBar';import BottomNav from '@/components/layout/BottomNav';import CartBar from '@/components/layout/CartBar';import styles from './BuyerLayout.module.css';export function BuyerLayout() {  const { count } = useCart();  const location = useLocation();  const scrollPositionsRef = useRef({});  const prevPathRef = useRef(location.pathname);  const isSheetPath =    location.pathname.startsWith('/buyer/products/') ||    location.pathname.startsWith('/buyer/farmers/') ||    location.pathname.startsWith('/buyer/markets/') ||    location.pathname.startsWith('/buyer/orders/') ||    location.pathname.startsWith('/buyer/profile/') ||    location.pathname === '/buyer/cart' ||    location.pathname === '/buyer/order-confirmed' ||    location.pathname === '/buyer/assistant';  const isSheetOpen = Boolean(location.state?.background) || isSheetPath;  const isCartRoute = location.pathname === '/buyer/cart';  const isCartVisible = count > 0 && !isSheetOpen && !isCartRoute;  useEffect(() => {    if (location.state?.background) return;    const prevPath = prevPathRef.current;    if (prevPath && prevPath !== location.pathname) {      scrollPositionsRef.current[prevPath] = window.scrollY;    }    prevPathRef.current = location.pathname;    const savedY = scrollPositionsRef.current[location.pathname] || 0;    window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });  }, [location.pathname, location.state?.background]);  return (    <div className={styles.appShell} data-cart-visible={isCartVisible ? 'true' : 'false'}>      {}      <a href="#main-content" className={styles.skipLink}>        Skip to main content      </a>      {}      {!isSheetOpen && <AnnouncementBar />}      {}      <BuyerTopBar />      {}      <main id="main-content" className={styles.main}>        <Outlet />      </main>      {}      {!isSheetOpen && <CartBar />}      {}      {!isSheetOpen && <BottomNav />}    </div>  );}export default BuyerLayout;
=======
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

  const isSheetPath =
    location.pathname.startsWith('/buyer/products/') ||
    location.pathname.startsWith('/buyer/farmers/') ||
    location.pathname.startsWith('/buyer/markets/') ||
    location.pathname.startsWith('/buyer/orders/') ||
    location.pathname.startsWith('/buyer/profile/') ||
    location.pathname === '/buyer/cart' ||
    location.pathname === '/buyer/order-confirmed' ||
    location.pathname === '/buyer/assistant';

  const isSheetOpen = Boolean(location.state?.background) || isSheetPath;
  const isCartRoute = location.pathname === '/buyer/cart';
  const isCartVisible = count > 0 && !isSheetOpen && !isCartRoute;

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
    <div className={styles.appShell} data-cart-visible={isCartVisible ? 'true' : 'false'}>
      {/* Skip Link */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      {/* Slim site announcements */}
      {!isSheetOpen && <AnnouncementBar />}
      {!isSheetOpen && <VerifyEmailBanner />}

      {/* Top Bar Header */}
      <BuyerTopBar />

      {/* Main Page Area */}
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>

      {/* Floating Cart Pill */}
      {!isSheetOpen && <CartBar />}

      {/* Mobile Bottom Navigation */}
      {!isSheetOpen && <BottomNav />}
    </div>
  );
}

export default BuyerLayout;
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
