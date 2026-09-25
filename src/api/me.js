/**
 * Customer profile, home summary, saved markets, favorites, and notifications API
 */
import { apiFetch } from './client';

export async function getProfile(signal) {
  const res = await apiFetch('/users/me', { signal });
  return res.data;
}

export async function updateProfile(payload) {
  const res = await apiFetch('/users/me', {
    method: 'PATCH',
    body: payload,
  });
  return res.data;
}

export async function changePassword(payload) {
  const res = await apiFetch('/users/me/password', {
    method: 'POST',
    body: payload,
  });
  return res.data;
}

export async function getHomeSummary(signal) {
  const res = await apiFetch('/home/summary', { signal });
  return res.data;
}

export async function setHomeMarket(marketId) {
  const res = await apiFetch(`/users/me/home-market/${marketId}`, {
    method: 'PUT',
  });
  return res.data;
}

export async function getSavedMarkets(signal) {
  const res = await apiFetch('/users/me/saved-markets', { signal });
  return res.data;
}

export async function saveMarket(marketId) {
  const res = await apiFetch(`/users/me/saved-markets/${marketId}`, {
    method: 'PUT',
  });
  return res.data;
}

export async function unsaveMarket(marketId) {
  const res = await apiFetch(`/users/me/saved-markets/${marketId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function getFavoriteIds(signal) {
  const res = await apiFetch('/favorites/ids', { signal });
  return res.data;
}

export async function addFavorite(type, id) {
  const res = await apiFetch(`/favorites/${type}/${id}`, {
    method: 'PUT',
  });
  return res.data;
}

export async function removeFavorite(type, id) {
  const res = await apiFetch(`/favorites/${type}/${id}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function getFavoritesList(type, signal) {
  const res = await apiFetch('/favorites', {
    query: { type },
    signal,
  });
  return res.data;
}

export async function getNotifications(query = {}, signal) {
  const res = await apiFetch('/notifications', { query, signal });
  return res;
}

export async function markNotificationRead(id) {
  const res = await apiFetch(`/notifications/${id}/read`, {
    method: 'POST',
  });
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await apiFetch('/notifications/read-all', {
    method: 'POST',
  });
  return res.data;
}
