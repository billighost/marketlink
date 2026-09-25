import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Leaf,
  Filter,
  Sliders,
  ChevronDown,
  ShoppingBag,
  Bookmark,
  Star,
  Check,
  X,
  Store,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import styles from './Products.module.css';

export const GUEST_PRODUCTS_DATA = [
  {
    id: 'prod-heirloom-tomatoes',
    name: 'Organic Heirloom Tomato Mix',
    category: 'Vegetables & Greens',
    price: '$6.50',
    unit: '/ basket',
    numericPrice: 6.5,
    farmer: 'Elena Vance',
    farmName: 'Riverbend Farm',
    farmerId: 'f-riverbend',
    location: 'Hudson Valley, NY',
    markets: ['Greenwich Village', 'Union Square'],
    image: '/images/product-tomatoes.jpg',
    badge: 'In Season',
    badgeType: 'in-season',
    isOrganic: true,
    inStock: true,
    stockText: '14 baskets available',
    description:
      'Juicy, vine-ripened mix of Brandywine, Cherokee Purple, and Green Zebra heritage tomatoes. 2 lb basket picked the morning of market.',
    rating: 4.9,
    reviews: 38,
  },
  {
    id: 'prod-country-sourdough',
    name: 'Country Sourdough Loaf',
    category: 'Artisan Bakery',
    price: '$8.00',
    unit: '/ loaf',
    numericPrice: 8.0,
    farmer: 'Dan & Priya Patel',
    farmName: 'Oak & Mill Artisan Bakery',
    farmerId: 'f-oakmill',
    location: 'Kingston, NY',
    markets: ['Greenwich Village', 'Chelsea'],
    image: '/images/product-sourdough.jpg',
    badge: 'Freshly Baked',
    badgeType: 'freshly-baked',
    isOrganic: false,
    inStock: true,
    stockText: '8 loaves left',
    description:
      'Naturally fermented 48-hour sourdough made with stone-milled regional grains. Crackly crust and open, tender, airy crumb.',
    rating: 5.0,
    reviews: 52,
  },
  {
    id: 'prod-wildflower-honey',
    name: 'Raw Meadow Wildflower Honey',
    category: 'Honey & Preserves',
    price: '$12.00',
    unit: '/ 16oz jar',
    numericPrice: 12.0,
    farmer: 'Sarah Jenkins',
    farmName: 'Hollow Creek Apiary',
    farmerId: 'f-hollowcreek',
    location: 'Morris County, NJ',
    markets: ['Greenwich Village', 'Tompkins Square'],
    image: '/images/product-honey.jpg',
    badge: 'Single Origin',
    badgeType: 'specialty',
    isOrganic: true,
    inStock: true,
    stockText: '18 jars in stock',
    description:
      'Unheated, unpasteurized raw honey harvested from pesticide-free wildflower meadows. Golden amber with notes of clover, thyme, and dandelion.',
    rating: 4.9,
    reviews: 44,
  },
  {
    id: 'prod-butterhead-lettuce',
    name: 'Living Butterhead Lettuce',
    category: 'Vegetables & Greens',
    price: '$3.00',
    unit: '/ head',
    numericPrice: 3.0,
    farmer: 'Marcus Chen',
    farmName: "Chen's Organic Acres",
    farmerId: 'f-sunburst',
    location: 'Catskill, NY',
    markets: ['Union Square', 'Chelsea'],
    image: '/images/product-lettuce.jpg',
    badge: 'Harvested Today',
    badgeType: 'in-season',
    isOrganic: true,
    inStock: true,
    stockText: '11 heads available',
    description:
      'Crisp, sweet butterhead lettuce harvested with root ball intact. Stays fresh in your crisper for up to two weeks.',
    rating: 4.8,
    reviews: 29,
  },
  {
    id: 'prod-alpine-strawberries',
    name: 'Organic Alpine Strawberries',
    category: 'Fruit & Berries',
    price: '$6.50',
    unit: '/ pint',
    numericPrice: 6.5,
    farmer: 'Claire Dupont',
    farmName: 'Sunridge Berry Farm',
    farmerId: 'f-sunridge',
    location: 'Dutchess County, NY',
    markets: ['Greenwich Village', 'Union Square'],
    image: '/images/product-strawberries.jpg',
    badge: 'Limited Batch',
    badgeType: 'specialty',
    isOrganic: true,
    inStock: true,
    stockText: '6 pints remaining',
    description:
      'Intensely fragrant European heirloom alpine strawberries. Concentrated sweetness with aromatic floral notes.',
    rating: 5.0,
    reviews: 41,
  },
  {
    id: 'prod-purple-carrots',
    name: 'Heritage Purple & Orange Carrots',
    category: 'Vegetables & Greens',
    price: '$4.00',
    unit: '/ bunch',
    numericPrice: 4.0,
    farmer: 'Elena Vance',
    farmName: 'Riverbend Farm',
    farmerId: 'f-riverbend',
    location: 'Hudson Valley, NY',
    markets: ['Greenwich Village', 'Union Square'],
    image: '/images/hero-carrots.jpg',
    badge: 'In Season',
    badgeType: 'in-season',
    isOrganic: true,
    inStock: true,
    stockText: '20 bunches available',
    description:
      'Crisp, earthy heirloom carrots with rich purple skins and orange cores. Sweet flavor, loaded with anthocyanin antioxidants.',
    rating: 4.8,
    reviews: 26,
  },
  {
    id: 'prod-jersey-butter',
    name: 'Cultured Farmhouse Butter',
    category: 'Dairy & Eggs',
    price: '$7.50',
    unit: '/ 8oz block',
    numericPrice: 7.5,
    farmer: 'Robert Miller',
    farmName: 'Maplecrest Creamery',
    farmerId: 'f-maplecrest',
    location: 'Hunterdon County, NJ',
    markets: ['Union Square', 'Tompkins Square'],
    image: '/images/market-central.jpg',
    badge: 'Grass-Fed',
    badgeType: 'specialty',
    isOrganic: true,
    inStock: true,
    stockText: '12 blocks left',
    description:
      'Slow-churned from cultured pasteurized Jersey cow cream. Rich, golden yellow with 84% butterfat and sea salt crystals.',
    rating: 4.9,
    reviews: 33,
  },
  {
    id: 'prod-wildflower-bouquet',
    name: 'Fresh Market Wildflower Bouquet',
    category: 'Flowers & Herbs',
    price: '$15.00',
    unit: '/ bouquet',
    numericPrice: 15.0,
    farmer: 'Elena Vance',
    farmName: 'The Wildflower Stand',
    farmerId: 'f-riverbend',
    location: 'Hudson Valley, NY',
    markets: ['Greenwich Village'],
    image: '/images/market-wildflower.jpg',
    badge: 'Freshly Cut',
    badgeType: 'freshly-baked',
    isOrganic: true,
    inStock: true,
    stockText: '9 bouquets left',
    description:
      'Hand-tied seasonal arrangement of sunflowers, cosmos, cornflowers, and fragrant eucalyptus harvested Friday afternoon.',
    rating: 5.0,
    reviews: 19,
  },
];

const CATEGORIES = [
  'All Harvest',
  'Vegetables & Greens',
  'Fruit & Berries',
  'Artisan Bakery',
  'Dairy & Eggs',
  'Honey & Preserves',
];

const MARKETS_LIST = [
  'All Markets',
  'Greenwich Village',
  'Union Square',
  'Chelsea',
  'Tompkins Square',
];

export function Products() {
  useDocumentTitle('Fresh Harvest & Farm Goods — MarketLink');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'All Harvest'
  );
  const [selectedMarket, setSelectedMarket] = useState('All Markets');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [reservedItems, setReservedItems] = useState({});
  const [savedItems, setSavedItems] = useState({});

  const toggleReserve = (id, e) => {
    if (e) e.stopPropagation();
    setReservedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSave = (id, e) => {
    if (e) e.stopPropagation();
    setSavedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProducts = useMemo(() => {
    let result = GUEST_PRODUCTS_DATA.filter((p) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesFarm = p.farmName.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        if (!matchesName && !matchesFarm && !matchesDesc && !matchesCat) return false;
      }

      // Category
      if (selectedCategory !== 'All Harvest' && p.category !== selectedCategory) {
        return false;
      }

      // Market
      if (
        selectedMarket !== 'All Markets' &&
        !p.markets.some((m) => m.toLowerCase().includes(selectedMarket.toLowerCase()))
      ) {
        return false;
      }

      // Organic
      if (organicOnly && !p.isOrganic) {
        return false;
      }

      return true;
    });

    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.numericPrice - b.numericPrice);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.numericPrice - a.numericPrice);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [searchQuery, selectedCategory, selectedMarket, organicOnly, sortBy]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedCategory !== 'All Harvest' ||
    selectedMarket !== 'All Markets' ||
    organicOnly
  );

  return (
    <div className={styles.page}>
      {/* ─── 1. HERO SEARCH HEADER ───────────────────────────────── */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>
              <Leaf size={14} className={styles.eyebrowIcon} />
              100% REGIONAL PRODUCER HARVEST
            </span>
            <h1 className={styles.heroTitle}>Fresh From Fields & Local Stalls</h1>
            <p className={styles.heroSubtitle}>
              Explore seasonal heirloom vegetables, stone-milled sourdough, raw wildflower honey,
              and pasture dairy harvested within 150 miles of New York City.
            </p>

            {/* Combined Search & Market Bar */}
            <div className={styles.searchBarRow}>
              <div className={styles.searchInputWrap}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search heirloom tomatoes, sourdough, wildflower honey, kale..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={styles.clearSearchBtn}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Market Filter Dropdown */}
              <div className={styles.marketSelectWrap}>
                <Store size={16} className={styles.marketIcon} />
                <select
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                  className={styles.marketSelect}
                  aria-label="Filter by market"
                >
                  {MARKETS_LIST.map((m) => (
                    <option key={m} value={m}>
                      {m === 'All Markets' ? 'All Markets' : `Pickup: ${m}`}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className={styles.selectChevron} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. CATEGORY FILTER STRIP ────────────────────────────── */}
      <div className={styles.categoryBar}>
        <div className="container">
          <div className={styles.categoryScroll} role="tablist">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.categoryChip} ${
                  selectedCategory === cat ? styles.categoryChipActive : ''
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 3. SUB-FILTER & RESULTS SUMMARY ROW ─────────────────── */}
      <div className={styles.filterMetaBar}>
        <div className="container">
          <div className={styles.filterMetaInner}>
            <div className={styles.filterLeftToggles}>
              <button
                type="button"
                onClick={() => setOrganicOnly((v) => !v)}
                className={`${styles.togglePill} ${organicOnly ? styles.togglePillActive : ''}`}
              >
                <ShieldCheck size={14} />
                <span>Certified Organic</span>
              </button>
              <span className={styles.resultsCount}>
                Showing <strong>{filteredProducts.length}</strong> items available for pre-order
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className={styles.sortWrapper}>
              <span className={styles.sortLabel}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
                aria-label="Sort products"
              >
                <option value="featured">Featured First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. PRODUCTS GRID ────────────────────────────────────── */}
      <main className={styles.productsSection}>
        <div className="container">
          <div className={styles.productsGrid}>
            {filteredProducts.map((p) => {
              const isReserved = reservedItems[p.id];
              const isSaved = savedItems[p.id];

              return (
                <article
                  key={p.id}
                  className={styles.productCard}
                  onClick={() => navigate(`/products/${p.id}`)}
                >
                  {/* Image Wrap */}
                  <div className={styles.imageWrap}>
                    <img src={p.image} alt={p.name} className={styles.productImg} />
                    <span
                      className={
                        p.badgeType === 'in-season'
                          ? styles.badgeSeason
                          : p.badgeType === 'freshly-baked'
                          ? styles.badgeBaked
                          : styles.badgeSpecialty
                      }
                    >
                      {p.badge}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => toggleSave(p.id, e)}
                      className={`${styles.bookmarkBtn} ${isSaved ? styles.bookmarkBtnActive : ''}`}
                      aria-label="Save product"
                    >
                      <Bookmark size={15} fill={isSaved ? '#6A1B29' : 'none'} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className={styles.cardBody}>
                    <div className={styles.farmAttributionRow}>
                      <Link
                        to={`/farmers/${p.farmerId}`}
                        onClick={(e) => e.stopPropagation()}
                        className={styles.farmLink}
                      >
                        {p.farmName}
                      </Link>
                      <span className={styles.farmLoc}>• {p.location}</span>
                    </div>

                    <h2 className={styles.productTitle}>
                      <Link to={`/products/${p.id}`} className={styles.productTitleLink}>
                        {p.name}
                      </Link>
                    </h2>

                    <p className={styles.productDesc}>{p.description}</p>

                    {/* Market Availability Chip */}
                    <div className={styles.marketAvailRow}>
                      <Store size={12} className={styles.marketIconSm} />
                      <span>At {p.markets.join(', ')}</span>
                    </div>

                    {/* Pricing & Stock Row */}
                    <div className={styles.pricingRow}>
                      <div className={styles.priceGroup}>
                        <span className={styles.priceAmount}>{p.price}</span>
                        <span className={styles.priceUnit}>{p.unit}</span>
                      </div>
                      <span className={styles.stockNotice}>{p.stockText}</span>
                    </div>

                    {/* Reserve Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleReserve(p.id, e)}
                      className={`${styles.reserveBtn} ${
                        isReserved ? styles.reserveBtnActive : ''
                      }`}
                    >
                      <ShoppingBag size={15} />
                      <span>{isReserved ? '✓ Reserved for Pickup' : 'Reserve for Pickup'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconBadge}>
                <div className={styles.emptyIconPulse} />
                <Leaf size={32} className={styles.emptyIcon} />
              </div>

              <h3 className={styles.emptyTitle}>No products match your search</h3>

              <p className={styles.emptyDesc}>
                {searchQuery.trim() ? (
                  <>
                    No regional harvests found matching &ldquo;<strong>{searchQuery.trim()}</strong>&rdquo;.
                    Try checking for typos, searching broader crops, or clearing your active filters.
                  </>
                ) : (
                  'We couldn’t find any fresh harvest matching your selected filters. Clear your market or organic filters to see everything available this week.'
                )}
              </p>

              {hasActiveFilters && (
                <div className={styles.activeFilterPills}>
                  <span className={styles.activeFilterPillsLabel}>Active filters:</span>
                  {searchQuery.trim() && (
                    <span className={styles.filterPill}>
                      Search: &ldquo;{searchQuery}&rdquo;
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className={styles.filterPillRemove}
                        title="Remove search filter"
                        aria-label="Remove search filter"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {selectedCategory !== 'All Harvest' && (
                    <span className={styles.filterPill}>
                      {selectedCategory}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('All Harvest')}
                        className={styles.filterPillRemove}
                        title="Remove category filter"
                        aria-label="Remove category filter"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {selectedMarket !== 'All Markets' && (
                    <span className={styles.filterPill}>
                      {selectedMarket}
                      <button
                        type="button"
                        onClick={() => setSelectedMarket('All Markets')}
                        className={styles.filterPillRemove}
                        title="Remove market filter"
                        aria-label="Remove market filter"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}
                  {organicOnly && (
                    <span className={styles.filterPill}>
                      Certified Organic
                      <button
                        type="button"
                        onClick={() => setOrganicOnly(false)}
                        className={styles.filterPillRemove}
                        title="Remove organic filter"
                        aria-label="Remove organic filter"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}
                </div>
              )}

              <div className={styles.emptyActionsRow}>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Harvest');
                    setSelectedMarket('All Markets');
                    setOrganicOnly(false);
                  }}
                  className={styles.resetBtn}
                >
                  <RotateCcw size={15} />
                  <span>Reset All Filters</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Harvest');
                    setSelectedMarket('All Markets');
                    setOrganicOnly(false);
                  }}
                  className={styles.secondaryBtn}
                >
                  <span>Show All Products</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── 5. SEASONAL HARVEST CALENDAR BANNER ─────────────────── */}
      <section className={styles.calendarBannerSection}>
        <div className="container">
          <div className={styles.calendarBanner}>
            <div className={styles.calendarBannerText}>
              <span className={styles.calendarTag}>SPRING / EARLY SUMMER CROP</span>
              <h2>What's Peak in Season This Week</h2>
              <p>
                Regional soil yields its best flavor when picked at natural peak ripeness. Right now
                our Hudson Valley and New Jersey growers are harvesting tender asparagus, sweet alpine
                strawberries, garlic scapes, and French breakfast radishes.
              </p>
            </div>
            <Link to={PATHS.MARKETS} className={styles.findMarketCta}>
              <Calendar size={16} />
              <span>Find Weekend Markets</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Products;
