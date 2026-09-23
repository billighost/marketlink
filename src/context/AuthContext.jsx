import React, { createContext, useContext, useState } from 'react';

/**
 * Authentication & role context stub
 * Roles: 'guest' | 'buyer' | 'vendor' | 'admin'
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState('guest');
  const [user, setUser] = useState(null);

  const login = (newRole) => {
    setRole(newRole);
    setUser({
      id: 'demo-user',
      name: newRole === 'buyer' ? 'Customer Demo' : newRole === 'vendor' ? 'Farmer Demo' : 'Admin Demo',
      role: newRole,
    });
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
