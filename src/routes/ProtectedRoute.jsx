import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PATHS } from './paths';

/**
 * Route guard that checks if the user is authenticated and has the required role.
 * Waits for silent session refresh before redirecting.
 */
export function ProtectedRoute({ allowedRoles = ['customer', 'buyer'], children }) {
  const { isAuthenticated, role, isCheckingSession } = useAuth();
  const location = useLocation();

  if (isCheckingSession) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} state={{ from: location }} replace />;
  }

  // Normalize role check (accept either customer or buyer)
  const userRole = role === 'buyer' ? 'customer' : role;
  const isAllowed = allowedRoles.some((r) => {
    const norm = r === 'buyer' ? 'customer' : r;
    return norm === userRole;
  });

  if (!isAllowed) {
    return <Navigate to={PATHS.UNAUTHORIZED} replace />;
  }

  return children;
}

export default ProtectedRoute;
