/**
 * Cart API client wrappers.
 */
import { apiFetch } from './client';

/**
 * Calculates a live cart quote for items or groups.
 *
 * @param {Array<object>} items - List of items or vendor groups
 * @param {AbortSignal} [signal]
 * @returns {Promise<object>}
 */
export async function postCartQuote(items, signal) {
  const payload = Array.isArray(items) && items.length > 0 && items[0].farmerId ? { groups: items } : { items };
  const res = await apiFetch('/cart/quote', {
    method: 'POST',
    body: payload,
    signal,
  });
  return res.data;
}
