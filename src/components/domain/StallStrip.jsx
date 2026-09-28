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

export function StallStrip({ marketId }) {
  const navigate = useNavigate();
  const { selectedMarketId } = useAuth();
  const effectiveMarketId = marketId || selectedMarketId;

  const fetchFarmers = useCallback(
    ({ signal }) => {
      if (!effectiveMarketId) return Promise.resolve({ data: [] });
      return getMarketFarmers(effectiveMarketId, {}, signal).catch(() => ({ data: [] }));
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

  if (!loading && farmersData != null && sortedStalls.length === 0) {
    return null;
  }

  return (
    <HorizontalRow
      title="At the market today"
      seeAllLabel="See all"
      onSeeAll={() => navigate('/buyer/stalls')}
    >
      {(loading || !farmersData) && sortedStalls.length === 0 ? (
        <>
          {[1, 2, 3].map((n) => (
            <div key={n} className={styles.skeletonCard} aria-hidden="true">
              <div className={styles.skeletonBanner}>
                <div className={styles.skeletonAvatar} />
              </div>
              <div className={styles.skeletonBody}>
                <div className={styles.skeletonHeading} />
                <div className={styles.skeletonSub} />
                <div className={styles.skeletonTags}>
                  <div className={styles.skeletonTag} />
                  <div className={styles.skeletonTag} />
                </div>
                <div className={styles.skeletonFooter}>
                  <div className={styles.skeletonRating} />
                  <div className={styles.skeletonCta} />
                </div>
              </div>
            </div>
          ))}
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
