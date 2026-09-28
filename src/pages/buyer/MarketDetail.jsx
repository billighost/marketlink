import React from 'react';
import Page from '@/components/layout/Page';
import MarketView from '@/components/catalogue/MarketView';

/**
 * Customer / Buyer Market Detail page (/buyer/markets/:id).
 * Re-uses the redesigned MarketView with audience="buyer".
 */
export function MarketDetail() {
  return (
    <Page width="detail">
      <MarketView audience="buyer" />
    </Page>
  );
}

export default MarketDetail;