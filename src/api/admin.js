import { apiFetch } from './client';

/**
 * Admin Overview
 */
export async function getAdminOverview(signal) {
  return apiFetch('/admin/overview', { signal });
}

/**
 * People (Farmers & Customers)
 */
export async function getAdminFarmers(query = {}, signal) {
  return apiFetch('/admin/farmers', { query, signal });
}

export async function approveFarmer(id) {
  return apiFetch(`/admin/farmers/${id}/approve`, {
    method: 'POST',
  });
}

export async function rejectFarmer(id, reason) {
  return apiFetch(`/admin/farmers/${id}/reject`, {
    method: 'POST',
    body: { reason },
  });
}

export async function suspendFarmer(id, reason) {
  return apiFetch(`/admin/farmers/${id}/suspend`, {
    method: 'POST',
    body: { reason },
  });
}

export async function reinstateFarmer(id) {
  return apiFetch(`/admin/farmers/${id}/reinstate`, {
    method: 'POST',
  });
}

export async function getAdminCustomers(query = {}, signal) {
  return apiFetch('/admin/customers', { query, signal });
}

export async function deactivateCustomer(id, reason = '') {
  return apiFetch(`/admin/customers/${id}/deactivate`, {
    method: 'POST',
    body: { reason },
  });
}

export async function activateCustomer(id) {
  return apiFetch(`/admin/customers/${id}/activate`, {
    method: 'POST',
  });
}

/**
 * Markets
 */
export async function getAdminMarkets(query = {}, signal) {
  return apiFetch('/admin/markets', { query, signal });
}

export async function createMarket(market) {
  return apiFetch('/admin/markets', {
    method: 'POST',
    body: market,
  });
}

export async function updateMarket(id, updates) {
  return apiFetch(`/admin/markets/${id}`, {
    method: 'PATCH',
    body: updates,
  });
}

export async function deleteMarket(id, force = false) {
  return apiFetch(`/admin/markets/${id}${force ? '?force=true' : ''}`, {
    method: 'DELETE',
    body: { force },
  });
}

/**
 * Moderation
 */
export async function getModerationFlags(query = {}, signal) {
  return apiFetch('/admin/moderation', { query, signal });
}

export async function resolveModerationFlag(id, { action, note }) {
  return apiFetch(`/admin/moderation/${id}/resolve`, {
    method: 'POST',
    body: { action, note },
  });
}

export async function removeProductByAdmin(id, note = '') {
  return apiFetch(`/admin/products/${id}/remove`, {
    method: 'POST',
    body: { note },
  });
}

export async function removeReviewByAdmin(id, note = '') {
  return apiFetch(`/admin/reviews/${id}/remove`, {
    method: 'POST',
    body: { note },
  });
}

/**
 * Reports & Analytics
 */
export async function getAdminReportsSummary(range = '30d', signal) {
  return apiFetch('/admin/reports/summary', { query: { range }, signal });
}

export async function getReportsHistory(signal) {
  return apiFetch('/admin/reports/history', { signal });
}

export async function exportAdminReport(type = 'orders', range = '30d') {
  return apiFetch('/admin/reports/export', {
    query: { type, range },
    headers: { Accept: 'text/csv' },
    responseType: 'blob',
  });
}

/**
 * Settings: Categories
 */
export async function getAdminCategories(signal) {
  return apiFetch('/admin/categories', { signal });
}

export async function createAdminCategory(data) {
  return apiFetch('/admin/categories', {
    method: 'POST',
    body: data,
  });
}

export async function updateAdminCategory(id, data) {
  return apiFetch(`/admin/categories/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteAdminCategory(id) {
  return apiFetch(`/admin/categories/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderAdminCategories(order) {
  return apiFetch('/admin/categories/order', {
    method: 'PUT',
    body: { order },
  });
}

/**
 * Settings: Announcements
 */
export async function getAdminAnnouncements(signal) {
  return apiFetch('/admin/announcements', { signal });
}

export async function createAdminAnnouncement(data) {
  return apiFetch('/admin/announcements', {
    method: 'POST',
    body: data,
  });
}

export async function updateAdminAnnouncement(id, data) {
  return apiFetch(`/admin/announcements/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function publishAdminAnnouncement(id) {
  return apiFetch(`/admin/announcements/${id}/publish`, {
    method: 'POST',
  });
}

export async function deleteAdminAnnouncement(id) {
  return apiFetch(`/admin/announcements/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Settings: Messages
 */
export async function getAdminMessages(query = {}, signal) {
  return apiFetch('/admin/messages', { query, signal });
}

export async function handleAdminMessage(id, reply = '') {
  return apiFetch(`/admin/messages/${id}/handle`, {
    method: 'POST',
    body: { reply },
  });
}

/**
 * Settings: Platform
 */
export async function getPlatformSettings(signal) {
  return apiFetch('/admin/settings', { signal });
}

export async function updatePlatformSettings(data) {
  return apiFetch('/admin/settings', {
    method: 'PATCH',
    body: data,
  });
}
