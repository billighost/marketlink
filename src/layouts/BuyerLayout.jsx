import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BuyerTopBar from '@/components/layout/BuyerTopBar';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import VerifyEmailBanner from '@/components/layout/VerifyEmailBanner';
import BottomNav from '@/components/layout/BottomNav';
import CommandPalette from '@/components/layout/CommandPalette';
import FloatingActions from '@/components/ui/FloatingActions';
import SmartBasketModal from '@/components/domain/SmartBasketModal';
import { useSmartBasket } from '@/context/SmartBasketContext';
import styles from './BuyerLayout.module.css';

/**
 * Clean application frame for Customer (buyer) pages.
 * Responsive navigation:
 *  - Below 1024px: Mobile/Tablet bottom nav (5 items), slim top bar
 *  - 1024px and up: Desktop top navigation, no bottom nav
 * Bottom stack:
 *  - Safe area inset -> Bottom nav -> Toast
 *  - --stack-bottom CSS token coordinates vertical offset
 */
export function BuyerLayout() {
  const location = useLocation();
  const { isOpen: isSmartBasketOpen, initialParams, closeSmartBasket } = useSmartBasket();
  const scrollPositionsRef = useRef({});
  const prevPathRef = useRef(location.pathname);
  const [reducedMotion, setReducedMotion] = useState(() => {
    try {
      return localStorage.getItem('marketlink_reduced_motion') === 'true';
    } catch {
      return false;
    }
  });

  // Listen for reduced motion changes from Profile settings
  useEffect(() => {
    const handleMotionChange = (e) => {
      const val = e.detail !== undefined ? Boolean(e.detail) : localStorage.getItem('marketlink_reduced_motion') === 'true';
      setReducedMotion(val);
    };

    window.addEventListener('marketlink_reduced_motion_change', handleMotionChange);
    window.addEventListener('storage', handleMotionChange);
    return () => {
      window.removeEventListener('marketlink_reduced_motion_change', handleMotionChange);
      window.removeEventListener('storage', handleMotionChange);
    };
  }, []);

  // Sync data-reduced-motion on document element
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  }, [reducedMotion]);

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
    <div
      className={styles.appShell}
      data-cart-visible="false"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
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

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Floating AI & Back to Top Actions */}
      <FloatingActions showTopAfter={350} />

      {/* Command Palette */}
      <CommandPalette />

      {/* AI Smart Basket Modal */}
      <SmartBasketModal
        isOpen={isSmartBasketOpen}
        onClose={closeSmartBasket}
        initialBudget={initialParams?.budget}
        initialCategories={initialParams?.categories}
        marketId={initialParams?.marketId}
        prompt={initialParams?.prompt}
        day={initialParams?.day}
      />
    </div>
  );
}

export default BuyerLayout;
