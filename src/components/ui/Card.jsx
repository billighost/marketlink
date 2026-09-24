import React from 'react';
import styles from './Card.module.css';

/**
 * Card surface component
 */
export function Card({
  as: Component = 'div',
  padding = 'default',
  children,
  className = '',
  ...rest
}) {
  const classes = [
    styles.card,
    padding === 'none' ? styles.paddingNone : styles.paddingDefault,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}

export default Card;
