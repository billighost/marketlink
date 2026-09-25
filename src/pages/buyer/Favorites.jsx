import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/context/FavoritesContext';
import { getFavoritesList } from '@/api/me';
import ProductCard from '@/components/domain/ProductCard';
import FarmerCard from '@/components/domain/FarmerCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import styles from './Favorites.module.css';

/**
 * Customer Favorites page with Products and Farmers tabs.
 * Connected to live backend GET /favorites?type=product|farmer.
 */
export function Favorites() {
  const [tab, setTab] = useState('products');
  const { productIds, farmerIds } = useFavorites();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const type = tab === 'products' ? 'product' : 'farmer';
    getFavoritesList(type)
      .then((data) => {
        if (!active) return;
        if (tab === 'products') {
          setProducts(Array.isArray(data) ? data : data?.items || []);
        } else {
          setFarmers(Array.isArray(data) ? data : data?.items || []);
        }
      })
      .catch(() => {
        if (active) {
          if (tab === 'products') setProducts([]);
          else setFarmers([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [tab, productIds.length, farmerIds.length]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Favorites</h1>
        <SegmentedControl
          name="favorites-tab"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'products', label: `Products (${productIds.length})` },
            { value: 'farmers', label: `Farmers (${farmerIds.length})` },
          ]}
        />
      </header>

      {/* Products Tab View */}
      {tab === 'products' && (
        <div className={styles.content}>
          {loading ? (
            <div className={styles.productGrid}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ height: 180, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className={styles.productGrid}>
              {products.map((product) => (
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
          {loading ? (
            <div className={styles.farmersList}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 100, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          ) : farmers.length > 0 ? (
            <div className={styles.farmersList}>
              {farmers.map((farmer) => (
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
