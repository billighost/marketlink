/**
 * Gemini REST Client.
 * Lightweight, zero-dependency client using Node 18+ native fetch and AbortController.
 * Supports standard generation, streaming via Server-Sent Events (alt=sse),
 * native tool/function declarations, and strict error masking.
 */

import { env } from '../../config/env.js';
import { maskKey } from './keyPool.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Sanitizes error messages to ensure API keys are never exposed.
 * @param {string} message
 * @param {string} apiKey
 * @returns {string}
 */
export function sanitizeErrorMessage(message, apiKey) {
  if (!message || typeof message !== 'string') return 'Gemini API Error';
  if (!apiKey || typeof apiKey !== 'string') return message;
  const masked = maskKey(apiKey);
  return message.split(apiKey).join(masked);
}

/**
 * Calls Gemini generateContent or streamGenerateContent.
 *
 * @param {object} params
 * @param {string} params.apiKey
 * @param {string} [params.model]
 * @param {string} [params.systemInstruction]
 * @param {Array<object>} params.contents
 * @param {Array<object>} [params.tools]
 * @param {object} [params.generationConfig]
 * @param {boolean} [params.stream=false]
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<object|AsyncGenerator<object>>}
 */
export async function generate({
  apiKey,
  model = env.GEMINI_MODEL || 'gemini-2.5-flash',
  systemInstruction,
  contents = [],
  tools,
  generationConfig,
  stream = false,
  signal,
}) {
  if (!apiKey) {
    throw new Error('Missing apiKey for Gemini request');
  }

  const endpoint = stream
    ? `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${apiKey}`
    : `${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  const bodyPayload = {
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: env.ASSISTANT_MAX_TOKENS || 400,
      ...generationConfig,
    },
  };

  if (systemInstruction) {
    bodyPayload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  if (tools && tools.length > 0) {
    bodyPayload.tools = tools;
  }

  const timeoutMs = env.GEMINI_TIMEOUT_MS || 12000;
  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort(new Error(`Gemini API call timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  let combinedSignal = timeoutController.signal;
  if (signal) {
    // If external signal fires, abort timeout controller
    signal.addEventListener('abort', () => timeoutController.abort(signal.reason), { once: true });
  }

  let res;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
      signal: combinedSignal,
    });
  } catch (fetchErr) {
    clearTimeout(timer);
    const sanitizedMsg = sanitizeErrorMessage(fetchErr.message, apiKey);
    const err = new Error(sanitizedMsg);
    err.name = fetchErr.name;
    if (fetchErr.name === 'AbortError') {
      err.status = 408;
    }
    throw err;
  }

  if (!res.ok) {
    clearTimeout(timer);
    let errorBody = {};
    try {
      errorBody = await res.json();
    } catch {
      // Non-JSON error body
    }

    const rawMessage = (errorBody.error && errorBody.error.message) || res.statusText || 'Gemini API Error';
    const sanitizedMsg = sanitizeErrorMessage(rawMessage, apiKey);
    const err = new Error(sanitizedMsg);
    err.status = res.status;
    err.code = (errorBody.error && errorBody.error.status) || 'GEMINI_ERROR';

    if (res.status === 429 || err.code === 'RESOURCE_EXHAUSTED' || /quota/i.test(sanitizedMsg)) {
      err.status = 429;
      err.code = 'RESOURCE_EXHAUSTED';
    } else if (res.status === 400 && /API_KEY_INVALID|key not valid/i.test(sanitizedMsg)) {
      err.status = 401;
      err.code = 'API_KEY_INVALID';
    }

    throw err;
  }

  if (!stream) {
    clearTimeout(timer);
    const data = await res.json();
    return parseGeminiResponse(data);
  }

  // Stream mode: return an async generator yielding chunks
  return (async function* () {
    try {
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep partial line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, '').trim();
          if (jsonStr === '[DONE]') {
            yield { done: true };
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parseGeminiChunk(parsed);
            yield chunk;
          } catch {
            // Ignore incomplete or unparseable SSE line
          }
        }
      }

      if (buffer.trim().startsWith('data:')) {
        const jsonStr = buffer.trim().replace(/^data:\s*/, '').trim();
        try {
          const parsed = JSON.parse(jsonStr);
          const chunk = parseGeminiChunk(parsed);
          yield chunk;
        } catch {
          // ignore
        }
      }

      yield { done: true };
    } finally {
      clearTimeout(timer);
    }
  })();
}

/**
 * Parses a standard Gemini generateContent response object.
 * @param {object} data
 * @returns {object}
 */
export function parseGeminiResponse(data) {
  let text = '';
  const functionCalls = [];
  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  for (const part of parts) {
    if (part.text) {
      text += part.text;
    }
    if (part.functionCall) {
      functionCalls.push(part.functionCall);
    }
  }

  return {
    text: text.trim(),
    functionCalls,
    parts,
    usageMetadata: data?.usageMetadata || null,
    finishReason: candidate?.finishReason || 'STOP',
    raw: data,
  };
}

/**
 * Parses an SSE chunk from streamGenerateContent.
 * @param {object} parsed
 * @returns {object}
 */
export function parseGeminiChunk(parsed) {
  let textChunk = '';
  const functionCalls = [];
  const candidate = parsed?.candidates?.[0];

  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.text) {
        textChunk += part.text;
      }
      if (part.functionCall) {
        functionCalls.push(part.functionCall);
      }
    }
  }

  return {
    textChunk,
    functionCalls,
    finishReason: candidate?.finishReason || null,
    done: false,
  };
}
