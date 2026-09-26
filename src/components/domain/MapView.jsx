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
  showRoute = false,
  className = '',
  ariaLabel = 'Interactive map of market locations',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayersRef = useRef(new Map());
  const routeLayerRef = useRef(null);
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
        map.fitBounds(bounds, { padding: [35, 35] });
      }
    } else {
      map.setView([40.735, -74.172], zoom || 12);
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
      routeLayerRef.current = null;
    };
  }, []); // Mount once

  // Synchronize markers and route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    for (const layer of markerLayersRef.current.values()) {
      layer.remove();
    }
    markerLayersRef.current.clear();

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (validMarkers.length === 0) return;

    validMarkers.forEach((marker) => {
      const isSelected = selectedId && marker.id === selectedId;
      const isHighlighted = Boolean(marker.highlight);
      const markerType = marker.markerType || 'market'; // 'market' | 'farmer' | 'pickup'
      const stopNum = marker.stopNumber != null ? marker.stopNumber : marker.badgeNumber;

      // Custom divIcon with type-aware colors and optional stop number
      const customIcon = L.divIcon({
        className: 'marketlink-map-pin',
        html: `
          <div class="marketlink-pin-badge ${markerType} ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}">
            ${stopNum != null ? `<span class="marketlink-pin-num">${stopNum}</span>` : `<div class="marketlink-pin-inner"></div>`}
          </div>
        `,
        iconSize: stopNum != null ? [34, 34] : [30, 30],
        iconAnchor: stopNum != null ? [17, 34] : [15, 30],
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
            ${marker.subtitle ? `<div class="marketlink-popup-subtitle">${marker.subtitle}</div>` : ''}
            ${marker.detail ? `<div class="marketlink-popup-detail">${marker.detail}</div>` : ''}
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

    // Draw route line if requested (for Market Visit Planner)
    if (showRoute && validMarkers.length > 1) {
      const latLngs = validMarkers.map((m) => [m.lat, m.lng]);
      const polyline = L.polyline(latLngs, {
        color: '#7A2E3B',
        weight: 3,
        opacity: 0.85,
        dashArray: '6, 8',
        lineCap: 'round',
      }).addTo(map);
      routeLayerRef.current = polyline;
    }

    // Pan to selected marker if selected
    if (selectedId) {
      const sel = validMarkers.find((m) => m.id === selectedId);
      if (sel) {
        map.panTo([sel.lat, sel.lng], { animate: true, duration: 0.4 });
      }
    } else if (validMarkers.length === 1) {
      map.setView([validMarkers[0].lat, validMarkers[0].lng], zoom || 15);
    } else if (validMarkers.length > 1) {
      const bounds = L.latLngBounds(validMarkers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [35, 35] });
    }
  }, [JSON.stringify(validMarkers), selectedId, draggable, showRoute]);

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
