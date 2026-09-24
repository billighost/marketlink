import React, { useState } from 'react';
import ListRow from '@/components/ui/ListRow';
import styles from './ProfileNotifications.module.css';

/**
 * Notifications preferences sheet for Customer profile.
 */
export function ProfileNotifications({ inSheet = true, onClose }) {
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [pickupReminders, setPickupReminders] = useState(true);
  const [weeklyPreview, setWeeklyPreview] = useState(true);
  const [farmerAlerts, setFarmerAlerts] = useState(false);
  const [savedKey, setSavedKey] = useState(null);

  const handleToggle = (key, setter, val) => {
    setter(val);
    setSavedKey(key);
    setTimeout(() => {
      setSavedKey((cur) => (cur === key ? null : cur));
    }, 1800);
  };

  return (
    <div className={styles.container}>
      <p className={styles.intro}>
        Manage how and when MarketLink contacts you. We only send relevant alerts about your orders and Saturday stall updates.
      </p>

      <section className={styles.panel} aria-label="Order notifications">
        <ListRow
          label="Order status updates"
          value="SMS & Email"
          indicator={savedKey === 'orders' ? 'Saved' : undefined}
          toggle={orderUpdates}
          onToggle={(val) => handleToggle('orders', setOrderUpdates, val)}
        />
        <ListRow
          label="Saturday pickup reminder"
          value="8:00 am"
          indicator={savedKey === 'pickup' ? 'Saved' : undefined}
          toggle={pickupReminders}
          onToggle={(val) => handleToggle('pickup', setPickupReminders, val)}
        />
        <ListRow
          label="Weekly harvest preview"
          value="Thursday 6 pm"
          indicator={savedKey === 'weekly' ? 'Saved' : undefined}
          toggle={weeklyPreview}
          onToggle={(val) => handleToggle('weekly', setWeeklyPreview, val)}
        />
        <ListRow
          label="Farmer alerts & specials"
          indicator={savedKey === 'alerts' ? 'Saved' : undefined}
          toggle={farmerAlerts}
          onToggle={(val) => handleToggle('alerts', setFarmerAlerts, val)}
        />
      </section>
    </div>
  );
}

export default ProfileNotifications;
