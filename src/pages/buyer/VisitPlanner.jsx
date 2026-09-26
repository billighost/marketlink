import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MapPin, Clock, Calendar, ShoppingBag, Navigation } from 'lucide-react';
import { MapView } from '@/components/domain/MapView';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import styles from './VisitPlanner.module.css';

function formatNaira(cents) {
  return `₦${(cents / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

function getPickupLabel(windows = []) {
  if (windows.length === 0) return 'Check with farmer';
  const first = windows[0];
  if (first.label) return first.label;
  if (first.start && first.end) return `${first.start} – ${first.end}`;
  return 'See stall';
}

/**
 * Market Visit Planner.
 * Receives basket items from SmartBasket or OrderDetail via location.state.
 * Groups by market → farmer → items and shows on the map.
 */
export function VisitPlanner() {
  const navigate = useNavigate();
  const location = useLocation();

  // Basket items passed from Smart Basket or Order Detail
  const items = location.state?.items || [];
  const pickupDate = location.state?.pickupDate || null;

  // Group items: market → farmer → items
  const marketGroups = useMemo(() => {
    const mgMap = new Map();

    for (const item of items) {
      const mKey = item.marketId || 'unknown';
      if (!mgMap.has(mKey)) {
        mgMap.set(mKey, {
          marketId: mKey,
          marketName: item.marketName || 'Unknown market',
          marketAddress: item.marketAddress || '',
          marketLocation: item.marketLocation,
          marketSchedule: item.marketSchedule || [],
          farmers: new Map(),
        });
      }
      const mg = mgMap.get(mKey);
      const fKey = item.farmerId;
      if (!mg.farmers.has(fKey)) {
        mg.farmers.set(fKey, {
          farmerId: fKey,
          farmerName: item.farmerName,
          farmerLocation: item.farmerLocation,
          farmerPickupWindows: item.farmerPickupWindows || [],
          farmerOperatingDays: item.farmerOperatingDays || [],
          farmerRatingAvg: item.farmerRatingAvg || 0,
          items: [],
        });
      }
      mg.farmers.get(fKey).items.push(item);
    }

    return [...mgMap.values()].map((mg) => ({
      ...mg,
      farmers: [...mg.farmers.values()],
    }));
  }, [items]);

  // Build map markers: one per farmer (stall location), fall back to market location
  const mapMarkers = useMemo(() => {
    const markers = [];
    let stopIndex = 1;
    for (const mg of marketGroups) {
      for (const farmer of mg.farmers) {
        const loc = farmer.farmerLocation || mg.marketLocation;
        if (loc?.lat && loc?.lng) {
          markers.push({
            id: farmer.farmerId,
            lat: loc.lat,
            lng: loc.lng,
            label: `Stop ${stopIndex}: ${farmer.farmerName}`,
            subtitle: mg.marketName,
            markerType: 'farmer',
          });
          stopIndex++;
        }
      }
    }
    return markers;
  }, [marketGroups]);

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <h1 className={styles.headerTitle}>Market Visit Planner</h1>
        </header>
        <div className={styles.body}>
          <EmptyState
            title="No basket items"
            text="Build a Smart Basket first, then plan your market visit."
            actionLabel="Build basket"
            onAction={() => navigate('/buyer/smart-basket')}
          />
        </div>
      </div>
    );
  }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalCents = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div className={styles.headerCenter}>
          <h1 className={styles.headerTitle}>Market Visit Planner</h1>
          {pickupDate && (
            <p className={styles.headerDate}>
              <Calendar size={13} aria-hidden="true" />
              {new Date(pickupDate).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          )}
        </div>
      </header>

      <div className={styles.body}>
        {/* Summary bar */}
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <ShoppingBag size={15} aria-hidden="true" />
            <span>{totalItems} items</span>
          </div>
          <span className={styles.summaryDivider}>·</span>
          <div className={styles.summaryItem}>
            <MapPin size={15} aria-hidden="true" />
            <span>{marketGroups.length} market{marketGroups.length !== 1 ? 's' : ''}</span>
          </div>
          <span className={styles.summaryDivider}>·</span>
          <span className={styles.summaryTotal}>{formatNaira(totalCents)}</span>
        </div>

        {/* Map showing all stall stops */}
        {mapMarkers.length > 0 && (
          <div className={styles.mapSection}>
            <MapView
              markers={mapMarkers}
              height="220px"
              showDirectionsLink={false}
              ariaLabel="Map showing your pickup stops"
            />
          </div>
        )}

        {/* Visit itinerary */}
        <div className={styles.itinerary}>
          {marketGroups.map((mg, mIdx) => (
            <div key={mg.marketId} className={styles.marketSection}>
              {/* Market header */}
              <div className={styles.marketHeader}>
                <div className={styles.marketIconWrap} aria-hidden="true">
                  <MapPin size={16} />
                </div>
                <div>
                  <h2 className={styles.marketName}>{mg.marketName}</h2>
                  {mg.marketAddress && (
                    <p className={styles.marketAddress}>{mg.marketAddress}</p>
                  )}
                </div>
              </div>

              {/* Farmers within market */}
              <div className={styles.farmersList}>
                {mg.farmers.map((farmer, fIdx) => {
                  const stopNum = marketGroups
                    .slice(0, mIdx)
                    .reduce((s, g) => s + g.farmers.length, 0) + fIdx + 1;
                  return (
                    <div key={farmer.farmerId} className={styles.farmerStop}>
                      <div className={styles.stopBadge} aria-label={`Stop ${stopNum}`}>
                        {stopNum}
                      </div>
                      <div className={styles.stopContent}>
                        <h3 className={styles.farmerName}>{farmer.farmerName}</h3>
                        <div className={styles.stopMeta}>
                          <span className={styles.stopMetaItem}>
                            <Clock size={12} aria-hidden="true" />
                            {getPickupLabel(farmer.farmerPickupWindows)}
                          </span>
                          {farmer.farmerOperatingDays.length > 0 && (
                            <span className={styles.stopMetaItem}>
                              <Calendar size={12} aria-hidden="true" />
                              {farmer.farmerOperatingDays.join(', ')}
                            </span>
                          )}
                        </div>

                        {/* Items at this stop */}
                        <ul className={styles.stopItems} aria-label={`Items from ${farmer.farmerName}`}>
                          {farmer.items.map((item) => (
                            <li key={item.productId} className={styles.stopItem}>
                              <span className={styles.stopItemName}>{item.name}</span>
                              <span className={styles.stopItemDetail}>
                                ×{item.quantity} {item.unit}
                              </span>
                              <span className={styles.stopItemPrice}>
                                {formatNaira(item.priceCents * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* Directions link */}
                        {(farmer.farmerLocation || mg.marketLocation) && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${(farmer.farmerLocation || mg.marketLocation).lat},${(farmer.farmerLocation || mg.marketLocation).lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.directionsLink}
                            aria-label={`Get directions to ${farmer.farmerName}`}
                          >
                            <Navigation size={13} aria-hidden="true" />
                            Get directions
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/buyer/orders')}
            className={styles.viewOrdersBtn}
            aria-label="View your orders"
          >
            View My Orders
          </Button>
          <button
            type="button"
            className={styles.newBasketBtn}
            onClick={() => navigate('/buyer/smart-basket')}
            aria-label="Build another basket"
          >
            Build another basket
          </button>
        </div>
      </div>
    </div>
  );
}

export default VisitPlanner;
