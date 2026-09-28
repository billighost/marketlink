import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ExternalLink,
  Plus,
  Minus,
  LocateFixed,
  Maximize2,
  Minimize2,
  RotateCcw,
} from 'lucide-react';
import styles from './MapView.module.css';

const BRISTOL_FALLBACK = [51.4545, -2.5879];

function isValidMarker(m) {
  return m && typeof m.lat === 'number' && !isNaN(m.lat) && typeof m.lng === 'number' && !isNaN(m.lng);
}

/**
 * Shared MapView component powered by Leaflet and OpenStreetMap.
 * Free OpenStreetMap tiles without API key requirements.
 *
 * Ships its own control cluster (zoom, locate me, recenter, fullscreen) built
 * as normal React buttons rather than imperative Leaflet controls, so they
 * stay themeable, keyboard-focusable and consistent with the rest of the app.
 */
export const MapView = forwardRef(function MapView({
  markers = [],
  routePath = [],
  selectedId,
  onSelect,
  draggable = false,
  onMove,
  height = '260px',
  zoom,
  interactive = true,
  showDirectionsLink = true,
  showControls = true,
  className = '',
  ariaLabel = 'Interactive map of market locations',
  children,
}, ref) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayersRef = useRef(new Map());
  const polylineLayerRef = useRef(null);
  const userLayerRef = useRef(null);
  const reducedMotionRef = useRef(false);

  const [tileError, setTileError] = useState(false);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomState, setZoomState] = useState({ atMin: false, atMax: false });
  const [locateStatus, setLocateStatus] = useState({ state: 'idle', message: '' });

  // Expose flyTo and openMarkerPopup to parent via ref
  useImperativeHandle(ref, () => ({
    flyTo(lat, lng, z) {
      const map = mapRef.current;
      if (!map) return;
      map.flyTo([lat, lng], z || map.getZoom(), { animate: true, duration: 0.5 });
    },
    openMarkerPopup(id) {
      const layer = markerLayersRef.current.get(id);
      if (layer) layer.openTooltip();
    },
  }));

  const validMarkers = markers.filter(isValidMarker);

  const fitToMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (validMarkers.length === 1) {
      map.flyTo([validMarkers[0].lat, validMarkers[0].lng], zoom || 15, {
        animate: !reducedMotionRef.current,
      });
    } else if (validMarkers.length > 1) {
      const bounds = L.latLngBounds(validMarkers.map((m) => [m.lat, m.lng]));
      map.flyToBounds(bounds, { padding: [30, 30], animate: !reducedMotionRef.current });
    } else {
      map.flyTo(BRISTOL_FALLBACK, zoom || 12, { animate: !reducedMotionRef.current });
    }
  }, [JSON.stringify(validMarkers), zoom]);

  // ---- Mount: create the map once ----
  useEffect(() => {
    if (!containerRef.current) return;

    reducedMotionRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: false,
      doubleClickZoom: interactive,
      zoomAnimation: !reducedMotionRef.current,
      fadeAnimation: !reducedMotionRef.current,
      attributionControl: true,
    });

    mapRef.current = map;

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    });

    tileLayer.on('tileerror', () => setTileError(true));
    tileLayer.once('load', () => setTilesLoaded(true));
    tileLayer.addTo(map);

    L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 110 }).addTo(map);

    if (validMarkers.length > 0) {
      if (validMarkers.length === 1) {
        map.setView([validMarkers[0].lat, validMarkers[0].lng], zoom || 15);
      } else {
        const bounds = L.latLngBounds(validMarkers.map((m) => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    } else {
      map.setView(BRISTOL_FALLBACK, zoom || 12);
    }

    const updateZoomState = () => {
      setZoomState({
        atMin: map.getZoom() <= map.getMinZoom(),
        atMax: map.getZoom() >= map.getMaxZoom(),
      });
    };
    updateZoomState();
    map.on('zoomend', updateZoomState);

    return () => {
      map.off('zoomend', updateZoomState);
      map.remove();
      mapRef.current = null;
      markerLayersRef.current.clear();
      userLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount once

  // ---- Sync markers ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const layer of markerLayersRef.current.values()) {
      layer.remove();
    }
    markerLayersRef.current.clear();

    if (validMarkers.length === 0) return;

    validMarkers.forEach((marker) => {
      const isSelected = selectedId && marker.id === selectedId;
      const isHighlighted = Boolean(marker.highlight);
      const markerType = marker.markerType || 'market';

      const pinInnerHtml = marker.stepNumber != null
        ? `<span class="marketlink-pin-num">${marker.stepNumber}</span>`
        : marker.iconText
          ? `<span class="marketlink-pin-text">${marker.iconText}</span>`
          : `<div class="marketlink-pin-inner"></div>`;

      const customIcon = L.divIcon({
        className: 'marketlink-map-pin',
        html: `
          <div class="marketlink-pin-badge ${markerType} ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}">
            ${pinInnerHtml}
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
        keyboard: true,
        alt: marker.label || 'Map marker',
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

      // Hover tooltip showing market name
      leafletMarker.bindTooltip(
        `<div class="marketlink-tooltip-name">${marker.title || marker.label || 'Market'}</div>`,
        {
          direction: 'top',
          offset: [0, -34],
          className: 'marketlink-tooltip',
          sticky: false,
          permanent: false,
        }
      );

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
        if (onSelect) onSelect(marker);
        leafletMarker.openTooltip();
      });

      markerLayersRef.current.set(marker.id, leafletMarker);
    });

    // Draw route path polyline if provided
    if (polylineLayerRef.current) {
      polylineLayerRef.current.remove();
      polylineLayerRef.current = null;
    }

    if (Array.isArray(routePath) && routePath.length > 1) {
      const validPoints = routePath
        .map((p) => (Array.isArray(p) ? p : isValidMarker(p) ? [p.lat, p.lng] : null))
        .filter(Boolean);

      if (validPoints.length > 1) {
        polylineLayerRef.current = L.polyline(validPoints, {
          color: '#1b4332',
          weight: 4,
          dashArray: '6, 8',
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(map);
      }
    }

    if (draggable && onMove) {
      map.on('click', (e) => {
        const newPos = {
          lat: parseFloat(e.latlng.lat.toFixed(6)),
          lng: parseFloat(e.latlng.lng.toFixed(6)),
        };
        onMove(newPos);
      });
    }

    if (validMarkers.length === 1) {
      map.setView([validMarkers[0].lat, validMarkers[0].lng], zoom || 15);
    } else if (validMarkers.length > 1) {
      const bounds = L.latLngBounds(validMarkers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(validMarkers), JSON.stringify(routePath), selectedId, draggable]);

  // ---- Fullscreen: resize the Leaflet canvas after the layout settles ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const id = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(id);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  // Lock the page behind the fullscreen map so it can't scroll underneath it.
  useEffect(() => {
    if (!isFullscreen) return undefined;
    document.documentElement.classList.add('noScroll');
    document.body.classList.add('noScroll');
    return () => {
      document.documentElement.classList.remove('noScroll');
      document.body.classList.remove('noScroll');
    };
  }, [isFullscreen]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocateStatus({ state: 'error', message: "Your browser can't share your location." });
      return;
    }
    setLocateStatus({ state: 'locating', message: 'Finding your location…' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const map = mapRef.current;
        const { latitude, longitude, accuracy } = position.coords;
        if (map) {
          if (userLayerRef.current) userLayerRef.current.remove();
          const userIcon = L.divIcon({
            className: 'marketlink-map-pin',
            html: '<div class="marketlink-pin-badge you-are-here"><div class="marketlink-pin-inner"></div></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });
          userLayerRef.current = L.marker([latitude, longitude], {
            icon: userIcon,
            zIndexOffset: 500,
            keyboard: false,
            alt: 'Your location',
          }).addTo(map);
          map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), {
            animate: !reducedMotionRef.current,
          });
        }
        setLocateStatus({
          state: 'done',
          message: accuracy ? `Located you within ${Math.round(accuracy)}m` : 'Located you',
        });
        window.setTimeout(() => setLocateStatus({ state: 'idle', message: '' }), 4000);
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Location access was denied.'
            : "Couldn't find your location.";
        setLocateStatus({ state: 'error', message });
        window.setTimeout(() => setLocateStatus({ state: 'idle', message: '' }), 4000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const singleMarker = validMarkers.length === 1 ? validMarkers[0] : null;
  const directionsUrl = singleMarker
    ? `https://www.google.com/maps/dir/?api=1&destination=${singleMarker.lat},${singleMarker.lng}`
    : null;

  const content = (
    <div
      className={`${styles.mapWrapper} ${isFullscreen ? styles.fullscreen : ''} ${className}`}
      style={isFullscreen ? undefined : { height }}
      aria-label={ariaLabel}
      role="region"
    >
      <div
        ref={containerRef}
        className={styles.mapContainer}
        tabIndex={0}
        aria-label="Map viewport. Use arrow keys to pan and plus/minus to zoom."
      />

      {!tilesLoaded && !tileError && (
        <div className={styles.loadingOverlay} aria-hidden="true">
          <div className={styles.loadingPulse} />
        </div>
      )}

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

      {showControls && interactive && !tileError && (
        <div className={styles.controlCluster} role="group" aria-label="Map controls">
          <div className={styles.controlGroup}>
            <button
              type="button"
              className={styles.controlButton}
              onClick={handleZoomIn}
              disabled={zoomState.atMax}
              aria-label="Zoom in"
              title="Zoom in"
            >
              <Plus size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.controlButton}
              onClick={handleZoomOut}
              disabled={zoomState.atMin}
              aria-label="Zoom out"
              title="Zoom out"
            >
              <Minus size={16} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.controlGroup}>
            <button
              type="button"
              className={`${styles.controlButton} ${locateStatus.state === 'locating' ? styles.controlButtonBusy : ''}`}
              onClick={handleLocate}
              aria-label="Find my location"
              title="Find my location"
            >
              <LocateFixed size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.controlButton}
              onClick={fitToMarkers}
              aria-label="Recenter map"
              title="Recenter map"
            >
              <RotateCcw size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.controlButton}
              onClick={() => setIsFullscreen((v) => !v)}
              aria-label={isFullscreen ? 'Exit fullscreen map' : 'Expand map to fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Expand map'}
            >
              {isFullscreen ? (
                <Minimize2 size={16} aria-hidden="true" />
              ) : (
                <Maximize2 size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      )}

      <div className={styles.statusLive} role="status" aria-live="polite">
        {locateStatus.message}
      </div>

      {locateStatus.message && (
        <div
          className={`${styles.statusPill} ${locateStatus.state === 'error' ? styles.statusPillError : ''}`}
        >
          {locateStatus.message}
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

      {children}
    </div>
  );

  // While fullscreen, escape any ancestor that creates its own stacking
  // context (position: sticky and position: fixed both do, unconditionally).
  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
});

export default MapView;