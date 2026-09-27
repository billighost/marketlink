import React from 'react';
import Page from '@/components/layout/Page';
import ProduceView from '@/components/catalogue/ProduceView';

/**
 * Buyer produce detail page wrapper.
 */
export function ProductDetail() {
  return (
    <Page width="detail">
      <ProduceView audience="buyer" />
    </Page>
  );
}

export default ProductDetail;
