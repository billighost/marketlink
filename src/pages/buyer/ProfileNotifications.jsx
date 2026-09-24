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

  return (
    <div className={styles.container}>
      <p className={styles.intro}>
        Manage how and when MarketLink contacts you. We only send relevant alerts about your orders and Saturday stall updates.
      </p>

      <section className={styles.panel} aria-label="Order notifications">
        <ListRow
          label="Order status updates"
          value="SMS & Email"
          toggle={orderUpdates}
          onToggle={setOrderUpdates}
        />
        <ListRow
          label="Saturday pickup reminder"
          value="8:00 am"
          toggle={pickupReminders}
          onToggle={setPickupReminders}
        />
        <ListRow
          label="Weekly harvest preview"
          value="Thursday 6 pm"
          toggle={weeklyPreview}
          onToggle={setWeeklyPreview}
        />
        <ListRow
          label="Farmer alerts & specials"
          toggle={farmerAlerts}
          onToggle={setFarmerAlerts}
        />
      </section>
    </div>
  );
}

export default ProfileNotifications;
