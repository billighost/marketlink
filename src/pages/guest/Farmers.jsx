import React from 'react';
import Page from '@/components/layout/Page';
import StallsView from '@/components/catalogue/StallsView';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Public stalls index page wrapper.
 */
export function Farmers() {
  useDocumentTitle('Stalls · MarketLink');
  return (
    <Page width="wide">
      <StallsView audience="guest" />
    </Page>
  );
}

export default Farmers;
