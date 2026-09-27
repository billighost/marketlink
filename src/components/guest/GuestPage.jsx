import React from 'react';
import Page from '@/components/layout/Page';

/**
 * GuestPage — public page content container.
 *
 * Reuses the buyer Page component directly. Its widths (wide=1200, detail=960,
 * read=720) match what the guest site needs — duplicating a near-identical component
 * is exactly the duplication this pack exists to remove.
 *
 * @param {'wide'|'detail'|'read'} width  wide = index/feed (1200px), detail = 960px, read = 720px
 * @param {React.ReactNode} children
 * @param {string} [className]
 */
export function GuestPage({ width = 'wide', children, className = '', ...rest }) {
  return (
    <Page width={width} className={className} {...rest}>
      {children}
    </Page>
  );
}

export default GuestPage;
