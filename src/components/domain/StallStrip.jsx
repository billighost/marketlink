import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@/hooks/useQuery';
import { getMarketFarmers } from '@/api/catalog';
import HorizontalRow from '@/components/layout/HorizontalRow';
import FarmerCard from '@/components/domain/FarmerCard';
import EmptyState from '@/components/ui/EmptyState';
import { byOpenThenScarcity } from '@/utils/sortStalls';
import styles from './StallStrip.module.css';

/**
 * "At the market today" horizontal stall strip.
 * Fetches market farmers for the selected market, sorted:
 *  1. Open today first
 *  2. lowStockCount descending
 *  3. Alphabetically by stallName
 *
 * Links to /buyer/stalls/:id
 */
export function StallStrip({ marketId }) {
  const navigate = useNavigate();
  const { selectedMarketId } = useAuth();
  const effectiveMarketId = marketId || selectedMarketId;

  const fetchFarmers = useCallback(
    ({ signal }) => {
      if (!effectiveMarketId) return Promise.resolve({ data: [] });
      return getMarketFarmers(effectiveMarketId, {}, signal);
    },
    [effectiveMarketId]
  );

  const { data: farmersData, loading } = useQuery(
    ['market-farmers', effectiveMarketId],
    fetchFarmers,
    { enabled: Boolean(effectiveMarketId) }
  );

  const sortedStalls = useMemo(() => {
    const list = Array.isArray(farmersData)
      ? farmersData
      : (farmersData?.data || []);

    return [...list].sort(byOpenThenScarcity);
  }, [farmersData]);

  if (!loading && sortedStalls.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <EmptyState
          scene="market-closed"
          title="No stalls listed for this market"
          text="Try another market, or check back before market day."
        />
      </div>
    );
  }

  return (
    <HorizontalRow
      title="At the market today"
      seeAllLabel="See all"
      onSeeAll={() => navigate('/buyer/stalls')}
    >
      {loading && sortedStalls.length === 0 ? (
        <>
          <div className={styles.skeletonCard} aria-hidden="true">
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonLines}>
              <div className={styles.skeletonHeading} />
              <div className={styles.skeletonSub} />
              <div className={styles.skeletonStatus} />
            </div>
          </div>
          <div className={styles.skeletonCard} aria-hidden="true">
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonLines}>
              <div className={styles.skeletonHeading} />
              <div className={styles.skeletonSub} />
              <div className={styles.skeletonStatus} />
            </div>
          </div>
          <div className={styles.skeletonCard} aria-hidden="true">
            <div className={styles.skeletonAvatar} />
            <div className={styles.skeletonLines}>
              <div className={styles.skeletonHeading} />
              <div className={styles.skeletonSub} />
              <div className={styles.skeletonStatus} />
            </div>
          </div>
        </>
      ) : (
        sortedStalls.map((farmer) => (
          <FarmerCard
            key={farmer.id}
            farmer={farmer}
            variant="stall"
          />
        ))
      )}
    </HorizontalRow>
  );
}

export default StallStrip;
