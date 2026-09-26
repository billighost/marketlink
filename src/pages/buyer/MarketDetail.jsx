import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Bookmark } from 'lucide-react';
import {
  getMarketDetail,
  getMarketFarmers,
  getMarketProducts,
} from '@/api/catalog';
import { saveMarket, unsaveMarket, getSavedMarkets } from '@/api/me';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/context/ToastContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import Page from '@/components/layout/Page';
import Section from '@/components/layout/Section';
import MarketClock from '@/components/layout/MarketClock';
import DayDots from '@/components/domain/DayDots';
import LocationBlock from '@/components/domain/LocationBlock';
import FarmerCard from '@/components/domain/FarmerCard';
import ProductCard from '@/components/domain/ProductCard';
import HorizontalRow from '@/components/layout/HorizontalRow';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { byOpenThenScarcity } from '@/utils/sortStalls';
import { formatMarketSchedule } from '@/utils/format';
import styles from './MarketDetail.module.css';

const DAY_MAP = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

function formatReadableSchedule(market) {
  if (!market) return '';
  if (Array.isArray(market.schedule) && market.schedule.length > 0) {
    const formatMin = (min) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return `${h}:${String(m).padStart(2, '0')}`;
    };
    return market.schedule
      .map((s) => {
        const d = DAY_MAP[s.day?.toLowerCase()] || s.day;
        const open = s.openMin != null ? formatMin(s.openMin) : '8:00';
        const close = s.closeMin != null ? formatMin(s.closeMin) : '13:00';
        return `${d} ${open}–${close}`;
      })
      .join(' · ');
  }
  return formatMarketSchedule(market);
}

/**
 * Page D: Market page (/buyer/markets/:id)
 *
 * Requirements:
 *  - Page width="detail" (960px)
 *  - Back link, market name (h1), address, MarketClock
 *  - Opening days with DayDots and readable schedule line
 *  - LocationBlock (map 280px) with OpenStreetMap directions link
 *  - Save this market button (one beet element on the page)
 *  - Stalls at this market (FarmerCard variant="stall", sorted byOpenThenScarcity)
 *  - Fresh at this market (HorizontalRow of ProductCard)
 *  - Bad id renders scene="lost-path"
 */
export function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [savingAction, setSavingAction] = useState(false);

  // 1. Fetch Market Detail
  const {
    data: market,
    loading: marketLoading,
    error: marketError,
  } = useQuery(['market-detail', id], ({ signal }) => getMarketDetail(id, signal), {
    enabled: Boolean(id),
  });

  useDocumentTitle(market?.name ? `${market.name} · MarketLink` : 'Market · MarketLink');

  // 2. Fetch Stalls at this market
  const { data: farmersData, loading: farmersLoading } = useQuery(
    ['market-farmers', id],
    ({ signal }) => getMarketFarmers(id, {}, signal),
    { enabled: Boolean(id) }
  );

  // 3. Fetch Products fresh at this market
  const { data: productsData } = useQuery(
    ['market-products', id],
    ({ signal }) => getMarketProducts(id, { limit: 12 }, signal),
    { enabled: Boolean(id) }
  );

  // 4. Fetch Saved Markets to know if this market is saved
  const { data: savedMarketsData, refetch: refetchSaved } = useQuery(
    ['saved-markets'],
    ({ signal }) => getSavedMarkets(signal)
  );

  const savedIds = useMemo(() => {
    const list = Array.isArray(savedMarketsData) ? savedMarketsData : savedMarketsData?.data || [];
    return new Set(list.map((m) => m.id || m._id));
  }, [savedMarketsData]);

  const isSaved = savedIds.has(id);

  const handleToggleSaveMarket = async () => {
    if (!id || savingAction) return;
    setSavingAction(true);
    try {
      if (isSaved) {
        await unsaveMarket(id);
        showToast('Removed from saved markets');
      } else {
        await saveMarket(id);
        showToast('Market saved to your list');
      }
      refetchSaved?.();
    } catch {
      showToast('Unable to update saved market');
    } finally {
      setSavingAction(false);
    }
  };

  // Sort stalls with the shared byOpenThenScarcity comparator
  const stalls = useMemo(() => {
    const list = Array.isArray(farmersData) ? farmersData : farmersData?.data || [];
    return [...list].sort(byOpenThenScarcity);
  }, [farmersData]);

  const freshProducts = useMemo(() => {
    const list = Array.isArray(productsData) ? productsData : productsData?.data || [];
    return list.slice(0, 12);
  }, [productsData]);

  const mapMarkers = useMemo(() => {
    if (market?.location?.lat && market?.location?.lng) {
      return [
        {
          id: market.id,
          lat: Number(market.location.lat),
          lng: Number(market.location.lng),
          title: market.name,
        },
      ];
    }
    return [];
  }, [market]);

  const operatingDays =
    market?.operatingDayNumbers ||
    (Array.isArray(market?.schedule) ? market.schedule.map((s) => s.day) : []);

  // Handle Loading
  if (marketLoading && !market) {
    return (
      <Page width="detail">
        <div className={styles.container}>
          <div className={styles.backRow}>
            <Skeleton height="1.5rem" width="8rem" />
          </div>
          <div className={styles.header}>
            <Skeleton height="2.5rem" width="60%" />
            <Skeleton height="1rem" width="40%" />
            <Skeleton height="1.5rem" width="50%" />
          </div>
          <Skeleton height="16rem" borderRadius="var(--radius-lg)" />
        </div>
      </Page>
    );
  }

  // Handle Bad ID / Not Found
  if (marketError || !market) {
    return (
      <Page width="detail">
        <EmptyState
          scene="lost-path"
          title="That market was not found"
          text="It may have closed or the link is incorrect."
          actionLabel="Back to markets"
          actionTo="/buyer/markets"
        />
      </Page>
    );
  }

  const clock = market.clock;
  const scheduleLine = formatReadableSchedule(market);
  const stallsCountText =
    stalls.length === 1 ? '1 stall' : `${stalls.length} stalls`;

  return (
    <Page width="detail">
      <div className={styles.container}>
        {/* Back Link */}
        <div className={styles.backRow}>
          <Link to="/buyer/markets" className={styles.backLink} aria-label="Back to markets">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to markets</span>
          </Link>
        </div>

        {/* Identity & Market Clock */}
        <header className={styles.header}>
          <h1 className={styles.title}>{market.name}</h1>
          {market.address && <p className={styles.address}>{market.address}</p>}

          <div className={styles.clockWrap}>
            <MarketClock
              marketName={market.name}
              openNow={clock?.openNow}
              windowLabel={clock?.windowLabel}
              nextOpenLabel={clock?.nextOpenLabel}
              closesAtLabel={clock?.closesAtLabel}
              progress={clock?.todayProgress ?? 0}
            />
          </div>
        </header>

        {/* Opening Days */}
        <Section title="Opening days">
          <div className={styles.openingDaysWrap}>
            <DayDots days={operatingDays} size="sm" />
            {scheduleLine && <p className={styles.scheduleText}>{scheduleLine}</p>}
          </div>
        </Section>

        {/* Where to find it */}
        <Section title="Where to find it">
          <LocationBlock
            markers={mapMarkers}
            addressLine={market.address}
            title={market.name}
            mapHeight="280px"
            actionSlot={
              <button
                type="button"
                className={[
                  styles.saveMarketButton,
                  isSaved ? styles.savedActive : '',
                ].filter(Boolean).join(' ')}
                onClick={handleToggleSaveMarket}
                disabled={savingAction}
                aria-pressed={isSaved}
              >
                {isSaved ? (
                  <>
                    <Check size={16} strokeWidth={2} aria-hidden="true" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={16} aria-hidden="true" />
                    <span>Save this market</span>
                  </>
                )}
              </button>
            }
          />
        </Section>

        {/* Stalls at this market */}
        <Section title="Stalls at this market" subtitle={stallsCountText}>
          {farmersLoading && stalls.length === 0 ? (
            <div className={styles.stallsGrid}>
              <Skeleton height="10rem" borderRadius="var(--radius-lg)" />
              <Skeleton height="10rem" borderRadius="var(--radius-lg)" />
            </div>
          ) : stalls.length === 0 ? (
            <EmptyState
              scene="market-closed"
              title="No stalls listed for this market"
              text="Check back before market day."
            />
          ) : (
            <div className={styles.stallsGrid}>
              {stalls.map((farmer) => (
                <FarmerCard key={farmer.id} farmer={farmer} variant="stall" />
              ))}
            </div>
          )}
        </Section>

        {/* Fresh at this market */}
        {freshProducts.length > 0 && (
          <HorizontalRow
            title="Fresh at this market"
            seeAllLabel="See all"
            onSeeAll={() => navigate(`/buyer/products?market=${market.id}`)}
          >
            {freshProducts.map((product) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                variant="compact"
              />
            ))}
          </HorizontalRow>
        )}
      </div>
    </Page>
  );
}

export default MarketDetail;
