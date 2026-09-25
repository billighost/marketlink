/**
 * MarketLink API Client
 * - Single-flight automatic token refresh on 401
 * - In-memory access token storage (never localStorage)
 * - Normalized ApiError shape: { status, code, message, details }
 * - AbortController signal support
 * - Idempotency-Key support
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

let inMemoryAccessToken = null;
let refreshPromise = null;
let authListeners = new Set();

export class ApiError extends Error {
  constructor({ status, code, message, details = [] }) {
    super(message || 'An unexpected error occurred');
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'UNKNOWN_ERROR';
    this.details = details;
  }
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

export function setAccessToken(token) {
  inMemoryAccessToken = token;
  notifyAuthListeners();
}

export function clearAccessToken() {
  inMemoryAccessToken = null;
  notifyAuthListeners();
}

export function onAuthTokenChange(cb) {
  authListeners.add(cb);
  return () => authListeners.delete(cb);
}

function notifyAuthListeners() {
  for (const cb of authListeners) {
    try {
      cb(inMemoryAccessToken);
    } catch {
      // ignore observer errors
    }
  }
}

/**
 * Creates a unique Idempotency-Key
 */
export function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'idemp_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Performs a single-flight token refresh
 */
export async function performTokenRefresh() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!res.ok) {
          clearAccessToken();
          return null;
        }

        const data = await res.json();
        const nextToken = data?.data?.accessToken;
        const user = data?.data?.user;
        if (nextToken) {
          setAccessToken(nextToken);
          return { accessToken: nextToken, user };
        }
        clearAccessToken();
        return null;
      } catch {
        clearAccessToken();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

/**
 * Primary HTTP request helper
 *
 * @param {string} path - Endpoint path (e.g. '/markets' or 'markets')
 * @param {object} [options]
 * @param {string} [options.method='GET']
 * @param {object} [options.body]
 * @param {object} [options.query]
 * @param {AbortSignal} [options.signal]
 * @param {object} [options.headers]
 * @param {string} [options.idempotencyKey]
 * @param {boolean} [options._isRetry=false]
 */
export async function apiFetch(path, options = {}) {
  const {
    method = 'GET',
    body,
    query,
    signal,
    headers = {},
    idempotencyKey,
    _isRetry = false,
  } = options;

  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Append query string if present
  if (query && typeof query === 'object') {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, String(val));
      }
    }
    const queryString = params.toString();
    if (queryString) {
      cleanPath += (cleanPath.includes('?') ? '&' : '?') + queryString;
    }
  }

  const url = `${BASE_URL}${cleanPath}`;
  const reqHeaders = {
    ...headers,
  };

  if (inMemoryAccessToken) {
    reqHeaders['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  if (idempotencyKey) {
    reqHeaders['Idempotency-Key'] = idempotencyKey;
  }

  let encodedBody = undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      encodedBody = body;
      // Let browser set multipart boundary
      delete reqHeaders['Content-Type'];
    } else {
      reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json';
      encodedBody = typeof body === 'string' ? body : JSON.stringify(body);
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: reqHeaders,
      body: encodedBody,
      signal,
      credentials: 'include',
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError({
      status: 0,
      code: 'NETWORK',
      message: "Can't reach MarketLink. Check your connection.",
      details: [{ field: 'network', message: err.message }],
    });
  }

  // 401 Unauthorized handling (single-flight token refresh)
  if (response.status === 401 && !_isRetry && !cleanPath.includes('/auth/login') && !cleanPath.includes('/auth/refresh')) {
    const refreshedToken = await performTokenRefresh();
    if (refreshedToken?.accessToken) {
      return apiFetch(path, {
        ...options,
        _isRetry: true,
      });
    } else {
      // If refresh failed and caller had a token, broadcast sign-out notification
      clearAccessToken();
      try {
        localStorage.setItem('marketlink_signed_out', Date.now().toString());
      } catch {
        // ignore storage errors
      }
    }
  }

  // 204 No Content
  if (response.status === 204) {
    return { data: null, meta: null };
  }

  // Handle blob responses (such as CSV exports)
  if (options.responseType === 'blob' || reqHeaders['Accept'] === 'text/csv') {
    if (!response.ok) {
      let msg = response.statusText || 'Export failed';
      try {
        const text = await response.text();
        const errObj = JSON.parse(text);
        msg = errObj?.error?.message || msg;
      } catch {
        // ignore JSON parse error
      }
      throw new ApiError({
        status: response.status,
        code: `HTTP_${response.status}`,
        message: msg,
      });
    }
    return await response.blob();
  }

  // Attempt to parse JSON response
  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const errorPayload = json?.error || {};
    throw new ApiError({
      status: response.status,
      code: errorPayload.code || `HTTP_${response.status}`,
      message: errorPayload.message || response.statusText || 'Request failed',
      details: Array.isArray(errorPayload.details) ? errorPayload.details : [],
    });
  }

  return json;
}

export default apiFetch;
