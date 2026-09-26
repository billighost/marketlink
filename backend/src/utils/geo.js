/**
 * Geospatial conversion and directions utilities.
 * Handles GeoJSON Point parsing, coordinate extraction, and maps directions URLs.
 */

/**
 * Converts longitude and latitude into a standard GeoJSON Point object.
 *
 * @param {number} lng
 * @param {number} lat
 * @returns {{ type: 'Point', coordinates: [number, number] }}
 */
export function toGeoPoint(lng, lat) {
  return {
    type: 'Point',
    coordinates: [Number(lng), Number(lat)],
  };
}

/**
 * Extracts { lat, lng } from a GeoJSON Point object.
 *
 * @param {{ type: string, coordinates: [number, number] } | null} geoPoint
 * @returns {{ lat: number, lng: number } | null}
 */
export function fromGeoPoint(geoPoint) {
  if (!geoPoint || !Array.isArray(geoPoint.coordinates) || geoPoint.coordinates.length < 2) {
    return null;
  }
  const [lng, lat] = geoPoint.coordinates;
  return {
    lat: Number(lat),
    lng: Number(lng),
  };
}

/**
 * Builds Google Maps and OpenStreetMap directions URLs for given coordinates.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {{ google: string, osm: string }}
 */
export function directionsUrls(lat, lng) {
  const destination = `${lat},${lng}`;
  return {
    google: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
    osm: `https://www.openstreetmap.org/directions?to=${encodeURIComponent(destination)}`,
  };
}

/**
 * Converts meters to miles.
 *
 * @param {number} meters
 * @returns {number}
 */
export function metersToMiles(meters) {
  return Math.round((meters / 1609.344) * 10) / 10;
}
