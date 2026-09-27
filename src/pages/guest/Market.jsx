import React from 'react';
import Page from '@/components/layout/Page';
import MarketsView from '@/components/catalogue/MarketsView';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Public markets index page wrapper.
 */
export function Market() {
  useDocumentTitle('Markets · MarketLink');
  return (
    <Page width="wide">
      <MarketsView audience="guest" />
    </Page>
  );
}

export default Market;
