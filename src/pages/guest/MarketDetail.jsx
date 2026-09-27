import React from 'react';
import Page from '@/components/layout/Page';
import MarketView from '@/components/catalogue/MarketView';

/**
 * Public market detail page wrapper.
 */
export function MarketDetail() {
  return (
    <Page width="detail">
      <MarketView audience="guest" />
    </Page>
  );
}

export default MarketDetail;
