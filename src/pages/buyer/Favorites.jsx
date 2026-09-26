import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { X, Heart, MapPin, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { getFavoritesList, addFavorite, removeFavorite, getSavedMarkets, saveMarket, unsaveMarket, setHomeMarket } from '@/api/me';
import { byOpenThenScarcity } from '@/utils/sortStalls';
import ProductCard from '@/components/domain/ProductCard';
import FarmerCard from '@/components/domain/FarmerCard';
import DayDots from '@/components/domain/DayDots';
import MarketClock from '@/components/layout/MarketClock';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import Tabs from '@/components/ui/Tabs';
import EmptyState from '@/components/ui/EmptyState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Favorites.module.css';

export function Favorites() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'produce';
  const { user, refreshUser } = useAuth();
  const { productIds, farmerIds, toggleProduct, toggleFarmer } = useFavorites();
  const { showToast } = useToast();

  useDocumentTitle('Saved · MarketLink');

  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifiedProductIds, setNotifiedProductIds] = useState(new Set());

  // Fetch produce and farmer favorites
  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      getFavoritesList('product').catch(() => []),
      getFavoritesList('farmer').catch(() => []),
      getSavedMarkets().catch(() => []),
    ]).then(([prodRes, farmerRes, marketRes]) => {
      if (!active) return;
      setProducts(Array.isArray(prodRes) ? prodRes : prodRes?.items || []);
      setFarmers(Array.isArray(farmerRes) ? farmerRes : farmerRes?.items || []);
      setMarkets(Array.isArray(marketRes) ? marketRes : marketRes?.items || marketRes?.data || []);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // Optimistic unsave handlers with Undo
  const handleUnsaveProduct = async (productId) => {
    const prev = products;
    const itemToUnsave = products.find((p) => p.id === productId);
    setProducts((list) => list.filter((p) => p.id !== productId));

    try {
      await removeFavorite('product', productId);
      showToast({
        message: 'Removed from saved',
        action: 'Undo',
        onAction: async () => {
          try {
            await addFavorite('product', productId);
            setProducts(prev);
          } catch {
            showToast('Could not restore item.');
          }
        },
      });
    } catch {
      setProducts(prev);
      showToast('Could not remove that. Try again.');
    }
  };

  const handleUnsaveFarmer = async (farmerId) => {
    const prev = farmers;
    setFarmers((list) => list.filter((f) => f.id !== farmerId));

    try {
      await removeFavorite('farmer', farmerId);
      showToast({
        message: 'Removed from saved',
        action: 'Undo',
        onAction: async () => {
          try {
            await addFavorite('farmer', farmerId);
            setFarmers(prev);
          } catch {
            showToast('Could not restore stall.');
          }
        },
      });
    } catch {
      setFarmers(prev);
      showToast('Could not remove that. Try again.');
    }
  };

  const handleUnsaveMarket = async (marketId) => {
    const prev = markets;
    setMarkets((list) => list.filter((m) => (m.id || m._id) !== marketId));

    try {
      await unsaveMarket(marketId);
      showToast({
        message: 'Removed from saved',
        action: 'Undo',
        onAction: async () => {
          try {
            await saveMarket(marketId);
            setMarkets(prev);
          } catch {
            showToast('Could not restore market.');
          }
        },
      });
    } catch {
      setMarkets(prev);
      showToast('Could not remove that. Try again.');
    }
  };

  const handleSetHomeMarket = async (marketId, marketName) => {
    try {
      await setHomeMarket(marketId);
      await refreshUser();
      showToast({ message: `${marketName} set as home market` });
    } catch (err) {
      showToast(err?.message || 'Could not set home market.');
    }
  };

  const handleRestockAlert = (productId, productName) => {
    setNotifiedProductIds((prev) => new Set(prev).add(productId));
    showToast(`We will let you know when ${productName} is back in stock.`);
  };

  // Sort stalls by open then scarcity
  const sortedStalls = useMemo(() => {
    return [...farmers].sort(byOpenThenScarcity);
  }, [farmers]);

  const homeMarketId = user?.homeMarketId || user?.homeMarket?._id || user?.homeMarket?.id;

  const tabOptions = [
    { id: 'produce', label: 'Produce', count: products.length },
    { id: 'stalls', label: 'Stalls', count: sortedStalls.length },
    { id: 'markets', label: 'Markets', count: markets.length },
  ];

  return (
    <Page>
      <PageTitle
        title="Saved"
        context={`${products.length} produce · ${sortedStalls.length} stalls · ${markets.length} markets`}
      />

      <div className={styles.tabsRow}>
        <Tabs tabs={tabOptions} active={currentTab} onChange={handleTabChange} />
      </div>

      <div className={styles.content}>
        {/* Tab 1: Produce */}
        {currentTab === 'produce' && (
          <>
            {products.length > 0 ? (
              <div className={styles.produceGrid}>
                {products.map((product) => {
                  const isSoldOut = product.availability === 'out' || product.stock === 'out';
                  const isAlertSet = notifiedProductIds.has(product.id);

                  return (
                    <div key={product.id} className={styles.savedItemWrap}>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => handleUnsaveProduct(product.id)}
                        aria-label={`Remove ${product.name} from saved`}
                      >
                        <X size={16} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <ProductCard product={product} variant="grid" />
                      {isSoldOut && (
                        <button
                          type="button"
                          className={styles.restockBtn}
                          onClick={() => handleRestockAlert(product.id, product.name)}
                          disabled={isAlertSet}
                        >
                          {isAlertSet ? 'We will let you know' : 'Tell me when this is back'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : !loading ? (
              <EmptyState
                scene="nothing-saved"
                title="Nothing saved yet"
                text="Tap the heart on produce to keep them here."
                actionLabel="Browse produce"
                actionTo="/buyer/products"
              />
            ) : null}
          </>
        )}

        {/* Tab 2: Stalls */}
        {currentTab === 'stalls' && (
          <>
            {sortedStalls.length > 0 ? (
              <div className={styles.stallsGrid}>
                {sortedStalls.map((farmer) => (
                  <div key={farmer.id} className={styles.stallCardWrap}>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => handleUnsaveFarmer(farmer.id)}
                      aria-label={`Remove ${farmer.stallName} from saved`}
                    >
                      <X size={16} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                    <FarmerCard farmer={farmer} variant="stall" />
                    <div className={styles.dayDotsWrap}>
                      <DayDots days={farmer.operatingDays || farmer.operatingDayNumbers} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !loading ? (
              <EmptyState
                scene="nothing-saved"
                title="Nothing saved yet"
                text="Tap the heart on stalls to keep them here."
                actionLabel="Browse stalls"
                actionTo="/buyer/stalls"
              />
            ) : null}
          </>
        )}

        {/* Tab 3: Markets */}
        {currentTab === 'markets' && (
          <>
            {markets.length > 0 ? (
              <div className={styles.marketsList}>
                {markets.map((market) => {
                  const mId = market.id || market._id;
                  const isHome = mId === homeMarketId;

                  return (
                    <div key={mId} className={styles.marketRow}>
                      <div className={styles.marketMain}>
                        <div className={styles.marketHeader}>
                          <Link to={`/buyer/markets/${mId}`} className={styles.marketName}>
                            {market.name}
                          </Link>
                          {isHome && <span className={styles.homeBadge}>Home market</span>}
                        </div>
                        <MarketClock
                          marketName={market.name}
                          openNow={market.openNow}
                          windowLabel={market.windowLabel || market.hours || 'Saturday 8:00–13:00'}
                          nextOpenLabel={market.nextOpenLabel}
                          closesAtLabel={market.closesAtLabel || '13:00'}
                          progress={market.progress || 0}
                        />
                        <div className={styles.marketMeta}>
                          {market.address && <span>{market.address}</span>}
                          <DayDots days={market.operatingDays || [6]} size="sm" />
                        </div>
                      </div>

                      <div className={styles.marketActions}>
                        {!isHome && (
                          <button
                            type="button"
                            className={styles.setHomeBtn}
                            onClick={() => handleSetHomeMarket(mId, market.name)}
                          >
                            Set as home market
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.unsaveTextBtn}
                          onClick={() => handleUnsaveMarket(mId)}
                          aria-label={`Remove ${market.name} from saved`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !loading ? (
              <EmptyState
                scene="nothing-saved"
                title="Nothing saved yet"
                text="Save preferred market locations for quick access."
                actionLabel="Explore markets"
                actionTo="/buyer/markets"
              />
            ) : null}
          </>
        )}
      </div>
    </Page>
  );
}

export default Favorites;
