import React, { createContext, useContext, useState } from 'react';

/**
 * Authentication & role context
 * Roles: 'guest' | 'buyer' | 'vendor' | 'admin'
 * login() accepts a full user object with name, firstName, email, phone, address, homeMarketId.
 * TEMP: replace with real auth when backend is ready.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => {
    try {
      return localStorage.getItem('marketlink_role') || 'guest';
    } catch {
      return 'guest';
    }
  });
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('marketlink_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    let nextRole = 'guest';
    let nextUser = null;

    if (typeof userData === 'string') {
      nextRole = userData;
      nextUser = {
        id: 'demo-user',
        name: userData === 'buyer' ? 'Customer Demo' : userData === 'vendor' ? 'Farmer Demo' : 'Admin Demo',
        firstName: userData === 'buyer' ? 'Customer' : userData === 'vendor' ? 'Farmer' : 'Admin',
        role: userData,
      };
    } else {
      nextRole = userData.role;
      nextUser = userData;
    }

    setRole(nextRole);
    setUser(nextUser);
    try {
      localStorage.setItem('marketlink_role', nextRole);
      localStorage.setItem('marketlink_user', JSON.stringify(nextUser));
    } catch {
      // ignore storage errors
    }
  };

  const logout = () => {
    setRole('guest');
    setUser(null);
    try {
      localStorage.removeItem('marketlink_role');
      localStorage.removeItem('marketlink_user');
    } catch {
      // ignore storage errors
    }
  };

  const isAuthenticated = role !== 'guest' && user !== null;

  return (
    <AuthContext.Provider value={{ role, user, login, logout, isAuthenticated }}>
      {children}
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
