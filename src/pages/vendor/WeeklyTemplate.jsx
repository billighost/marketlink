import React, { useState, useEffect, useMemo } from 'react';
import { getWeeklyTemplate, updateWeeklyTemplate, applyWeeklyTemplate } from '@/api/farmer';
import { formatPrice } from '@/utils/format';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import Skeleton from '@/components/ui/Skeleton';
import {
  CalendarCheck,
  Package,
  Sparkles,
  Search,
  X,
  Plus,
  Minus,
  Check,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';
import styles from './WeeklyTemplate.module.css';

export function WeeklyTemplate({ onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'excluded'

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await getWeeklyTemplate();
        if (isMounted) {
          const list = (res?.data || []).map((it) => ({
            ...it,
            productId: it.productId || it.id || it._id,
            productName: it.productName || it.name || 'Produce Item',
            enabled: Boolean(it.enabled ?? it.weekly?.enabled),
            defaultQuantity: Math.max(0, Number(it.defaultQuantity ?? it.weekly?.defaultQty ?? 10)),
            unit: it.unit || 'unit',
            priceCents: it.priceCents,
            currentQty: it.currentQty ?? it.quantityAvailable ?? 0,
          }));
          setItems(list);
        }
      } catch (err) {
        if (isMounted) setError(err?.message || 'Could not load weekly template.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = (productId, nextEnabled) => {
    setItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, enabled: nextEnabled } : item))
    );
  };

  const handleQtyChange = (productId, newQty) => {
    const parsed = Math.max(0, Math.min(9999, parseInt(newQty || '0', 10)));
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, defaultQuantity: parsed } : item
      )
    );
  };

  const handleStepQty = (productId, delta) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const next = Math.max(0, Math.min(9999, Number(item.defaultQuantity || 0) + delta));
        return { ...item, defaultQuantity: next };
      })
    );
  };

  // Bulk actions
  const handleToggleAll = (targetState) => {
    setItems((prev) => prev.map((item) => ({ ...item, enabled: targetState })));
  };

  const handleSetAllQty = (qty) => {
    setItems((prev) => prev.map((item) => ({ ...item, defaultQuantity: qty })));
  };

  // Metrics
  const totalItems = items.length;
  const activeItemsCount = useMemo(() => items.filter((it) => it.enabled).length, [items]);
  const totalRestockUnits = useMemo(
    () => items.reduce((sum, it) => (it.enabled ? sum + (Number(it.defaultQuantity) || 0) : sum), 0),
    [items]
  );

  // Filtered view
  const filteredItems = useMemo(() => {
    let result = items;

    if (filterTab === 'active') {
      result = result.filter((it) => it.enabled);
    } else if (filterTab === 'excluded') {
      result = result.filter((it) => !it.enabled);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (it) =>
          it.productName.toLowerCase().includes(q) ||
          (it.unit && it.unit.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, filterTab, searchQuery]);

  const saveTemplateData = async () => {
    await updateWeeklyTemplate(
      items.map((it) => ({
        productId: it.productId,
        enabled: Boolean(it.enabled),
        defaultQty: Number(it.defaultQuantity || 0),
        defaultQuantity: Number(it.defaultQuantity || 0),
      }))
    );
  };

  const handleSaveOnly = async () => {
    setSaving(true);
    setError('');
    try {
      await saveTemplateData();
      if (onSaved) onSaved({ applied: false });
      if (onClose) onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save weekly template.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndApply = async () => {
    setApplying(true);
    setError('');
    try {
      await saveTemplateData();
      await applyWeeklyTemplate();
      if (onSaved) onSaved({ applied: true });
      if (onClose) onClose();
    } catch (err) {
      setError(err?.message || 'Failed to apply weekly template.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.heroSkeleton}>
          <Skeleton height="70px" width="100%" borderRadius="12px" />
        </div>
        <div className={styles.statsSkeleton}>
          <Skeleton height="56px" width="48%" borderRadius="10px" />
          <Skeleton height="56px" width="48%" borderRadius="10px" />
        </div>
        <div className={styles.cardsSkeleton}>
          <Skeleton height="88px" width="100%" borderRadius="12px" />
          <Skeleton height="88px" width="100%" borderRadius="12px" />
          <Skeleton height="88px" width="100%" borderRadius="12px" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ── Top Hero / Overview Banner ── */}
      <div className={styles.heroBanner}>
        <div className={styles.heroHeader}>
          <div className={styles.heroIconBox} aria-hidden="true">
            <CalendarCheck size={22} className={styles.heroIcon} />
          </div>
          <div className={styles.heroTitles}>
            <h4 className={styles.heroTitle}>Automated Harvest Restock Schedule</h4>
            <p className={styles.heroSubtitle}>
              Configure your default replenishment quantities. When you apply your weekly schedule,
              active catalog items will automatically reset to these target counts.
            </p>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap}>
              <CheckCircle2 size={16} className={styles.metricActiveIcon} />
            </div>
            <div className={styles.metricText}>
              <span className={styles.metricLabel}>Scheduled Items</span>
              <span className={styles.metricValue}>
                {activeItemsCount}{' '}
                <span className={styles.metricTotal}>/ {totalItems} total</span>
              </span>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIconWrap}>
              <Package size={16} className={styles.metricUnitIcon} />
            </div>
            <div className={styles.metricText}>
              <span className={styles.metricLabel}>Total Weekly Restock</span>
              <span className={styles.metricValue}>
                {totalRestockUnits} <span className={styles.metricTotal}>units</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorBox} role="alert">
          <AlertCircle size={18} className={styles.errorIcon} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filter Toolbar ── */}
      {items.length > 0 && (
        <div className={styles.toolbar}>
          {/* Search Box */}
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className={styles.searchInput}
              aria-label="Filter products by name"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={styles.clearSearchBtn}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills & Bulk Actions */}
          <div className={styles.controlsRow}>
            <div className={styles.filterPills} role="tablist" aria-label="Filter products">
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'all'}
                className={`${styles.filterPill} ${filterTab === 'all' ? styles.filterPillActive : ''}`}
                onClick={() => setFilterTab('all')}
              >
                All ({totalItems})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'active'}
                className={`${styles.filterPill} ${filterTab === 'active' ? styles.filterPillActive : ''}`}
                onClick={() => setFilterTab('active')}
              >
                Active ({activeItemsCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={filterTab === 'excluded'}
                className={`${styles.filterPill} ${filterTab === 'excluded' ? styles.filterPillActive : ''}`}
                onClick={() => setFilterTab('excluded')}
              >
                Excluded ({totalItems - activeItemsCount})
              </button>
            </div>

            {/* Quick Bulk Actions */}
            <div className={styles.bulkActions}>
              {activeItemsCount < totalItems ? (
                <button
                  type="button"
                  className={styles.bulkBtn}
                  onClick={() => handleToggleAll(true)}
                  title="Enable weekly restock for all products"
                >
                  Enable all
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.bulkBtn}
                  onClick={() => handleToggleAll(false)}
                  title="Exclude all products from weekly restock"
                >
                  Disable all
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Product List ── */}
      <div className={styles.listSection}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={40} className={styles.emptyIcon} aria-hidden="true" />
            <h5 className={styles.emptyTitle}>No products found in catalog</h5>
            <p className={styles.emptyDesc}>
              Add produce or items to your catalog first before configuring weekly restock schedules.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={styles.emptySearch}>
            <Search size={28} className={styles.emptySearchIcon} aria-hidden="true" />
            <p className={styles.emptySearchText}>
              No products match <strong>"{searchQuery}"</strong>
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterTab('all');
              }}
              className={styles.resetFilterBtn}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className={styles.cardList}>
            {filteredItems.map((item) => {
              const isEnabled = Boolean(item.enabled);
              const initials = item.productName
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'P';

              return (
                <div
                  key={item.productId}
                  className={`${styles.productCard} ${isEnabled ? styles.cardActive : styles.cardInactive}`}
                >
                  {/* Left: Avatar & Meta */}
                  <div className={styles.cardHeaderLeft}>
                    <div
                      className={`${styles.productAvatar} ${isEnabled ? styles.avatarActive : styles.avatarInactive}`}
                      aria-hidden="true"
                    >
                      {initials}
                    </div>

                    <div className={styles.productDetails}>
                      <div className={styles.titleRow}>
                        <span className={styles.productName}>{item.productName}</span>
                        {item.priceCents > 0 && (
                          <span className={styles.priceTag}>{formatPrice(item.priceCents)}</span>
                        )}
                      </div>

                      <div className={styles.badgeRow}>
                        <span className={styles.unitBadge}>per {item.unit}</span>
                        <span className={styles.stockBadge}>
                          Current stock: {item.currentQty}
                        </span>
                        {isEnabled ? (
                          <span className={styles.statusScheduled}>
                            <span className={styles.pulseDot} aria-hidden="true" />
                            Scheduled
                          </span>
                        ) : (
                          <span className={styles.statusExcluded}>Excluded</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Toggle */}
                  <div className={styles.cardControls}>
                    {isEnabled ? (
                      <div className={styles.stepperContainer}>
                        <span className={styles.stepperLabel}>Target restock:</span>
                        <div className={styles.stepperBox}>
                          <button
                            type="button"
                            onClick={() => handleStepQty(item.productId, -1)}
                            disabled={item.defaultQuantity <= 0 || saving || applying}
                            className={styles.stepperBtn}
                            aria-label={`Decrease quantity for ${item.productName}`}
                          >
                            <Minus size={15} strokeWidth={2.2} />
                          </button>
                          <input
                            type="number"
                            value={item.defaultQuantity}
                            onChange={(e) => handleQtyChange(item.productId, e.target.value)}
                            min={0}
                            max={9999}
                            className={styles.qtyInput}
                            aria-label={`Target weekly quantity for ${item.productName}`}
                            disabled={saving || applying}
                          />
                          <button
                            type="button"
                            onClick={() => handleStepQty(item.productId, 1)}
                            disabled={item.defaultQuantity >= 9999 || saving || applying}
                            className={styles.stepperBtn}
                            aria-label={`Increase quantity for ${item.productName}`}
                          >
                            <Plus size={15} strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className={styles.pausedLabel}>Auto-restock paused</span>
                    )}

                    <div className={styles.toggleWrapper}>
                      <Toggle
                        checked={isEnabled}
                        onChange={(checked) => handleToggle(item.productId, checked)}
                        disabled={saving || applying}
                        label={`Include ${item.productName} in weekly schedule`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Action Bar ── */}
      <div className={styles.stickyFooter}>
        <div className={styles.footerSummary}>
          <Sparkles size={16} className={styles.footerSparkle} aria-hidden="true" />
          <span className={styles.summaryText}>
            <strong>{activeItemsCount}</strong> items scheduled ·{' '}
            <strong>{totalRestockUnits}</strong> units total
          </span>
        </div>

        <div className={styles.footerButtons}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={saving || applying}
            className={styles.cancelBtn}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleSaveAndApply}
            disabled={saving || applying || items.length === 0}
            loading={applying}
            className={styles.saveApplyBtn}
            title="Save template and immediately apply to your active stock"
          >
            <Zap size={16} className={styles.btnIcon} aria-hidden="true" />
            <span>Save & Apply Now</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSaveOnly}
            disabled={saving || applying || items.length === 0}
            loading={saving}
            className={styles.saveBtn}
          >
            <Check size={17} className={styles.btnIcon} aria-hidden="true" />
            <span>Save Template</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WeeklyTemplate;
