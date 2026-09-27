import React from 'react';
import { AlertCircle, RefreshCw, WifiOff, FileQuestion } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './ErrorState.module.css';

const SCENE_ICON_MAP = {
  'offline-field': WifiOff,
  'lost-path': FileQuestion,
};

/**
 * Standard error state component used across the application.
 * Replaces old SVG scene art with clear, accessible, and professional UI.
 *
 * @param {string} [scene]           Optional scene key hint
 * @param {React.ComponentType} [icon] Optional icon override
 * @param {string} [title]           Title text, defaults to "Couldn't load this"
 * @param {string} [text]            User-friendly explanation
 * @param {string} [buttonText]      Retry button text, defaults to "Try again"
 * @param {Function} [onRetry]       Retry callback handler
 * @param {string} [className]       Optional additional classes
 */
export function ErrorState({
  scene,
  icon: CustomIcon,
  title = "Couldn't load this",
  text = 'Something went wrong. Please check your connection and try again.',
  buttonText = 'Try again',
  onRetry,
  className = '',
}) {
  const IconComponent = CustomIcon || (scene ? SCENE_ICON_MAP[scene] : null) || AlertCircle;

  return (
    <div className={`${styles.errorState} ${className}`} role="alert">
      <div className={styles.iconBadge} aria-hidden="true">
        <IconComponent size={28} strokeWidth={1.85} className={styles.icon} />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.text}>{text}</p>
      {onRetry && (
        <div className={styles.action}>
          <Button variant="primary" size="md" onClick={onRetry} className={styles.retryBtn}>
            <RefreshCw size={15} className={styles.btnIcon} aria-hidden="true" />
            <span>{buttonText}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
