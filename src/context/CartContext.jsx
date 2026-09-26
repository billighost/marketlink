import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getCartQuote, checkout as apiCheckout } from '@/api/orders';
import { getProductDetail } from '@/api/catalog';
import { createIdempotencyKey } from '@/api/client';
import { invalidateQueries } from '@/hooks/useQuery';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const storageKey = `marketlink_cart_${userId}`;

  // In-memory cart items persisted per user ID: [{ productId, quantity, farmerId, slotStart }]
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Switch storage key if user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setItems(saved ? JSON.parse(saved) : []);
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, storageKey]);

  // Idempotency key for checkout session
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey());

  const resetIdempotencyKey = useCallback(() => {
    setIdempotencyKey(createIdempotencyKey());
  }, []);

  // Server quote truth state
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  const quoteAbortRef = useRef(null);
  const quoteDebounceRef = useRef(null);

  // Fetch server quote
  const fetchQuote = useCallback(async (currentItems) => {
    if (!currentItems || currentItems.length === 0) {
      setQuote(null);
      setLoadingQuote(false);
      setQuoteError(null);
      return null;
    }

    if (quoteAbortRef.current) {
      quoteAbortRef.current.abort();
    }
    quoteAbortRef.current = new AbortController();
    const signal = quoteAbortRef.current.signal;

    setLoadingQuote(true);
    setQuoteError(null);

    try {
      const groupsMap = new Map();

      // Resolve farmerIds and build vendor groups
      for (const item of currentItems) {
        let fId = item.farmerId;
        if (!fId) {
          try {
            const p = await getProductDetail(item.productId, signal);
            fId = p?.farmer?.id;
            item.farmerId = fId;
          } catch {
            // ignore
          }
        }
        if (!fId) continue;

        if (!groupsMap.has(fId)) {
          groupsMap.set(fId, {
            farmerId: fId,
            ...(item.slotStart ? { slotStart: item.slotStart } : {}),
            items: [],
          });
        }

        const g = groupsMap.get(fId);
        if (item.slotStart && !g.slotStart) {
          g.slotStart = item.slotStart;
        }
        g.items.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }

      const groups = Array.from(groupsMap.values());
      if (groups.length === 0) {
        setLoadingQuote(false);
        return null;
      }

      const quoteData = await getCartQuote(groups, signal);
      if (!signal.aborted) {
        setQuote(quoteData);
        setQuoteError(null);
        setLoadingQuote(false);

        if (quoteData && quoteData.groups) {
          const needsSlot = currentItems.some(
            (it) => !it.slotStart && quoteData.groups.some((g) => g.farmerId === it.farmerId && g.slots?.some((s) => s.isOpen))
          );
          if (needsSlot) {
            setItems((prev) =>
              prev.map((it) => {
                if (it.slotStart) return it;
                const grp = quoteData.groups.find((g) => g.farmerId === it.farmerId);
                const openSlot = grp?.slots?.find((s) => s.isOpen);
                return openSlot ? { ...it, slotStart: openSlot.start } : it;
              })
            );
          }
        }
      }
      return quoteData;
    } catch (err) {
      if (err.name === 'AbortError' || signal.aborted) return null;
      setQuoteError(err);
      setLoadingQuote(false);
      return null;
    }
  }, []);

  // Debounced quote updates (300ms) when items change
  useEffect(() => {
    clearTimeout(quoteDebounceRef.current);
    if (items.length === 0) {
      setQuote(null);
      setLoadingQuote(false);
      setQuoteError(null);
      return;
    }

    setLoadingQuote(true);
    quoteDebounceRef.current = setTimeout(() => {
      fetchQuote(items);
    }, 300);

    return () => {
      clearTimeout(quoteDebounceRef.current);
    };
  }, [items, fetchQuote]);

  const add = useCallback((productId, meta = {}) => {
    const farmerId = typeof meta === 'object' ? meta?.farmerId : null;
    const slotStart = typeof meta === 'object' ? (meta?.slotStart || meta?.slotId) : meta;

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
                farmerId: farmerId || item.farmerId,
                slotStart: slotStart || item.slotStart,
              }
            : item
        );
      }
      return [...prev, { productId, quantity: 1, farmerId, slotStart }];
    });
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const setSlot = useCallback((farmerId, slotStart) => {
    setItems((prev) =>
      prev.map((item) =>
        item.farmerId === farmerId || item.productId === farmerId
          ? { ...item, slotStart }
          : item
      )
    );
  }, []);

  const remove = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const restoreItem = useCallback((productId, quantity = 1, farmerId = null) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { productId, quantity, farmerId }];
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setQuote(null);
    resetIdempotencyKey();
  }, [resetIdempotencyKey]);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const getQuantity = useCallback(
    (productId) => {
      const item = items.find((i) => i.productId === productId);
      return item ? item.quantity : 0;
    },
    [items]
  );

  // Subtotal in integer cents from server quote (or fallback)
  const subtotalCents = useMemo(() => {
    if (quote?.totalCents !== undefined) return quote.totalCents;
    if (quote?.subtotal !== undefined) return quote.subtotal;
    if (quote?.total !== undefined) return quote.total;
    return 0;
  }, [quote]);

  // Execute checkout
  const performCheckout = useCallback(
    async (notes = '') => {
      const groupsMap = new Map();
      for (const item of items) {
        const fId = item.farmerId;
        if (!fId) continue;
        if (!groupsMap.has(fId)) {
          // Fall back to quote selected slot or first open slot if not on item
          const fallbackSlot =
            quote?.groups?.find((g) => g.farmerId === fId)?.selectedSlot?.start ||
            quote?.groups?.find((g) => g.farmerId === fId)?.slots?.find((s) => s.isOpen)?.start;
          const slotStart = item.slotStart || fallbackSlot;

          groupsMap.set(fId, {
            farmerId: fId,
            ...(slotStart ? { slotStart } : {}),
            ...(notes ? { note: notes } : {}),
            items: [],
          });
        }
        groupsMap.get(fId).items.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }

      const groups = Array.from(groupsMap.values());
      const res = await apiCheckout({ groups }, idempotencyKey);

      // Invalidate relevant queries
      invalidateQueries('/orders');
      invalidateQueries('/feed');
      invalidateQueries('/home/summary');
      clear();
      return res;
    },
    [items, quote, idempotencyKey, clear]
  );

  const value = useMemo(
    () => ({
      items,
      add,
      setQuantity,
      setSlot,
      remove,
      restoreItem,
      clear,
      count,
      subtotalCents,
      getQuantity,
      quote,
      loadingQuote,
      quoteError,
      refreshQuote: () => fetchQuote(items),
      idempotencyKey,
      resetIdempotencyKey,
      performCheckout,
    }),
    [
      items,
      add,
      setQuantity,
      setSlot,
      remove,
      restoreItem,
      clear,
      count,
      subtotalCents,
      getQuantity,
      quote,
      loadingQuote,
      quoteError,
      fetchQuote,
      idempotencyKey,
      resetIdempotencyKey,
      performCheckout,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

export default CartContext;
