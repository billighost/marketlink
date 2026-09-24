import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from '@/components/layout/TopBar';
import Footer from '@/components/layout/Footer';
import BackToTop from '@/components/ui/BackToTop';
import styles from './GuestLayout.module.css';

/**
 * GuestLayout frame wrapping public unauthenticated pages.
 * Provides skip-to-content link, persistent TopBar, unconstrained <main>, Footer, and BackToTop.
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

      {/* Persistent guest header */}
      <TopBar />

      {/* Main content: unconstrained to allow full-width canvas bands */}
      <main id="main" className={styles.main} tabIndex={-1}>
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
