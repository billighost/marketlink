import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from '@/components/layout/TopBar';
import Footer from '@/components/layout/Footer';
import styles from './GuestLayout.module.css';

/**
 * GuestLayout frame wrapping public unauthenticated pages.
 * Provides skip-to-content link, persistent TopBar, unconstrained <main>, and Footer.
 */
export function GuestLayout() {
  const location = useLocation();

  // Scroll to top on route change for seamless page navigation
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

      {/* Persistent footer with top wave */}
      <Footer withWave={true} />
    </div>
  );
}

export default GuestLayout;
