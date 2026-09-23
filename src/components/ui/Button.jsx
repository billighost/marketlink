import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

/**
 * Button component supporting primary, secondary, text, and danger variants.
 * Supports rendering as native button, React Router Link, or custom component.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  as: Component = 'button',
  to,
  href,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  if (Component === Link || Component === 'Link' || (to && Component === 'button')) {
    return (
      <Link to={to} className={classes} aria-disabled={disabled} {...rest}>
        {children}
      </Link>
    );
  }

  if (Component === 'a' || href) {
    return (
      <a href={href} className={classes} aria-disabled={disabled} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
