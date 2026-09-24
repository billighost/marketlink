import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Info, Check, ArrowLeft } from 'lucide-react';
import { getMarket, farmers, products } from '@/data/placeholders';
import { useAuth } from '@/context/AuthContext';
import MapPlaceholder from '@/components/domain/MapPlaceholder';
import FarmerCard from '@/components/domain/FarmerCard';
import ProductCard from '@/components/domain/ProductCard';
import HorizontalRow from '@/components/layout/HorizontalRow';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import styles from './MarketDetail.module.css';

/**
 * Market detail sheet view.
 */
export function MarketDetail({ inSheet = true, onClose }) {
  const { id } = useParams();
  const { user } = useAuth();

  const market = getMarket(id);

  if (!market) {
    return (
      <div className={styles.notFound}>
        <h2>Market not found</h2>
        <button type="button" className={styles.backLink} onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  const isCurrentMarket = user?.homeMarketId === market.id || (!user?.homeMarketId && market.id === 'market-elm');

  const marketFarmers = farmers.filter((f) => f.marketIds?.includes(market.id));
  const marketFarmerIds = new Set(marketFarmers.map((f) => f.id));
  const marketProducts = products.filter((p) => marketFarmerIds.has(p.farmerId)).slice(0, 8);

  const handleSetHomeMarket = () => {
    if (user) {
      user.homeMarketId = market.id;
    }
    onClose?.();
  };

  return (
    <div className={`${styles.container} ${!inSheet ? styles.standalone : ''}`}>
      {!inSheet && (
        <div className={styles.fallbackHeader}>
          <Link to="/buyer/markets" className={styles.backButton}>
            <ArrowLeft size={20} aria-hidden="true" />
            <span>Back to markets</span>
          </Link>
        </div>
      )}

      {/* Header Info */}
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{market.name}</h1>
          {isCurrentMarket && (
            <Badge variant="success" size="sm">Your market</Badge>
          )}
        </div>
        <div className={styles.locationRow}>
          <MapPin size={16} className={styles.icon} aria-hidden="true" />
          <span>{market.address}</span>
          {market.distance && (
            <>
              <span className={styles.dot} aria-hidden="true">·</span>
              <span>{market.distance}</span>
            </>
          )}
        </div>
      </header>

      {/* Map visual */}
      <div className={styles.mapWrap}>
        <MapPlaceholder address={market.address} height="200px" />
      </div>

      {/* Schedule and amenities */}
      <section className={styles.detailsCard}>
        <div className={styles.detailRow}>
          <Clock size={18} className={styles.icon} aria-hidden="true" />
          <div className={styles.detailContent}>
            <span className={styles.detailLabel}>Market schedule</span>
            <span className={styles.detailValue}>
              {market.days?.join(', ')} · {market.hours || '8:00 am – 1:00 pm'}
            </span>
          </div>
        </div>

        {market.note && (
          <div className={styles.detailRow}>
            <Info size={18} className={styles.icon} aria-hidden="true" />
            <div className={styles.detailContent}>
              <span className={styles.detailLabel}>Amenities & notes</span>
              <span className={styles.detailText}>{market.note}</span>
            </div>
          </div>
        )}
      </section>

      {/* Farmers at this market */}
      {marketFarmers.length > 0 && (
        <div className={styles.rowSection}>
          <HorizontalRow
            title={`Farmers at this market (${marketFarmers.length})`}
            subtitle="Local growers and producers attending weekly"
          >
            {marketFarmers.map((f) => (
              <FarmerCard key={f.id} farmer={f} variant="row" />
            ))}
          </HorizontalRow>
        </div>
      )}

      {/* Products fresh at this market */}
      {marketProducts.length > 0 && (
        <div className={styles.rowSection}>
          <HorizontalRow
            title="Fresh harvests at this market"
            subtitle="Available for Saturday pre-order"
          >
            {marketProducts.map((p) => (
              <ProductCard key={p.id} product={p} variant="compact" />
            ))}
          </HorizontalRow>
        </div>
      )}

      {/* Sticky footer action */}
      <footer className={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          className={styles.fullWidthButton}
          onClick={handleSetHomeMarket}
          disabled={isCurrentMarket}
        >
          {isCurrentMarket ? (
            <>
              <Check size={18} aria-hidden="true" />
              <span>Current market</span>
            </>
          ) : (
            <span>Set as my home market</span>
          )}
        </Button>
      </footer>
    </div>
  );
}

export default MarketDetail;
