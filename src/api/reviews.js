import { apiFetch } from './client';

export async function updateReview(id, payload) {
  const res = await apiFetch(`/reviews/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return res.data;
}

export async function deleteReview(id) {
  const res = await apiFetch(`/reviews/${id}`, {
    method: 'DELETE',
  });
  return res.data;
}
