import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import styles from './OfflineBanner.module.css';

/**
 * Global network offline banner indicating lost connectivity.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <WifiOff size={16} aria-hidden="true" />
      <span>You appear to be offline. Please check your internet connection.</span>
    </div>
  );
}

export default OfflineBanner;
