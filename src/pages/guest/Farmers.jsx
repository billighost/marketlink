import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Store, Leaf, ShieldCheck, Star, ArrowRight,
  X, Eye, Sparkles, SlidersHorizontal, RotateCcw,
  TrendingUp, Clock, PackageCheck, AlertCircle, ChevronDown,
} from "lucide-react";
import { getFarmers, getMarkets, getFarmerProducts } from "@/api/catalog";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import BottomSheet from "@/components/ui/BottomSheet";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { formatPrice } from "@/utils/format";
import styles from "./Farmers.module.css";

const CATEGORIES = [
  { id: "all", label: "All Growers", icon: "🌿" },
  { id: "vegetables", label: "Vegetables & Herbs", icon: "🥦" },
  { id: "fruit", label: "Fruit & Berries", icon: "🍓" },
  { id: "bakery", label: "Bakery", icon: "🍞" },
  { id: "dairy", label: "Dairy & Cheese", icon: "🧀" },
  { id: "honey", label: "Honey & Preserves", icon: "🍯" },
];

const SORT_OPTIONS = [
  { id: "rating", label: "Top Rated" },
  { id: "top", label: "Best Sellers" },
  { id: "new", label: "Newest" },
  { id: "name", label: "A → Z" },
];

const ART_EMOJI = {
  vegetables: "🥦", fruit: "🍎", bakery: "🍞", dairy: "🧀",
  honey: "🍯", herbs: "🌿", mushroom: "🍄", eggs: "🥚",
  meat: "🥩", fish: "🐟", flowers: "🌸", grains: "🌾",
};

function getArtDisplay(farmer) {
  if (farmer.art && ART_EMOJI[farmer.art]) return ART_EMOJI[farmer.art];
  const s = (farmer.stallName || "").toLowerCase();
  if (s.includes("bread") || s.includes("bakery") || s.includes("hearth")) return "🍞";
  if (s.includes("dairy") || s.includes("cream") || s.includes("cheese")) return "🧀";
  if (s.includes("honey") || s.includes("apiary") || s.includes("bee")) return "🍯";
  if (s.includes("berry") || s.includes("orchard") || s.includes("fruit")) return "🍎";
  if (s.includes("flower") || s.includes("bloom")) return "🌸";
  return "🌿";
}

function getStallInitials(stallName = "") {
  return stallName.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("");
}

function formatOperatingDays(days = []) {
  const MAP = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
  if (!days.length) return null;
  return days.map((d) => MAP[d] || d).join(" · ");
}

function FarmerCardSkeleton() {
  return (
    <div className={styles.cardSkeleton}>
      <div className={styles.skeletonHeader}>
        <Skeleton height="100%" style={{ borderRadius: "0", position: "absolute", inset: 0 }} />
      </div>
      <div className={styles.skeletonBody}>
        <Skeleton height="22px" width="70%" style={{ marginBottom: 8 }} />
        <Skeleton height="14px" width="50%" style={{ marginBottom: 12 }} />
        <Skeleton height="14px" width="90%" style={{ marginBottom: 6 }} />
        <Skeleton height="14px" width="80%" style={{ marginBottom: 18 }} />
        <Skeleton height="36px" />
      </div>
    </div>
  );
}

function FarmerCard({ farmer, onPeek }) {
  const hasImage = Boolean(farmer.bannerUrl || farmer.imageUrl);
  const days = formatOperatingDays(farmer.operatingDays);
  const initials = getStallInitials(farmer.stallName);
  const art = getArtDisplay(farmer);

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        {hasImage ? (
          <img
            src={farmer.bannerUrl || farmer.imageUrl}
            alt={farmer.stallName}
            className={styles.cardCover}
            loading="lazy"
          />
        ) : null}
        <div className={`${styles.cardCoverFallback} ${hasImage ? styles.hidden : ""}`}>
          <span className={styles.cardArtEmoji}>{art}</span>
        </div>
        <div className={styles.cardHeaderOverlay}>
          {farmer.openToday && (
            <span className={styles.openBadge}>
              <span className={styles.openBadgeDot} /> Open Today
            </span>
          )}
          {farmer.isTopSeller && (
            <span className={styles.topSellerBadge}>
              <TrendingUp size={11} /> Top Seller
            </span>
          )}
          {farmer.isNew && <span className={styles.newBadge}>New</span>}
        </div>
        <div className={styles.cardLogo}>
          {farmer.logoUrl ? (
            <img src={farmer.logoUrl} alt={farmer.stallName} className={styles.cardLogoImg} />
          ) : (
            <span className={styles.cardLogoInitials}>{initials}</span>
          )}
        </div>
        {farmer.ratingAvg > 0 && (
          <div className={styles.ratingChip}>
            <Star size={11} fill="#E07A2C" color="#E07A2C" />
            <span>{Number(farmer.ratingAvg).toFixed(1)}</span>
            <span className={styles.ratingCount}>({farmer.ratingCount})</span>
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTitleRow}>
          <h2 className={styles.cardTitle}>{farmer.stallName}</h2>
          {farmer.stallNumber && <span className={styles.stallNum}>Stall {farmer.stallNumber}</span>}
        </div>
        {farmer.specialty && <p className={styles.cardSpecialty}>{farmer.specialty}</p>}
        {(farmer.lowStockCount > 0 || farmer.soldOutCount > 0) && (
          <div className={styles.stockRow}>
            {farmer.lowStockCount > 0 && (
              <span className={styles.lowStockPill}><AlertCircle size={11} /> {farmer.lowStockCount} low stock</span>
            )}
            {farmer.soldOutCount > 0 && (
              <span className={styles.soldOutPill}><PackageCheck size={11} /> {farmer.soldOutCount} sold out</span>
            )}
          </div>
        )}
        {farmer.markets?.length > 0 && (
          <div className={styles.marketsRow}>
            <Store size={12} className={styles.marketsIcon} />
            <span className={styles.marketsText}>{farmer.markets.slice(0, 2).map((m) => m.name).join(" · ")}</span>
          </div>
        )}
        {days && (
          <div className={styles.daysRow}>
            <Clock size={12} className={styles.daysIcon} />
            <span className={styles.daysText}>{days}</span>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <button type="button" onClick={onPeek} className={styles.peekBtn} title="Quick peek at seasonal produce">
          <Eye size={14} />
          <span>Peek</span>
        </button>
        <Link to={`/farmers/${farmer.id}`} className={styles.visitBtn}>
          <span>Explore Stall</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

export function Farmers() {
  useDocumentTitle("Local Farmers & Producers — MarketLink");
  const navigate = useNavigate();

  const [farmers, setFarmers] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMarketId, setSelectedMarketId] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [peekFarmer, setPeekFarmer] = useState(null);
  const [peekProducts, setPeekProducts] = useState([]);
  const [peekLoading, setPeekLoading] = useState(false);
  const [peekError, setPeekError] = useState("");

  const debounceTimer = useRef(null);
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(val), 380);
  };

  const fetchFarmers = useCallback(async ({ cursor = null, replace = true } = {}) => {
    if (replace) { setLoading(true); setError(""); }
    else setLoadingMore(true);
    try {
      const query = { sort: sortBy, limit: 12 };
      if (debouncedQuery.trim()) query.q = debouncedQuery.trim();
      if (selectedCategory !== "all") query.category = selectedCategory;
      if (selectedMarketId !== "all") query.market = selectedMarketId;
      if (cursor) query.cursor = cursor;
      const res = await getFarmers(query);
      const list = Array.isArray(res) ? res : res?.data || [];
      const meta = res?.meta || {};
      setFarmers((prev) => (replace ? list : [...prev, ...list]));
      setNextCursor(meta.nextCursor || null);
      setHasMore(Boolean(meta.nextCursor));
    } catch (err) {
      setError(err?.message || "Failed to load farmers. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedQuery, selectedCategory, selectedMarketId, sortBy]);

  useEffect(() => { fetchFarmers({ replace: true }); }, [fetchFarmers]);

  useEffect(() => {
    getMarkets().then((res) => {
      const list = Array.isArray(res) ? res : res?.data || [];
      setMarkets(list);
    }).catch(() => {});
  }, []);

  const handleOpenPeek = async (farmer, e) => {
    e?.preventDefault();
    setPeekFarmer(farmer);
    setPeekProducts([]);
    setPeekLoading(true);
    setPeekError("");
    try {
      const res = await getFarmerProducts(farmer.id, { limit: 8 });
      const list = Array.isArray(res) ? res : res?.data || [];
      setPeekProducts(list);
    } catch {
      setPeekError("Could not load products for this stall.");
    } finally {
      setPeekLoading(false);
    }
  };

  const activeFiltersCount = (selectedMarketId !== "all" ? 1 : 0) + (verifiedOnly ? 1 : 0) + (sortBy !== "rating" ? 1 : 0);

  const displayedFarmers = useMemo(() => {
    if (!verifiedOnly) return farmers;
    return farmers.filter((f) => f.ratingAvg >= 4 || f.isTopSeller);
  }, [farmers, verifiedOnly]);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedMarketId("all");
    setSortBy("rating");
    setVerifiedOnly(false);
    setSearchQuery("");
    setDebouncedQuery("");
  };

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={styles.heroSection}>
        <div className={styles.heroNoise} aria-hidden="true" />
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <Leaf size={13} />
              100% Regional Producer-Only Network
            </span>
            <h1 className={styles.heroTitle}>
              Meet Your Local<br />
              <em>Farmers &amp; Artisans</em>
            </h1>
            <p className={styles.heroSubtitle}>
              Every grower on MarketLink is an independent family farm or food artisan.
              Zero middlemen — harvested within hours of your pickup.
            </p>

            <div className={styles.statsBar}>
              <div className={styles.statItem}>
                <span className={styles.statNum}>{loading ? "—" : (farmers.length || "—")}</span>
                <span className={styles.statLabel}>Verified Producers</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum}>{markets.length || "—"}</span>
                <span className={styles.statLabel}>Market Locations</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum}>100%</span>
                <span className={styles.statLabel}>Direct-to-Customer</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statNum}>&lt; 45mi</span>
                <span className={styles.statLabel}>Avg Farm Distance</span>
              </div>
            </div>

            <div className={styles.searchRow}>
              <div className={styles.searchInputWrap}>
                <Search size={17} className={styles.searchIcon} />
                <input
                  id="farmer-search"
                  type="search"
                  placeholder="Search by farm name or specialty..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={styles.searchInput}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              <div className={styles.sortWrap}>
                <select
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort farmers"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className={styles.sortChevron} />
              </div>
              <button
                type="button"
                className={`${styles.filterBtn} ${activeFiltersCount > 0 ? styles.filterBtnActive : ""}`}
                onClick={() => setFilterSheetOpen(true)}
              >
                <SlidersHorizontal size={16} />
                <span>Filters</span>
                {activeFiltersCount > 0 && <span className={styles.filterBadge}>{activeFiltersCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY PILLS */}
      <div className={styles.categoryBar}>
        <div className="container">
          <div className={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`${styles.categoryChip} ${selectedCategory === cat.id ? styles.categoryChipActive : ""}`}
              >
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GRID */}
      <section className={styles.gridSection}>
        <div className="container">
          {!loading && !error && (
            <div className={styles.metaRow}>
              <p className={styles.resultsText}>
                {displayedFarmers.length === 0
                  ? "No growers found"
                  : <><strong>{displayedFarmers.length}</strong> verified growers</>}
                {selectedCategory !== "all" && ` · ${CATEGORIES.find((c) => c.id === selectedCategory)?.label}`}
              </p>
              {(searchQuery || selectedCategory !== "all" || selectedMarketId !== "all" || verifiedOnly) && (
                <button type="button" onClick={resetFilters} className={styles.resetBtn}>
                  <RotateCcw size={13} />
                  <span>Reset all</span>
                </button>
              )}
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={20} />
              <div>
                <strong>Failed to load farmers</strong>
                <p>{error}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => fetchFarmers({ replace: true })}>Retry</Button>
            </div>
          )}

          <div className={styles.grid}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <FarmerCardSkeleton key={i} />)
            ) : displayedFarmers.length > 0 ? (
              displayedFarmers.map((farmer) => (
                <FarmerCard key={farmer.id} farmer={farmer} onPeek={(e) => handleOpenPeek(farmer, e)} />
              ))
            ) : !error ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIllustration}>🌱</div>
                <h3 className={styles.emptyTitle}>No growers found</h3>
                <p className={styles.emptyText}>Try adjusting your search or clearing the filters.</p>
                <Button variant="secondary" size="md" onClick={resetFilters}>Clear all filters</Button>
              </div>
            ) : null}
          </div>

          {hasMore && !loading && !error && (
            <div className={styles.loadMoreRow}>
              <Button variant="secondary" size="md" loading={loadingMore} disabled={loadingMore}
                onClick={() => fetchFarmers({ cursor: nextCursor, replace: false })}>
                Load more growers
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* PEEK MODAL */}
      {peekFarmer && (
        <BottomSheet
          isOpen={true}
          onClose={() => setPeekFarmer(null)}
          size="peek"
          title={peekFarmer.stallName}
          footer={
            <div className={styles.peekFooter}>
              <button type="button" className={styles.peekCloseBtn} onClick={() => setPeekFarmer(null)}>Close</button>
              <Link to={`/farmers/${peekFarmer.id}`} className={styles.peekVisitBtn} onClick={() => setPeekFarmer(null)}>
                <span>View Full Stall</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          }
        >
          <div className={styles.peekContent}>
            <div className={styles.peekBanner}>
              <div className={styles.peekArt}>{getArtDisplay(peekFarmer)}</div>
              <div className={styles.peekInfo}>
                <h3 className={styles.peekStallName}>{peekFarmer.stallName}</h3>
                {peekFarmer.specialty && <p className={styles.peekSpecialty}>{peekFarmer.specialty}</p>}
                <div className={styles.peekMeta}>
                  {peekFarmer.ratingAvg > 0 && (
                    <span className={styles.peekRating}>
                      <Star size={12} fill="#E07A2C" color="#E07A2C" />
                      <strong>{Number(peekFarmer.ratingAvg).toFixed(1)}</strong>
                      <span>({peekFarmer.ratingCount})</span>
                    </span>
                  )}
                  {peekFarmer.openToday && (
                    <span className={styles.peekOpenBadge}><span className={styles.openDot} /> Open Today</span>
                  )}
                </div>
              </div>
            </div>

            {peekFarmer.markets?.length > 0 && (
              <div className={styles.peekMarkets}>
                <span className={styles.peekMarketsLabel}><Store size={13} /> Pickup at:</span>
                <div className={styles.peekMarketsList}>
                  {peekFarmer.markets.slice(0, 2).map((m) => (
                    <span key={m.id} className={styles.peekMarketPill}>{m.name}</span>
                  ))}
                </div>
              </div>
            )}

            {peekFarmer.operatingDays?.length > 0 && (
              <div className={styles.peekDays}>
                <Clock size={13} />
                <span>{formatOperatingDays(peekFarmer.operatingDays)}</span>
              </div>
            )}

            <div className={styles.peekProductsHeader}>
              <span className={styles.peekProductsTitle}><Sparkles size={13} /> Seasonal Harvest Available</span>
              {peekProducts.length > 0 && <span className={styles.peekProductCount}>{peekProducts.length} items</span>}
            </div>

            {peekLoading ? (
              <div className={styles.peekLoadingGrid}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.peekProductSkeleton}>
                    <Skeleton height="14px" width="80%" style={{ marginBottom: 6 }} />
                    <Skeleton height="18px" width="50%" />
                  </div>
                ))}
              </div>
            ) : peekError ? (
              <p className={styles.peekErrorText}>{peekError}</p>
            ) : peekProducts.length === 0 ? (
              <div className={styles.peekEmpty}>
                <p>Catalog refreshing for this week&apos;s market.</p>
                <Link to={`/farmers/${peekFarmer.id}`} className={styles.peekEmptyLink}>See full stall details →</Link>
              </div>
            ) : (
              <div className={styles.peekGrid}>
                {peekProducts.map((p) => (
                  <div key={p.id || p._id} className={styles.peekProductCard}>
                    <span className={styles.peekProductArt}>{p.art ? (ART_EMOJI[p.art] || "🌿") : "🌿"}</span>
                    <div className={styles.peekProductInfo}>
                      <p className={styles.peekProductName}>{p.name}</p>
                      <div className={styles.peekProductPriceLine}>
                        <span className={styles.peekProductPrice}>{formatPrice(p.priceCents)}</span>
                        {p.unit && <span className={styles.peekProductUnit}>/ {p.unit}</span>}
                      </div>
                      {p.availability === "low" && <span className={styles.peekLowStock}>Low stock</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </BottomSheet>
      )}

      {/* FILTER SHEET */}
      <BottomSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filter Producers"
        footer={
          <div className={styles.filterFooter}>
            <button type="button" className={styles.filterResetBtn}
              onClick={() => { setSelectedMarketId("all"); setSortBy("rating"); setVerifiedOnly(false); }}>
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
            <button type="button" className={styles.filterApplyBtn} onClick={() => setFilterSheetOpen(false)}>
              {loading ? "Loading..." : `Show ${displayedFarmers.length} Growers`}
            </button>
          </div>
        }
      >
        <div className={styles.filterContent}>
          <div className={styles.filterSection}>
            <p className={styles.filterSectionLabel}>Sort by</p>
            <div className={styles.filterPillGrid}>
              {SORT_OPTIONS.map((opt) => (
                <button key={opt.id} type="button"
                  className={`${styles.filterPill} ${sortBy === opt.id ? styles.filterPillActive : ""}`}
                  onClick={() => setSortBy(opt.id)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {markets.length > 0 && (
            <div className={styles.filterSection}>
              <p className={styles.filterSectionLabel}><Store size={14} /> Market Location</p>
              <div className={styles.filterPillGrid}>
                <button type="button"
                  className={`${styles.filterPill} ${selectedMarketId === "all" ? styles.filterPillActive : ""}`}
                  onClick={() => setSelectedMarketId("all")}>
                  All Markets
                </button>
                {markets.map((m) => {
                  const mid = m.id || m._id?.toString();
                  return (
                    <button key={mid} type="button"
                      className={`${styles.filterPill} ${selectedMarketId === mid ? styles.filterPillActive : ""}`}
                      onClick={() => setSelectedMarketId(mid)}>
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.filterSection}>
            <p className={styles.filterSectionLabel}><ShieldCheck size={14} /> Standards</p>
            <div
              role="button" tabIndex={0}
              className={`${styles.filterToggleCard} ${verifiedOnly ? styles.filterToggleCardActive : ""}`}
              onClick={() => setVerifiedOnly((v) => !v)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setVerifiedOnly((v) => !v)}
            >
              <div>
                <strong className={styles.filterToggleTitle}>High-Rated Producers Only</strong>
                <p className={styles.filterToggleSub}>4+ rated regional family farms</p>
              </div>
              <div className={`${styles.toggle} ${verifiedOnly ? styles.toggleOn : ""}`}>
                <div className={styles.toggleThumb} />
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

export default Farmers;
