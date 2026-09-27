import React from 'react';
import Page from '@/components/layout/Page';
import StallView from '@/components/catalogue/StallView';

/**
 * Public stall detail page wrapper.
 */
export function FarmerDetail() {
  return (
    <Page width="detail">
      <StallView audience="guest" />
    </Page>
  );
}

export default FarmerDetail;
