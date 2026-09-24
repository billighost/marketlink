import React from 'react';
import { MapPin } from 'lucide-react';
import styles from './MapPlaceholder.module.css';

/**
 * Placeholder map container displaying market coordinates / pins.
 */
export function MapPlaceholder({
  address = 'Farmers Market Location',
  height = '240px',
  className = '',
}) {
  return (
    <div
      className={`${styles.container} ${className}`}
      style={{ height }}
      role="region"
      aria-label={`Map showing location of ${address}`}
    >
      <div className={styles.gridPattern} aria-hidden="true" />
      <div className={styles.markerBadge}>
        <span className={styles.pinPulse} aria-hidden="true" />
        <MapPin size={24} className={styles.pinIcon} aria-hidden="true" />
        <span className={styles.addressText}>{address}</span>
      </div>
      <div className={styles.watermark}>
        <span>MarketLink Map View</span>
      </div>
    </div>
  );
}

export default MapPlaceholder;
