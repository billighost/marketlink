import { apiFetch } from './client';

/**
 * Farmer Overview & Insights
 */
export async function getFarmerOverview(signal) {
  return apiFetch('/farmer/overview', { signal });
}

export async function getFarmerInsights(range = '30d', signal) {
  return apiFetch('/farmer/insights', { query: { range }, signal });
}

/**
 * Farmer Profile & Settings
 */
export async function getFarmerProfile(signal) {
  return apiFetch('/farmer/profile', { signal });
}

export async function updateFarmerProfile(updates) {
  return apiFetch('/farmer/profile', {
    method: 'PATCH',
    body: updates,
  });
}

/**
 * Farmer Slots & Closures
 */
export async function getFarmerSlots(days = 14, signal) {
  return apiFetch('/farmer/slots', { query: { days }, signal });
}

export async function addSlotClosures(dates, reason = '') {
  return apiFetch('/farmer/slots/closures', {
    method: 'PUT',
    body: { dates, reason },
  });
}

export async function removeSlotClosure(date) {
  return apiFetch(`/farmer/slots/closures/${date}`, {
    method: 'DELETE',
  });
}

/**
 * Products & Catalog
 */
export async function getFarmerProducts(query = {}, signal) {
  return apiFetch('/farmer/products', { query, signal });
}

export async function getFarmerProduct(id, signal) {
  return apiFetch(`/farmer/products/${id}`, { signal });
}

export async function createFarmerProduct(product) {
  return apiFetch('/farmer/products', {
    method: 'POST',
    body: product,
  });
}

export async function updateFarmerProduct(id, updates) {
  return apiFetch(`/farmer/products/${id}`, {
    method: 'PATCH',
    body: updates,
  });
}

export async function deleteFarmerProduct(id) {
  return apiFetch(`/farmer/products/${id}`, {
    method: 'DELETE',
  });
}

export async function setFarmerProductSoldOut(id) {
  return apiFetch(`/farmer/products/${id}/sold-out`, {
    method: 'POST',
  });
}

export async function setFarmerProductAvailable(id, data = {}) {
  return apiFetch(`/farmer/products/${id}/available`, {
    method: 'POST',
    body: data,
  });
}

export async function setFarmerProductHidden(id, hide = true) {
  return apiFetch(`/farmer/products/${id}/${hide ? 'hide' : 'unhide'}`, {
    method: 'POST',
  });
}

export async function bulkUpdateFarmerProducts(operations) {
  return apiFetch('/farmer/products/bulk', {
    method: 'POST',
    body: operations,
  });
}

/**
 * Weekly Inventory Template
 */
export async function getWeeklyTemplate(signal) {
  return apiFetch('/farmer/weekly-template', { signal });
}

export async function updateWeeklyTemplate(items) {
  return apiFetch('/farmer/weekly-template', {
    method: 'PUT',
    body: { items },
  });
}

export async function applyWeeklyTemplate() {
  return apiFetch('/farmer/weekly-template/apply', {
    method: 'POST',
  });
}

/**
 * Farmer Orders
 */
export async function getFarmerOrders(query = {}, signal) {
  return apiFetch('/farmer/orders', { query, signal });
}

export async function getFarmerOrderDetail(id, signal) {
  return apiFetch(`/farmer/orders/${id}`, { signal });
}

export async function acceptFarmerOrder(id) {
  return apiFetch(`/farmer/orders/${id}/accept`, {
    method: 'POST',
  });
}

export async function declineFarmerOrder(id, reason) {
  return apiFetch(`/farmer/orders/${id}/decline`, {
    method: 'POST',
    body: { reason },
  });
}

export async function readyFarmerOrder(id) {
  return apiFetch(`/farmer/orders/${id}/ready`, {
    method: 'POST',
  });
}

export async function completeFarmerOrder(id) {
  return apiFetch(`/farmer/orders/${id}/complete`, {
    method: 'POST',
  });
}

export async function cancelFarmerOrder(id, reason) {
  return apiFetch(`/farmer/orders/${id}/cancel`, {
    method: 'POST',
    body: { reason },
  });
}

export async function getPickList(date, signal) {
  return apiFetch('/farmer/orders/pick-list', { query: { date }, signal });
}

/**
 * Reviews & Moderation
 */
export async function getFarmerReviews(query = {}, signal) {
  return apiFetch('/farmer/reviews', { query, signal });
}

export async function replyFarmerReview(reviewId, text) {
  return apiFetch(`/farmer/reviews/${reviewId}/reply`, {
    method: 'POST',
    body: { body: text },
  });
}

export async function deleteFarmerReviewReply(reviewId) {
  return apiFetch(`/farmer/reviews/${reviewId}/reply`, {
    method: 'DELETE',
  });
}

export async function reportReview(reviewId, reason) {
  return apiFetch(`/reviews/${reviewId}/flag`, {
    method: 'POST',
    body: { reason },
  });
}

/**
 * Image Upload
 */
export async function uploadFarmerImage(file, kind = 'product') {
  if (!file) throw new Error('No file provided');
  if (file.size > 1048576) {
    throw new Error('Image exceeds 1 MB limit.');
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed.');
  }

  return apiFetch(`/farmer/uploads/image?kind=${kind}`, {
    method: 'POST',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
}
