/**
 * Smart Basket API client.
 * Wraps /api/smart-basket/generate, /api/smart-basket/validate, and /api/smart-basket/replacements endpoints.
 */
import { apiFetch } from './client';

/**
 * Generates a Smart Basket suggestion from real product inventory.
 *
 * @param {{ budget: number, categories?: string[], prompt?: string, marketId?: string, pickupDate?: string, pickupTime?: string }} payload
 * @param {AbortSignal} [signal]
 */
export async function generateSmartBasket(payload, signal) {
  const res = await apiFetch('/smart-basket/generate', {
    method: 'POST',
    body: payload,
    signal,
  });
  return res.data;
}

/**
 * Validates current stock and availability for basket items.
 *
 * @param {Array<{ productId: string, quantity: number }>} items
 * @param {AbortSignal} [signal]
 */
export async function validateSmartBasket(items, signal) {
  const res = await apiFetch('/smart-basket/validate', {
    method: 'POST',
    body: { items },
    signal,
  });
  return res.data;
}

/**
 * Fetches in-stock alternative products for replacing an item in the Smart Basket.
 *
 * @param {string} productId
 * @param {{ marketId?: string, limit?: number }} [params]
 * @param {AbortSignal} [signal]
 */
export async function getReplacements(productId, params = {}, signal) {
  const query = new URLSearchParams();
  if (params.marketId) query.set('marketId', params.marketId);
  if (params.limit) query.set('limit', params.limit);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/smart-basket/replacements/${productId}${qStr}`, { signal });
  return res.data;
}
