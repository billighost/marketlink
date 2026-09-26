import React from 'react';
import { Link } from 'react-router-dom';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Review pickup and place the pre-order. Stage 4 stub — Stage 8 builds this properly.
 * Payment is settled in cash at the stall, so this page never collects payment details.
 */
export function Checkout() {
  useDocumentTitle('Review pickup · MarketLink');
  return (
    <Page width="detail">
      <PageTitle
        title="Review pickup"
        context="Choose when you will collect from each stall."
        backTo="/buyer/basket"
        backLabel="Back to basket"
      />
      <p>Checkout is built in a later stage.</p>
      <Link to="/buyer/basket">Back to basket</Link>
    </Page>
  );
}

export default Checkout;
