import React from 'react';
import Page from '@/components/layout/Page';
import MarketView from '@/components/catalogue/MarketView';

/**
 * Buyer market detail page wrapper.
 */
export function MarketDetail() {
  return (
    <Page width="detail">
      <MarketView audience="buyer" />
    </Page>
  );
}

export default MarketDetail;