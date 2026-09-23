import React from 'react';
import Illustration from '@/components/domain/Illustration';
import Button from '@/components/ui/Button';
import styles from './EmptyState.module.css';

/**
 * EmptyState component with canvas-tinted circle and illustration/icon
 */
export function EmptyState({
  title,
  text,
  illustration,
  icon: IconComponent,
  actionLabel,
  onAction,
  actionAs,
  actionTo,
  children,
  className = '',
}) {
  return (
    <div className={`${styles.emptyState} ${className}`}>
      <div className={styles.circleBackdrop} aria-hidden="true">
        {illustration ? (
          <Illustration name={illustration} size="lg" />
        ) : IconComponent ? (
          typeof IconComponent === 'function' ? (
            <IconComponent size={36} strokeWidth={1.5} className={styles.icon} />
          ) : (
            IconComponent
          )
        ) : (
          <Illustration name="basket" size="lg" />
        )}
      </div>

      {title && <h3 className={styles.title}>{title}</h3>}
      {text && <p className={styles.text}>{text}</p>}

      {actionLabel && (
        <div className={styles.action}>
          <Button
            variant="primary"
            onClick={onAction}
            as={actionAs}
            to={actionTo}
          >
            {actionLabel}
          </Button>
        </div>
      )}

      {children}
    </div>
  );
}

export default EmptyState;
