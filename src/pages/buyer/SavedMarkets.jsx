import React, { useState, useEffect } from 'react';
import { Check, MapPin, Store } from 'lucide-react';
import { getMarkets } from '@/api/catalog';
import { setHomeMarket } from '@/api/me';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import styles from './SavedMarkets.module.css';

/**
 * Saved Markets sheet for Customer profile.
 * Connected to live backend GET /markets and PUT /users/me/home-market/:id.
 */
export function SavedMarkets({ inSheet = true, onClose }) {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [marketList, setMarketList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const currentHomeMarketId = user?.homeMarketId || user?.homeMarket?._id || user?.homeMarket?.id;

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMarkets()
      .then((data) => {
        if (active) {
          setMarketList(Array.isArray(data) ? data : data?.items || []);
        }
      })
      .catch(() => {
        if (active) setMarketList([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSelect = async (marketId, marketName) => {
    setUpdatingId(marketId);
    try {
      await setHomeMarket(marketId);
      await refreshUser();
      showToast({
        message: `${marketName} set as primary market`,
        type: 'success',
      });
    } catch (err) {
      showToast({
        message: err.message || 'Unable to update primary market',
        type: 'danger',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <p className={styles.intro}>
        Choose your primary market. Your home feed and available Saturday pre-orders will reflect the stalls attending this location.
      </p>

      <div className={styles.list}>
        {loading ? (
          <>
            <div style={{ height: 90, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-lg)' }} />
            <div style={{ height: 90, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-lg)' }} />
          </>
        ) : (
          marketList.map((market) => {
            const isSelected = market.id === currentHomeMarketId || market._id === currentHomeMarketId;
            const isUpdating = updatingId === (market.id || market._id);

            return (
              <div
                key={market.id || market._id}
                className={`${styles.marketCard} ${isSelected ? styles.selectedCard : ''}`}
              >
                <div className={styles.iconWrap}>
                  <Store size={22} className={styles.storeIcon} aria-hidden="true" />
                </div>

                <div className={styles.details}>
                  <div className={styles.nameRow}>
                    <h3 className={styles.name}>{market.name}</h3>
                    {isSelected && (
                      <span className={styles.currentBadge}>Primary</span>
                    )}
                  </div>
                  <div className={styles.addressRow}>
                    <MapPin size={14} className={styles.metaIcon} aria-hidden="true" />
                    <span>{market.address}</span>
                  </div>
                  <span className={styles.schedule}>
                    {market.days?.join(', ') || market.day || 'Saturday'} · {market.hours || '8 am – 1 pm'}
                  </span>
                </div>

                <button
                  type="button"
                  className={`${styles.selectButton} ${isSelected ? styles.selectedButton : ''}`}
                  onClick={() => handleSelect(market.id || market._id, market.name)}
                  disabled={isSelected || isUpdating}
                  aria-label={`Select ${market.name} as primary market`}
                >
                  {isSelected ? (
                    <Check size={18} aria-hidden="true" />
                  ) : (
                    <span>{isUpdating ? 'Saving...' : 'Select'}</span>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SavedMarkets;
