import React from 'react';
import Page from '@/components/layout/Page';
import MarketsView from '@/components/catalogue/MarketsView';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Buyer markets index page wrapper.
 */
export function Markets() {
  useDocumentTitle('Markets · MarketLink');
  return (
    <Page width="wide">
      <MarketsView audience="buyer" />
    </Page>
  );
}

export default Markets;
