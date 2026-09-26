import React from 'react';
import Illustration from '@/components/domain/Illustration';
import Button from '@/components/ui/Button';
import styles from './EmptyState.module.css';

/**
 * Friendly empty state with illustration, title, text, and action button.
 */
export function EmptyState({
  illustration = 'basket',
  title,
  text,
  actionLabel,
  onAction,
  actionTo,
  className = '',
}) {
  return (
    <div className={`${styles.empty} ${className}`}>
      <Illustration name={illustration} size="lg" />
      {title && <h3 className={styles.title}>{title}</h3>}
      {text && <p className={styles.text}>{text}</p>}
      {actionLabel && (
        <Button
          variant="primary"
          size="md"
          onClick={onAction}
          to={actionTo}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
