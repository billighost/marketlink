import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './ErrorState.module.css';

/**
 * Standard error state component used across all app areas.
 * Conforms to Stage 8 specification D3:
 * Title "Couldn't load this", mapped user-friendly message, and "Try again" action.
 */
export function ErrorState({
  title = "Couldn't load this",
  text = 'Something went wrong. Please check your connection and try again.',
  buttonText = 'Try again',
  onRetry,
  className = '',
}) {
  return (
    <div className={`${styles.errorState} ${className}`} role="alert">
      <div className={styles.iconWrap} aria-hidden="true">
        <AlertCircle size={28} strokeWidth={2} />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.text}>{text}</p>
      {onRetry && (
        <div className={styles.action}>
          <Button variant="primary" size="md" onClick={onRetry}>
            {buttonText}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
