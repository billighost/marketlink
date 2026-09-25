import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import StockForm from './StockForm';
import WeeklyTemplate from './WeeklyTemplate';
import { Search, Plus, Calendar, AlertCircle } from 'lucide-react';
import styles from './Stock.module.css';

const FILTER_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'in', label: 'In stock' },
  { id: 'low', label: 'Low' },
  { id: 'out', label: 'Sold out' },
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

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Sheet modals: 'none' | 'new' | 'edit' | 'template' | 'confirm-apply-template'
  const [sheetMode, setSheetMode] = useState('none');
  const [editingProductId, setEditingProductId] = useState(null);

  // Debounced optimistic updates tracker
  const pendingUpdatesRef = useRef(new Map());
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
        const query = { limit: 20 };
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

  // Optimistic quantity stepper change
  const handleQuantityChange = (productId, newQty) => {
    // 1. Snapshot previous products for potential rollback
    const originalProducts = [...products];

    // 2. Update UI state optimistically
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

    // 3. Queue update with 600ms debounce
    if (debounceTimersRef.current.has(productId)) {
      clearTimeout(debounceTimersRef.current.get(productId));
    }

    const timer = setTimeout(async () => {
      try {
        await updateFarmerProduct(productId, { quantity: newQty });
        refreshCounts();
      } catch (err) {
        // Rollback
        setProducts(originalProducts);
        setToastMessage(`Failed to update quantity: ${err?.message}`);
        setToastType('error');
      } finally {
        debounceTimersRef.current.delete(productId);
      }
    }, 600);

    debounceTimersRef.current.set(productId, timer);
  };

  // Optimistic Sold-Out Toggle
  const handleToggleSoldOut = (productId, currentlySoldOut) => {
    const originalProducts = [...products];
    const willBeSoldOut = !currentlySoldOut;

    // Update UI immediately
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

    // Send API write
    (async () => {
      try {
        if (willBeSoldOut) {
          await setFarmerProductSoldOut(productId);
        } else {
          await setFarmerProductAvailable(productId);
        }
        refreshCounts();
      } catch (err) {
        // Rollback
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
      setToastMessage(`Weekly template applied for ${updatedCount} products.`);
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
      <div className={styles.header}>
        <h1 className={styles.title}>Stock</h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.secondaryTextBtn}
            onClick={() => setSheetMode('template')}
          >
            Weekly template
          </button>
          <button
            type="button"
            className={styles.secondaryTextBtn}
            onClick={() => setSheetMode('confirm-apply-template')}
          >
            Apply template
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name..."
          className={styles.searchInput}
          aria-label="Search stock products"
        />
      </div>

      {/* Single Chip Row Filter */}
      <div className={styles.chipRow} role="tablist" aria-label="Filter stock by availability">
        {FILTER_CHIPS.map((chip) => (
          <Chip
            key={chip.id}
            label={chip.label}
            selected={activeFilter === chip.id}
            onClick={() => setActiveFilter(chip.id)}
          />
        ))}
      </div>

      {/* Product List */}
      {loading ? (
        <div className={styles.loadingBox}>
          <Skeleton height="72px" />
          <Skeleton height="72px" />
          <Skeleton height="72px" />
        </div>
      ) : error ? (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={() => fetchProducts()}>
            Try again
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No products found matching your filter.</p>
          {!isPending && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSheetMode('new');
              }}
            >
              Add a product
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.productList}>
          {products.map((p) => {
            const isSoldOut = p.availability === 'out';
            const showStatusDot = ['low', 'out', 'hidden'].includes(p.availability);

            return (
              <div key={p.id} className={styles.productRow}>
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
                      {formatPrice(p.priceCents)} / {p.unit}
                    </span>
                  </div>

                  <div className={styles.statusRow}>
                    <span className={styles.stockSummary}>
                      {p.quantity} in stock
                    </span>
                    {showStatusDot && (
                      <span className={styles.statusBadge}>
                        <StatusDot status={p.availability} />
                        <span className={styles.statusLabel}>
                          {p.availability === 'out'
                            ? 'Sold out'
                            : p.availability === 'low'
                            ? 'Low'
                            : 'Hidden'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline Stepper + Toggle Controls */}
                <div className={styles.controlsRow}>
                  <QuantityStepper
                    value={p.quantity}
                    onChange={(newQty) => handleQuantityChange(p.id, newQty)}
                    min={0}
                    max={10000}
                    disabled={isPending}
                  />

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

      {/* Sticky Primary Action: Add a product */}
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
            <span>Add a product</span>
          </Button>
        </div>
      )}

      {/* Add / Edit Product Sheet */}
      {(sheetMode === 'new' || sheetMode === 'edit') && (
        <BottomSheet
          isOpen={true}
          onClose={handleCloseSheet}
          size="tall"
          title={sheetMode === 'edit' ? 'Edit Product' : 'Add Product'}
        >
          <StockForm
            productId={sheetMode === 'edit' ? editingProductId : undefined}
            onClose={handleCloseSheet}
            onSaved={() => {
              setToastMessage('Product saved successfully.');
              setToastType('success');
              fetchProducts();
            }}
            onDeleted={() => {
              setToastMessage('Product deleted.');
              setToastType('success');
              fetchProducts();
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
          title="Weekly Stock Template"
        >
          <WeeklyTemplate
            onClose={handleCloseSheet}
            onSaved={() => {
              setToastMessage('Weekly template saved.');
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
            title="Reset weekly stock?"
            message={`This resets quantities for ${products.length} products to their weekly template values.`}
            confirmLabel="Apply template"
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
