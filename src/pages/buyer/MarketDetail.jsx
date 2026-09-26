import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Info, Check, ArrowLeft, Bookmark, ExternalLink } from 'lucide-react';
import { getMarketDetail, getMarketFarmers, getMarketProducts } from '@/api/catalog';
import { setHomeMarket, saveMarket, unsaveMarket, getSavedMarkets } from '@/api/me';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/context/AuthContext';
import { MapView } from '@/components/domain/MapView';
import FarmerCard from '@/components/domain/FarmerCard';
import ProductCard from '@/components/domain/ProductCard';
import HorizontalRow from '@/components/layout/HorizontalRow';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatMarketSchedule } from '@/utils/format';
import styles from './MarketDetail.module.css';

/**
 * Market detail sheet view.
 * Connected to GET /api/markets/:id, /farmers, and /products with real Leaflet MapView.
 */
export function MarketDetail({ inSheet = true, onClose }) {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const [savingAction, setSavingAction] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const { data: market, loading, error } = useQuery(
    ['market-detail', id],
    ({ signal }) => getMarketDetail(id, signal)
  );

  const { data: farmersData } = useQuery(
    ['market-farmers', id],
    ({ signal }) => getMarketFarmers(id, {}, signal),
    { enabled: Boolean(id) }
  );

  const { data: productsData } = useQuery(
    ['market-products', id],
    ({ signal }) => getMarketProducts(id, {}, signal),
    { enabled: Boolean(id) }
  );

  const { data: savedMarketsData, refetch: refetchSaved } = useQuery(
    ['saved-markets'],
    ({ signal }) => getSavedMarkets(signal)
  );

  const savedIds = new Set((savedMarketsData || []).map((m) => m.id || m._id));
  const isSaved = savedIds.has(id);

  if (loading) {
    return (
      <div className={`${styles.container} ${!inSheet ? styles.standalone : ''}`}>
        <div style={{ padding: 'var(--space-6)' }}>
          <Skeleton height="32px" width="50%" style={{ marginBottom: 'var(--space-2)' }} />
          <Skeleton height="18px" width="40%" style={{ marginBottom: 'var(--space-4)' }} />
          <Skeleton height="200px" borderRadius="var(--radius-lg)" style={{ marginBottom: 'var(--space-4)' }} />
          <Skeleton height="80px" borderRadius="var(--radius-md)" />
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className={styles.notFound}>
        <h2>Market not found</h2>
        <button type="button" className={styles.backLink} onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  const isCurrentMarket =
    user?.homeMarket?.id === market.id || user?.homeMarketId === market.id;

  const attendingFarmers = farmersData?.data || [];
  const marketProducts = productsData?.data || [];

  const handleSetHomeMarket = async () => {
    try {
      await setHomeMarket(market.id);
      refreshUser?.();
      onClose?.();
    } catch (err) {
      console.error('Failed to set home market:', err);
    }
  };

  const handleToggleSave = async () => {
    if (savingAction) return;
    setSavingAction(true);
    try {
      if (isSaved) {
        await unsaveMarket(market.id);
      } else {
        await saveMarket(market.id);
      }
      refetchSaved();
    } catch (err) {
      console.error('Failed to toggle saved market:', err);
    } finally {
      setSavingAction(false);
    }
  };

  const mapMarker = market.location?.lat && market.location?.lng ? [
    {
      id: market.id,
      lat: market.location.lat,
      lng: market.location.lng,
      label: market.name,
    },
  ] : [];

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

      {/* Market Banner Visual */}
      {market.bannerUrl && !bannerError && (
        <div className={styles.bannerWrapper} data-aspect="16/9">
          <img
            src={market.bannerUrl}
            alt={`${market.name} banner`}
            loading="lazy"
            className={styles.bannerImg}
            onError={() => setBannerError(true)}
          />
        </div>
      )}

      {/* Header Info */}
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{market.name}</h1>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            {isCurrentMarket && (
              <Badge variant="success" size="sm">Your market</Badge>
            )}
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleToggleSave}
              disabled={savingAction}
              aria-label={isSaved ? 'Unsave market' : 'Save market'}
            >
              <Bookmark size={18} fill={isSaved ? 'var(--color-beet)' : 'none'} color="var(--color-beet)" />
            </button>
          </div>
        </div>

        <div className={styles.locationRow}>
          <MapPin size={16} className={styles.icon} aria-hidden="true" />
          <span>{market.address}</span>
          {market.distanceKm != null && (
            <>
              <span className={styles.dot} aria-hidden="true">·</span>
              <span>{market.distanceKm.toFixed(1)} km away</span>
            </>
          )}
        </div>
      </header>

      {/* Real Map visual */}
      <div className={styles.mapWrap}>
        <MapView
          markers={mapMarker}
          selectedId={market.id}
          height="200px"
          showDirectionsLink={true}
        />
      </div>

      {/* Schedule and amenities */}
      <section className={styles.detailsCard}>
        <div className={styles.detailRow}>
          <Clock size={16} className={styles.detailIcon} aria-hidden="true" />
          <div className={styles.detailContent}>
            <span className={styles.detailLabel}>Operating Schedule</span>
            <span className={styles.detailValue}>
              {formatMarketSchedule(market)}
            </span>
          </div>
        </div>

        <div className={styles.detailRow}>
          <Info size={16} className={styles.detailIcon} aria-hidden="true" />
          <div className={styles.detailContent}>
            <span className={styles.detailLabel}>Order Pickup Rules</span>
            <span className={styles.detailValue}>
              Order before cutoff to pick up fresh harvest directly from attending stall holders.
            </span>
          </div>
        </div>

        {market.directionsUrls && (
          <div className={styles.directionsGroup}>
            {market.directionsUrls.google && (
              <a
                href={market.directionsUrls.google}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.directionLink}
              >
                <span>Google Maps</span>
                <ExternalLink size={13} />
              </a>
            )}
            {market.directionsUrls.osm && (
              <a
                href={market.directionsUrls.osm}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.directionLink}
              >
                <span>OpenStreetMap</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}
      </section>

      {/* Farmers attending this market */}
      {attendingFarmers.length > 0 && (
        <div className={styles.sectionWrap}>
          <HorizontalRow title="Growers attending this market">
            {attendingFarmers.map((f) => (
              <FarmerCard key={f.id} farmer={f} variant="row" />
            ))}
          </HorizontalRow>
        </div>
      )}

      {/* Products at this market */}
      {marketProducts.length > 0 && (
        <div className={styles.sectionWrap}>
          <HorizontalRow title="Available fresh at this market">
            {marketProducts.map((p) => (
              <ProductCard key={p.id} product={p} variant="compact" />
            ))}
          </HorizontalRow>
        </div>
      )}

      {/* Action to set as home market */}
      {!isCurrentMarket && (
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSetHomeMarket}
          >
            <Check size={18} aria-hidden="true" />
            <span>Set as my market</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export default MarketDetail;
