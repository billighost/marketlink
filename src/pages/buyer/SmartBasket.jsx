import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import SmartBasketExperience from '@/components/domain/SmartBasketExperience';

export function SmartBasket() {
  useDocumentTitle('Smart Basket · MarketLink');
  const [searchParams] = useSearchParams();

  const promptParam = searchParams.get('prompt') || undefined;
  const budgetParam = searchParams.get('budget') ? Number(searchParams.get('budget')) : undefined;
  const dayParam = searchParams.get('day') || undefined;
  const marketIdParam = searchParams.get('marketId') || undefined;

  const initialParams = {
    prompt: promptParam,
    budget: budgetParam,
    day: dayParam,
    marketId: marketIdParam,
  };

  return (
    <Page width="wide">
      <PageTitle
        title="Smart Basket"
        context="Curate a complete harvest basket within your weekly budget from attending farmers."
        backTo="/buyer"
        backLabel="Back to marketplace"
      />

      <SmartBasketExperience
        initialParams={initialParams}
        embedded={false}
      />
    </Page>
  );
}

export default SmartBasket;
