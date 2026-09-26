import React from 'react';
import styles from './Page.module.css';

/**
 * Buyer page container. Owns the content width, the page gutter and the vertical rhythm.
 * Every buyer page is wrapped in exactly one of these.
 *
 * @param {'wide'|'detail'|'read'} width  wide = index/feed (1200px), detail = 960px, read = 720px
 */
export function Page({ width = 'wide', children, className = '', ...rest }) {
  return (
    <div className={`${styles.page} ${styles[width]} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export default Page;
