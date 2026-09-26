import React from 'react';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Buyer notification preferences. Stage 4 stub — Stage 9 builds this properly.
 */
export function NotificationPrefs() {
  useDocumentTitle('Notification preferences · MarketLink');

  return (
    <Page width="read">
      <PageTitle
        title="Notification preferences"
        context="Choose which updates you receive."
        backTo="/buyer/profile"
        backLabel="Back to you"
      />
      <p>Notification preferences will be configured here.</p>
    </Page>
  );
}

export default NotificationPrefs;
