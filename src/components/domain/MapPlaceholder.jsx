import React from 'react';
import { MapPin } from 'lucide-react';
import styles from './MapPlaceholder.module.css';

/**
 * MapPlaceholder component representing the market location.
 * In production, this can be replaced with Google Maps or OpenStreetMap (Leaflet).
 */
export function MapPlaceholder({ className = '' }) {
  // NOTE: Google Maps or OpenStreetMap interactive widget plugs in here per SRS requirements.
  return (
    <div className={`${styles.container} ${className}`} role="region" aria-label="Market location map">
      <div className={styles.gridOverlay} aria-hidden="true" />
      <div className={styles.cardOverlay}>
        <div className={styles.pinCircle} aria-hidden="true">
          <MapPin size={20} strokeWidth={1.5} className={styles.pinIcon} />
        </div>
        <div className={styles.info}>
          <p className={styles.locationTitle}>Elm Street Market Stall</p>
          <p className={styles.locationSub}>142 Elm Street, Market Square · Saturdays 8:00 AM – 1:00 PM</p>
        </div>
      </div>
    </div>
  );
}

export default MapPlaceholder;
