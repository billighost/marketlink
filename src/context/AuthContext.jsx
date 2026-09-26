import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { login as apiLogin, logout as apiLogout, refresh as apiRefresh, getMe, registerCustomer as apiRegisterCustomer, registerFarmer as apiRegisterFarmer } from '@/api/auth';
import { setHomeMarket } from '@/api/me';
import { setAccessToken, clearAccessToken } from '@/api/client';
import { invalidateQueries } from '@/hooks/useQuery';

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
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

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
            setUser(refreshData.user);
          } else {
            const me = await getMe();
            if (!cancelled && me) {
              setUser(me);
            }
          }
        }
      } catch {
        // Not authenticated, user remains guest
        clearAccessToken();
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
        setUser(null);
        invalidateQueries();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      cancelled = true;
      clearTimeout(timeoutTimer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await apiLogin({ email, password });
    if (data?.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore logout errors
    } finally {
      setUser(null);
      clearAccessToken();
      invalidateQueries();
      try {
        localStorage.setItem('marketlink_signed_out', Date.now().toString());
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  const registerCustomer = useCallback(async (payload) => {
    const data = await apiRegisterCustomer(payload);
    if (data?.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  const registerFarmer = useCallback(async (payload) => {
    const data = await apiRegisterFarmer(payload);
    if (data?.user) {
      setUser(data.user);
    }
    return data;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      if (me) {
        setUser(me);
      }
      return me;
    } catch {
      return null;
    }
  }, []);

  const [guestMarketId, setGuestMarketId] = useState(() => {
    try {
      return localStorage.getItem('marketlink_selected_market') || 'market-elm';
    } catch {
      return 'market-elm';
    }
  });

  const selectedMarketId = user?.homeMarketId || user?.homeMarket?.id || guestMarketId;

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
