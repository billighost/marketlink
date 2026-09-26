import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/api/me';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import SectionRows from '@/components/ui/SectionRows';
import ListRow from '@/components/ui/ListRow';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './NotificationPrefs.module.css';

const DEFAULT_PREFS = {
  orderConfirmed: true,
  orderAccepted: true,
  orderReady: true,
  orderCancelled: true,
  restockAlerts: true,
  newProduceAlerts: true,
  marketDayReminder: true,
  marketScheduleChanges: true,
};

export function NotificationPrefs() {
  const { user, refreshUser } = useAuth();
  useDocumentTitle('Notification preferences · MarketLink');

  const [prefs, setPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem('marketlink_notif_prefs');
      if (stored) {
        return { ...DEFAULT_PREFS, ...JSON.parse(stored), ...(user?.notificationPrefs || {}) };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_PREFS, ...(user?.notificationPrefs || {}) };
  });

  const [savedIndicators, setSavedIndicators] = useState({});
  const debounceTimerRef = useRef(null);
  const pendingPrefsRef = useRef(prefs);

  useEffect(() => {
    if (user?.notificationPrefs) {
      setPrefs((prev) => ({ ...prev, ...user.notificationPrefs }));
    }
  }, [user]);

  const savePreferences = useCallback(async (newPrefs) => {
    try {
      localStorage.setItem('marketlink_notif_prefs', JSON.stringify(newPrefs));
    } catch {
      // ignore
    }

    try {
      await updateProfile({ notificationPrefs: newPrefs });
      await refreshUser();
    } catch {
      // ignore
    }
  }, [refreshUser]);

  const handleToggle = (key, val) => {
    const nextPrefs = { ...prefs, [key]: val };
    setPrefs(nextPrefs);
    pendingPrefsRef.current = nextPrefs;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      savePreferences(pendingPrefsRef.current);

      setSavedIndicators((prev) => ({ ...prev, [key]: 'Saved' }));
      setTimeout(() => {
        setSavedIndicators((prev) => ({ ...prev, [key]: undefined }));
      }, 1500);
    }, 600);
  };

  return (
    <Page width="read">
      <PageTitle
        title="Notification preferences"
        context="Choose which updates you receive."
        backTo="/buyer/profile"
        backLabel="Back to you"
      />

      <div className={styles.container}>
        <p className={styles.intro}>
          MarketLink sends SMS and in-app updates for your pre-orders and Saturday market reminders. Adjust your alerts below; changes save automatically.
        </p>

        {/* Group 1: Orders */}
        <SectionRows title="Orders">
          <ListRow
            label="Order confirmed"
            indicator={savedIndicators.orderConfirmed}
            toggle={prefs.orderConfirmed}
            onToggle={(val) => handleToggle('orderConfirmed', val)}
          />
          <ListRow
            label="Order accepted"
            indicator={savedIndicators.orderAccepted}
            toggle={prefs.orderAccepted}
            onToggle={(val) => handleToggle('orderAccepted', val)}
          />
          <ListRow
            label="Ready for pickup"
            indicator={savedIndicators.orderReady}
            toggle={prefs.orderReady}
            onToggle={(val) => handleToggle('orderReady', val)}
          />
          <ListRow
            label="Order cancelled"
            indicator={savedIndicators.orderCancelled}
            toggle={prefs.orderCancelled}
            onToggle={(val) => handleToggle('orderCancelled', val)}
          />
        </SectionRows>

        {/* Group 2: Stalls */}
        <SectionRows title="Stalls">
          <ListRow
            label="Restock alerts for saved produce"
            indicator={savedIndicators.restockAlerts}
            toggle={prefs.restockAlerts}
            onToggle={(val) => handleToggle('restockAlerts', val)}
          />
          <ListRow
            label="New produce from saved stalls"
            indicator={savedIndicators.newProduceAlerts}
            toggle={prefs.newProduceAlerts}
            onToggle={(val) => handleToggle('newProduceAlerts', val)}
          />
        </SectionRows>

        {/* Group 3: Markets */}
        <SectionRows title="Markets">
          <ListRow
            label="Market day reminder"
            indicator={savedIndicators.marketDayReminder}
            toggle={prefs.marketDayReminder}
            onToggle={(val) => handleToggle('marketDayReminder', val)}
          />
          <ListRow
            label="Market schedule changes"
            indicator={savedIndicators.marketScheduleChanges}
            toggle={prefs.marketScheduleChanges}
            onToggle={(val) => handleToggle('marketScheduleChanges', val)}
          />
        </SectionRows>
      </div>
    </Page>
  );
}

export default NotificationPrefs;
