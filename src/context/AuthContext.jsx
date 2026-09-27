import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { login as apiLogin, logout as apiLogout, refresh as apiRefresh, getMe, registerCustomer as apiRegisterCustomer, registerFarmer as apiRegisterFarmer } from '@/api/auth';
import { setHomeMarket } from '@/api/me';
import { setAccessToken, clearAccessToken } from '@/api/client';
import { getMarkets } from '@/api/catalog';
import { useQuery, invalidateQueries } from '@/hooks/useQuery';

export const ROLE_PATHS = {
  customer: '/buyer',
  buyer: '/buyer',
  farmer: '/vendor',
  vendor: '/vendor',
  admin: '/admin',
};

export function homePathFor(role) {
  if (!role) return '/';
  const normalized = role.toLowerCase();
  return ROLE_PATHS[normalized] || '/';
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('marketlink_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    try {
      if (nextUser) {
        localStorage.setItem('marketlink_user', JSON.stringify(nextUser));
      } else {
        localStorage.removeItem('marketlink_user');
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // If we already have a cached user and token, don't show blocking loading screen
  const [isCheckingSession, setIsCheckingSession] = useState(() => {
    try {
      const hasCachedUser = Boolean(localStorage.getItem('marketlink_user'));
      const hasToken = Boolean(localStorage.getItem('marketlink_access_token'));
      return !(hasCachedUser && hasToken);
    } catch {
      return true;
    }
  });

  // Normalize role
  const role = useMemo(() => {
    if (!user) return 'guest';
    const r = user.role || 'guest';
    return r === 'buyer' ? 'customer' : r === 'vendor' ? 'farmer' : r;
  }, [user]);

  const isAuthenticated = Boolean(user && user.id && role !== 'guest');

  // Silent session restore on app load (capped at 4000ms)
  useEffect(() => {
    let cancelled = false;
    const timeoutTimer = setTimeout(() => {
      if (!cancelled) {
        setIsCheckingSession(false);
      }
    }, 4000);

    async function checkExistingSession() {
      try {
        const refreshData = await apiRefresh();
        if (cancelled) return;

        if (refreshData?.accessToken) {
          setAccessToken(refreshData.accessToken);
          if (refreshData.user) {
            updateUser(refreshData.user);
          } else {
            const me = await getMe();
            if (!cancelled && me) {
              updateUser(me);
            }
          }
        } else if (refreshData?.error === 'UNAUTHENTICATED') {
          // Explicit server rejection (cookie missing or invalid)
          clearAccessToken();
          updateUser(null);
        }
        // If network error (e.g. backend server restarting), preserve existing cached session
      } catch (err) {
        if (err?.status === 401 || err?.code === 'UNAUTHENTICATED') {
          clearAccessToken();
          updateUser(null);
        }
      } finally {
        if (!cancelled) {
          clearTimeout(timeoutTimer);
          setIsCheckingSession(false);
        }
      }
    }

    checkExistingSession();

    // Cross-tab signout listener
    const handleStorageChange = (e) => {
      if (e.key === 'marketlink_signed_out') {
        clearAccessToken();
        updateUser(null);
        invalidateQueries();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      cancelled = true;
      clearTimeout(timeoutTimer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [updateUser]);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin({ email, password });
    if (data?.user) {
      updateUser(data.user);
    }
    return data;
  }, [updateUser]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore logout errors
    } finally {
      updateUser(null);
      clearAccessToken();
      invalidateQueries();
      try {
        localStorage.removeItem('marketlink_user');
        localStorage.setItem('marketlink_signed_out', Date.now().toString());
      } catch {
        // ignore storage errors
      }
    }
  }, [updateUser]);

  const registerCustomer = useCallback(async (payload) => {
    const data = await apiRegisterCustomer(payload);
    if (data?.user) {
      updateUser(data.user);
    }
    return data;
  }, [updateUser]);

  const registerFarmer = useCallback(async (payload) => {
    const data = await apiRegisterFarmer(payload);
    if (data?.user) {
      updateUser(data.user);
    }
    return data;
  }, [updateUser]);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      if (me) {
        updateUser(me);
      }
      return me;
    } catch {
      return null;
    }
  }, [updateUser]);

  // Fetch active markets to ensure selected market is always valid
  const { data: marketsData } = useQuery(['markets'], ({ signal }) =>
    getMarkets({}, signal)
  );

  const markets = useMemo(() => {
    return Array.isArray(marketsData) ? marketsData : marketsData?.data || [];
  }, [marketsData]);

  const [guestMarketId, setGuestMarketId] = useState(() => {
    try {
      const saved = localStorage.getItem('marketlink_selected_market');
      // Only keep saved value if it is a valid 24-character hexadecimal MongoDB ObjectId
      if (saved && /^[0-9a-fA-F]{24}$/.test(saved)) {
        return saved;
      }
      return '';
    } catch {
      return '';
    }
  });

  const rawSelectedId = user?.homeMarketId || user?.homeMarket?.id || guestMarketId;

  // Resolve valid active market ID:
  // If rawSelectedId matches an active market in markets, keep it.
  // If markets are loaded and rawSelectedId is not in markets (or is invalid/deleted/stale),
  // fallback automatically to the first active market (e.g. Elm Street Market).
  const selectedMarketId = useMemo(() => {
    if (!markets || markets.length === 0) {
      return /^[0-9a-fA-F]{24}$/.test(rawSelectedId) ? rawSelectedId : '';
    }
    const match = markets.find((m) => (m.id || m._id) === rawSelectedId);
    if (match) {
      return match.id || match._id;
    }
    return markets[0]?.id || markets[0]?._id || '';
  }, [markets, rawSelectedId]);

  // Auto-heal localStorage and user homeMarket when stale/invalid market is detected
  useEffect(() => {
    if (!markets || markets.length === 0 || !selectedMarketId) return;

    if (rawSelectedId !== selectedMarketId) {
      setGuestMarketId(selectedMarketId);
      try {
        localStorage.setItem('marketlink_selected_market', selectedMarketId);
      } catch {
        // ignore
      }

      if (isAuthenticated) {
        setHomeMarket(selectedMarketId).catch(() => {});
        setUser((prev) => (prev ? { ...prev, homeMarketId: selectedMarketId } : prev));
      }

      invalidateQueries('buyer-stalls');
      invalidateQueries('market-detail');
      invalidateQueries('market-farmers');
      invalidateQueries('feed');
      invalidateQueries('home-summary');
      invalidateQueries('buyer-products');
    }
  }, [markets, rawSelectedId, selectedMarketId, isAuthenticated]);

  const switchMarket = useCallback(async (marketId) => {
    if (!marketId) return;
    setGuestMarketId(marketId);
    try {
      localStorage.setItem('marketlink_selected_market', marketId);
    } catch {
      // ignore
    }

    if (isAuthenticated) {
      try {
        await setHomeMarket(marketId);
        setUser((prev) => (prev ? { ...prev, homeMarketId: marketId } : prev));
      } catch (err) {
        console.warn('Could not sync home market to user profile:', err);
      }
    }

    invalidateQueries('feed');
    invalidateQueries('markets');
    invalidateQueries('buyer-markets');
    invalidateQueries('buyer-stalls');
    invalidateQueries('market-detail');
    invalidateQueries('market-farmers');
    invalidateQueries('home-summary');
    invalidateQueries('feed-meta');
    invalidateQueries('buyer-products');

    window.dispatchEvent(new CustomEvent('marketlink:refresh-feed'));
    window.dispatchEvent(new CustomEvent('marketlink:market-changed', { detail: { marketId } }));
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      user,
      role,
      isAuthenticated,
      isCheckingSession,
      selectedMarketId,
      switchMarket,
      login,
      logout,
      registerCustomer,
      registerFarmer,
      refreshUser,
      homePathFor,
    }),
    [user, role, isAuthenticated, isCheckingSession, selectedMarketId, switchMarket, login, logout, registerCustomer, registerFarmer, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {isCheckingSession ? (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-white)',
            fontFamily: 'var(--font-head)',
            color: 'var(--color-beet)',
            gap: 'var(--space-3)',
          }}
          aria-live="polite"
          aria-busy="true"
        >
          <div style={{ fontSize: 'var(--text-h3)', letterSpacing: '-0.02em' }}>
            MarketLink
          </div>
          <div
            style={{
              width: '28px',
              height: '28px',
              border: '2px solid var(--color-wood-line)',
              borderTopColor: 'var(--color-beet)',
              borderRadius: 'var(--radius-full)',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
