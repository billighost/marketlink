import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Store, Clock, ArrowRight, Compass } from 'lucide-react';
import DayDots from '@/components/domain/DayDots';
import { useCatalogueRoutes } from '@/components/catalogue/routes';
import styles from './MarketCard.module.css';

/**
 * Premium MarketCard component.
 * Features:
 *  - Prominent market typography
 *  - Real-time animated status pill (Open now vs next opening time)
 *  - Artisanal meta chips (location, distance, stall count)
 *  - DayDots schedule with clear labels
 *  - Interactive hover states and directional CTA
 *
 * @param {object}   market
 * @param {Function} onSelect
 * @param {boolean}  isSelected
 * @param {string}   className
 * @param {'guest'|'buyer'} audience
 * @param {'list'|'map'} variant
 */
export function MarketCard({
  market,
  onSelect,
  isSelected = false,
  className = '',
  audience = 'buyer',
  variant = 'list',
}) {
  const routes = useCatalogueRoutes(audience);
  const navigate = useNavigate();

  if (!market) return null;

  const marketId = market.id || market._id;
  const clock = market.clock;
  const isOpen = Boolean(clock?.openNow);

  // Derive city from city property or address
  const city =
    market.city ||
    (market.address && market.address.includes(',')
      ? market.address.split(',')[1]?.trim()
      : market.address) ||
    '';

  const distance =
    market.distance ||
    (typeof market.distanceKm === 'number'
      ? `${market.distanceKm.toFixed(1)} km away`
      : null);

  const farmerCount = market.farmerCount ?? market.stallCount ?? market.attendingCount ?? null;
  const stallCountText =
    farmerCount != null
      ? `${farmerCount} ${farmerCount === 1 ? 'stall' : 'stalls'}`
      : null;

  const days =
    market.operatingDayNumbers ||
    (Array.isArray(market.schedule) ? market.schedule.map((s) => s.day) : []);

  const handleClick = () => {
    if (onSelect) {
      onSelect(market);
    } else if (variant === 'list') {
      navigate(routes.market(marketId));
    }
  };

  return (
    <article
      className={`${styles.card} ${isSelected ? styles.selectedCard : ''} ${className}`}
      aria-label={`${market.name}${city ? `, ${city}` : ''}`}
      onClick={handleClick}
    >
      {variant === 'list' && (
        <Link
          to={routes.market(marketId)}
          className={styles.stretchedLink}
          tabIndex={0}
          aria-label={`View ${market.name}`}
        />
      )}

      {/* Top row: Name & Live Status Badge */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h3 className={styles.name}>{market.name}</h3>
        </div>

        {/* Status Pill Badge */}
        {isOpen ? (
          <span className={styles.statusPillOpen} aria-label="Open now">
            <span className={styles.pulseDot} aria-hidden="true" />
            <span className={styles.statusText}>Open now</span>
            {clock?.closesAtLabel && (
              <span className={styles.statusSub}>· till {clock.closesAtLabel}</span>
            )}
          </span>
        ) : (
          <span className={styles.statusPillClosed}>
            <Clock size={12} className={styles.clockIcon} aria-hidden="true" />
            <span className={styles.statusText}>
              {clock?.nextOpenLabel || clock?.windowLabel || 'Check schedule'}
            </span>
          </span>
        )}
      </div>

      {/* Meta Chips: City, Distance, Stall Count */}
      <div className={styles.metaRow}>
        {city && (
          <span className={styles.metaChip}>
            <MapPin size={12} className={styles.metaIcon} aria-hidden="true" />
            <span>{city}</span>
          </span>
        )}

        {stallCountText && (
          <span className={styles.metaChip}>
            <Store size={12} className={styles.metaIcon} aria-hidden="true" />
            <span>{stallCountText}</span>
          </span>
        )}

        {distance && (
          <span className={styles.metaChip}>
            <Compass size={12} className={styles.metaIcon} aria-hidden="true" />
            <span>{distance}</span>
          </span>
        )}
      </div>

      {/* Bottom Bar: Day Schedule & Interactive CTA */}
      <div className={styles.bottomBar}>
        <div className={styles.daysArea}>
          <DayDots days={days} size="sm" />
        </div>

        {variant === 'map' ? (
          <Link
            to={routes.market(marketId)}
            className={styles.goToMarketBtn}
            onClick={(e) => e.stopPropagation()}
          >
            <span>Go to market</span>
            <ArrowRight size={14} className={styles.btnArrow} aria-hidden="true" />
          </Link>
        ) : (
          <div className={styles.listCardAction}>
            <span>Explore stalls</span>
            <ArrowRight size={14} className={styles.btnArrow} aria-hidden="true" />
          </div>
        )}
      </div>
    </article>
  );
}

export default MarketCard;
