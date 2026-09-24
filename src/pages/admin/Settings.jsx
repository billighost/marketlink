import React, { useState } from 'react';
import { Globe, Bell, Shield, Save } from 'lucide-react';
import styles from './Settings.module.css';

export default function Settings() {
  const [platformName, setPlatformName] = useState('Market Link');
  const [supportEmail, setSupportEmail] = useState('support@marketlink.com');
  const [currency, setCurrency] = useState('NGN');
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [orderCutoffHours, setOrderCutoffHours] = useState('6');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoApproveListings, setAutoApproveListings] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Configure platform-wide settings.</p>
        </div>
      </div>

      <div className={styles.settingsLayout}>
        {/* General */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBox}>
              <Globe size={22} className={styles.iconGreen} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>General</h3>
              <p className={styles.cardSub}>Core platform configuration.</p>
            </div>
          </div>
          <div className={styles.formGrid}>
            <div className={styles.row2}>
              <div className={styles.formGroup}>
                <label>Platform Name</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.row2}>
              <div className={styles.formGroup}>
                <label>Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={styles.select}
                >
                  <option value="NGN">NGN (₦)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={styles.select}
                >
                  <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                  <option value="America/New_York">America/New York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Order Cut-off (hours before market)</label>
              <input
                type="number"
                value={orderCutoffHours}
                onChange={(e) => setOrderCutoffHours(e.target.value)}
                className={styles.input}
                min="1"
                max="48"
                style={{ maxWidth: '120px' }}
              />
            </div>
          </div>
        </div>

        {/* Notifications & Policies */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBox}>
              <Shield size={22} className={styles.iconGreen} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Policies & Notifications</h3>
              <p className={styles.cardSub}>Control automated behavior and alerts.</p>
            </div>
          </div>
          <div className={styles.toggleList}>
            <div className={styles.toggleRow}>
              <div>
                <span className={styles.toggleLabel}>Email notifications</span>
                <p className={styles.toggleDesc}>Send email alerts for new orders, registrations, and reports.</p>
              </div>
              <button
                className={`${styles.toggleTrack} ${emailNotifications ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => setEmailNotifications(!emailNotifications)}
              >
                <span className={styles.toggleThumb}></span>
              </button>
            </div>
            <div className={styles.toggleRow}>
              <div>
                <span className={styles.toggleLabel}>Auto-approve new listings</span>
                <p className={styles.toggleDesc}>Skip manual moderation for product listings.</p>
              </div>
              <button
                className={`${styles.toggleTrack} ${autoApproveListings ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => setAutoApproveListings(!autoApproveListings)}
              >
                <span className={styles.toggleThumb}></span>
              </button>
            </div>
            <div className={styles.toggleRow}>
              <div>
                <span className={styles.toggleLabel}>Maintenance mode</span>
                <p className={styles.toggleDesc}>Take the platform offline for maintenance. Users will see a notice.</p>
              </div>
              <button
                className={`${styles.toggleTrack} ${maintenanceMode ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => setMaintenanceMode(!maintenanceMode)}
              >
                <span className={styles.toggleThumb}></span>
              </button>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className={styles.saveBar}>
          <button className={styles.btnPrimary}>
            <Save size={18} /> Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
