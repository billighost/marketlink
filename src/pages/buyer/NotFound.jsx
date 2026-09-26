import React from 'react';
import Page from '@/components/layout/Page';
import EmptyState from '@/components/ui/EmptyState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Buyer 404 page for unmatched routes under /buyer/*.
 */
export function NotFound() {
  useDocumentTitle('Page not found · MarketLink');

  return (
    <Page width="read">
      <EmptyState
        scene="lost-path"
        title="That page is not on the map"
        text="The link may be old, or the stall may have moved."
        actionLabel="Back to today"
        actionTo="/buyer"
      />
    </Page>
  );
}

export default NotFound;
