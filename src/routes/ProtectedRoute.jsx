import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PATHS } from './paths';

/**
 * Route guard that checks if the user is authenticated.
 * All authenticated users can freely access all routes without role blockage.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isCheckingSession } = useAuth();
  const location = useLocation();

  if (isCheckingSession) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
