import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { getProduct, getFarmer, markets } from '@/data/placeholders';
import ProductCard from '@/components/domain/ProductCard';
import FarmerCard from '@/components/domain/FarmerCard';
import MarketCard from '@/components/domain/MarketCard';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';
import styles from './Favorites.module.css';

/**
 * Customer Favorites page with Products, Farmers, and Saved Markets tabs.
 */
export function Favorites() {
  const [tab, setTab] = useState('products');
  const { productIds, farmerIds, marketIds } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();

  const favoriteProducts = productIds.map((id) => getProduct(id)).filter(Boolean);
  const favoriteFarmers = farmerIds.map((id) => getFarmer(id)).filter(Boolean);
  const savedMarkets = (marketIds || []).map((id) => markets.find((m) => m.id === id)).filter(Boolean);

  const handleSelectMarket = (market) => {
    if (user) {
      user.homeMarketId = market.id;
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Your Favorites</h1>
            <p className={styles.subtitle}>
              Keep track of your favorite harvests, trusted growers, and Saturday market locations.
            </p>
          </div>
        </div>

        <SegmentedControl
          name="favorites-tab"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'products', label: `Products (${favoriteProducts.length})` },
            { value: 'farmers', label: `Farmers (${favoriteFarmers.length})` },
            { value: 'markets', label: `Saved Markets (${savedMarkets.length})` },
          ]}
        />
      </header>

      {/* ── 1. Products Tab View ─────────────────────────────────── */}
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
              actionLabel="Explore Fresh Produce"
              onAction={() => navigate('/buyer/products')}
            />
          )}
        </div>
      )}

      {/* ── 2. Farmers Tab View ──────────────────────────────────── */}
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
              actionLabel="Discover Local Farmers"
              onAction={() => navigate('/buyer/farmers')}
            />
          )}
        </div>
      )}

      {/* ── 3. Saved Markets Tab View ────────────────────────────── */}
      {tab === 'markets' && (
        <div className={styles.content}>
          {savedMarkets.length > 0 ? (
            <div className={styles.marketsList}>
              {savedMarkets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={{
                    ...market,
                    farmerCount: market.farmerIds?.length || 8,
                  }}
                  onSelect={handleSelectMarket}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              illustration="stall"
              title="No saved markets yet"
              text="Select your primary market to customize your pickup schedule and attending stall roster."
              actionLabel="Find Nearby Markets"
              onAction={() => navigate('/buyer/markets')}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Favorites;
