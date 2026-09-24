import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { favoriteProductIds as initialProductIds, favoriteFarmerIds as initialFarmerIds } from '@/data/placeholders';

/**
 * Favorites context for the Customer app.
 * Tracks saved products and farmers in memory.
 * TEMP: replace with API calls when backend is ready.
 */
const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [productIds, setProductIds] = useState(new Set(initialProductIds));
  const [farmerIds, setFarmerIds] = useState(new Set(initialFarmerIds));

  const toggleProduct = useCallback((id) => {
    setProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleFarmer = useCallback((id) => {
    setFarmerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isProductFavorite = useCallback((id) => productIds.has(id), [productIds]);
  const isFarmerFavorite = useCallback((id) => farmerIds.has(id), [farmerIds]);

  const value = useMemo(
    () => ({
      productIds: [...productIds],
      farmerIds: [...farmerIds],
      toggleProduct,
      toggleFarmer,
      isProductFavorite,
      isFarmerFavorite,
    }),
    [productIds, farmerIds, toggleProduct, toggleFarmer, isProductFavorite, isFarmerFavorite]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

export default FavoritesContext;
