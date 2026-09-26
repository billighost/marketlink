/**
 * Smart Basket API client.
 * Wraps /api/smart-basket/generate and /api/smart-basket/validate endpoints.
 */
import { apiFetch } from './client';

/**
 * Generates a Smart Basket suggestion from real product inventory.
 *
 * @param {{ budget: number, categories: string[], marketId?: string, pickupDate?: string }} payload
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
