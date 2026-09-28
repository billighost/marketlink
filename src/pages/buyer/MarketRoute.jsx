import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Store,
  ChevronRight,
  ArrowDown,
  Sparkles,
  ExternalLink,
  Eye,
  X,
  Flag,
  RotateCcw,
} from 'lucide-react';
import { getRoutePlan, toggleRouteCollect, resetRouteProgress } from '@/api/orders';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import { MapView } from '@/components/domain/MapView';
import PickupCode from '@/components/domain/PickupCode';
import Button from '@/components/ui/Button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './MarketRoute.module.css';

/**
 * Market Route Planner (/buyer/route).
 *
 * Connects orders + farmers + map into an integrated walking route:
 * START (Market Entrance)
 *  ↓
 * 📍 Green Valley — Stall A12
 *  ↓
 * 📍 Mama Grace — Stall B05
 *  ↓
 * 📍 Fresh Harvest — Stall C08
 *  ↓
 * FINISH (Collection Complete)
 */
export function MarketRoute() {
  useDocumentTitle('Market Route Planner · MarketLink');

  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useDemo, setUseDemo] = useState(false);
  const [selectedStopId, setSelectedStopId] = useState(null);
  const [activeCodeStop, setActiveCodeStop] = useState(null);
  const [collectedStopIds, setCollectedStopIds] = useState(() => new Set());

  // Fetch plan from backend and synchronize database collection states
  const fetchPlan = useCallback(async (signal) => {
    try {
      setLoading(true);
      const data = await getRoutePlan(signal);
      setRouteData(data);

      if (data?.stops && Array.isArray(data.stops)) {
        const alreadyCollected = new Set(
          data.stops.filter((s) => s.collected).map((s) => s.id)
        );
        setCollectedStopIds(alreadyCollected);
      }

      if (!data?.hasRealOrders) {
        setUseDemo(true);
      } else {
        setUseDemo(false);
      }
    } catch {
      // Fallback to local demo data if network fails
      setUseDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchPlan(controller.signal);
    return () => controller.abort();
  }, [fetchPlan]);

  // Determine current active stops
  const currentStops = useMemo(() => {
    if (!routeData) return [];
    if (useDemo || !routeData.hasRealOrders) {
      return routeData.demoStops || routeData.stops || [];
    }
    return routeData.stops || [];
  }, [routeData, useDemo]);

  // Set initial selected stop
  useEffect(() => {
    if (currentStops.length > 0 && !selectedStopId) {
      setSelectedStopId(currentStops[0].id);
    }
  }, [currentStops, selectedStopId]);

  // Find currently selected stop object
  const activeStop = useMemo(() => {
    return currentStops.find((s) => s.id === selectedStopId) || currentStops[0] || null;
  }, [currentStops, selectedStopId]);

  // Toggle collection checkbox for a stop with optimistic DB sync
  const toggleCollected = async (stopId) => {
    const isCurrentlyCollected = collectedStopIds.has(stopId);
    const nextState = !isCurrentlyCollected;

    // Optimistic UI update
    setCollectedStopIds((prev) => {
      const next = new Set(prev);
      if (nextState) {
        next.add(stopId);
      } else {
        next.delete(stopId);
      }
      return next;
    });

    try {
      await toggleRouteCollect(stopId, nextState);
    } catch (err) {
      console.error('Failed to sync route stop collection status:', err);
      // Revert optimistic state on failure
      setCollectedStopIds((prev) => {
        const reverted = new Set(prev);
        if (isCurrentlyCollected) {
          reverted.add(stopId);
        } else {
          reverted.delete(stopId);
        }
        return reverted;
      });
    }
  };

  // Reset checklist progress in database and local UI
  const resetAllCollected = async () => {
    const previous = new Set(collectedStopIds);
    setCollectedStopIds(new Set());
    try {
      await resetRouteProgress();
    } catch (err) {
      console.error('Failed to reset route collection progress:', err);
      setCollectedStopIds(previous);
    }
  };

  const totalStopsCount = currentStops.length;
  const completedStopsCount = currentStops.filter((s) => collectedStopIds.has(s.id)).length;
  const progressPercent = totalStopsCount > 0 ? Math.round((completedStopsCount / totalStopsCount) * 100) : 0;
  const allStopsCollected = totalStopsCount > 0 && completedStopsCount === totalStopsCount;

  // Build map markers (Start entrance + each stall + Finish exit)
  const mapData = useMemo(() => {
    const market = routeData?.market || {};
    const centerLat = market.centerLat || 51.4545;
    const centerLng = market.centerLng || -2.5879;

    const startPoint = market.startPoint || {
      lat: centerLat - 0.0008,
      lng: centerLng - 0.0006,
      label: 'START — Main Entrance',
    };

    const finishPoint = market.finishPoint || {
      lat: centerLat + 0.0008,
      lng: centerLng + 0.0006,
      label: 'FINISH — Market Exit',
    };

    const markers = [
      {
        id: 'route-start',
        lat: startPoint.lat,
        lng: startPoint.lng,
        label: startPoint.label,
        subtitle: market.name || 'Market Entrance',
        markerType: 'route-start',
        iconText: 'START',
      },
      ...currentStops.map((stop, idx) => ({
        id: stop.id,
        lat: stop.lat || centerLat,
        lng: stop.lng || centerLng,
        label: `${stop.stallName} (${stop.stallNumber})`,
        subtitle: `${stop.items?.length || 1} reserved items · Code: ${stop.pickupCode}`,
        markerType: 'route-stop',
        stepNumber: idx + 1,
        highlight: stop.id === selectedStopId,
      })),
      {
        id: 'route-finish',
        lat: finishPoint.lat,
        lng: finishPoint.lng,
        label: finishPoint.label,
        subtitle: 'Collection Complete',
        markerType: 'route-finish',
        iconText: 'FINISH',
      },
    ];

    const routePath = markers.map((m) => [m.lat, m.lng]);

    return { markers, routePath };
  }, [routeData, currentStops, selectedStopId]);

  const marketName = routeData?.market?.name || 'Bodija Market';
  const routeDay = routeData?.dayName || 'Saturday';
  const routeTitle = routeData?.routeTitle || `Your ${routeDay} Market Route`;

  return (
    <Page width="wide" className={styles.page}>
      <header className={styles.header}>
        <div className={styles.topBadgeRow}>
          <span className={styles.routeBadge}>
            <Navigation size={13} aria-hidden="true" />
            Market Route Planner
          </span>

          {routeData?.hasRealOrders && (
            <button
              type="button"
              className={styles.modeToggleBtn}
              onClick={() => setUseDemo((v) => !v)}
            >
              <Sparkles size={13} aria-hidden="true" />
              {useDemo ? 'Switch to My Live Route' : 'View Sample Route'}
            </button>
          )}
        </div>

        <PageTitle
          title={routeTitle}
          context={`${marketName} · ${totalStopsCount} stops · Connects your orders, farmers, and map`}
          backTo="/buyer/orders"
          backLabel="Back to orders"
        />

        <div className={styles.headerMeta}>
          <span className={styles.metaItem}>
            <Store size={15} aria-hidden="true" />
            {totalStopsCount} Stalls to visit
          </span>
          <span className={styles.metaItem}>
            <Clock size={15} aria-hidden="true" />
            ~{routeData?.summary?.estimatedWalkMinutes || 4} min walk
          </span>
          <span className={styles.metaItem}>
            <ShoppingBag size={15} aria-hidden="true" />
            {currentStops.reduce((sum, s) => sum + (s.itemCount || 1), 0)} items reserved
          </span>
          {completedStopsCount > 0 && (
            <button
              type="button"
              className={styles.modeToggleBtn}
              onClick={resetAllCollected}
              title="Reset collected checkboxes"
            >
              <RotateCcw size={12} aria-hidden="true" />
              Reset checklist
            </button>
          )}
        </div>
      </header>

      {/* Live vs Preview Info Banner */}
      {(!routeData?.hasRealOrders || useDemo) && (
        <div className={styles.previewBanner}>
          <div className={styles.bannerContent}>
            <Sparkles size={20} className={styles.bannerIcon} aria-hidden="true" />
            <div>
              <div className={styles.bannerHeading}>
                {useDemo && routeData?.hasRealOrders
                  ? 'Viewing sample preview route'
                  : 'Market Route Preview · No Active Pre-orders Yet'}
              </div>
              <div className={styles.bannerSubtext}>
                {useDemo && routeData?.hasRealOrders
                  ? 'You are viewing a demonstration route. Switch to your live route above to guide your active pickups.'
                  : 'This walking checklist connects real Saturday market stalls with GPS coordinates. Pre-order fresh produce to generate your live walking route with custom pickup codes!'}
              </div>
            </div>
          </div>
          <Link to="/buyer/products" className={styles.bannerCta}>
            <ShoppingBag size={14} aria-hidden="true" />
            Pre-order Produce
          </Link>
        </div>
      )}

      {/* Progress Strip */}
      <section className={styles.progressCard} aria-label="Route collection progress">
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Pickup Progress</span>
          <span className={styles.progressCount}>
            {completedStopsCount} of {totalStopsCount} stops collected ({progressPercent}%)
          </span>
        </div>
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
        {allStopsCollected && (
          <div className={styles.progressAllDone}>
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>All stops collected! You are all set to exit the market.</span>
          </div>
        )}
      </section>

      {/* Main Two-Column Layout */}
      <div className={styles.layout}>
        {/* Left: Walking Route Flow (START -> Stops -> FINISH) */}
        <div className={styles.routeFlow}>
          {/* 1. START Waypoint */}
          <div className={`${styles.waypoint} ${styles.waypointStart}`}>
            <div className={styles.waypointIcon}>
              <Navigation size={18} aria-hidden="true" />
            </div>
            <div className={styles.waypointContent}>
              <div className={styles.waypointTag}>START</div>
              <div className={styles.waypointTitle}>
                {routeData?.market?.startPoint?.label || 'Market Main Entrance'}
              </div>
              <div className={styles.waypointSubtitle}>
                {marketName} · Begin your pickup journey here
              </div>
            </div>
          </div>

          {/* Sequential Stops */}
          {currentStops.map((stop, index) => {
            const isSelected = stop.id === selectedStopId;
            const isCollected = collectedStopIds.has(stop.id);

            return (
              <React.Fragment key={stop.id}>
                {/* Connecting arrow */}
                <div className={styles.connector} aria-hidden="true">
                  <div className={styles.connectorLine} />
                  <ArrowDown size={14} className={styles.connectorArrow} />
                </div>

                {/* Stop Card */}
                <article
                  className={[
                    styles.stopCard,
                    isSelected ? styles.stopCardActive : '',
                    isCollected ? styles.stopCardCollected : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedStopId(stop.id)}
                >
                  <div className={styles.stopCardHeader}>
                    <div className={styles.stopTitleGroup}>
                      <span
                        className={[
                          styles.stopNumberBadge,
                          isCollected ? styles.stopNumberBadgeCollected : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {isCollected ? '✓' : index + 1}
                      </span>
                      <div>
                        <h2 className={styles.stopStallName}>
                          📍 {stop.stallName}
                          <span className={styles.stopStallNumber}>{stop.stallNumber}</span>
                        </h2>
                        <div className={styles.stopCategory}>{stop.category}</div>
                      </div>
                    </div>

                    {stop.farmerId && (
                      <Link
                        to={`/buyer/stalls/${stop.farmerId}`}
                        className={styles.stallLink}
                        onClick={(e) => e.stopPropagation()}
                        title="View farm stall profile"
                      >
                        <span>Stall profile</span>
                        <ChevronRight size={13} aria-hidden="true" />
                      </Link>
                    )}
                  </div>

                  {/* Status & Code pill row */}
                  <div className={styles.stopMetaRow}>
                    <span
                      className={[
                        styles.orderStatusPill,
                        stop.status === 'ready' ? styles.statusReady : styles.statusPlaced,
                      ].join(' ')}
                    >
                      <CheckCircle2 size={13} aria-hidden="true" />
                      {stop.statusLabel || (stop.status === 'ready' ? 'Ready for pickup' : 'Being packed')}
                    </span>

                    <button
                      type="button"
                      className={styles.pickupCodeBadge}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCodeStop(stop);
                      }}
                      title="Enlarge pickup code for handoff"
                    >
                      <Eye size={13} aria-hidden="true" />
                      Code: {stop.pickupCode}
                    </button>
                  </div>

                  {/* Items reserved list */}
                  <div className={styles.itemsList}>
                    <div className={styles.itemsHeading}>Reserved Produce</div>
                    {stop.items && stop.items.map((item, iIdx) => (
                      <div key={iIdx} className={styles.itemRow}>
                        <span className={styles.itemName}>
                          <span>•</span>
                          <span>{item.name}</span>
                        </span>
                        <span className={styles.itemQuantity}>
                          {item.quantity} {item.unit || 'unit'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Card actions */}
                  <div className={styles.stopActions}>
                    <label
                      className={styles.collectToggle}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isCollected}
                        onChange={() => toggleCollected(stop.id)}
                        className={styles.collectCheckbox}
                      />
                      <span>{isCollected ? 'Collected' : 'Mark as collected'}</span>
                    </label>

                    {stop.orderId && !stop.id.startsWith('demo') ? (
                      <Link
                        to={`/buyer/orders/${stop.orderId}`}
                        className={styles.receiptLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>View receipt</span>
                        <ExternalLink size={12} aria-hidden="true" />
                      </Link>
                    ) : (
                      <span className={styles.receiptLink}>
                        Order #{stop.orderNumber}
                      </span>
                    )}
                  </div>
                </article>
              </React.Fragment>
            );
          })}

          {/* Final connecting arrow */}
          <div className={styles.connector} aria-hidden="true">
            <div className={styles.connectorLine} />
            <ArrowDown size={14} className={styles.connectorArrow} />
          </div>

          {/* 3. FINISH Waypoint */}
          <div className={`${styles.waypoint} ${styles.waypointFinish}`}>
            <div className={styles.waypointIcon}>
              <Flag size={18} aria-hidden="true" />
            </div>
            <div className={styles.waypointContent}>
              <div className={styles.waypointTag}>FINISH</div>
              <div className={styles.waypointTitle}>
                {routeData?.market?.finishPoint?.label || 'Market Exit & Collection Complete'}
              </div>
              <div className={styles.waypointSubtitle}>
                All {totalStopsCount} farmer orders picked up · Head to parking or transit
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Map & Selected Stop Handoff */}
        <aside className={styles.mapColumn}>
          {/* Map View */}
          <div className={styles.mapCard}>
            <div className={styles.mapCardHeader}>
              <span className={styles.mapTitle}>
                <MapPin size={16} aria-hidden="true" />
                Market Walking Route
              </span>
              <div className={styles.mapLegend}>
                <span className={`${styles.legendDot} ${styles.legendDotStart}`} title="Start Entrance" />
                <span>Start</span>
                <span className={`${styles.legendDot} ${styles.legendDotStop}`} title="Stalls" />
                <span>Stalls</span>
                <span className={`${styles.legendDot} ${styles.legendDotFinish}`} title="Finish Exit" />
                <span>Exit</span>
              </div>
            </div>

            <MapView
              markers={mapData.markers}
              routePath={mapData.routePath}
              selectedId={selectedStopId}
              onSelect={(marker) => {
                if (marker.id !== 'route-start' && marker.id !== 'route-finish') {
                  setSelectedStopId(marker.id);
                }
              }}
              height="280px"
              zoom={16}
              interactive={true}
              showDirectionsLink={true}
              ariaLabel={`Interactive map showing market pickup route at ${marketName}`}
            />
          </div>

          {/* Quick Handoff Card for active stop */}
          {activeStop && (
            <div className={styles.quickHandoffCard}>
              <div className={styles.quickHandoffTitle}>Current Stop Handoff</div>
              <div className={styles.quickHandoffStall}>
                {activeStop.stallName} — {activeStop.stallNumber}
              </div>

              <div className={styles.quickHandoffCodeWrap}>
                <div className={styles.quickHandoffCodeLabel}>Collection Code for Farmer</div>
                <div className={styles.quickHandoffCodeVal}>{activeStop.pickupCode}</div>
              </div>

              <div className={styles.quickHandoffTip}>
                Show this 6-character code at the counter. The farmer will cross-reference and hand over your packed produce.
              </div>

              <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)' }}>
                <Button
                  variant={collectedStopIds.has(activeStop.id) ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => toggleCollected(activeStop.id)}
                  style={{ flex: 1 }}
                >
                  {collectedStopIds.has(activeStop.id) ? '✓ Collected' : 'Mark Collected'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveCodeStop(activeStop)}
                  title="Enlarge pickup code"
                >
                  <Eye size={14} aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Modal for Fullscreen Pickup Code */}
      {activeCodeStop && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setActiveCodeStop(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setActiveCodeStop(null)}
              aria-label="Close code dialog"
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: 'var(--text-h3)', marginBottom: 'var(--space-1)' }}>
              {activeCodeStop.stallName}
            </h3>
            <p style={{ color: 'var(--color-ink-soft)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
              {activeCodeStop.stallNumber} · Order #{activeCodeStop.orderNumber}
            </p>

            <PickupCode code={activeCodeStop.pickupCode} size="lg" />

            <div className={styles.modalActionRow}>
              <Button
                variant={collectedStopIds.has(activeCodeStop.id) ? 'outline' : 'primary'}
                size="md"
                onClick={() => toggleCollected(activeCodeStop.id)}
              >
                {collectedStopIds.has(activeCodeStop.id) ? '✓ Marked as Collected' : 'Mark as Collected'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setActiveCodeStop(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

export default MarketRoute;
