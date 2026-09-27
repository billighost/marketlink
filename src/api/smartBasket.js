/**
 * Smart Basket API client.
 * Wraps /api/smart-basket endpoints.
 */
import { apiFetch } from './client';

/**
 * Generates a Smart Basket suggestion from real product inventory.
 *
 * @param {{
 *   prompt?: string,
 *   budget?: number,
 *   categories?: string[],
 *   marketId?: string,
 *   day?: string,
 *   pickupDate?: string,
 *   pickupTime?: string,
 * }} payload
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
 * Gets available markets, categories, and pickup days for configuring Smart Basket.
 *
 * @param {AbortSignal} [signal]
 */
export async function getSmartBasketOptions(signal) {
  const res = await apiFetch('/smart-basket/options', {
    method: 'GET',
    signal,
  });
  return res.data;
}

/**
 * Searches active products to add to or replace in Smart Basket.
 *
 * @param {{ q?: string, marketId?: string, categorySlug?: string, day?: string }} params
 * @param {AbortSignal} [signal]
 */
export async function searchBasketProducts({ q = '', marketId = '', categorySlug = '', day = '' } = {}, signal) {
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (marketId) query.set('marketId', marketId);
  if (categorySlug) query.set('categorySlug', categorySlug);
  if (day) query.set('day', day);

  const res = await apiFetch(`/smart-basket/products/search?${query.toString()}`, {
    method: 'GET',
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
 * Recalculates basket totals authoritatively on the backend using server DB prices.
 *
 * @param {{
 *   items: Array<{ productId: string, quantity: number }>,
 *   budget?: number,
 *   marketId?: string,
 *   pickupDate?: string,
 * }} payload
 * @param {AbortSignal} [signal]
 */
export async function recalculateSmartBasket(payload, signal) {
  const res = await apiFetch('/smart-basket/recalculate', {
    method: 'POST',
    body: payload,
    signal,
  });
  return res.data;
}

/**
 * Creates final order / pre-order reservation for Smart Basket directly.
 *
 * @param {{
 *   items: Array<{ productId: string, quantity: number }>,
 *   marketId?: string,
 *   pickupDate?: string,
 *   pickupTime?: string,
 *   slotStart?: string,
 *   note?: string,
 *   idempotencyKey?: string,
 * }} payload
 * @param {AbortSignal} [signal]
 */
export async function createSmartBasketOrder(payload, signal) {
  const res = await apiFetch('/smart-basket/order', {
    method: 'POST',
    body: payload,
    signal,
  });
  return res.data;
}

