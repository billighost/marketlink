import React from 'react';
import Page from '@/components/layout/Page';
import ProduceView from '@/components/catalogue/ProduceView';

/**
 * Public produce detail page wrapper.
 */
export function ProductDetail() {
  return (
    <Page width="wide">
      <ProduceView audience="guest" />
    </Page>
  );
}

export default ProductDetail;
