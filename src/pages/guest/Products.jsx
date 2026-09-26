<<<<<<< HEAD
﻿import React, { useState, useEffect, useMemo } from 'react';import { Link, useNavigate, useSearchParams } from 'react-router-dom';import {  Search,  MapPin,  Leaf,  Store,  Bookmark,  Star,  X,  ShieldCheck,  ShoppingBag,} from 'lucide-react';import { getProducts, getCategories } from '@/api/catalog';import { formatPrice } from '@/utils/format';import { PATHS } from '@/routes/paths';import useDocumentTitle from '@/hooks/useDocumentTitle';import styles from './Products.module.css';export function Products() {  useDocumentTitle('Fresh Harvest & Farm Goods ΓÇö MarketLink');  const navigate = useNavigate();  const [searchParams, setSearchParams] = useSearchParams();  const [rawProducts, setRawProducts] = useState([]);  const [categories, setCategories] = useState(['All Harvest']);  const [loading, setLoading] = useState(true);  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');  const [selectedCategory, setSelectedCategory] = useState(    searchParams.get('category') || 'All Harvest'  );  const [sortBy, setSortBy] = useState('featured');  const [savedItems, setSavedItems] = useState({});  useEffect(() => {    let active = true;    setLoading(true);    Promise.all([      getProducts().catch(() => []),      getCategories().catch(() => []),    ])      .then(([prods, cats]) => {        if (!active) return;        const pList = Array.isArray(prods) ? prods : prods?.items || prods?.data || [];        setRawProducts(pList);        const cList = Array.isArray(cats) ? cats : cats?.items || cats?.data || [];        const catNames = ['All Harvest', ...cList.map((c) => (typeof c === 'string' ? c : c.name || c.id))];        setCategories(catNames);      })      .finally(() => {        if (active) setLoading(false);      });    return () => {      active = false;    };  }, []);  const normalizedProducts = useMemo(() => {    return rawProducts.map((p) => {      const id = p.id || p._id;      const farmName = p.farmer?.stallName || p.farmer?.name || 'Local Farm';      return {        id,        name: p.name,        category: p.category || 'Vegetables & Greens',        price: formatPrice(p.priceCents || p.price),        unit: `/ ${p.unit || 'each'}`,        numericPrice: (p.priceCents || 0) / 100,        farmer: farmName,        farmName,        farmerId: p.farmer?.id || p.farmerId,        location: p.farmer?.location || 'Local Region',        image: p.image || '/images/product-tomatoes.jpg',        badge: p.availability === 'in_stock' ? 'In Season' : 'Fresh',        badgeType: 'in-season',        inStock: p.availability !== 'out',        stockText: p.quantityAvailable ? `${p.quantityAvailable} available` : 'Freshly harvested',        description: p.description || 'Grown with care by local producers and packed fresh for your Saturday pickup.',        rating: p.rating || 4.9,        reviews: p.reviewCount || 28,      };    });  }, [rawProducts]);  const toggleSave = (id, e) => {    if (e) e.stopPropagation();    setSavedItems((prev) => ({ ...prev, [id]: !prev[id] }));  };  const filteredProducts = useMemo(() => {    let result = normalizedProducts.filter((p) => {      if (searchQuery.trim()) {        const q = searchQuery.toLowerCase();        const matchesName = p.name?.toLowerCase().includes(q);        const matchesFarm = p.farmName?.toLowerCase().includes(q);        const matchesDesc = p.description?.toLowerCase().includes(q);        if (!matchesName && !matchesFarm && !matchesDesc) return false;      }      if (selectedCategory !== 'All Harvest' && p.category !== selectedCategory) {        return false;      }      return true;    });    if (sortBy === 'price-low') {      result.sort((a, b) => a.numericPrice - b.numericPrice);    } else if (sortBy === 'price-high') {      result.sort((a, b) => b.numericPrice - a.numericPrice);    } else if (sortBy === 'rating') {      result.sort((a, b) => b.rating - a.rating);    }    return result;  }, [normalizedProducts, searchQuery, selectedCategory, sortBy]);  return (    <div className={styles.page}>      {}      <section className={styles.heroSection}>        <div className="container">          <div className={styles.heroContent}>            <span className={styles.eyebrow}>              <Leaf size={14} className={styles.eyebrowIcon} />              HARVEST DIRECTORY            </span>            <h1 className={styles.heroTitle}>Explore Fresh Harvest & Artisan Goods</h1>            <p className={styles.heroSubtitle}>              Reserve seasonal fruits, heritage vegetables, fresh bread, and farm goods online. Pick up              and pay in person at your Saturday market stall.            </p>            {}            <div className={styles.searchBarWrapper}>              <div className={styles.searchInputGroup}>                <Search size={18} className={styles.searchIcon} />                <input                  type="text"                  placeholder="Search tomatoes, sourdough, peaches, honey..."                  value={searchQuery}                  onChange={(e) => setSearchQuery(e.target.value)}                  className={styles.searchInput}                />                {searchQuery && (                  <button                    type="button"                    onClick={() => setSearchQuery('')}                    className={styles.clearSearchBtn}                    aria-label="Clear search"                  >                    <X size={15} />                  </button>                )}              </div>            </div>          </div>        </div>      </section>      {}      <div className={styles.categoryBar}>        <div className="container">          <div className={styles.categoryScroll} role="tablist">            {categories.map((cat) => (              <button                key={cat}                type="button"                onClick={() => setSelectedCategory(cat)}                className={`${styles.categoryChip} ${                  selectedCategory === cat ? styles.categoryChipActive : ''                }`}              >                {cat}              </button>            ))}          </div>        </div>      </div>      {}      <div className={styles.filterMetaBar}>        <div className="container">          <div className={styles.filterMetaInner}>            <div className={styles.filterLeftToggles}>              <span className={styles.resultsCount}>                Showing <strong>{filteredProducts.length}</strong> items available for pre-order              </span>            </div>            {}            <div className={styles.sortWrapper}>              <span className={styles.sortLabel}>Sort by:</span>              <select                value={sortBy}                onChange={(e) => setSortBy(e.target.value)}                className={styles.sortSelect}                aria-label="Sort products"              >                <option value="featured">Featured First</option>                <option value="price-low">Price: Low to High</option>                <option value="price-high">Price: High to Low</option>                <option value="rating">Highest Rated</option>              </select>            </div>          </div>        </div>      </div>      {}      <main className={styles.productsSection}>        <div className="container">          <div className={styles.productsGrid}>            {loading ? (              <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: '#6e655c' }}>                Loading fresh harvest...              </div>            ) : filteredProducts.length > 0 ? (              filteredProducts.map((p) => {                const isSaved = savedItems[p.id];                return (                  <article                    key={p.id}                    className={styles.productCard}                    onClick={() => navigate(`/products/${p.id}`)}                  >                    <div className={styles.imageWrap}>                      <img src={p.image} alt={p.name} className={styles.productImg} />                      <span className={styles.badgeSeason}>{p.badge}</span>                      <button                        type="button"                        onClick={(e) => toggleSave(p.id, e)}                        className={`${styles.bookmarkBtn} ${isSaved ? styles.bookmarkBtnActive : ''}`}                        aria-label="Save product"                      >                        <Bookmark size={15} fill={isSaved ? '#541722' : 'none'} />                      </button>                    </div>                    <div className={styles.cardContent}>                      <div className={styles.vendorRow}>                        <span className={styles.vendorName}>{p.farmName}</span>                        <div className={styles.ratingBadge}>                          <Star size={11} fill="#D4850A" color="#D4850A" />                          <span>{p.rating}</span>                        </div>                      </div>                      <h2 className={styles.productTitle}>                        <Link to={`/products/${p.id}`} className={styles.titleLink}>                          {p.name}                        </Link>                      </h2>                      <p className={styles.description}>{p.description}</p>                      <div className={styles.cardBottomRow}>                        <div className={styles.priceGroup}>                          <span className={styles.price}>{p.price}</span>                          <span className={styles.unit}>{p.unit}</span>                        </div>                        <span className={styles.stockNote}>{p.stockText}</span>                      </div>                      <div className={styles.cardActions}>                        <Link to={`/products/${p.id}`} className={styles.reserveBtn}>                          <ShoppingBag size={14} />                          <span>Pre-Order Details</span>                        </Link>                      </div>                    </div>                  </article>                );              })            ) : (              <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: '#6e655c' }}>                <h3>No harvest items found</h3>                <p>Try searching for a different crop or resetting your category filter.</p>              </div>            )}          </div>        </div>      </main>    </div>  );}export default Products;
=======
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Leaf,
  Store,
  Bookmark,
  Star,
  X,
  ShoppingBag,
  RotateCcw,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { getProducts, getCategories } from '@/api/catalog';
import { formatPrice } from '@/utils/format';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { Illustration } from '@/components/domain/Illustration';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import styles from './Products.module.css';

function getProductVisual(product) {
  if (product?.imageUrl) return { type: 'img', src: product.imageUrl };
  if (product?.image) return { type: 'img', src: product.image };
  const name = (product?.name || '').toLowerCase();
  const art = (product?.art || '').toLowerCase();
  if (name.includes('tomato') || art.includes('tomato')) return { type: 'img', src: '/images/product-tomatoes.jpg' };
  if (name.includes('sourdough') || name.includes('bread') || name.includes('loaf') || art.includes('sourdough') || art.includes('bread')) {
    return { type: 'img', src: '/images/product-sourdough.jpg' };
  }
  if (name.includes('lettuce') || name.includes('green') || name.includes('kale') || name.includes('chard') || art.includes('lettuce')) {
    return { type: 'img', src: '/images/product-lettuce.jpg' };
  }
  if (name.includes('strawberr') || name.includes('berry') || art.includes('strawberr')) {
    return { type: 'img', src: '/images/product-strawberries.jpg' };
  }
  if (name.includes('honey') || art.includes('honey')) return { type: 'img', src: '/images/product-honey.jpg' };
  if (name.includes('carrot') || art.includes('carrot')) return { type: 'img', src: '/images/hero-carrots.jpg' };
  if (name.includes('bouquet') || name.includes('flower') || art.includes('flower')) return { type: 'illustration', name: 'flowers' };
  if (name.includes('corn') || art.includes('corn')) return { type: 'illustration', name: 'corn' };
  if (name.includes('mushroom') || name.includes('lion') || name.includes('oyster') || art.includes('mushroom')) {
    return { type: 'illustration', name: 'mushrooms' };
  }
  if (name.includes('cheese') || name.includes('ricotta') || name.includes('dairy') || art.includes('cheese')) {
    return { type: 'illustration', name: 'cheese-wedge' };
  }
  if (name.includes('egg') || name.includes('poultry') || art.includes('egg')) return { type: 'illustration', name: 'egg-carton' };
  if (name.includes('beet') || art.includes('beet')) return { type: 'illustration', name: 'beet-bunch' };
  if (product?.art) return { type: 'illustration', name: product.art };
  return { type: 'illustration', name: 'basket' };
}

export function Products() {
  useDocumentTitle('Fresh Harvest & Farm Goods — MarketLink');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { add } = useCart();
  const { isProductFavorite, toggleProduct } = useFavorites();
  const { showToast } = useToast();

  const [rawProducts, setRawProducts] = useState([]);
  const [categories, setCategories] = useState(['All Harvest']);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'All Harvest'
  );
  const [sortBy, setSortBy] = useState('featured');
  const [reservedSet, setReservedSet] = useState(new Set());

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      getProducts().catch(() => []),
      getCategories().catch(() => []),
    ])
      .then(([prods, cats]) => {
        if (!active) return;
        const pList = Array.isArray(prods) ? prods : prods?.items || prods?.data || [];
        setRawProducts(pList);

        const cList = Array.isArray(cats) ? cats : cats?.items || cats?.data || [];
        const catNames = ['All Harvest', ...cList.map((c) => (typeof c === 'string' ? c : c.name || c.id))];
        setCategories(catNames);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const normalizedProducts = useMemo(() => {
    return rawProducts.map((p) => {
      const id = p.id || p._id;
      const farmName = p.farmer?.stallName || p.farmer?.name || 'Local Farm';
      const stallNumber = p.farmer?.stallNumber || '';
      const catName = typeof p.category === 'object' ? p.category?.name || 'Vegetables & Greens' : p.category || 'Vegetables & Greens';
      const isOut = p.availability === 'out';
      const isLow = p.availability === 'low';
      const isSeasonal = (p.tags || []).includes('seasonal');
      const isOrganic = (p.tags || []).includes('organic');
      const isBestseller = (p.tags || []).includes('bestseller');

      let badge = 'In Season';
      let badgeClass = styles.badgeSeason;
      if (isOrganic) {
        badge = 'Organic';
        badgeClass = styles.badgeSpecialty;
      } else if (isBestseller) {
        badge = 'Bestseller';
        badgeClass = styles.badgeBaked;
      } else if (catName.toLowerCase().includes('bakery') || catName.toLowerCase().includes('bread')) {
        badge = 'Freshly Baked';
        badgeClass = styles.badgeBaked;
      }

      return {
        id,
        name: p.name,
        category: catName,
        price: formatPrice(p.priceCents || p.price),
        unit: `/ ${p.unit || 'each'}`,
        numericPrice: (p.priceCents || 0) / 100,
        farmer: farmName,
        farmName,
        stallNumber,
        farmerId: p.farmer?.id || p.farmerId,
        location: p.farmer?.location || 'Hudson Valley & Regional',
        visual: getProductVisual(p),
        badge,
        badgeClass,
        inStock: !isOut,
        stockText: p.quantityLeft ? `${p.quantityLeft} available` : isLow ? 'Low stock' : 'Freshly harvested',
        description: p.description || 'Grown with care by local producers and packed fresh for your Saturday market pickup.',
        rating: p.ratingAvg ? Number(p.ratingAvg).toFixed(1) : '4.9',
        reviews: p.ratingCount || 18,
      };
    });
  }, [rawProducts]);

  const handleToggleBookmark = (id, e) => {
    if (e) e.stopPropagation();
    toggleProduct(id);
  };

  const handleReserve = (p, e) => {
    if (e) e.stopPropagation();
    add(p.id, { farmerId: p.farmerId });
    setReservedSet((prev) => {
      const next = new Set(prev);
      next.add(p.id);
      return next;
    });
    showToast({
      message: `Added ${p.name} to your Saturday pickup basket`,
      type: 'success',
      action: 'View Basket',
      onAction: () => navigate('/buyer/cart'),
    });
  };

  const filteredProducts = useMemo(() => {
    let result = normalizedProducts.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesFarm = p.farmName?.toLowerCase().includes(q);
        const matchesDesc = p.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesFarm && !matchesDesc) return false;
      }

      if (selectedCategory !== 'All Harvest' && p.category !== selectedCategory) {
        return false;
      }

      return true;
    });

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.numericPrice - b.numericPrice);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.numericPrice - a.numericPrice);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => Number(b.rating) - Number(a.rating));
    }

    return result;
  }, [normalizedProducts, searchQuery, selectedCategory, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'All Harvest';

  return (
    <div className={styles.page}>
      {/* ─── 1. HERO SEARCH BANNER ───────────────────────────────── */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>
              <Leaf size={14} className={styles.eyebrowIcon} />
              HARVEST DIRECTORY
            </span>
            <h1 className={styles.heroTitle}>Explore Fresh Harvest & Artisan Goods</h1>
            <p className={styles.heroSubtitle}>
              Reserve seasonal fruits, heritage vegetables, fresh bread, and farm goods online. Pick up
              and pay in person at your Saturday market stall.
            </p>

            {/* Filter Bar */}
            <div className={styles.searchBarRow}>
              <div className={styles.searchInputWrap}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search tomatoes, sourdough, peaches, honey, herbs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  aria-label="Search produce and goods"
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
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. CATEGORY FILTER STRIP ────────────────────────────── */}
      <div className={styles.categoryBar}>
        <div className="container">
          <div className={styles.categoryScroll} role="tablist">
            {categories.map((cat) => (
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

      {/* ─── 3. SUB-FILTER & RESULTS SUMMARY ROW ──────────────────── */}
      <div className={styles.filterMetaBar}>
        <div className="container">
          <div className={styles.filterMetaInner}>
            <div className={styles.filterLeftToggles}>
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

      {/* ─── 4. PRODUCTS GRID ─────────────────────────────────────── */}
      <main className={styles.productsSection}>
        <div className="container">
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#6e655c' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 600 }}>
                <Sparkles size={18} color="#6a1b29" />
                Loading seasonal harvest...
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className={styles.productsGrid}>
              {filteredProducts.map((p) => {
                const isSaved = isProductFavorite(p.id);
                const isReserved = reservedSet.has(p.id);

                return (
                  <article
                    key={p.id}
                    className={styles.productCard}
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    <div className={styles.imageWrap}>
                      {p.visual.type === 'img' ? (
                        <img
                          src={p.visual.src}
                          alt={p.name}
                          className={styles.productImg}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const sibling = e.currentTarget.parentElement?.querySelector('[data-fallback]');
                            if (sibling) sibling.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      <div
                        data-fallback
                        className={styles.productIllustrationWrap}
                        style={{ display: p.visual.type === 'img' ? 'none' : 'flex' }}
                      >
                        <Illustration name={p.visual.name || 'basket'} size={88} />
                      </div>

                      <span className={p.badgeClass}>{p.badge}</span>

                      <button
                        type="button"
                        onClick={(e) => handleToggleBookmark(p.id, e)}
                        className={`${styles.bookmarkBtn} ${isSaved ? styles.bookmarkBtnActive : ''}`}
                        aria-label="Save product"
                        title={isSaved ? 'Remove from saved' : 'Save for later'}
                      >
                        <Bookmark size={15} fill={isSaved ? '#6a1b29' : 'none'} color={isSaved ? '#6a1b29' : '#544d45'} />
                      </button>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.farmAttributionRow}>
                        <Link
                          to={`/farmers/${p.farmerId}`}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.farmLink}
                        >
                          {p.farmName}
                        </Link>
                        {p.stallNumber && <span className={styles.farmLoc}>• {p.stallNumber}</span>}
                      </div>

                      <h2 className={styles.productTitle}>
                        <Link
                          to={`/products/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.productTitleLink}
                        >
                          {p.name}
                        </Link>
                      </h2>

                      <p className={styles.productDesc}>{p.description}</p>

                      <div className={styles.marketAvailRow}>
                        <Store size={12} className={styles.marketIconSm} />
                        <span>Saturday Market Pickup</span>
                      </div>

                      <div className={styles.pricingRow}>
                        <div className={styles.priceGroup}>
                          <span className={styles.priceAmount}>{p.price}</span>
                          <span className={styles.priceUnit}>{p.unit}</span>
                        </div>
                        <span className={styles.stockNotice}>{p.stockText}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleReserve(p, e)}
                        className={`${styles.reserveBtn} ${isReserved ? styles.reserveBtnActive : ''}`}
                      >
                        <ShoppingBag size={14} />
                        <span>{isReserved ? '✓ Added to Basket' : 'Reserve for Saturday'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconBadge}>
                <div className={styles.emptyIconPulse} />
                <Leaf size={32} className={styles.emptyIcon} />
              </div>

              <h3 className={styles.emptyTitle}>No harvest items match your search</h3>

              <p className={styles.emptyDesc}>
                {searchQuery.trim() ? (
                  <>
                    No regional harvest found matching &ldquo;<strong>{searchQuery.trim()}</strong>&rdquo;.
                    Try checking for typos or resetting your filters.
                  </>
                ) : (
                  'We couldn’t find any crops matching this category. Reset filters to see everything harvesting this week.'
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
                        aria-label="Remove category filter"
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
                  }}
                  className={styles.secondaryBtn}
                >
                  <span>Show All Harvest</span>
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
              <span className={styles.calendarTag}>PEAK SEASON HARVEST</span>
              <h2>What's Fresh & In Season This Week</h2>
              <p>
                Regional soil yields its best flavor when picked at natural peak ripeness. Right now
                our Hudson Valley and New Jersey growers are harvesting tender greens, heritage tomatoes,
                sweet berries, fresh cut flowers, and artisan sourdough.
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
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
