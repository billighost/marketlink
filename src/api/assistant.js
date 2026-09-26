<<<<<<< HEAD
import { apiFetch } from './client';export async function sendAssistantMessage(text, history = [], signal) {  const res = await apiFetch('/assistant/message', {    method: 'POST',    body: { text, history },    signal,  });  return res.data;}
=======
/**
 * Market Assistant AI / Bot API.
 * Supports streaming Server-Sent Events (SSE) with fallback to standard REST JSON.
 */
import { apiFetch, getAccessToken } from './client';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '/api';

/**
 * Streams an assistant message token-by-token over SSE.
 *
 * @param {string} text - User message
 * @param {Array<object>} [history=[]] - Conversation history
 * @param {object} [options]
 * @param {function} [options.onChunk] - Callback for incoming token chunk (textChunk)
 * @param {AbortSignal} [options.signal] - Cancellation signal
 * @returns {Promise<{ reply: string, cards: Array<object>, suggestions: Array<string>, provider?: string }>}
 */
export async function streamAssistantMessage(text, history = [], { onChunk, signal } = {}) {
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/assistant/message?stream=1`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ text, history }),
    signal,
  });

  if (!res.ok) {
    let errBody = {};
    try {
      errBody = await res.json();
    } catch {
      // Non-JSON response
    }
    const err = new Error(errBody?.error?.message || res.statusText || 'Assistant request failed');
    err.status = res.status;
    err.code = errBody?.error?.code || (res.status === 503 ? 'ASSISTANT_BUSY' : 'ASSISTANT_ERROR');
    throw err;
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) {
    const data = await res.json();
    return data?.data || data;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let finalResult = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;

      const jsonStr = trimmed.replace(/^data:\s*/, '').trim();
      try {
        const payload = JSON.parse(jsonStr);
        if (payload.error) {
          const err = new Error(payload.error.message || 'Stream terminated with error');
          err.code = payload.error.code || 'STREAM_ERROR';
          throw err;
        }

        if (payload.chunk && typeof onChunk === 'function') {
          onChunk(payload.chunk);
        }

        if (payload.done) {
          finalResult = {
            reply: payload.reply,
            cards: payload.cards || [],
            suggestions: payload.suggestions || [],
            provider: payload.provider,
          };
        }
      } catch (parseErr) {
        if (parseErr.code || parseErr.status) {
          throw parseErr;
        }
      }
    }
  }

  return finalResult || { reply: '', cards: [], suggestions: [] };
}

export async function sendAssistantMessage(text, history = [], signal) {
  const res = await apiFetch('/assistant/message', {
    method: 'POST',
    body: { text, history },
    signal,
  });
  return res.data;
}
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
