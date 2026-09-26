import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

/**
 * Button component supporting primary, secondary, text, and danger variants.
 * Supports rendering as native button, React Router Link, or custom component.
 */
export const Button = React.forwardRef(function Button(
  {
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
  },
  ref
) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  if (Component === Link || Component === 'Link' || (to && Component === 'button')) {
    return (
      <Link to={to} ref={ref} className={classes} aria-disabled={disabled} {...rest}>
        {children}
      </Link>
    );
  }

  if (Component === 'a' || href) {
    return (
      <a href={href} ref={ref} className={classes} aria-disabled={disabled} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
