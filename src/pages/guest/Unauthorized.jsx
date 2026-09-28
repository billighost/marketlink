import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, homePathFor } from '@/context/AuthContext';

export function Unauthorized() {
  const { role } = useAuth();
  const dashboardPath = homePathFor(role) || '/';
  return <Navigate to={dashboardPath} replace />;
}

export default Unauthorized;
