/**
 * Market Assistant AI / Bot API
 */
import { apiFetch } from './client';

export async function sendAssistantMessage(text, history = [], signal) {
  const res = await apiFetch('/assistant/message', {
    method: 'POST',
    body: { text, history },
    signal,
  });
  return res.data;
}
