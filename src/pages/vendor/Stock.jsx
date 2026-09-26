import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getFarmerProducts,
  setFarmerProductSoldOut,
  setFarmerProductAvailable,
  updateFarmerProduct,
  applyWeeklyTemplate,
} from '@/api/farmer';
import { useVendor } from '@/layouts/VendorLayout';
import { formatPrice } from '@/utils/format';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import StatusDot from '@/components/ui/StatusDot';
import QuantityStepper from '@/components/ui/QuantityStepper';
import Toggle from '@/components/ui/Toggle';
import Skeleton from '@/components/ui/Skeleton';
import BottomSheet from '@/components/ui/BottomSheet';
import ConfirmStep from '@/components/ui/ConfirmStep';
import Toast from '@/components/ui/Toast';
import Illustration from '@/components/domain/Illustration';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import StockForm from './StockForm';
import WeeklyTemplate from './WeeklyTemplate';
import {
  Search,
  Plus,
  Calendar,
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  TrendingUp,
  LayoutGrid,
  List as ListIcon,
  X,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import styles from './Stock.module.css';

const AVAILABILITY_FILTERS = [
  { id: 'all', label: 'All Catalog' },
  { id: 'in', label: 'In Stock' },
  { id: 'low', label: 'Low Stock' },
  { id: 'out', label: 'Sold Out' },
  { id: 'hidden', label: 'Hidden' },
];

export function Stock() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPending, refreshCounts } = useVendor();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  // Filters & View Mode
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  // Sheet modals: 'none' | 'new' | 'edit' | 'template' | 'confirm-apply-template'
  const [sheetMode, setSheetMode] = useState('none');
  const [editingProductId, setEditingProductId] = useState(null);

  // Debounced optimistic updates tracker
  const debounceTimersRef = useRef(new Map());

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Handle URL query parameters for direct open
  useEffect(() => {
    const action = searchParams.get('action');
    const editId = searchParams.get('edit');
    if (action === 'new') {
      setSheetMode('new');
    } else if (editId) {
      setEditingProductId(editId);
      setSheetMode('edit');
    }
  }, [searchParams]);

  // Debounce search input by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch products
  const fetchProducts = useCallback(
    async (cursor = null, isLoadMore = false) => {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);
      setError('');

      try {
        const query = { limit: 50 };
        if (cursor) query.cursor = cursor;
        if (debouncedSearch.trim()) query.q = debouncedSearch.trim();
        if (activeFilter !== 'all') query.availability = activeFilter;

        const res = await getFarmerProducts(query);
        const list = res?.data || [];
        const meta = res?.meta || {};

        setProducts((prev) => (isLoadMore ? [...prev, ...list] : list));
        setNextCursor(meta.nextCursor || null);
        setHasMore(Boolean(meta.hasMore));
      } catch (err) {
        setError(err?.message || 'Failed to load stock list.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, activeFilter]
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Calculate live categories and telemetry stats
  const { categories, stats, filteredProducts } = useMemo(() => {
    const catSet = new Set();
    let totalCents = 0;
    let inCount = 0;
    let lowCount = 0;
    let outCount = 0;
    let hiddenCount = 0;

    products.forEach((p) => {
      if (p.category) catSet.add(p.category);
      const qty = p.quantity || 0;
      const price = p.priceCents || 0;
      totalCents += qty * price;

      if (p.availability === 'out' || qty === 0) outCount++;
      else if (p.availability === 'low' || qty <= (p.lowStockThreshold ?? 3)) lowCount++;
      else if (p.availability === 'hidden') hiddenCount++;
      else inCount++;
    });

    const categoryList = Array.from(catSet).sort();

    // Secondary client filter for category
    const filtered = products.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      return true;
    });

    return {
      categories: categoryList,
      stats: {
        totalItems: products.length,
        inCount,
        lowCount,
        outCount,
        hiddenCount,
        totalInventoryCents: totalCents,
        inStockPct: products.length > 0 ? Math.round((inCount / products.length) * 100) : 0,
      },
      filteredProducts: filtered,
    };
  }, [products, selectedCategory]);

  // Optimistic quantity stepper change
  const handleQuantityChange = (productId, newQty) => {
    const originalProducts = [...products];

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const avail =
            newQty === 0
              ? 'out'
              : newQty <= (p.lowStockThreshold ?? 3)
              ? 'low'
              : 'in';
          return { ...p, quantity: newQty, availability: avail };
        }
        return p;
      })
    );

    if (debounceTimersRef.current.has(productId)) {
      clearTimeout(debounceTimersRef.current.get(productId));
    }

    const timer = setTimeout(async () => {
      try {
        await updateFarmerProduct(productId, { quantity: newQty });
        refreshCounts();
      } catch (err) {
        setProducts(originalProducts);
        setToastMessage(`Failed to update quantity: ${err?.message}`);
        setToastType('error');
      } finally {
        debounceTimersRef.current.delete(productId);
      }
    }, 500);

    debounceTimersRef.current.set(productId, timer);
  };

  // Quick Restock helper (+5 units)
  const handleQuickRestock = (productId, currentQty) => {
    handleQuantityChange(productId, currentQty + 5);
    setToastMessage('+5 units added to stock');
    setToastType('success');
  };

  // Optimistic Sold-Out Toggle
  const handleToggleSoldOut = (productId, currentlySoldOut) => {
    const originalProducts = [...products];
    const willBeSoldOut = !currentlySoldOut;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            availability: willBeSoldOut ? 'out' : p.quantity <= (p.lowStockThreshold ?? 3) ? 'low' : 'in',
          };
        }
        return p;
      })
    );

    (async () => {
      try {
        if (willBeSoldOut) {
          await setFarmerProductSoldOut(productId);
          setToastMessage('Marked as sold out');
        } else {
          await setFarmerProductAvailable(productId);
          setToastMessage('Marked available for orders');
        }
        setToastType('success');
        refreshCounts();
      } catch (err) {
        setProducts(originalProducts);
        setToastMessage(`Failed to update status: ${err?.message}`);
        setToastType('error');
      }
    })();
  };

  // Apply Weekly Template
  const handleApplyTemplate = async () => {
    try {
      const res = await applyWeeklyTemplate();
      const updatedCount = res?.data?.updatedCount ?? 'all';
      setToastMessage(`Weekly template applied for ${updatedCount} items.`);
      setToastType('success');
      setSheetMode('none');
      fetchProducts();
      refreshCounts();
    } catch (err) {
      setToastMessage(`Failed to apply template: ${err?.message}`);
      setToastType('error');
    }
  };

  const handleCloseSheet = () => {
    setSheetMode('none');
    setEditingProductId(null);
    if (searchParams.get('action') || searchParams.get('edit')) {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <div className={styles.container}>
      {/* Toast notifications */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onDismiss={() => setToastMessage('')}
        />
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeRow}>
            <span className={styles.liveBadge}>
              <span className={styles.pulseDot} /> Live Farm Inventory
            </span>
            {stats.lowCount > 0 && (
              <span className={styles.alertBadge}>
                <AlertTriangle size={12} /> {stats.lowCount} low stock items
              </span>
            )}
          </div>
          <h1 className={styles.title}>Produce & Stock Catalog</h1>
          <p className={styles.subtitle}>
            Manage harvest inventory, real-time stock levels, and automated pre-order limits.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.templateBtn}
            onClick={() => setSheetMode('template')}
            title="Configure default recurring weekly stock"
          >
            <Calendar size={15} aria-hidden="true" />
            <span>Weekly Template</span>
          </button>
          <button
            type="button"
            className={styles.applyBtn}
            onClick={() => setSheetMode('confirm-apply-template')}
            title="Reset stock to weekly schedule"
          >
            <span>Apply Schedule</span>
          </button>
          {!isPending && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setSheetMode('new')}
              className={styles.addPrimaryBtn}
            >
              <Plus size={16} aria-hidden="true" />
              <span>Add Produce</span>
            </Button>
          )}
        </div>
      </header>

      {/* Telemetry Bento Grid */}
      <section className={styles.telemetryGrid} aria-label="Inventory metrics">
        <div className={styles.telemetryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Listed Produce</span>
            <span className={styles.cardIconWrap}>
              <Package size={16} />
            </span>
          </div>
          <div className={styles.cardValueRow}>
            <span className={styles.cardValue}>{stats.totalItems}</span>
            <span className={styles.cardUnit}>items</span>
          </div>
          <div className={styles.cardMeta}>
            <span>{categories.length || 1} harvest categories</span>
          </div>
        </div>

        <div className={styles.telemetryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>In-Stock Healthy</span>
            <span className={`${styles.cardIconWrap} ${styles.iconSuccess}`}>
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className={styles.cardValueRow}>
            <span className={styles.cardValue}>{stats.inCount}</span>
            <span className={styles.cardTag}>{stats.inStockPct}% ready</span>
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              style={{ width: `${stats.inStockPct}%` }}
            />
          </div>
        </div>

        <div
          className={`${styles.telemetryCard} ${stats.lowCount > 0 ? styles.cardHighlightAlert : ''}`}
          onClick={() => setActiveFilter(activeFilter === 'low' ? 'all' : 'low')}
          role="button"
          tabIndex={0}
          title="Click to filter low stock items"
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Low Stock Alert</span>
            <span className={`${styles.cardIconWrap} ${styles.iconAlert}`}>
              <AlertCircle size={16} />
            </span>
          </div>
          <div className={styles.cardValueRow}>
            <span className={`${styles.cardValue} ${stats.lowCount > 0 ? styles.valAlert : ''}`}>
              {stats.lowCount}
            </span>
            <span className={styles.cardUnit}>needs harvest</span>
          </div>
          <div className={styles.cardMeta}>
            <span>{stats.outCount} items currently sold out</span>
          </div>
        </div>

        <div className={styles.telemetryCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Inventory Value</span>
            <span className={`${styles.cardIconWrap} ${styles.iconBeet}`}>
              <DollarSign size={16} />
            </span>
          </div>
          <div className={styles.cardValueRow}>
            <span className={styles.cardValue}>{formatPrice(stats.totalInventoryCents)}</span>
          </div>
          <div className={styles.cardMeta}>
            <span>Estimated total market value</span>
          </div>
        </div>
      </section>

      {/* Control Bar: Search & View Toggle */}
      <section className={styles.controlBar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by produce name, crop, or variety..."
            className={styles.searchInput}
            aria-label="Search stock products"
          />
          {search && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className={styles.viewModeToggle} role="group" aria-label="Layout view">
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
            title="Compact List View"
          >
            <ListIcon size={16} />
          </button>
          <button
            type="button"
            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            title="Card Grid View"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </section>

      {/* Status & Category Filters */}
      <div className={styles.filterSection}>
        {/* Availability Filter Chips with Counts */}
        <div className={styles.chipRow} role="tablist" aria-label="Filter stock by availability">
          {AVAILABILITY_FILTERS.map((chip) => {
            let badge = stats.totalItems;
            if (chip.id === 'in') badge = stats.inCount;
            if (chip.id === 'low') badge = stats.lowCount;
            if (chip.id === 'out') badge = stats.outCount;
            if (chip.id === 'hidden') badge = stats.hiddenCount;

            const isSelected = activeFilter === chip.id;

            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`${styles.filterChip} ${isSelected ? styles.filterChipActive : ''}`}
                onClick={() => setActiveFilter(chip.id)}
              >
                <span>{chip.label}</span>
                <span className={styles.filterBadge}>{badge}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Category Chips */}
        {categories.length > 0 && (
          <div className={styles.categoryRow}>
            <span className={styles.categoryRowLabel}>Category:</span>
            <button
              type="button"
              className={`${styles.categoryPill} ${selectedCategory === 'all' ? styles.categoryPillActive : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Produce
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.categoryPill} ${selectedCategory === cat ? styles.categoryPillActive : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product List / Grid */}
      {loading ? (
        <div className={styles.loadingBox}>
          <Skeleton height="76px" />
          <Skeleton height="76px" />
          <Skeleton height="76px" />
          <Skeleton height="76px" />
        </div>
      ) : error ? (
        <ErrorState title="Could not load inventory" text={error} onRetry={() => fetchProducts()} />
      ) : filteredProducts.length === 0 ? (
        <div className={styles.emptyContainer}>
          <EmptyState
            illustration="basket"
            title={search ? 'No produce matches your query' : 'No produce in this view'}
            text={
              search
                ? `No items found matching "${search}". Try checking for spelling or clear the filter.`
                : 'Add fresh crops or use your weekly template to restock in one click.'
            }
            actionLabel={!isPending ? 'Add a Product' : undefined}
            onAction={!isPending ? () => setSheetMode('new') : undefined}
          />
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className={styles.productGrid}>
          {filteredProducts.map((p) => {
            const isSoldOut = p.availability === 'out' || p.quantity === 0;
            const isLow = p.availability === 'low' || (p.quantity > 0 && p.quantity <= (p.lowStockThreshold ?? 3));
            const threshold = p.lowStockThreshold ?? 3;
            const stockPct = Math.min(100, Math.round((p.quantity / (threshold * 3 || 10)) * 100));

            return (
              <div
                key={p.id}
                className={`${styles.gridCard} ${isSoldOut ? styles.gridCardSoldOut : ''}`}
              >
                {/* Visual Header */}
                <div
                  className={styles.gridImageWrap}
                  onClick={() => {
                    setEditingProductId(p.id);
                    setSheetMode('edit');
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className={styles.gridImage} />
                  ) : (
                    <div className={styles.gridArtFallback}>
                      <Illustration name={p.art || 'basket'} size="md" />
                    </div>
                  )}

                  <span className={styles.gridPriceBadge}>
                    {formatPrice(p.priceCents)} <span className={styles.gridUnit}>/ {p.unit}</span>
                  </span>

                  <div className={styles.gridStatusPill}>
                    <StatusDot status={p.availability} />
                    <span>{isSoldOut ? 'Sold out' : isLow ? 'Low stock' : 'In stock'}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className={styles.gridBody}>
                  <div
                    className={styles.gridTitleBlock}
                    onClick={() => {
                      setEditingProductId(p.id);
                      setSheetMode('edit');
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <h3 className={styles.gridName}>{p.name}</h3>
                    {p.category && <span className={styles.gridCategory}>{p.category}</span>}
                  </div>

                  {/* Stock Bar Meter */}
                  <div className={styles.stockMeterBox}>
                    <div className={styles.stockMeterLabel}>
                      <span>Stock: <strong>{p.quantity} {p.unit}</strong></span>
                      <span className={styles.stockMeterThreshold}>Alert at ≤ {threshold}</span>
                    </div>
                    <div className={styles.meterTrack}>
                      <div
                        className={`${styles.meterFill} ${
                          isSoldOut
                            ? styles.meterFillOut
                            : isLow
                            ? styles.meterFillLow
                            : styles.meterFillGood
                        }`}
                        style={{ width: `${Math.max(6, stockPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Controls */}
                  <div className={styles.gridControls}>
                    <div className={styles.stepperWrap}>
                      <QuantityStepper
                        value={p.quantity}
                        onChange={(newQty) => handleQuantityChange(p.id, newQty)}
                        min={0}
                        max={9999}
                        disabled={isPending}
                      />
                      <button
                        type="button"
                        className={styles.quickAddPill}
                        onClick={() => handleQuickRestock(p.id, p.quantity)}
                        title="Add 5 units quickly"
                      >
                        +5
                      </button>
                    </div>

                    <div className={styles.gridToggleRow}>
                      <span className={styles.toggleText}>Sold Out</span>
                      <Toggle
                        checked={isSoldOut}
                        onChange={() => handleToggleSoldOut(p.id, isSoldOut)}
                        disabled={isPending}
                        label={`Mark ${p.name} sold out`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className={styles.productList}>
          {filteredProducts.map((p) => {
            const isSoldOut = p.availability === 'out' || p.quantity === 0;
            const isLow = p.availability === 'low' || (p.quantity > 0 && p.quantity <= (p.lowStockThreshold ?? 3));
            const threshold = p.lowStockThreshold ?? 3;
            const stockPct = Math.min(100, Math.round((p.quantity / (threshold * 3 || 10)) * 100));

            return (
              <div
                key={p.id}
                className={`${styles.productRow} ${isSoldOut ? styles.rowSoldOut : ''}`}
              >
                {/* Visual Thumbnail */}
                <div
                  className={styles.thumbWrapper}
                  onClick={() => {
                    setEditingProductId(p.id);
                    setSheetMode('edit');
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Edit ${p.name}`}
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className={styles.thumbImage} />
                  ) : (
                    <div className={styles.thumbArt}>
                      <Illustration name={p.art || 'basket'} size="sm" />
                    </div>
                  )}
                </div>

                {/* Info Block */}
                <div
                  className={styles.infoBlock}
                  onClick={() => {
                    setEditingProductId(p.id);
                    setSheetMode('edit');
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Edit ${p.name}`}
                >
                  <div className={styles.nameRow}>
                    <span className={styles.productName}>{p.name}</span>
                    <span className={styles.productPrice}>
                      {formatPrice(p.priceCents)} <span className={styles.unitText}>/ {p.unit}</span>
                    </span>
                  </div>

                  <div className={styles.metaRow}>
                    {p.category && (
                      <span className={styles.categoryBadge}>{p.category}</span>
                    )}
                    <span className={styles.stockSummary}>
                      <strong>{p.quantity}</strong> in stock
                    </span>
                    <span className={styles.statusBadge}>
                      <StatusDot status={p.availability} />
                      <span className={styles.statusLabel}>
                        {isSoldOut ? 'Sold out' : isLow ? 'Low stock' : 'Available'}
                      </span>
                    </span>
                  </div>

                  {/* Inline visual gauge */}
                  <div className={styles.rowGauge}>
                    <div
                      className={`${styles.gaugeFill} ${
                        isSoldOut
                          ? styles.meterFillOut
                          : isLow
                          ? styles.meterFillLow
                          : styles.meterFillGood
                      }`}
                      style={{ width: `${Math.max(4, stockPct)}%` }}
                    />
                  </div>
                </div>

                {/* Inline Stepper + Quick Actions */}
                <div className={styles.controlsRow}>
                  <div className={styles.stepperGroup}>
                    <QuantityStepper
                      value={p.quantity}
                      onChange={(newQty) => handleQuantityChange(p.id, newQty)}
                      min={0}
                      max={10000}
                      disabled={isPending}
                    />
                    <button
                      type="button"
                      className={styles.quickAddPill}
                      onClick={() => handleQuickRestock(p.id, p.quantity)}
                      title="Quick restock +5"
                    >
                      +5
                    </button>
                  </div>

                  <div className={styles.soldOutToggle}>
                    <Toggle
                      checked={isSoldOut}
                      onChange={() => handleToggleSoldOut(p.id, isSoldOut)}
                      disabled={isPending}
                      label={`Mark ${p.name} sold out`}
                    />
                    <span className={styles.toggleLabel}>Sold out</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className={styles.loadMoreWrapper}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => fetchProducts(nextCursor, true)}
            loading={loadingMore}
            disabled={loadingMore}
          >
            Load more products
          </Button>
        </div>
      )}

      {/* Mobile Sticky Action: Add a product */}
      {!isPending && (
        <div className={styles.stickyFooter}>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => setSheetMode('new')}
            className={styles.addStickyBtn}
          >
            <Plus size={18} aria-hidden="true" />
            <span>Add New Produce</span>
          </Button>
        </div>
      )}

      {/* Add / Edit Product Sheet */}
      {(sheetMode === 'new' || sheetMode === 'edit') && (
        <BottomSheet
          isOpen={true}
          onClose={handleCloseSheet}
          size="tall"
          title={sheetMode === 'edit' ? 'Edit Produce Details' : 'Add New Harvest Produce'}
        >
          <StockForm
            productId={sheetMode === 'edit' ? editingProductId : undefined}
            onClose={handleCloseSheet}
            onSaved={() => {
              setToastMessage('Produce details saved.');
              setToastType('success');
              fetchProducts();
              refreshCounts();
            }}
            onDeleted={() => {
              setToastMessage('Product removed from catalog.');
              setToastType('success');
              fetchProducts();
              refreshCounts();
            }}
          />
        </BottomSheet>
      )}

      {/* Weekly Template Sheet */}
      {sheetMode === 'template' && (
        <BottomSheet
          isOpen={true}
          onClose={handleCloseSheet}
          size="tall"
          title="Weekly Stock Schedule Template"
        >
          <WeeklyTemplate
            onClose={handleCloseSheet}
            onSaved={() => {
              setToastMessage('Weekly harvest schedule updated.');
              setToastType('success');
            }}
          />
        </BottomSheet>
      )}

      {/* Apply Template Confirm Peek Sheet */}
      {sheetMode === 'confirm-apply-template' && (
        <BottomSheet
          isOpen={true}
          onClose={handleCloseSheet}
          size="peek"
          title="Apply Weekly Template"
        >
          <ConfirmStep
            title="Reset Stock to Schedule?"
            message={`This resets quantities for all ${products.length} catalog items to your recurring weekly template values.`}
            confirmLabel="Apply Schedule Now"
            confirmVariant="primary"
            cancelLabel="Cancel"
            onConfirm={handleApplyTemplate}
            onCancel={handleCloseSheet}
          />
        </BottomSheet>
      )}
    </div>
  );
}

export default Stock;
