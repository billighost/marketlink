import React from 'react';
import BrowseView from '@/components/catalogue/BrowseView';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Public produce browsing page wrapper.
 */
export function Products() {
  useDocumentTitle('Produce · MarketLink');
  return <BrowseView audience="guest" />;
}

export default Products;
