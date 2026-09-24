import React from 'react';
import { MapPin, Eye, Calendar, Users as UsersIcon } from 'lucide-react';
import styles from './Markets.module.css';

const MARKETS = [
  {
    id: 'M-01',
    name: 'Elm Street Saturday Market',
    location: '123 Elm Street, Downtown',
    days: 'Sat',
    time: '7:00 AM – 1:00 PM',
    vendors: 24,
    status: 'Active',
  },
  {
    id: 'M-02',
    name: 'Riverbend Farmers Market',
    location: '45 River Road, Riverbend',
    days: 'Wed, Sat',
    time: '8:00 AM – 12:00 PM',
    vendors: 18,
    status: 'Active',
  },
  {
    id: 'M-03',
    name: 'Hillside Organic Market',
    location: '10 Hillside Ave',
    days: 'Sun',
    time: '9:00 AM – 2:00 PM',
    vendors: 12,
    status: 'Active',
  },
  {
    id: 'M-04',
    name: 'Oak & Mill Community Market',
    location: '78 Oak Drive, Westville',
    days: 'Fri',
    time: '3:00 PM – 7:00 PM',
    vendors: 9,
    status: 'Paused',
  },
  {
    id: 'M-05',
    name: 'Hollow Creek Night Market',
    location: '200 Creek Blvd',
    days: 'Thu',
    time: '5:00 PM – 9:00 PM',
    vendors: 15,
    status: 'Active',
  },
];

export default function Markets() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Markets</h1>
          <p className={styles.subtitle}>Manage all registered market locations.</p>
        </div>
        <button className={styles.btnPrimary}>+ Add Market</button>
      </div>

      <div className={styles.grid}>
        {MARKETS.map((market) => (
          <div key={market.id} className={styles.marketCard}>
            <div className={styles.marketTop}>
              <span className={`${styles.statusDot} ${market.status === 'Active' ? styles.dotActive : styles.dotPaused}`}></span>
              <span className={styles.statusLabel}>{market.status}</span>
            </div>
            <h3 className={styles.marketName}>{market.name}</h3>
            <div className={styles.metaRow}>
              <MapPin size={14} />
              <span>{market.location}</span>
            </div>
            <div className={styles.metaRow}>
              <Calendar size={14} />
              <span>{market.days} · {market.time}</span>
            </div>
            <div className={styles.metaRow}>
              <UsersIcon size={14} />
              <span>{market.vendors} vendors</span>
            </div>
            <div className={styles.cardActions}>
              <button className={styles.btnOutline}><Eye size={14} /> View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
