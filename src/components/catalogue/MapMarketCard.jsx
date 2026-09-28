import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Store, Clock, ArrowRight, X, Compass } from 'lucide-react';
import DayDots from '@/components/domain/DayDots';
import { useCatalogueRoutes } from '@/components/catalogue/routes';
import styles from './MapMarketCard.module.css';

function getMarketImage(market) {
  if (market?.imageUrl) return market.imageUrl;
  if (market?.image) return market.image;
  const name = (market?.name || '').toLowerCase();
  const slug = (market?.slug || '').toLowerCase();
  if (name.includes('elm') || slug.includes('elm')) return '/images/market-morning.jpg';
  if (name.includes('grove') || slug.includes('grove')) return '/images/market-riverside.jpg';
  if (name.includes('hilltop') || slug.includes('hilltop')) return '/images/market-greenwich.jpg';
  if (name.includes('riverside') || slug.includes('riverside')) return '/images/market-riverside.jpg';
  if (name.includes('central') || slug.includes('central')) return '/images/market-central.jpg';
  if (name.includes('chelsea') || slug.includes('chelsea')) return '/images/market-chelsea.jpg';
  if (name.includes('union') || slug.includes('union')) return '/images/market-unionsquare.jpg';
  return '/images/market-central.jpg';
}

/**
 * Interactive floating card rendered directly on the map viewport.
 * Shows market details and allows one-click exploration.
 */
export function MapMarketCard({
  market,
  audience = 'guest',
  onClose,
  className = '',
}) {
  const routes = useCatalogueRoutes(audience);
  const navigate = useNavigate();

  if (!market) return null;

  const marketId = market.id || market._id;
  const clock = market.clock;
  const isOpen = Boolean(clock?.openNow);

  const city =
    market.city ||
    (market.address && market.address.includes(',')
      ? market.address.split(',')[1]?.trim()
      : market.address) ||
    '';

  const farmerCount = market.farmerCount ?? market.stallCount ?? market.attendingCount ?? null;
  const stallCountText =
    farmerCount != null
      ? `${farmerCount} ${farmerCount === 1 ? 'stall' : 'stalls'}`
      : null;

  const days =
    market.operatingDayNumbers ||
    (Array.isArray(market.schedule) ? market.schedule.map((s) => s.day) : []);

  const marketUrl = routes.market(marketId);
  const imageSrc = getMarketImage(market);

  const handleCardClick = (e) => {
    // If clicking a button or link inside, let it handle its own event
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    navigate(marketUrl);
  };

  return (
    <div
      className={`${styles.overlayCard} ${className}`}
      onClick={handleCardClick}
      role="region"
      aria-label={`Selected market: ${market.name}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(marketUrl);
      }}
    >
      {/* Banner Image with Status & Dismiss Button */}
      <div className={styles.imageWrap}>
        <img
          src={imageSrc}
          alt={market.name}
          className={styles.bannerImg}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className={styles.imageGradient} />

        {/* Live Status Badge */}
        <div className={styles.statusBadgeWrap}>
          {isOpen ? (
            <span className={styles.statusPillOpen}>
              <span className={styles.pulseDot} aria-hidden="true" />
              <span>Open now</span>
            </span>
          ) : (
            <span className={styles.statusPillClosed}>
              <Clock size={11} aria-hidden="true" />
              <span>
                {clock?.nextOpenLabel || clock?.windowLabel || 'Upcoming'}
              </span>
            </span>
          )}
        </div>

        {/* Dismiss / Close Button */}
        {onClose && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close market preview card"
            title="Close"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Card Content Body */}
      <div className={styles.cardBody}>
        <div className={styles.headerInfo}>
          <h3 className={styles.marketTitle}>{market.name}</h3>
        </div>

        {/* Chips row: Address / City & Stall Count */}
        <div className={styles.metaRow}>
          {market.address ? (
            <div className={styles.metaChip} title={market.address}>
              <MapPin size={12} className={styles.metaIcon} aria-hidden="true" />
              <span className={styles.chipText}>{market.address}</span>
            </div>
          ) : city ? (
            <div className={styles.metaChip}>
              <MapPin size={12} className={styles.metaIcon} aria-hidden="true" />
              <span className={styles.chipText}>{city}</span>
            </div>
          ) : null}

          {stallCountText && (
            <div className={styles.metaChip}>
              <Store size={12} className={styles.metaIcon} aria-hidden="true" />
              <span className={styles.chipText}>{stallCountText}</span>
            </div>
          )}
        </div>

        {/* Operating days */}
        {days.length > 0 && (
          <div className={styles.scheduleRow}>
            <span className={styles.scheduleLabel}>Market days:</span>
            <DayDots days={days} size="sm" />
          </div>
        )}

        {/* Note if present */}
        {market.note && (
          <p className={styles.marketNote}>{market.note}</p>
        )}

        {/* Action Button */}
        <div className={styles.actionRow}>
          <Link
            to={marketUrl}
            className={styles.exploreBtn}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Explore ${market.name}`}
          >
            <span>Explore market</span>
            <ArrowRight size={15} className={styles.btnArrow} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MapMarketCard;
