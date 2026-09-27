import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from '@/components/layout/TopBar';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Footer from '@/components/layout/Footer';
import BackToTop from '@/components/ui/BackToTop';
import styles from './GuestLayout.module.css';

/**
 * GuestLayout wraps all public unauthenticated pages.
 * - Scopes --color-border to --color-hairline (neutral, not tan) on .layout
 * - Scopes --color-bg-muted to --color-white (no canvas bands as default section bg)
 * - Adds key={pathname} on <main> so the skip link lands correctly after navigation
 * - GuestBottomNav removed: a signed-out visitor is browsing, not operating an app.
 *   64px of persistent bottom chrome on every page duplicates the drawer and steals
 *   viewport from the catalogue. TopBar + drawer carry all navigation.
 */
export function GuestLayout() {
  const location = useLocation();

  // Scroll to top on route change for clean page navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className={styles.layout}>
      {/* Accessible skip link */}
      <a href="#main" className="skipLink">
        Skip to main content
      </a>

      {/* Slim site announcements */}
      <AnnouncementBar />

      {/* Persistent guest header */}
      <TopBar />

      {/* key forces remount on navigation so skip link scrolls to top of new page */}
      <main id="main" key={location.pathname} className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>

      {/* Persistent footer */}
      <Footer withWave={false} />

      {/* Floating Back to Top Button */}
      <BackToTop showAfter={350} />
    </div>
  );
}

export default GuestLayout;
