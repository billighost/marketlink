import React from 'react';
import BrowseView from '@/components/catalogue/BrowseView';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Buyer produce browsing page wrapper.
 */
export function Products() {
  useDocumentTitle('Browse · MarketLink');
  return <BrowseView audience="buyer" />;
}

export default Products;