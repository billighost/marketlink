import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Bookmark,
  Share2,
  MapPin,
  Clock,
  Calendar,
  Store,
  Navigation,
  Car,
  Accessibility,
  CreditCard,
  ShoppingBag,
  Sparkles,
  Search,
  X,
  ShieldCheck,
  Sprout,
  HeartHandshake,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  getMarketDetail,
  getMarketFarmers,
  getMarketProducts,
} from '@/api/catalog';
import { saveMarket, unsaveMarket, getSavedMarkets } from '@/api/me';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/context/ToastContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import MarketClock from '@/components/layout/MarketClock';
import DayDots from '@/components/domain/DayDots';
import LocationBlock from '@/components/domain/LocationBlock';
import FarmerCard from '@/components/domain/FarmerCard';
import ProductCard from '@/components/domain/ProductCard';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { byOpenThenScarcity } from '@/utils/sortStalls';
import { formatMarketSchedule } from '@/utils/format';
import { useCatalogueRoutes } from './routes';
import styles from './MarketView.module.css';

const DAY_MAP = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

const MARKET_HERO_IMAGES = {
  'elm-street-market': '/images/hero-market-crates.jpg',
  'grove-park-market': '/images/market-wildflower.jpg',
  'hilltop-farmers-market': '/images/market-morning.jpg',
  'riverside-sunday-market': '/images/market-riverside.jpg',
};

const STALL_CATEGORIES = [
  { id: 'all', label: 'All Stalls' },
  { id: 'veg', label: 'Vegetables & Greens' },
  { id: 'fruit', label: 'Fruit & Berries' },
  { id: 'bakery', label: 'Bakery & Bread' },
  { id: 'dairy', label: 'Dairy & Eggs' },
  { id: 'flowers', label: 'Flowers & Plants' },
  { id: 'preserves', label: 'Honey & Preserves' },
  { id: 'meat', label: 'Meat & Poultry' },
];

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

export function MarketView({ audience = 'guest' }) {
  const { id } = useParams();
  const routes = useCatalogueRoutes(audience);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [savingAction, setSavingAction] = useState(false);
  const [stallSearch, setStallSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const isBuyer = audience === 'buyer';

  const {
    data: market,
    loading: marketLoading,
    error: marketError,
  } = useQuery([`${audience}-market-detail`, id], ({ signal }) => getMarketDetail(id, signal), {
    enabled: Boolean(id),
  });

  useDocumentTitle(market?.name ? `${market.name} · MarketLink` : 'Market · MarketLink');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [id]);

  const { data: farmersData, loading: farmersLoading } = useQuery(
    [`${audience}-market-farmers`, id],
    ({ signal }) => getMarketFarmers(id, {}, signal).catch(() => ({ data: [] })),
    { enabled: Boolean(id) && !marketError }
  );

  const { data: productsData, loading: productsLoading } = useQuery(
    [`${audience}-market-products`, id],
    ({ signal }) => getMarketProducts(id, { limit: 12 }, signal).catch(() => ({ data: [] })),
    { enabled: Boolean(id) && !marketError }
  );

  const { data: savedMarketsData, refetch: refetchSaved } = useQuery(
    ['saved-markets'],
    ({ signal }) => getSavedMarkets(signal).catch(() => ({ data: [] })),
    { enabled: isBuyer }
  );

  const savedIds = useMemo(() => {
    if (!isBuyer) return new Set();
    const list = Array.isArray(savedMarketsData) ? savedMarketsData : savedMarketsData?.data || [];
    return new Set(list.map((m) => m.id || m._id));
  }, [savedMarketsData, isBuyer]);

  const isSaved = isBuyer && savedIds.has(id);

  const handleToggleSaveMarket = async () => {
    if (!id || savingAction) return;
    if (!isBuyer) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setSavingAction(true);
    try {
      if (isSaved) {
        await unsaveMarket(id);
        showToast('Removed from saved markets');
      } else {
        await saveMarket(id);
        showToast('Market saved to your collection');
      }
      refetchSaved?.();
    } catch {
      showToast('Unable to update saved market');
    } finally {
      setSavingAction(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Market link copied to clipboard');
    } else {
      showToast('Share: ' + window.location.href);
    }
  };

  const allStalls = useMemo(() => {
    const list = Array.isArray(farmersData) ? farmersData : farmersData?.data || [];
    return [...list].sort(byOpenThenScarcity);
  }, [farmersData]);

  const filteredStalls = useMemo(() => {
    return allStalls.filter((stall) => {
      const matchesSearch =
        !stallSearch.trim() ||
        (stall.stallName || stall.name || '').toLowerCase().includes(stallSearch.toLowerCase()) ||
        (stall.farmerName || stall.ownerName || '').toLowerCase().includes(stallSearch.toLowerCase()) ||
        (stall.categories || []).some((c) =>
          (typeof c === 'string' ? c : c.name || '').toLowerCase().includes(stallSearch.toLowerCase())
        );

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;

      const stallCats = (stall.categories || [])
        .map((c) => (typeof c === 'string' ? c : c.slug || c.name || '').toLowerCase())
        .join(' ');
      const text = `${stall.stallName || ''} ${stall.bio || ''} ${stallCats}`.toLowerCase();

      if (selectedCategory === 'veg') return text.includes('veg') || text.includes('green') || text.includes('herb');
      if (selectedCategory === 'fruit') return text.includes('fruit') || text.includes('berr') || text.includes('apple') || text.includes('orchard');
      if (selectedCategory === 'bakery') return text.includes('bake') || text.includes('bread') || text.includes('pastr') || text.includes('sourdough');
      if (selectedCategory === 'dairy') return text.includes('dair') || text.includes('cheese') || text.includes('egg') || text.includes('milk');
      if (selectedCategory === 'flowers') return text.includes('flower') || text.includes('plant') || text.includes('bouquet');
      if (selectedCategory === 'preserves') return text.includes('honey') || text.includes('jam') || text.includes('preserve') || text.includes('chutney');
      if (selectedCategory === 'meat') return text.includes('meat') || text.includes('poultry') || text.includes('pork') || text.includes('beef');

      return true;
    });
  }, [allStalls, stallSearch, selectedCategory]);

  const freshProducts = useMemo(() => {
    const list = Array.isArray(productsData) ? productsData : productsData?.data || [];
    return list.slice(0, 12);
  }, [productsData]);

  const mapMarkers = useMemo(() => {
    if (market?.location?.lat && market?.location?.lng) {
      return [
        {
          id: market.id || market._id,
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

  if (marketLoading || (!market && !marketError)) {
    return (
      <div className={styles.container}>
        <div className={styles.navRow}>
          <Skeleton height="2rem" width="9rem" borderRadius="var(--radius-md)" />
        </div>
        <div className={styles.heroSkeleton}>
          <Skeleton height="18rem" borderRadius="var(--radius-xl)" />
        </div>
        <div className={styles.splitGrid}>
          <Skeleton height="14rem" borderRadius="var(--radius-lg)" />
          <Skeleton height="14rem" borderRadius="var(--radius-lg)" />
        </div>
      </div>
    );
  }

  if (marketError || !market) {
    return (
      <div className={styles.container}>
        <div className={styles.navRow}>
          <Link to={routes.markets} className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to all markets</span>
          </Link>
        </div>
        <EmptyState
          scene="lost-path"
          title="That market was not found"
          text="It may have concluded or the link has changed."
          actionLabel="Explore all markets"
          actionTo={routes.markets}
        />
      </div>
    );
  }

  const clock = market.clock;
  const scheduleLine = formatReadableSchedule(market);
  const heroImage =
    market.bannerUrl ||
    MARKET_HERO_IMAGES[market.slug] ||
    '/images/hero-market-crates.jpg';

  const directionsUrl =
    market.directionsUrls?.google ||
    (market.location?.lat && market.location?.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          market.location.lat
        )},${encodeURIComponent(market.location.lng)}`
      : null);

  return (
    <div className={styles.container}>
      
      <nav className={styles.navRow} aria-label="Page navigation">
        <Link to={routes.markets} className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>All Markets</span>
        </Link>

        <div className={styles.navActions}>
          <button
            type="button"
            className={styles.iconActionBtn}
            onClick={handleShare}
            aria-label="Share this market"
            title="Share market"
          >
            <Share2 size={16} aria-hidden="true" />
            <span className={styles.btnLabel}>Share</span>
          </button>

          <button
            type="button"
            className={`${styles.saveBtn} ${isSaved ? styles.savedActive : ''}`}
            onClick={handleToggleSaveMarket}
            disabled={savingAction}
            aria-pressed={isSaved}
          >
            {isSaved ? (
              <>
                <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Bookmark size={16} aria-hidden="true" />
                <span>{isBuyer ? 'Save Market' : 'Save'}</span>
              </>
            )}
          </button>
        </div>
      </nav>

      <section className={styles.headerSection} aria-labelledby="market-title">
        
        <div className={styles.compactBannerWrap}>
          <img
            src={heroImage}
            alt={market.name}
            className={styles.compactBannerImage}
          />
          <div className={styles.compactBannerOverlay} />

          <div className={styles.statusPillWrap}>
            {clock?.openNow ? (
              <span className={styles.statusOpen}>
                <span className={styles.pulseDot} aria-hidden="true" />
                Open Today · Closes {clock.closesAtLabel || '13:00'}
              </span>
            ) : (
              <span className={styles.statusUpcoming}>
                <Clock size={13} aria-hidden="true" />
                {clock?.nextOpenLabel || 'Next market scheduled soon'}
              </span>
            )}
          </div>
        </div>

        <div className={styles.identityRow}>
          <div className={styles.titleAndMeta}>
            <h1 id="market-title" className={styles.marketTitle}>
              {market.name}
            </h1>

            <div className={styles.metaStrip}>
              {market.address && (
                <div className={styles.metaItem}>
                  <MapPin size={15} className={styles.metaPinIcon} aria-hidden="true" />
                  <span className={styles.metaText}>{market.address}</span>
                  {directionsUrl && (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.mapLink}
                    >
                      <span>Directions</span>
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}

              {scheduleLine && (
                <>
                  <span className={styles.metaDot} aria-hidden="true">·</span>
                  <div className={styles.metaItem}>
                    <Calendar size={15} className={styles.metaIcon} aria-hidden="true" />
                    <span className={styles.metaText}>{scheduleLine.split('·')[0].trim()}</span>
                  </div>
                </>
              )}

              {allStalls.length > 0 && (
                <>
                  <span className={styles.metaDot} aria-hidden="true">·</span>
                  <div className={styles.metaItem}>
                    <Store size={15} className={styles.metaIcon} aria-hidden="true" />
                    <span className={styles.metaText}>
                      {allStalls.length} {allStalls.length === 1 ? 'stall' : 'stalls'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {!clock?.openNow && (
        <section className={styles.closedAlert} role="status">
          <div className={styles.closedIconBox} aria-hidden="true">
            <Store size={22} />
          </div>
          <div className={styles.closedContent}>
            <h3 className={styles.closedTitle}>
              Market is not trading right now
            </h3>
            <p className={styles.closedText}>
              {market.name} trades on scheduled market days. Next collection opens{' '}
              <strong>{clock?.nextOpenLabel || 'on the next market date'}</strong>. You can pre-order produce today for guaranteed collection or browse other markets currently open.
            </p>
            <div className={styles.closedBtnGroup}>
              <Link to={`${routes.browse}?market=${market.id || market._id}`} className={styles.alertActionBtn}>
                Pre-order for next market day
              </Link>
              <Link to={`${routes.markets}?openNow=true`} className={styles.alertSecondaryBtn}>
                Explore markets open today
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className={styles.splitGrid} aria-label="Visit and schedule details">
        
        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconCircle}>
              <Calendar size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Trading Days & Schedule</h2>
              <p className={styles.cardSubtitle}>Weekly market schedule and collection hours</p>
            </div>
          </div>

          <div className={styles.scheduleWidget}>
            <div className={styles.dayDotsBox}>
              <DayDots days={operatingDays} size="sm" />
            </div>

            <div className={styles.scheduleDetails}>
              {Array.isArray(market.schedule) && market.schedule.length > 0 ? (
                market.schedule.map((slot, idx) => {
                  const dayName = DAY_MAP[slot.day?.toLowerCase()] || slot.day;
                  const formatMin = (min) => {
                    const h = Math.floor(min / 60);
                    const m = min % 60;
                    return `${h}:${String(m).padStart(2, '0')}`;
                  };
                  return (
                    <div key={idx} className={styles.scheduleRow}>
                      <span className={styles.scheduleDay}>{dayName}</span>
                      <span className={styles.scheduleHours}>
                        {slot.openMin != null ? formatMin(slot.openMin) : '8:00'} –{' '}
                        {slot.closeMin != null ? formatMin(slot.closeMin) : '13:00'}
                      </span>
                      <span className={styles.scheduleBadge}>Trading Day</span>
                    </div>
                  );
                })
              ) : (
                <p className={styles.scheduleSummaryText}>{scheduleLine}</p>
              )}
            </div>

            <div className={styles.clockEmbedded}>
              <MarketClock
                marketName={market.name}
                openNow={clock?.openNow}
                windowLabel={clock?.windowLabel}
                nextOpenLabel={clock?.nextOpenLabel}
                closesAtLabel={clock?.closesAtLabel}
                progress={clock?.todayProgress ?? 0}
              />
            </div>

            <div className={styles.collectionNoteBox}>
              <ShieldCheck size={16} className={styles.noteIcon} aria-hidden="true" />
              <span>
                <strong>Collector Tip:</strong> Pre-orders close 24 hours prior to market opening so growers have time to harvest fresh from the field.
              </span>
            </div>
          </div>
        </div>

        <div className={styles.infoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconCircle}>
              <Navigation size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className={styles.cardTitle}>Getting There & Location</h2>
              <p className={styles.cardSubtitle}>{market.address || 'Market location map'}</p>
            </div>
          </div>

          <div className={styles.locationWrapper}>
            <LocationBlock
              markers={mapMarkers}
              addressLine={market.address}
              title={market.name}
              mapHeight="240px"
              actionSlot={
                directionsUrl ? (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.directionsButton}
                  >
                    <Navigation size={14} aria-hidden="true" />
                    <span>Get Directions</span>
                  </a>
                ) : null
              }
            />

            <div className={styles.facilitiesBlock}>
              <span className={styles.facilitiesTitle}>Market Amenities</span>
              <div className={styles.facilitiesGrid}>
                <span className={styles.facilityPill}>
                  <Car size={14} aria-hidden="true" />
                  <span>Free On-Site Parking</span>
                </span>
                <span className={styles.facilityPill}>
                  <Accessibility size={14} aria-hidden="true" />
                  <span>Step-Free Access</span>
                </span>
                <span className={styles.facilityPill}>
                  <CreditCard size={14} aria-hidden="true" />
                  <span>Card & Contactless</span>
                </span>
                <span className={styles.facilityPill}>
                  <Sparkles size={14} aria-hidden="true" />
                  <span>Dog Friendly</span>
                </span>
              </div>

              {market.note && (
                <div className={styles.marketNoteCard}>
                  <span className={styles.noteLabel}>Parking & Access:</span>
                  <p className={styles.noteBody}>{market.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.stallsSection} id="stalls-directory" aria-labelledby="stalls-heading">
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeaderTitles}>
            <div className={styles.titleWithBadge}>
              <h2 id="stalls-heading" className={styles.sectionHeading}>
                Stalls & Producers
              </h2>
              <span className={styles.stallCountBadge}>
                {allStalls.length}
              </span>
            </div>
            <p className={styles.sectionDesc}>
              {allStalls.length === 1
                ? '1 independent producer pitch'
                : `${allStalls.length} independent growers and artisan makers`}
            </p>
          </div>

          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search stalls or produce..."
              value={stallSearch}
              onChange={(e) => setStallSearch(e.target.value)}
              aria-label="Filter stalls at this market"
            />
            {stallSearch && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setStallSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.categoryBar} role="tablist" aria-label="Filter stalls by category">
          {STALL_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.catPill} ${active ? styles.catPillActive : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {farmersLoading ? (
          <div className={styles.stallsGrid}>
            <Skeleton height="11rem" borderRadius="var(--radius-lg)" />
            <Skeleton height="11rem" borderRadius="var(--radius-lg)" />
            <Skeleton height="11rem" borderRadius="var(--radius-lg)" />
          </div>
        ) : filteredStalls.length > 0 ? (
          <div className={styles.stallsGrid}>
            {filteredStalls.map((farmer) => (
              <FarmerCard
                key={farmer.id || farmer._id}
                farmer={farmer}
                variant="stall"
                audience={audience}
              />
            ))}
          </div>
        ) : (
          <div className={styles.noStallsFound}>
            <p className={styles.noStallsTitle}>No matching stalls found</p>
            <p className={styles.noStallsDesc}>
              Try adjusting your search terms or view all stalls at this market.
            </p>
            <button
              type="button"
              className={styles.resetFiltersBtn}
              onClick={() => {
                setStallSearch('');
                setSelectedCategory('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {freshProducts.length > 0 && (
        <section className={styles.produceSection} aria-labelledby="fresh-heading">
          <div className={styles.produceHeaderRow}>
            <div>
              <span className={styles.sectionEyebrow}>Harvest Catalogue</span>
              <h2 id="fresh-heading" className={styles.sectionHeading}>
                Fresh Produce Available at this Market
              </h2>
              <p className={styles.sectionDesc}>
                Harvested to order for pickup at your scheduled market collection
              </p>
            </div>

            <Link
              to={`${routes.browse}?market=${market.id || market._id}`}
              className={styles.viewAllProduceBtn}
            >
              <span>View all produce</span>
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.produceGrid}>
            {freshProducts.map((product) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                variant="grid"
                audience={audience}
              />
            ))}
          </div>
        </section>
      )}

      <section className={styles.valuesSection} aria-label="MarketLink farmer promise">
        <div className={styles.valueCard}>
          <div className={styles.valueIconCircle}>
            <Sprout size={20} aria-hidden="true" />
          </div>
          <h3 className={styles.valueTitle}>Direct from the Grower</h3>
          <p className={styles.valueText}>
            No brokers or extended cold storage. Over 90% of every sale goes directly to the family farm.
          </p>
        </div>

        <div className={styles.valueCard}>
          <div className={styles.valueIconCircle}>
            <ShoppingBag size={20} aria-hidden="true" />
          </div>
          <h3 className={styles.valueTitle}>Guaranteed Harvest</h3>
          <p className={styles.valueText}>
            Pre-ordering secures scarce varieties and specialty harvests so your basket is ready at the stall.
          </p>
        </div>

        <div className={styles.valueCard}>
          <div className={styles.valueIconCircle}>
            <HeartHandshake size={20} aria-hidden="true" />
          </div>
          <h3 className={styles.valueTitle}>Thriving Local Food</h3>
          <p className={styles.valueText}>
            Support local biodiversity, regional soil health, and seasonal eating across our communities.
          </p>
        </div>
      </section>
    </div>
  );
}

export default MarketView;
