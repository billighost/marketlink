import React from 'react';
import Page from '@/components/layout/Page';
import StallView from '@/components/catalogue/StallView';

/**
 * Buyer stall detail page wrapper.
 */
export function FarmerDetail() {
  return (
    <Page width="detail">
      <StallView audience="buyer" />
    </Page>
  );
}

export default FarmerDetail;