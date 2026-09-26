import React from 'react';
import { ExternalLink } from 'lucide-react';
import { MapView } from '@/components/domain/MapView';
import styles from './LocationBlock.module.css';

/**
 * Embedded map, address, and a directions link to the pickup point.
 *
 * @param {Array}  markers       passed straight to MapView
 * @param {string} addressLine   e.g. "Riverbend Quay, Bristol BS1 4RN"
 * @param {string} pitchLine     e.g. "Stall 14, east row" — the stall's spot within the market
 * @param {string} directionsUrl optional override
 * @param {string} title         name used for aria-labels
 * @param {string} mapHeight     default '240px'
 * @param {number} zoom          default 16
 * @param {React.ReactNode} actionSlot extra buttons / actions (e.g. Save button)
 * @param {string} className
 */
export function LocationBlock({
  markers = [],
  addressLine,
  pitchLine,
  directionsUrl,
  title = 'pickup point',
  mapHeight = '240px',
  zoom = 16,
  actionSlot,
  className = '',
}) {
  const validMarkers = (Array.isArray(markers) ? markers : []).filter(
    (m) =>
      m &&
      typeof m.lat === 'number' &&
      !isNaN(m.lat) &&
      typeof m.lng === 'number' &&
      !isNaN(m.lng)
  );

  const hasCoords = validMarkers.length > 0;
  const firstMarker = validMarkers[0];

  const effectiveDirectionsUrl =
    directionsUrl ||
    (hasCoords
      ? `https://www.openstreetmap.org/directions?to=${encodeURIComponent(
          firstMarker.lat
        )}%2C${encodeURIComponent(firstMarker.lng)}`
      : null);

  const ariaLabel = `Map of ${title}`;
  const directionsAriaLabel = `Get directions to ${title}, opens in a new tab`;

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Map wrapper: omitted completely if there are no coordinates */}
      {hasCoords && (
        <div className={styles.mapWrapper} style={{ height: mapHeight }}>
          <MapView
            markers={validMarkers}
            height={mapHeight}
            zoom={zoom}
            interactive={true}
            showDirectionsLink={false}
            ariaLabel={ariaLabel}
          />
        </div>
      )}

      {/* Address and pitch details */}
      <div className={styles.metaBlock}>
        <div className={styles.lines}>
          {pitchLine && <p className={styles.pitch}>{pitchLine}</p>}
          {addressLine && <p className={styles.address}>{addressLine}</p>}
        </div>

        {(effectiveDirectionsUrl || actionSlot) && (
          <div className={styles.actionsRow}>
            {effectiveDirectionsUrl && (
              <a
                href={effectiveDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.directionsLink}
                aria-label={directionsAriaLabel}
              >
                <span>Get directions</span>
                <ExternalLink size={14} className={styles.icon} aria-hidden="true" />
              </a>
            )}
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationBlock;
