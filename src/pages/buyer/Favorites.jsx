import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/context/FavoritesContext';
import { getProduct, getFarmer } from '@/data/placeholders';
import ProductCard from '@/components/domain/ProductCard';
import FarmerCard from '@/components/domain/FarmerCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import styles from './Favorites.module.css';

/**
 * Customer Favorites page with Products and Farmers tabs.
 */
export function Favorites() {
  const [tab, setTab] = useState('products');
  const { productIds, farmerIds } = useFavorites();
  const navigate = useNavigate();

  const favoriteProducts = productIds.map((id) => getProduct(id)).filter(Boolean);
  const favoriteFarmers = farmerIds.map((id) => getFarmer(id)).filter(Boolean);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Favorites</h1>
        <SegmentedControl
          name="favorites-tab"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'products', label: `Products (${favoriteProducts.length})` },
            { value: 'farmers', label: `Farmers (${favoriteFarmers.length})` },
          ]}
        />
      </header>

      {/* Products Tab View */}
      {tab === 'products' && (
        <div className={styles.content}>
          {favoriteProducts.length > 0 ? (
            <div className={styles.productGrid}>
              {favoriteProducts.map((product) => (
                <ProductCard key={product.id} product={product} variant="grid" />
              ))}
            </div>
          ) : (
            <EmptyState
              illustration="basket"
              title="No favorite products yet"
              text="Tap the heart icon on any harvest or baked good to save it here for fast re-ordering."
              actionLabel="Explore fresh market items"
              onAction={() => navigate('/buyer/products')}
            />
          )}
        </div>
      )}

      {/* Farmers Tab View */}
      {tab === 'farmers' && (
        <div className={styles.content}>
          {favoriteFarmers.length > 0 ? (
            <div className={styles.farmersList}>
              {favoriteFarmers.map((farmer) => (
                <FarmerCard key={farmer.id} farmer={farmer} variant="list" />
              ))}
            </div>
          ) : (
            <EmptyState
              illustration="closed-stall"
              title="No favorite farmers yet"
              text="Follow your favourite stalls to stay up to date with seasonal harvests and weekly offerings."
              actionLabel="View all farmers"
              onAction={() => navigate('/buyer/farmers')}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Favorites;
