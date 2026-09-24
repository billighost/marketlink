import React, { createContext, useContext, useState } from 'react';

/**
 * Authentication & role context
 * Roles: 'guest' | 'buyer' | 'vendor' | 'admin'
 * login() accepts a full user object with name, firstName, email, phone, address, homeMarketId.
 * TEMP: replace with real auth when backend is ready.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState('guest');
  const [user, setUser] = useState(null);

  const login = (userData) => {
    // Accept a full user object (from demoUsers) or a role string for backward compat
    if (typeof userData === 'string') {
      // Legacy: called with just a role string (vendor layout uses this)
      setRole(userData);
      setUser({
        id: 'demo-user',
        name: userData === 'buyer' ? 'Customer Demo' : userData === 'vendor' ? 'Farmer Demo' : 'Admin Demo',
        firstName: userData === 'buyer' ? 'Customer' : userData === 'vendor' ? 'Farmer' : 'Admin',
        role: userData,
      });
    } else {
      // New: called with a user object
      setRole(userData.role);
      setUser(userData);
    }
  };

  const logout = () => {
    setRole('guest');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ role, user, login, logout }}>
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
