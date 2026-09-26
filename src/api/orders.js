/**
 * Orders and Cart API endpoints
 */
import { apiFetch } from './client';

export async function getCartQuote(groups, signal) {
  const res = await apiFetch('/cart/quote', {
    method: 'POST',
    body: { groups },
    signal,
  });
  return res.data;
}

/**
 * Calculates a live cart quote for items or groups.
 *
 * @param {Array<object>} items - List of items or groups
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

export async function checkout(payload, idempotencyKey) {
  const res = await apiFetch('/orders/checkout', {
    method: 'POST',
    body: payload,
    idempotencyKey,
  });
  return res.data;
}

export async function getOrders(query = {}, signal) {
  const res = await apiFetch('/orders', { query, signal });
  return res;
}

/**
 * Retrieves details for an order (including pickupCode).
 *
 * @param {string} id
 * @param {AbortSignal} [signal]
 * @returns {Promise<object>}
 */
export async function getOrder(id, signal) {
  return getOrderDetail(id, signal);
}

export async function getOrderDetail(id, signal) {
  const res = await apiFetch(`/orders/${id}`, { signal });
  return res.data;
}

export async function modifyOrder(id, payload) {
  const res = await apiFetch(`/orders/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return res.data;
}

export async function cancelOrder(id, reason = '') {
  const res = await apiFetch(`/orders/${id}/cancel`, {
    method: 'POST',
    body: { reason },
  });
  return res.data;
}

export async function getReorderPreview(id, signal) {
  const res = await apiFetch(`/orders/${id}/reorder-preview`, { signal });
  return res.data;
}

export async function createOrderReview(orderId, payload) {
  const res = await apiFetch(`/orders/${orderId}/reviews`, {
    method: 'POST',
    body: payload,
  });
  return res.data;
}
