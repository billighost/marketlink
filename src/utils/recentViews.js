/**
 * Utility for tracking and retrieving recently viewed products.
 * Stored locally in localStorage with timestamps.
 */

const STORAGE_KEY = 'marketlink_recent_views';
const MAX_RECENT_VIEWS = 15;

/**
 * Records a viewed product into localStorage.
 *
 * @param {object} product - Product card or detail object
 */
export function recordViewedProduct(product) {
  if (!product || !product.id) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];

    // Filter out previous entry if already present
    const filtered = existing.filter((p) => p.id !== product.id);

    // Keep essential card fields for rendering
    const item = {
      id: product.id,
      name: product.name,
      priceCents: product.priceCents,
      unit: product.unit,
      art: product.art,
      imageUrl: product.imageUrl || null,
      categorySlug: product.categorySlug,
      farmer: product.farmer
        ? {
            id: product.farmer.id || product.farmerId,
            stallName: product.farmer.stallName || product.farmer.name,
            stallNumber: product.farmer.stallNumber,
            art: product.farmer.art,
          }
        : null,
      availability: product.availability || 'in',
      viewedAt: Date.now(),
    };

    filtered.unshift(item);
    const capped = filtered.slice(0, MAX_RECENT_VIEWS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));

    window.dispatchEvent(new CustomEvent('marketlink:recent-views-updated', { detail: capped }));
  } catch (err) {
    console.warn('[recentViews] Failed to record view:', err);
  }
}

/**
 * Returns the list of recently viewed products.
 *
 * @returns {Array<object>}
 */
export function getViewedProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clears recently viewed products history.
 */
export function clearViewedProducts() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('marketlink:recent-views-updated', { detail: [] }));
  } catch {}
}
