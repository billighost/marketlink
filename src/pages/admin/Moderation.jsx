import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getModerationFlags, resolveModerationFlag } from '@/api/admin';
import { useAdmin } from '@/layouts/AdminLayout';
import { useToast } from '@/components/ui/Toast';
import AdminPage from '@/components/admin/AdminPage';
import FilterBar from '@/components/admin/FilterBar';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import ModerationCard from './ModerationCard';
import styles from './Moderation.module.css';


export function Moderation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshOverview } = useAdmin();
  const { showToast } = useToast();

  const tabParam = searchParams.get('tab') || 'open';
  const activeTab = tabParam === 'resolved' ? 'resolved' : 'open';

  const typeParam = searchParams.get('type') || 'all';
  const queryParam = searchParams.get('q') || searchParams.get('search') || '';

  const [search, setSearch] = useState(queryParam);
  const [debouncedSearch, setDebouncedSearch] = useState(queryParam);

  const [flags, setFlags] = useState([]);
  const [counts, setCounts] = useState({ open: 0, resolved: 0, removed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Confirm dialog state
  const [dialogConfig, setDialogConfig] = useState(null);

  // Debounce search input (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (search.trim()) {
          next.set('q', search.trim());
        } else {
          next.delete('q');
          next.delete('search');
        }
        return next;
      }, { replace: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [search, setSearchParams]);

  useEffect(() => {
    if (queryParam !== search) {
      setSearch(queryParam);
      setDebouncedSearch(queryParam);
    }
  }, [queryParam]);

  // Fetch flags
  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = { limit: 100 };
      if (activeTab === 'open') {
        query.status = 'open';
      }
      if (typeParam && typeParam !== 'all') {
        query.targetType = typeParam;
      }

      const res = await getModerationFlags(query);
      const data = res?.data || [];
      const metaCounts = res?.meta?.counts || { open: 0, resolved: 0, removed: 0 };

      // If activeTab is resolved, filter data locally if query.status was not set
      if (activeTab === 'resolved') {
        const resolvedList = data.filter((f) => f.status === 'resolved' || f.status === 'removed');
        setFlags(resolvedList);
      } else {
        const openList = data.filter((f) => f.status === 'open');
        setFlags(openList);
      }

      setCounts(metaCounts);
    } catch (err) {
      setError(err?.message || 'Failed to load moderation flags.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, typeParam]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  // Handle Tab Switch
  const handleTabChange = (newTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      return next;
    });
  };

  // Handle Type Filter Switch
  const handleTypeChange = (newType) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newType && newType !== 'all') {
        next.set('type', newType);
      } else {
        next.delete('type');
      }
      return next;
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('type');
      next.delete('q');
      next.delete('search');
      return next;
    });
  };

  // Standard mutation runner
  const runAction = async (action, flagId, note, successMsg) => {
    setBusyId(flagId);
    try {
      await resolveModerationFlag(flagId, { action, note });
      await fetchFlags();
      refreshOverview();
      showToast(successMsg);
      setDialogConfig(null);
    } catch (err) {
      throw err;
    } finally {
      setBusyId(null);
    }
  };

  // Action Dialog Triggers
  const triggerRemoveContent = (flag) => {
    const isReview = flag.targetType === 'review';
    setDialogConfig({
      open: true,
      title: isReview ? 'Remove this review?' : 'Remove this listing?',
      body: isReview
        ? 'It will no longer be visible on the stall or product page.'
        : 'It will be withdrawn from the public catalogue. Existing orders are not affected.',
      confirmLabel: isReview ? 'Remove review' : 'Remove listing',
      requireReason: true,
      variant: 'danger',
      onConfirm: async (note) => {
        await runAction(
          'remove',
          flag.id,
          note,
          isReview ? 'Review removed and flag resolved.' : 'Product removed and flag resolved.'
        );
      },
    });
  };

  const triggerKeepContent = (flag) => {
    setDialogConfig({
      open: true,
      title: 'Keep this content?',
      body: 'The flag will be closed and the content stays visible.',
      confirmLabel: 'Keep content',
      requireReason: false,
      variant: 'primary',
      onConfirm: async (note) => {
        await runAction('dismiss', flag.id, note, 'Flag dismissed and content kept.');
      },
    });
  };

  // Filtered Cards
  const displayedFlags = useMemo(() => {
    if (!debouncedSearch.trim()) return flags;
    const term = debouncedSearch.trim().toLowerCase();
    return flags.filter((f) => {
      const reasonMatch = f.reason?.toLowerCase().includes(term);
      const noteMatch = f.note?.toLowerCase().includes(term);
      const previewMatch =
        f.preview?.name?.toLowerCase().includes(term) ||
        f.preview?.comment?.toLowerCase().includes(term) ||
        f.preview?.customerName?.toLowerCase().includes(term) ||
        f.preview?.farmerName?.toLowerCase().includes(term);
      return reasonMatch || noteMatch || previewMatch;
    });
  }, [flags, debouncedSearch]);

  const totalResolvedCount = (counts.resolved || 0) + (counts.removed || 0);

  const filterOptions = [
    {
      key: 'type',
      label: 'Type',
      value: typeParam,
      options: [
        { value: 'all', label: 'All types' },
        { value: 'listing', label: 'Listings' },
        { value: 'review', label: 'Reviews' },
      ],
    },
  ];

  return (
    <AdminPage
      title="Moderation"
      context={`${counts.open || 0} open ${(counts.open || 0) === 1 ? 'flag' : 'flags'}`}
    >
      <div className={styles.container}>
        {/* Navigation Tabs */}
        <Tabs
          tabs={[
            { id: 'open', label: 'Open Queue', count: counts.open || 0 },
            { id: 'resolved', label: 'Resolved', count: totalResolvedCount },
          ]}
          active={activeTab}
          onChange={handleTabChange}
        />

        {/* Search & Filter Bar */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          filters={filterOptions}
          onFilterChange={(_, value) => handleTypeChange(value)}
          resultCount={displayedFlags.length}
          onReset={handleResetFilters}
        />

        {/* Error State */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={fetchFlags}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className={styles.cardsList}>
            <div className={styles.skeletonCard} />
            <div className={styles.skeletonCard} />
          </div>
        )}

        {/* Cards Queue */}
        {!loading && !error && displayedFlags.length > 0 && (
          <div className={styles.cardsList}>
            {displayedFlags.map((flag) => (
              <ModerationCard
                key={flag.id}
                flag={flag}
                activeTab={activeTab}
                isBusy={busyId === flag.id}
                onRemove={triggerRemoveContent}
                onKeep={triggerKeepContent}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && displayedFlags.length === 0 && (
          <EmptyState
            title={
              activeTab === 'open'
                ? (debouncedSearch || typeParam !== 'all' ? 'No flags match these filters' : 'Nothing flagged')
                : (debouncedSearch || typeParam !== 'all' ? 'No resolved flags match these filters' : 'No resolved flags yet')
            }
            description={
              activeTab === 'open'
                ? (debouncedSearch || typeParam !== 'all' ? 'Try adjusting your search or filters.' : 'Flagged reviews and listings appear here.')
                : (debouncedSearch || typeParam !== 'all' ? 'Try adjusting your search or filters.' : 'Resolved moderation decisions will appear here as an audit trail.')
            }
            action={
              (debouncedSearch || typeParam !== 'all') ? (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={handleResetFilters}
                >
                  Reset filters
                </button>
              ) : null
            }
          />
        )}

        {/* Confirmation Dialog */}
        {dialogConfig && (
          <ConfirmDialog
            open={dialogConfig.open}
            title={dialogConfig.title}
            body={dialogConfig.body}
            confirmLabel={dialogConfig.confirmLabel}
            requireReason={dialogConfig.requireReason}
            variant={dialogConfig.variant}
            onConfirm={dialogConfig.onConfirm}
            onClose={() => setDialogConfig(null)}
          />
        )}
      </div>
    </AdminPage>
  );
}

export default Moderation;