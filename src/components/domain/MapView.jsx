import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink } from 'lucide-react';
import styles from './MapView.module.css';

/**
 * Shared MapView component powered by Leaflet and OpenStreetMap.
 * Free OpenStreetMap tiles without API key requirements.
 */
export function MapView({
  markers = [],
  selectedId,
  onSelect,
  draggable = false,
  onMove,
  height = '260px',
  zoom,
  interactive = true,
  showDirectionsLink = true,
  className = '',
  ariaLabel = 'Interactive map of market locations',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayersRef = useRef(new Map());
  const [tileError, setTileError] = useState(false);

  // Validate coordinates
  const validMarkers = markers.filter(
    (m) =>
      m &&
      typeof m.lat === 'number' &&
      !isNaN(m.lat) &&
      typeof m.lng === 'number' &&
      !isNaN(m.lng)
  );

  useEffect(() => {
    if (!containerRef.current) return;

    // Detect reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initialize Leaflet map instance
    const map = L.map(containerRef.current, {
      zoomControl: interactive,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: false,
      doubleClickZoom: interactive,
      zoomAnimation: !prefersReducedMotion,
      fadeAnimation: !prefersReducedMotion,
      attributionControl: true,
    });

    mapRef.current = map;

    // Add OpenStreetMap tile layer with required attribution
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    });

    tileLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayer.addTo(map);

    // Initial center/bounds
    if (validMarkers.length > 0) {
      if (validMarkers.length === 1) {
        map.setView([validMarkers[0].lat, validMarkers[0].lng], zoom || 15);
      } else {
        const bounds = L.latLngBounds(validMarkers.map((m) => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    } else {
      map.setView([51.4545, -2.5879], zoom || 12);
    }

    // Accessible keyboard zoom control labels
    const zoomInBtn = containerRef.current.querySelector('.leaflet-control-zoom-in');
    if (zoomInBtn) zoomInBtn.setAttribute('aria-label', 'Zoom in');
    const zoomOutBtn = containerRef.current.querySelector('.leaflet-control-zoom-out');
    if (zoomOutBtn) zoomOutBtn.setAttribute('aria-label', 'Zoom out');

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayersRef.current.clear();
    };
  }, []); // Mount once

  // Synchronize markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    for (const layer of markerLayersRef.current.values()) {
      layer.remove();
    }
    markerLayersRef.current.clear();

    if (validMarkers.length === 0) return;

    validMarkers.forEach((marker) => {
      const isSelected = selectedId && marker.id === selectedId;
      const isHighlighted = Boolean(marker.highlight);
      const markerType = marker.markerType || 'market'; // 'market' | 'farmer' | 'pickup'

      // Custom divIcon with type-aware colors
      const customIcon = L.divIcon({
        className: 'marketlink-map-pin',
        html: `
          <div class="marketlink-pin-badge ${markerType} ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}">
            <div class="marketlink-pin-inner"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const isDraggable = Boolean(marker.draggable || draggable);
      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: customIcon,
        title: marker.label || 'Location',
        draggable: isDraggable,
      }).addTo(map);

      if (isDraggable) {
        leafletMarker.on('dragend', (e) => {
          const latLng = e.target.getLatLng();
          const newPos = {
            lat: parseFloat(latLng.lat.toFixed(6)),
            lng: parseFloat(latLng.lng.toFixed(6)),
          };
          if (marker.onMove) marker.onMove(newPos);
          if (onMove) onMove({ ...newPos, id: marker.id });
        });
      }

      if (marker.label) {
        leafletMarker.bindPopup(
          `
            <div class="marketlink-popup-title">${marker.label}</div>
            ${marker.subtitle ? `<div>${marker.subtitle}</div>` : ''}
          `,
          { className: 'marketlink-popup', closeButton: false }
        );
      }

      leafletMarker.on('click', () => {
        if (onSelect) {
          onSelect(marker);
        }
      });

      markerLayersRef.current.set(marker.id, leafletMarker);
    });

    // Map click for repositioning pin when in draggable mode
    if (draggable && onMove) {
      map.on('click', (e) => {
        const newPos = {
          lat: parseFloat(e.latlng.lat.toFixed(6)),
          lng: parseFloat(e.latlng.lng.toFixed(6)),
        };
        onMove(newPos);
      });
    }

    // Update bounds when markers change
    if (validMarkers.length === 1) {
      map.setView([validMarkers[0].lat, validMarkers[0].lng], zoom || 15);
    } else if (validMarkers.length > 1) {
      const bounds = L.latLngBounds(validMarkers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [JSON.stringify(validMarkers), selectedId, draggable]);

  const singleMarker = validMarkers.length === 1 ? validMarkers[0] : null;
  const directionsUrl = singleMarker
    ? `https://www.google.com/maps/dir/?api=1&destination=${singleMarker.lat},${singleMarker.lng}`
    : null;

  return (
    <div
      className={`${styles.mapWrapper} ${className}`}
      style={{ height }}
      aria-label={ariaLabel}
      role="region"
    >
      <div
        ref={containerRef}
        className={styles.mapContainer}
        tabIndex={0}
        aria-label="Map viewport. Use arrow keys to pan and plus/minus to zoom."
      />

      {showDirectionsLink && directionsUrl && (
        <div className={styles.directionsOverlay}>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.directionsButton}
            title="Open turn-by-turn directions in Google Maps"
          >
            <ExternalLink size={14} aria-hidden="true" />
            <span>Get directions</span>
          </a>
        </div>
      )}

      {tileError && (
        <div className={styles.fallback}>
          <p>Map tiles could not be loaded.</p>
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.directionsButton}
            >
              Open directions in Maps
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default MapView;
