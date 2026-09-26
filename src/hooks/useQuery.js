/**
 * In-memory query hook with in-flight deduplication, stale-while-revalidate (15s),
 * abort on unmount, and React StrictMode double-invocation protection.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

// Global in-memory cache and in-flight promises
const queryCache = new Map(); // key -> { data, timestamp }
const inFlightRequests = new Map(); // key -> Promise

const STALE_TIME_MS = 15000; // 15 seconds

export function invalidateQueries(keyPrefix) {
  for (const key of queryCache.keys()) {
    if (!keyPrefix || key.startsWith(keyPrefix)) {
      queryCache.delete(key);
    }
  }
}

export function useQuery(key, fetcher, options = {}) {
  const { enabled = true, keepPrevious = false } = options;
  const serializedKey = key ? (typeof key === 'string' ? key : JSON.stringify(key)) : null;

  const getCachedEntry = () => {
    if (!serializedKey) return null;
    return queryCache.get(serializedKey) || null;
  };

  const cached = getCachedEntry();
  const isFresh = cached && Date.now() - cached.timestamp < STALE_TIME_MS;

  const [data, setData] = useState(() => (cached ? cached.data : null));
  const [loading, setLoading] = useState(() => (enabled && serializedKey ? !isFresh : false));
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);
  const lastKeyRef = useRef(serializedKey);

  const executeFetch = useCallback(
    async (isBackground = false) => {
      if (!serializedKey || !enabled) return;

      // Abort previous in-flight request for this component instance
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      if (!isBackground) {
        setLoading(true);
        setError(null);
        if (!keepPrevious) {
          setData(null);
        }
      }

      try {
        // Reuse in-flight request if one is already pending for this key
        let promise = inFlightRequests.get(serializedKey);
        if (!promise) {
          promise = fetcher(signal);
          inFlightRequests.set(serializedKey, promise);
        }

        const result = await promise;

        if (mountedRef.current && !signal.aborted) {
          queryCache.set(serializedKey, { data: result, timestamp: Date.now() });
          setData(result);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (err.name === 'AbortError' || signal.aborted) {
          return;
        }
        if (mountedRef.current) {
          setError(err);
          setLoading(false);
        }
      } finally {
        inFlightRequests.delete(serializedKey);
      }
    },
    [serializedKey, enabled, keepPrevious, fetcher]
  );

  useEffect(() => {
    mountedRef.current = true;
    const keyChanged = lastKeyRef.current !== serializedKey;
    lastKeyRef.current = serializedKey;

    if (!enabled || !serializedKey) {
      setLoading(false);
      return;
    }

    const currentCached = getCachedEntry();
    if (currentCached) {
      setData(currentCached.data);
      const stillFresh = Date.now() - currentCached.timestamp < STALE_TIME_MS;
      if (!stillFresh) {
        // Stale-while-revalidate: show cached, fetch in background
        executeFetch(true);
      } else {
        setLoading(false);
      }
    } else {
      executeFetch(false);
    }

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [serializedKey, enabled, executeFetch]);

  const refetch = useCallback(() => {
    if (serializedKey) {
      queryCache.delete(serializedKey);
    }
    return executeFetch(false);
  }, [serializedKey, executeFetch]);

  return { data, loading, error, refetch };
}

export default useQuery;
