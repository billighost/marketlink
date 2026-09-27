import { useState, useCallback, useRef, useEffect } from 'react';
import { getFeed } from '@/api/catalog';

// Module-level cache so navigating into sheets and back does not reload or reset feed
let cachedSections = null;
let cachedCursor = null;
let cachedHasMore = true;

/**
 * Custom hook to manage the curated and endless Home feed from GET /api/feed.
 */
export function useFeed() {
  const [sections, setSections] = useState(() => cachedSections || []);
  const [loading, setLoading] = useState(!cachedSections);
  const [cursor, setCursor] = useState(() => cachedCursor);
  const [hasMore, setHasMore] = useState(() => cachedHasMore);
  const inFlightRef = useRef(false);

  const fetchBatch = useCallback(async (nextCursor = null, isRefresh = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);

    try {
      const res = await getFeed(nextCursor);
      const incomingSections = res?.data?.sections || [];
      const newCursor = res?.meta?.nextCursor || null;
      let hasNewValidSections = false;

      setSections((prev) => {
        const base = isRefresh ? [] : prev;
        
        // Deduplicate items across all sections currently in view
        const seenItemIds = new Set();
        base.forEach((sec) => {
          (sec.items || []).forEach((item) => seenItemIds.add(item.id));
        });

        const deduplicatedIncoming = incomingSections.map((sec) => {
          const isFarmer =
            sec.type === 'farmers' ||
            sec.type === 'farmerRow' ||
            sec.type === 'farmer';

          const filteredItems = (sec.items || []).filter((item) => {
            if (seenItemIds.has(item.id)) return false;
            seenItemIds.add(item.id);
            return true;
          });
          return {
            ...sec,
            items: filteredItems,
            cardVariant: isFarmer
              ? 'stall'
              : (sec.cardVariant || (sec.id === 'bestsellers' ? 'feature' : 'compact')),
          };
        }).filter((sec) => (sec.items || []).length > 0);

        hasNewValidSections = deduplicatedIncoming.length > 0;
        const merged = [...base, ...deduplicatedIncoming];
        cachedSections = merged;
        return merged;
      });

      // Only continue pagination if server says hasMore, there is a next cursor, and new non-empty sections were actually returned
      const more = Boolean(res?.meta?.hasMore && newCursor && incomingSections.length > 0 && hasNewValidSections);

      setCursor(newCursor);
      setHasMore(more);
      cachedCursor = newCursor;
      cachedHasMore = more;
    } catch (err) {
      console.error('[useFeed] Error loading feed batch:', err);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  // Initial fetch if cache is empty
  useEffect(() => {
    if (!cachedSections) {
      fetchBatch(null, true);
    }
  }, [fetchBatch]);

  // Re-seed on user pull-to-refresh / tab double tap event
  useEffect(() => {
    const handleRefresh = () => {
      cachedSections = null;
      cachedCursor = null;
      cachedHasMore = true;
      fetchBatch(null, true);
    };
    window.addEventListener('marketlink:refresh-feed', handleRefresh);
    return () => window.removeEventListener('marketlink:refresh-feed', handleRefresh);
  }, [fetchBatch]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore || inFlightRef.current) return;
    fetchBatch(cursor, false);
  }, [loading, hasMore, cursor, fetchBatch]);

  const refetch = useCallback(() => {
    return fetchBatch(null, true);
  }, [fetchBatch]);

  return { sections, loadMore, loading, hasMore, refetch };
}

export default useFeed;
