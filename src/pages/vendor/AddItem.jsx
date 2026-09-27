import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Convenience redirect for adding a new product.
 * Directs to the Stock catalog with the Add Item modal sheet opened.
 */
export default function AddItem() {
  return <Navigate to="/vendor/stock?action=new" replace />;
}
