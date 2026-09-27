import React from 'react';
import Page from '@/components/layout/Page';
import ProduceView from '@/components/catalogue/ProduceView';

/**
 * Customer / Buyer Produce Detail Page (/buyer/products/:id).
 * Re-uses the redesigned ProduceView with audience="buyer".
 */
export function ProductDetail() {
  return (
    <Page width="detail">
      <ProduceView audience="buyer" />
    </Page>
  );
}

export default ProductDetail;
