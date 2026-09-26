import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Heart } from 'lucide-react';
import {
  getFarmerDetail,
  getFarmerProducts,
  getFarmerReviews,
  getFarmerPickupSlots,
  getMarketDetail,
} from '@/api/catalog';
import { useQuery } from '@/hooks/useQuery';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import Page from '@/components/layout/Page';
import Section from '@/components/layout/Section';
import ProductCard from '@/components/domain/ProductCard';
import ReviewItem from '@/components/domain/ReviewItem';
import DayDots from '@/components/domain/DayDots';
import PickupWindows from '@/components/domain/PickupWindows';
import LocationBlock from '@/components/domain/LocationBlock';
import Stars from '@/components/ui/Stars';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import styles from './FarmerDetail.module.css';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getStallInitials(name) {
  if (!name) return 'ML';
  const words = name.trim().split(/\s+/).filter((w) => /^[a-zA-Z0-9]/.test(w));
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return (words[0]?.slice(0, 2) || 'ML').toUpperCase();
}

/**
 * Page B: Stall page (/buyer/stalls/:id)
 *
 * The single strongest expression of the market metaphor:
 *  - White-first tokens, maximum 1 beet element (the Save stall button)
 *  - 56px round avatar, initials on --color-beet-tint
 *  - Stall name (Idiqlat h1) + farmer name + rating
 *  - Seven DayDots (size="md", 28px) with today's ring
 *  - Open-state line (success when open, ink-soft when here today, ink-faint when not here)
 *  - Collect from this stall: PickupWindows
 *  - About the stall (max 62ch)
 *  - On the table today: current weekly stock with category chips, sold-out visible and sorted last
 *  - LocationBlock with OpenStreetMap directions link and embedded MapView (omitted if no coords)
 *  - Reviews with Stars and replies
 *  - Two columns at 1024+ with sticky right rail
 */
export function FarmerDetail() {
  const { id } = useParams();
  const { isFarmerFavorite, toggleFarmer } = useFavorites();
  const { showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [savingFavorite, setSavingFavorite] = useState(false);

  // 1. Fetch Farmer Detail
  const {
    data: farmer,
    loading: farmerLoading,
    error: farmerError,
  } = useQuery(['farmer-detail', id], ({ signal }) => getFarmerDetail(id, signal), {
    enabled: Boolean(id),
  });

  useDocumentTitle(farmer?.stallName ? `${farmer.stallName} · MarketLink` : 'Stall · MarketLink');

  // Market ID for schedule and clock
  const marketId = farmer?.marketId || farmer?.marketIds?.[0] || farmer?.market?.id;

  // 2. Fetch Market Detail for clock and timezone
  const { data: market } = useQuery(
    ['market-detail', marketId],
    ({ signal }) => getMarketDetail(marketId, signal),
    { enabled: Boolean(marketId) }
  );

  // 3. Fetch Products (include sold out so customer sees normal catalog)
  const { data: productsData, loading: productsLoading } = useQuery(
    ['farmer-products', id],
    ({ signal }) => getFarmerProducts(id, { includeSoldOut: true, limit: 50 }, signal),
    { enabled: Boolean(id) }
  );

  // 4. Fetch Pickup Slots
  const { data: slotsData } = useQuery(
    ['farmer-slots', id],
    ({ signal }) => getFarmerPickupSlots(id, signal),
    { enabled: Boolean(id) }
  );

  // 5. Fetch Reviews
  const { data: reviewsData } = useQuery(
    ['farmer-reviews', id],
    ({ signal }) => getFarmerReviews(id, { limit: 10 }, signal),
    { enabled: Boolean(id) }
  );

  // Check if saved
  const isSaved = farmer ? isFarmerFavorite(farmer.id) : false;

  const handleToggleFavorite = async () => {
    if (!farmer || savingFavorite) return;
    setSavingFavorite(true);
    try {
      await toggleFarmer(farmer.id);
      showToast(isSaved ? 'Removed from saved stalls' : 'Saved this stall');
    } catch {
      showToast('Unable to update saved stall');
    } finally {
      setSavingFavorite(false);
    }
  };

  // Derive market clock & today weekday in market timezone
  const marketClock = market?.clock;
  const marketTimezone = market?.timezone || 'America/New_York';

  const todayIndex = useMemo(() => {
    try {
      const dayStr = new Intl.DateTimeFormat('en-US', {
        timeZone: marketTimezone,
        weekday: 'short',
      }).format(new Date());
      const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
      return map[dayStr.toLowerCase()] ?? null;
    } catch {
      return null;
    }
  }, [marketTimezone]);

  const operatingDays = useMemo(() => {
    if (!farmer) return [];
    if (Array.isArray(farmer.operatingDayNumbers)) return farmer.operatingDayNumbers;
    if (Array.isArray(farmer.operatingDays)) {
      const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
      return farmer.operatingDays
        .map((d) => (typeof d === 'number' ? d : map[d?.toLowerCase?.()]))
        .filter((n) => typeof n === 'number' && !isNaN(n));
    }
    return [];
  }, [farmer]);

  // Compute open state line
  const openState = useMemo(() => {
    if (!farmer || operatingDays.length === 0) {
      return { text: 'Trading days not listed', type: 'none' };
    }

    const isOpenToday = Boolean(farmer.openToday);
    const isMarketOpenNow = Boolean(marketClock?.openNow);

    if (isOpenToday && isMarketOpenNow) {
      const windowStr =
        marketClock?.todayWindow
          ? `${marketClock.todayWindow.opensAt}–${marketClock.todayWindow.closesAt}`
          : marketClock?.closesAtLabel
          ? `closes ${marketClock.closesAtLabel}`
          : '8:00–13:00';
      return {
        text: `● Open today · ${windowStr}`,
        type: 'open',
      };
    }

    if (isOpenToday && !isMarketOpenNow) {
      const opensAt = marketClock?.todayWindow?.opensAt || '8:00';
      return {
        text: `● Here today · opens ${opensAt}`,
        type: 'here',
      };
    }

    // Not here today - find next trading day
    let nextDayName = 'market day';
    if (todayIndex != null && operatingDays.length > 0) {
      for (let offset = 1; offset <= 7; offset += 1) {
        const checkDay = (todayIndex + offset) % 7;
        if (operatingDays.includes(checkDay)) {
          nextDayName = DAY_NAMES[checkDay];
          break;
        }
      }
    } else if (operatingDays.length > 0) {
      nextDayName = DAY_NAMES[operatingDays[0]];
    }

    return {
      text: `● Not here today · next ${nextDayName}`,
      type: 'not-here',
    };
  }, [farmer, operatingDays, marketClock, todayIndex]);

  // Prepare products: sorted available first, sold-out last
  const allProducts = useMemo(() => {
    const list = Array.isArray(productsData) ? productsData : productsData?.data || [];
    return [...list].sort((a, b) => {
      const aOut = a.availability === 'out' || a.inventory === 0;
      const bOut = b.availability === 'out' || b.inventory === 0;
      if (aOut !== bOut) return aOut ? 1 : -1;
      return 0;
    });
  }, [productsData]);

  // Categories list for chips
  const categories = useMemo(() => {
    const set = new Set();
    for (const p of allProducts) {
      const cat = p.categoryName || p.categorySlug || p.category;
      if (cat) set.add(cat);
    }
    return ['All', ...Array.from(set)];
  }, [allProducts]);

  // Filtered products by category chip
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return allProducts;
    return allProducts.filter((p) => {
      const cat = p.categoryName || p.categorySlug || p.category;
      return cat?.toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [allProducts, selectedCategory]);

  // Reviews
  const reviews = useMemo(() => {
    const list = Array.isArray(reviewsData) ? reviewsData : reviewsData?.data || [];
    return list.slice(0, 3);
  }, [reviewsData]);

  const totalReviewsCount = farmer?.reviewCount ?? reviewsData?.meta?.total ?? reviews.length;
  const ratingAvg = farmer?.ratingAvg ?? farmer?.rating ?? null;

  // Pickup windows
  const pickupWindows = useMemo(() => {
    const list = Array.isArray(slotsData) ? slotsData : slotsData?.data || farmer?.pickupWindows || [];
    return list.map((s, idx) => ({
      id: s.id || s._id || String(idx),
      label: s.label || (s.startsAt && s.endsAt ? `${s.startsAt}–${s.endsAt}` : 'Pickup slot'),
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      available: s.available !== false && (s.remaining === undefined || s.remaining > 0),
      remaining: s.remaining,
    }));
  }, [slotsData, farmer]);

  const cutoffLabel =
    farmer?.cutoffLabel ||
    (market?.cutoffDay ? `Reserve by ${market.cutoffDay}` : 'Reserve before market morning');

  // Markers for LocationBlock
  const mapMarkers = useMemo(() => {
    if (farmer?.location?.lat && farmer?.location?.lng) {
      return [
        {
          id: farmer.id,
          lat: Number(farmer.location.lat),
          lng: Number(farmer.location.lng),
          title: farmer.stallName,
        },
      ];
    }
    if (market?.location?.lat && market?.location?.lng) {
      return [
        {
          id: market.id,
          lat: Number(market.location.lat),
          lng: Number(market.location.lng),
          title: farmer?.stallName || market.name,
        },
      ];
    }
    return [];
  }, [farmer, market]);

  // Market & Pitch metadata
  const marketName = market?.name || farmer?.marketName || farmer?.market?.name || 'Local Market';
  const marketAddress = market?.address || farmer?.address || '';
  const stallLocationText = farmer?.stallNumber
    ? `Stall ${farmer.stallNumber}, ${marketName}`
    : marketAddress
    ? `${marketName} · ${marketAddress}`
    : marketName;

  // Handle Loading State
  if (farmerLoading && !farmer) {
    return (
      <Page width="detail">
        <div className={styles.container}>
          <div className={styles.backRow}>
            <Skeleton height="1.5rem" width="8rem" />
          </div>
          <div className={styles.identityHeader}>
            <Skeleton height="3.5rem" width="3.5rem" borderRadius="var(--radius-full)" />
            <Skeleton height="2rem" width="60%" />
            <Skeleton height="1rem" width="40%" />
          </div>
          <Skeleton height="10rem" borderRadius="var(--radius-lg)" />
        </div>
      </Page>
    );
  }

  // Handle Not Found (Bad ID)
  if (farmerError || !farmer) {
    return (
      <Page width="detail">
        <EmptyState
          scene="lost-path"
          title="That stall is not at the market"
          text="It may have closed, or the link may be old."
          actionLabel="Back to stalls"
          actionTo="/buyer/stalls"
        />
      </Page>
    );
  }

  const initials = getStallInitials(farmer.stallName);
  const farmerPersonName = farmer.ownerName || farmer.farmerName || farmer.contactPerson || '';

  return (
    <Page width="detail">
      <div className={styles.container}>
        {/* Back Link */}
        <div className={styles.backRow}>
          <Link to="/buyer/stalls" className={styles.backLink} aria-label="Back to stalls">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to stalls</span>
          </Link>
        </div>

        {/* Two column grid at 1024+, single column on mobile */}
        <div className={styles.layout}>
          {/* Left Column: Identity, About, Table Today, Reviews */}
          <div className={styles.leftCol}>
            {/* 1. Identity Header */}
            <header className={styles.identityHeader}>
              <div className={styles.avatar} aria-hidden="true">
                {initials}
              </div>

              <h1 className={styles.stallHeading}>{farmer.stallName}</h1>

              {farmerPersonName && (
                <p className={styles.farmerName}>{farmerPersonName}</p>
              )}

              <div className={styles.ratingRow}>
                {ratingAvg ? (
                  <>
                    <Stars rating={Number(ratingAvg)} size={14} />
                    <span className={styles.starRating}>★ {Number(ratingAvg).toFixed(1)}</span>
                    <span className={styles.dot} aria-hidden="true">·</span>
                    <span>{totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'}</span>
                  </>
                ) : (
                  <span>New stall · No reviews yet</span>
                )}
              </div>
            </header>

            {/* 2. About the stall */}
            {farmer.description && (
              <Section title="About the stall">
                <p className={styles.aboutText}>{farmer.description}</p>
              </Section>
            )}

            {/* 3. On the table today (Current weekly stock) */}
            <Section
              title="On the table today"
              subtitle={`${filteredProducts.length} ${filteredProducts.length === 1 ? 'item' : 'items'}`}
            >
              {/* Category chip row */}
              {categories.length > 2 && (
                <div className={styles.catScroll} role="tablist" aria-label="Stall categories">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        className={[
                          styles.catChip,
                          isSelected ? styles.activeCatChip : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Products Grid or Empty */}
              {productsLoading && allProducts.length === 0 ? (
                <div className={styles.produceGrid}>
                  <Skeleton height="12rem" borderRadius="var(--radius-lg)" />
                  <Skeleton height="12rem" borderRadius="var(--radius-lg)" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  scene="stall-empty"
                  title="Nothing on the table yet"
                  text="This stall has not listed stock for the coming market day."
                />
              ) : (
                <div className={styles.produceGrid}>
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id || product._id} product={product} variant="grid" />
                  ))}
                </div>
              )}
            </Section>

            {/* 4. Reviews */}
            <Section
              title="Reviews"
              subtitle={
                ratingAvg
                  ? `★ ${Number(ratingAvg).toFixed(1)} · ${totalReviewsCount} reviews`
                  : 'Customer feedback'
              }
            >
              {reviews.length === 0 ? (
                <EmptyState
                  scene="first-review"
                  title="No reviews yet"
                  text="Reviews appear after customers collect their orders."
                />
              ) : (
                <div className={styles.reviewsList}>
                  {reviews.map((review) => (
                    <ReviewItem
                      key={review.id || review._id}
                      review={review}
                      farmerName={farmer.stallName}
                    />
                  ))}
                  {totalReviewsCount > 3 && (
                    <div>
                      <Link
                        to={`/buyer/reviews?farmer=${farmer.id}`}
                        className={styles.showAllReviewsLink}
                      >
                        Show all {totalReviewsCount} reviews →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Section>
          </div>

          {/* Right Rail: Schedule, Collect, LocationBlock, Save Button */}
          <aside className={styles.rightCol}>
            <div className={styles.scheduleCard}>
              {/* Seven DayDots */}
              <DayDots days={operatingDays} size="md" today={todayIndex} />

              {/* Open-state line */}
              <p
                className={[
                  styles.statusLine,
                  openState.type === 'open'
                    ? styles.statusOpen
                    : openState.type === 'here'
                    ? styles.statusHere
                    : styles.statusNotHere,
                ].join(' ')}
              >
                {openState.text}
              </p>

              {/* Market name and city */}
              <p className={styles.marketLocation}>{stallLocationText}</p>

              {/* Save this stall button (The ONE permitted beet element) */}
              <button
                type="button"
                className={[
                  styles.saveButton,
                  isSaved ? styles.savedActive : '',
                ].filter(Boolean).join(' ')}
                onClick={handleToggleFavorite}
                disabled={savingFavorite}
                aria-pressed={isSaved}
              >
                {isSaved ? (
                  <>
                    <Check size={16} strokeWidth={2} aria-hidden="true" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Heart size={16} aria-hidden="true" />
                    <span>Save this stall</span>
                  </>
                )}
              </button>
            </div>

            {/* Collect from this stall */}
            <Section title="Collect from this stall">
              <PickupWindows
                windows={pickupWindows}
                cutoffLabel={cutoffLabel}
              />
            </Section>

            {/* Where to find it */}
            <Section title="Where to find it">
              <LocationBlock
                markers={mapMarkers}
                addressLine={marketAddress}
                pitchLine={farmer.stallPitch || `Stall ${farmer.stallNumber || ''}, ${marketName}`.trim()}
                title={farmer.stallName}
                mapHeight="240px"
              />
            </Section>
          </aside>
        </div>
      </div>
    </Page>
  );
}

export default FarmerDetail;
