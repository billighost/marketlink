import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { invalidateQueries } from '@/hooks/useQuery';
import styles from './OfflineBanner.module.css';

/**
 * Global network connectivity banner with recovery action.
 * Handles:
 * - Network failure
 * - User-friendly message & safe local state notice
 * - Interactive "Retry connection" recovery button
 * - Reconnection confirmation
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  const testConnection = useCallback(async () => {
    setIsRetrying(true);
    try {
      // Attempt a lightweight fetch to check backend / internet connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(async () => {
        // Fallback check to favicon or origin if api/health is not available
        return await fetch('/', { method: 'HEAD', cache: 'no-store', signal: controller.signal });
      });
      clearTimeout(timeoutId);

      if (res && (res.ok || res.status < 500)) {
        setIsOffline(false);
        setJustReconnected(true);
        invalidateQueries();
        setTimeout(() => setJustReconnected(false), 3000);
      } else {
        setIsOffline(true);
      }
    } catch {
      setIsOffline(true);
    } finally {
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      invalidateQueries();
      setTimeout(() => setJustReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    const handleCustomNetworkError = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('marketlink:offline', handleCustomNetworkError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('marketlink:offline', handleCustomNetworkError);
    };
  }, []);

  if (justReconnected) {
    return (
      <div className={`${styles.banner} ${styles.reconnected}`} role="status" aria-live="polite">
        <CheckCircle2 size={16} aria-hidden="true" />
        <span>Connected! MarketLink is back online.</span>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      <div className={styles.content}>
        <WifiOff size={16} aria-hidden="true" className={styles.icon} />
        <span className={styles.text}>
          Connection lost. You're currently offline — your basket is safely saved.
        </span>
      </div>
      <button
        type="button"
        className={styles.retryBtn}
        onClick={testConnection}
        disabled={isRetrying}
        aria-label="Retry connection"
      >
        <RefreshCw size={13} className={isRetrying ? styles.spin : ''} aria-hidden="true" />
        <span>{isRetrying ? 'Checking…' : 'Retry connection'}</span>
      </button>
    </div>
  );
}

export default OfflineBanner;
