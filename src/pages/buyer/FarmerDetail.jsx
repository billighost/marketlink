import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Heart, CalendarOff } from 'lucide-react';
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

function getProductCategoryName(p) {
  if (!p) return '';
  if (typeof p.category === 'object' && p.category !== null) {
    return p.category.name || p.category.slug || '';
  }
  return p.categoryName || (typeof p.category === 'string' ? p.category : '') || p.categorySlug || '';
}

function getProductCategorySlug(p) {
  if (!p) return '';
  if (typeof p.category === 'object' && p.category !== null) {
    return p.category.slug || p.category.name || '';
  }
  return p.categorySlug || (typeof p.category === 'string' ? p.category : '') || p.categoryName || '';
}

/**
 * Page B: Stall page (/buyer/stalls/:id)
 *
 * Content order (matches DOM order, which is also the mobile reading order):
 *  1. Identity — avatar, stall name, farmer name, rating
 *  2. Info card — open state, day dots, save button, pickup windows, location
 *  3. About the stall
 *  4. On the table today — current weekly stock, with category chips
 *  5. Reviews
 *
 * At 1024px+, a CSS grid re-flows this into two columns (identity/about/products/reviews
 * on the left, a sticky info card on the right) without changing the underlying DOM order,
 * so the logical reading order and the mobile visual order stay identical.
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
  const marketId = farmer?.markets?.[0]?.id || farmer?.marketId || farmer?.marketIds?.[0] || farmer?.market?.id;

  // 2. Fetch Market Detail for clock and timezone
  const { data: market } = useQuery(
    ['market-detail', marketId],
    ({ signal }) => getMarketDetail(marketId, signal).catch(() => null),
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
        text: `Open today · ${windowStr}`,
        type: 'open',
      };
    }

    if (isOpenToday && !isMarketOpenNow) {
      const opensAt = marketClock?.todayWindow?.opensAt || '8:00';
      return {
        text: `Here today · opens ${opensAt}`,
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
      text: `Not here today · next ${nextDayName}`,
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
      const catName = getProductCategoryName(p);
      if (catName && typeof catName === 'string') {
        set.add(catName.trim());
      }
    }
    return ['All', ...Array.from(set).sort()];
  }, [allProducts]);

  // Reset category selection when switching stalls
  useEffect(() => {
    setSelectedCategory('All');
  }, [id]);

  // Filtered products by category chip
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return allProducts;
    const target = selectedCategory.toLowerCase();
    return allProducts.filter((p) => {
      const name = getProductCategoryName(p).toLowerCase();
      const slug = getProductCategorySlug(p).toLowerCase();
      return name === target || slug === target;
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
  if (farmerLoading || (!farmer && !farmerError)) {
    return (
      <Page width="detail">
        <div className={styles.container}>
          <div className={styles.backRow}>
            <Skeleton height="1.5rem" width="8rem" />
          </div>
          <div className={styles.identityHeader}>
            <Skeleton height="4rem" width="4rem" borderRadius="var(--radius-full)" />
            <div className={styles.textCol}>
              <Skeleton height="2rem" width="12rem" />
              <Skeleton height="1rem" width="8rem" />
            </div>
          </div>
          <Skeleton height="9rem" borderRadius="var(--radius-lg)" />
          <Skeleton height="12rem" borderRadius="var(--radius-lg)" />
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

  const isUnavailable = Boolean(
    farmer &&
    (farmer.listingEnabled === false || farmer.status === 'paused' || farmer.acceptingOrders === false)
  );

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

        {/* Farmer unavailable state */}
        {isUnavailable && (
          <div className={styles.unavailableBanner} role="status">
            <div className={styles.unavailableIconWrap} aria-hidden="true">
              <CalendarOff size={22} />
            </div>
            <div className={styles.unavailableBody}>
              <h3 className={styles.unavailableTitle}>Stall taking a seasonal break</h3>
              <p className={styles.unavailableText}>
                {farmer.stallName || 'This producer'} is currently taking a seasonal break and not accepting pre-orders. You can explore other active growers at this market.
              </p>
              <div className={styles.unavailableActions}>
                <Link to="/buyer/farmers" className={styles.unavailableActionBtn}>
                  Browse active growers
                </Link>
                {marketId && (
                  <Link to={`/buyer/markets/${marketId}`} className={styles.unavailableActionBtnOutline}>
                    View attending stalls at this market
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={styles.layout}>
          {/* 1. Identity */}
          <header className={styles.identityHeader}>
            <div className={styles.avatar} aria-hidden="true">
              {initials}
            </div>
            <div className={styles.textCol}>
              <h1 className={styles.stallHeading}>{farmer.stallName}</h1>
              {farmerPersonName && (
                <p className={styles.farmerName}>{farmerPersonName}</p>
              )}
              <div className={styles.ratingRow}>
                {ratingAvg ? (
                  <>
                    <Stars rating={Number(ratingAvg)} />
                    <span className={styles.starRating}>{Number(ratingAvg).toFixed(1)}</span>
                    <span className={styles.dot} aria-hidden="true">·</span>
                    <span>{totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'}</span>
                  </>
                ) : (
                  <span>New stall · No reviews yet</span>
                )}
              </div>
            </div>
          </header>

          {/* 2. Info card: status, save, pickup, location — sticky rail at 1024px+ */}
          <aside className={styles.rail}>
            <div className={styles.infoCard}>
              <div className={styles.scheduleBlock}>
                <DayDots days={operatingDays} size="md" today={todayIndex} />
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
                <p className={styles.marketLocation}>{stallLocationText}</p>
              </div>

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

              <div className={styles.divider} role="presentation" />

              <div className={styles.railBlock}>
                <h2 className={styles.railHeading}>Collect from this stall</h2>
                <PickupWindows windows={pickupWindows} cutoffLabel={cutoffLabel} />
              </div>

              <div className={styles.divider} role="presentation" />

              <div className={styles.railBlock}>
                <h2 className={styles.railHeading}>Where to find it</h2>
                <LocationBlock
                  markers={mapMarkers}
                  addressLine={marketAddress}
                  pitchLine={farmer.stallPitch || `Stall ${farmer.stallNumber || ''}, ${marketName}`.trim()}
                  title={farmer.stallName}
                  mapHeight="200px"
                />
              </div>
            </div>
          </aside>

          {/* 3. About the stall */}
          {farmer.description && (
            <Section title="About the stall" className={styles.about}>
              <p className={styles.aboutText}>{farmer.description}</p>
            </Section>
          )}

          {/* 4. On the table today */}
          <Section
            title="On the table today"
            subtitle={`${filteredProducts.length} ${filteredProducts.length === 1 ? 'item' : 'items'}`}
            className={styles.products}
          >
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

          {/* 5. Reviews */}
          <Section
            title="Reviews"
            subtitle={ratingAvg ? `${Number(ratingAvg).toFixed(1)} · ${totalReviewsCount} reviews` : 'Customer feedback'}
            className={styles.reviews}
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
                      Show all {totalReviewsCount} reviews
                    </Link>
                  </div>
                )}
              </div>
            )}
          </Section>
        </div>
      </div>
    </Page>
  );
}

export default FarmerDetail;