import React, { useState } from 'react';
import { Check, MapPin, Store } from 'lucide-react';
import { markets } from '@/data/placeholders';
import { useAuth } from '@/context/AuthContext';
import styles from './SavedMarkets.module.css';

/**
 * Saved Markets sheet for Customer profile.
 */
export function SavedMarkets({ inSheet = true, onClose }) {
  const { user } = useAuth();
  const [currentMarketId, setCurrentMarketId] = useState(user?.homeMarketId || 'market-elm');

  const handleSelect = (marketId) => {
    setCurrentMarketId(marketId);
    if (user) {
      user.homeMarketId = marketId;
    }
  };

  return (
    <div className={styles.container}>
      <p className={styles.intro}>
        Choose your primary market. Your home feed and available Saturday pre-orders will reflect the stalls attending this location.
      </p>

      <div className={styles.list}>
        {markets.map((market) => {
          const isSelected = market.id === currentMarketId;
          return (
            <div
              key={market.id}
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
                  {market.distance && (
                    <>
                      <span className={styles.dot}>·</span>
                      <span>{market.distance}</span>
                    </>
                  )}
                </div>
                <span className={styles.schedule}>
                  {market.days?.join(', ')} · {market.hours || '8 am – 1 pm'}
                </span>
              </div>

              <button
                type="button"
                className={`${styles.selectButton} ${isSelected ? styles.selectedButton : ''}`}
                onClick={() => handleSelect(market.id)}
                disabled={isSelected}
                aria-label={`Select ${market.name} as primary market`}
              >
                {isSelected ? (
                  <Check size={18} aria-hidden="true" />
                ) : (
                  <span>Select</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SavedMarkets;
