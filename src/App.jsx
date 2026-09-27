import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ToastProvider } from '@/context/ToastContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { SmartBasketProvider } from '@/context/SmartBasketContext';
import AppRoutes from '@/routes/AppRoutes';

import ErrorBoundary from '@/components/layout/ErrorBoundary';
import OfflineBanner from '@/components/layout/OfflineBanner';

/**
 * Root App component providing Router, Auth, Cart, Favorites, Toast, Notification, and SmartBasket contexts.
 */
export function App() {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <ToastProvider>
                <NotificationProvider>
                  <SmartBasketProvider>
                    <AppRoutes />
                  </SmartBasketProvider>
                </NotificationProvider>
              </ToastProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
