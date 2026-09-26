import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft, MapPin, Clock, Calendar, ShoppingBag, Navigation,
  CheckCircle2, ArrowRight, Store, Sparkles
} from 'lucide-react';
import { MapView } from '@/components/domain/MapView';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import styles from './VisitPlanner.module.css';

function formatNaira(centsOrNaira) {
  // If value is in cents (typically > 50000 or cents format) vs already in Naira
  const val = typeof centsOrNaira === 'number' ? centsOrNaira : 0;
  return `₦${val.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

function getPickupLabel(windows = []) {
  if (windows.length === 0) return 'Regular market hours';
  const first = windows[0];
  if (first.label) return first.label;
  if (first.start && first.end) return `${first.start} – ${first.end}`;
  return 'Saturday 8:00 AM – 1:00 PM';
}

/**
 * Market Visit Planner.
 * Receives basket items from SmartBasket or OrderDetail via location.state.
 * Groups by market → farmer → items and shows an interactive itinerary and route on the map.
 */
export function VisitPlanner() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = location.state?.items || [];
  const pickupDate = location.state?.pickupDate || null;
  const isPreOrder = location.state?.isPreOrder !== false && !location.state?.orderId;
  const basketResult = location.state?.result || null;

  const [selectedStopId, setSelectedStopId] = useState(null);
  const [selectedWindows, setSelectedWindows] = useState({});

  // Group items: market → farmer → items
  const marketGroups = useMemo(() => {
    const mgMap = new Map();

    for (const item of items) {
      const mKey = item.marketId || 'unknown';
      if (!mgMap.has(mKey)) {
        mgMap.set(mKey, {
          marketId: mKey,
          marketName: item.marketName || 'Local Farmers Market',
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
          farmerStallNumber: item.farmerStallNumber || null,
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

  // Build map markers: one per farmer stop with sequential stop numbers
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
            subtitle: `${mg.marketName}${farmer.farmerStallNumber ? ` • ${farmer.farmerStallNumber}` : ''}`,
            detail: `${farmer.items.length} item${farmer.items.length !== 1 ? 's' : ''} to pick up`,
            markerType: 'farmer',
            stopNumber: stopIndex,
            highlight: selectedStopId === farmer.farmerId,
          });
          stopIndex++;
        }
      }
    }
    return markers;
  }, [marketGroups, selectedStopId]);

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

  const totalItems = items.reduce((s, i) => s + (i.quantity || 1), 0);
  const totalNaira = items.reduce((s, i) => {
    const itemPrice = i.priceNaira || (i.priceCents ? Math.round(i.priceCents / 100) : 0);
    return s + itemPrice * (i.quantity || 1);
  }, 0);

  const handleProceedToReserve = () => {
    navigate('/buyer/smart-basket', {
      state: {
        resumeStep: 3,
        items,
        result: basketResult,
      },
    });
  };

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
          <p className={styles.headerSubtitle}>
            {mapMarkers.length} pickup stop{mapMarkers.length !== 1 ? 's' : ''} scheduled
            {pickupDate && (
              <> · {new Date(pickupDate).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })}</>
            )}
          </p>
        </div>
      </header>

      <div className={styles.body}>
        {/* Route / Trip Bar */}
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <ShoppingBag size={15} aria-hidden="true" />
            <span>{totalItems} items ({marketGroups.length} market{marketGroups.length !== 1 ? 's' : ''})</span>
          </div>
          <span className={styles.summaryDivider}>·</span>
          <div className={styles.summaryItem}>
            <Store size={15} aria-hidden="true" />
            <span>{mapMarkers.length} Stall Stops</span>
          </div>
          <span className={styles.summaryDivider}>·</span>
          <span className={styles.summaryTotal}>{formatNaira(totalNaira)}</span>
        </div>

        {/* Map with Ordered Route Polyline */}
        {mapMarkers.length > 0 && (
          <div className={styles.mapSection}>
            <MapView
              markers={mapMarkers}
              selectedId={selectedStopId}
              onSelect={(m) => setSelectedStopId(m.id)}
              showRoute={mapMarkers.length > 1}
              height="260px"
              showDirectionsLink={false}
              ariaLabel="Map showing your pickup stops and route"
            />
            <div className={styles.mapTip}>
              <Sparkles size={13} aria-hidden="true" />
              <span>Tap any stop or pin to inspect stall details & directions</span>
            </div>
          </div>
        )}

        {/* Ordered Pickup Itinerary */}
        <div className={styles.itinerary}>
          <h2 className={styles.itineraryHeading}>Your Pickup Route</h2>

          {marketGroups.map((mg, mIdx) => (
            <div key={mg.marketId} className={styles.marketSection}>
              {/* Market Header */}
              <div className={styles.marketHeader}>
                <div className={styles.marketIconWrap} aria-hidden="true">
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 className={styles.marketName}>{mg.marketName}</h3>
                  {mg.marketAddress && (
                    <p className={styles.marketAddress}>{mg.marketAddress}</p>
                  )}
                </div>
              </div>

              {/* Farmers Stops in Market */}
              <div className={styles.farmersList}>
                {mg.farmers.map((farmer, fIdx) => {
                  const stopNum = marketGroups
                    .slice(0, mIdx)
                    .reduce((s, g) => s + g.farmers.length, 0) + fIdx + 1;
                  const isSelected = selectedStopId === farmer.farmerId;

                  return (
                    <div
                      key={farmer.farmerId}
                      className={`${styles.farmerStop} ${isSelected ? styles.farmerStopSelected : ''}`}
                      onClick={() => setSelectedStopId(farmer.farmerId)}
                    >
                      <div className={styles.stopBadge} aria-label={`Stop ${stopNum}`}>
                        {stopNum}
                      </div>

                      <div className={styles.stopContent}>
                        <div className={styles.stopHeader}>
                          <div>
                            <h4 className={styles.farmerName}>{farmer.farmerName}</h4>
                            {farmer.farmerStallNumber && (
                              <span className={styles.stallPill}>
                                <Store size={11} aria-hidden="true" />
                                {farmer.farmerStallNumber}
                              </span>
                            )}
                          </div>
                          {farmer.farmerRatingAvg > 0 && (
                            <span className={styles.ratingBadge}>★ {farmer.farmerRatingAvg.toFixed(1)}</span>
                          )}
                        </div>

                        {/* Timing and Pickup Window */}
                        <div className={styles.stopTimingRow}>
                          <div className={styles.timingMeta}>
                            <Clock size={12} aria-hidden="true" />
                            <span>{getPickupLabel(farmer.farmerPickupWindows)}</span>
                          </div>
                          {farmer.farmerOperatingDays.length > 0 && (
                            <div className={styles.timingMeta}>
                              <Calendar size={12} aria-hidden="true" />
                              <span>{farmer.farmerOperatingDays.join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Preferred Window Selector */}
                        {farmer.farmerPickupWindows.length > 1 && (
                          <div className={styles.windowSelectWrap} onClick={(e) => e.stopPropagation()}>
                            <label htmlFor={`win-${farmer.farmerId}`} className={styles.windowLabel}>
                              Preferred arrival window:
                            </label>
                            <select
                              id={`win-${farmer.farmerId}`}
                              className={styles.windowSelect}
                              value={selectedWindows[farmer.farmerId] || ''}
                              onChange={(e) =>
                                setSelectedWindows((prev) => ({
                                  ...prev,
                                  [farmer.farmerId]: e.target.value,
                                }))
                              }
                            >
                              {farmer.farmerPickupWindows.map((pw, i) => (
                                <option key={i} value={pw.label || pw.start}>
                                  {pw.label || `${pw.start} – ${pw.end}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Items at this stop */}
                        <ul className={styles.stopItems} aria-label={`Items from ${farmer.farmerName}`}>
                          {farmer.items.map((item) => {
                            const itemPrice = item.priceNaira || (item.priceCents ? Math.round(item.priceCents / 100) : 0);
                            return (
                              <li key={item.productId} className={styles.stopItem}>
                                <span className={styles.stopItemName}>{item.name}</span>
                                <span className={styles.stopItemDetail}>
                                  ×{item.quantity} {item.unit || ''}
                                </span>
                                <span className={styles.stopItemPrice}>
                                  {formatNaira(itemPrice * item.quantity)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>

                        {/* Directions Link */}
                        {(farmer.farmerLocation || mg.marketLocation) && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${(farmer.farmerLocation || mg.marketLocation).lat},${(farmer.farmerLocation || mg.marketLocation).lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.directionsLink}
                            aria-label={`Get directions to ${farmer.farmerName}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Navigation size={13} aria-hidden="true" />
                            <span>Navigate to {farmer.farmerStallNumber || 'Stall'}</span>
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

        {/* Footer actions */}
        <div className={styles.footer}>
          {isPreOrder ? (
            <>
              <Button
                variant="primary"
                size="lg"
                onClick={handleProceedToReserve}
                className={styles.primaryActionBtn}
                aria-label="Proceed to reserve pre-order"
              >
                <span>Reserve Pre-Order ({formatNaira(totalNaira)})</span>
                <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <button
                type="button"
                className={styles.secondaryActionBtn}
                onClick={() => navigate('/buyer/smart-basket')}
                aria-label="Edit smart basket"
              >
                Back to basket editor
              </button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/buyer/orders')}
                className={styles.primaryActionBtn}
                aria-label="View your orders"
              >
                View My Orders
              </Button>
              <button
                type="button"
                className={styles.secondaryActionBtn}
                onClick={() => navigate('/buyer/smart-basket')}
                aria-label="Build another basket"
              >
                Build another basket
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VisitPlanner;
