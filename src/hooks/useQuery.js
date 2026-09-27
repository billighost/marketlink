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

  // Synchronize state during render when serializedKey or enabled changes
  const [prevKey, setPrevKey] = useState(serializedKey);
  const [prevEnabled, setPrevEnabled] = useState(enabled);

  if (prevKey !== serializedKey || prevEnabled !== enabled) {
    setPrevKey(serializedKey);
    setPrevEnabled(enabled);
    const newCached = getCachedEntry();
    const newFresh = newCached && Date.now() - newCached.timestamp < STALE_TIME_MS;
    if (newCached) {
      setData(newCached.data);
      setLoading(enabled && serializedKey ? !newFresh : false);
    } else {
      if (!keepPrevious) {
        setData(null);
      }
      setLoading(Boolean(enabled && serializedKey));
    }
    setError(null);
  }

  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const executeFetch = useCallback(
    async (isBackground = false) => {
      if (!serializedKey || !enabled) return;

      // Abort previous in-flight request for this component instance
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const signal = controller.signal;

      if (!isBackground) {
        setLoading(true);
        setError(null);
        if (!keepPrevious) {
          setData(null);
        }
      }

      try {
        // Reuse in-flight request if one is already pending and not aborted
        let inFlight = inFlightRequests.get(serializedKey);
        let promise;

        if (inFlight && !inFlight.controller.signal.aborted) {
          promise = inFlight.promise;
        } else {
          promise = Promise.resolve()
            .then(() => fetcherRef.current(signal))
            .catch((err) => {
              if (err.name === 'AbortError' || signal.aborted) return null;
              throw err;
            });
          inFlightRequests.set(serializedKey, { promise, controller });
          promise.finally(() => {
            const current = inFlightRequests.get(serializedKey);
            if (current && current.promise === promise) {
              inFlightRequests.delete(serializedKey);
            }
          });
        }

        const result = await promise;

        // If this specific fetch was aborted or component unmounted, ignore result without touching loading
        if (signal.aborted || !mountedRef.current) {
          return;
        }

        if (result !== undefined) {
          queryCache.set(serializedKey, { data: result, timestamp: Date.now() });
          setData(result);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        // If aborted or unmounted, DO NOT set loading false or touch error
        if (signal.aborted || !mountedRef.current || err.name === 'AbortError') {
          return;
        }
        setError(err);
        setLoading(false);
      }
    },
    [serializedKey, enabled, keepPrevious]
  );

  useEffect(() => {
    mountedRef.current = true;

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
