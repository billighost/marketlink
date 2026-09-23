import React from 'react';
import styles from './Badge.module.css';

/**
 * Status or category tag badge
 */
export function Badge({
  tone = 'neutral',
  children,
  className = '',
  ...rest
}) {
  const classes = [
    styles.badge,
    styles[tone] || styles.neutral,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}

export default Badge;
