import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

/**
 * Bottom toast notification, above the nav and sheets.
 * Auto-dismisses after duration (default 2s).
 */
export function Toast({ message, action, onAction, duration = 2000, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  const content = (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.message}>{message}</span>
      {action && (
        <button type="button" className={styles.action} onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

export default Toast;
