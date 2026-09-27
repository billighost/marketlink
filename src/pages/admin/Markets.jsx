import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { getAdminMarkets, deleteMarket } from '@/api/admin';
import { useToast } from '@/components/ui/Toast';
import AdminPage from '@/components/admin/AdminPage';
import DataTable from '@/components/admin/DataTable';
import FilterBar from '@/components/admin/FilterBar';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import Button from '@/components/ui/Button';
import DayDots from '@/components/domain/DayDots';
import MarketEditorSheet from './MarketEditorSheet';
import styles from './Markets.module.css';

function extractTown(address) {
  if (!address || typeof address !== 'string') return '—';
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length > 2) return parts[parts.length - 2];
  if (parts.length === 2) return parts[1];
  return parts[0] || '—';
}

export function Markets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // URL state
  const searchParam = searchParams.get('q') || '';
  const dayParam = searchParams.get('day') || 'all';
  const statusParam = searchParams.get('status') || 'all';

  const [search, setSearch] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (search.trim()) next.set('q', search.trim());
          else next.delete('q');
          return next;
        },
        { replace: true }
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [search, setSearchParams]);

  useEffect(() => {
    if (searchParam !== search) {
      setSearch(searchParam);
      setDebouncedSearch(searchParam);
    }
  }, [searchParam]);

  // Fetch markets
  const fetchMarketsList = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getAdminMarkets();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setMarkets(list);
    } catch (err) {
      setFetchError(err.message || 'Failed to load markets.');
      showToast(err.message || 'Failed to load markets.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMarketsList();
  }, [fetchMarketsList]);

  // Filtered rows
  const filteredMarkets = useMemo(() => {
    return markets.filter((m) => {
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const nameMatch = m.name?.toLowerCase().includes(query);
        const addressMatch = m.address?.toLowerCase().includes(query);
        if (!nameMatch && !addressMatch) return false;
      }
      if (dayParam && dayParam !== 'all') {
        const hasDay = Array.isArray(m.schedule) && m.schedule.some((s) => s.day === dayParam);
        if (!hasDay) return false;
      }
      if (statusParam && statusParam !== 'all') {
        const mStatus = m.status || 'active';
        if (mStatus !== statusParam) return false;
      }
      return true;
    });
  }, [markets, debouncedSearch, dayParam, statusParam]);

  const totalStalls = useMemo(() => {
    return markets.reduce(
      (sum, m) => sum + (m.farmerCount ?? m.attendingFarmersCount ?? 0),
      0
    );
  }, [markets]);

  // Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState(null);

  // Deletion State
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleOpenCreate = () => {
    setEditingMarket(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMarket(m);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setEditingMarket(null);
  };

  const handleSavedSheet = async () => {
    setIsSheetOpen(false);
    setEditingMarket(null);
    await fetchMarketsList();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMarket(deleteTarget.id || deleteTarget._id, true);
      showToast('Market deleted.', 'success');
      setDeleteTarget(null);
      await fetchMarketsList();
    } catch (err) {
      showToast(err?.message || 'Failed to delete market.', 'error');
    }
  };

  // Table Columns with (_val, row) signatures
  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Market',
        render: (_val, row) => (
          <div className={styles.marketCell}>
            <button
              type="button"
              className={styles.marketName}
              onClick={() => handleOpenEdit(row)}
            >
              {row?.name}
            </button>
            <span className={styles.marketAddress}>{row?.address}</span>
          </div>
        ),
      },
      {
        key: 'town',
        header: 'Town',
        render: (_val, row) => <span className={styles.townCell}>{extractTown(row?.address)}</span>,
      },
      {
        key: 'days',
        header: 'Days',
        render: (_val, row) => <DayDots days={row?.schedule || []} size="sm" />,
      },
      {
        key: 'stalls',
        header: 'Stalls',
        render: (_val, row) => {
          const stallCount = row?.farmerCount ?? row?.attendingFarmersCount ?? 0;
          return (
            <Link
              to={`/admin/people?tab=farmers&market=${row?.id || row?._id}`}
              className={styles.stallLink}
              title={`View ${stallCount} stall(s) in People`}
            >
              <span>{stallCount}</span>
              <ExternalLink size={12} className={styles.externalIcon} aria-hidden="true" />
            </Link>
          );
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (_val, row) => (
          <div className={styles.actionsCell}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => handleOpenEdit(row)}
              aria-label={`Edit ${row?.name}`}
            >
              Edit
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => setDeleteTarget(row)}
              aria-label={`Delete ${row?.name}`}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Filters for FilterBar
  const filterOptions = useMemo(
    () => [
      {
        key: 'day',
        label: 'Trading Day',
        value: dayParam,
        options: [
          { value: 'all', label: 'All days' },
          { value: 'mon', label: 'Monday' },
          { value: 'tue', label: 'Tuesday' },
          { value: 'wed', label: 'Wednesday' },
          { value: 'thu', label: 'Thursday' },
          { value: 'fri', label: 'Friday' },
          { value: 'sat', label: 'Saturday' },
          { value: 'sun', label: 'Sunday' },
        ],
      },
      {
        key: 'status',
        label: 'Status',
        value: statusParam,
        options: [
          { value: 'all', label: 'All statuses' },
          { value: 'active', label: 'Active' },
          { value: 'draft', label: 'Draft' },
        ],
      },
    ],
    [dayParam, statusParam]
  );

  const handleFilterChange = (key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value && value !== 'all') {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSearchParams({}, { replace: true });
  };

  return (
    <AdminPage
      title="Markets"
      context={`${markets.length} physical markets · ${totalStalls} stalls attached`}
      primaryAction={{
        label: 'Add market',
        onClick: handleOpenCreate,
      }}
    >
      <div className={styles.container}>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          filters={filterOptions}
          onFilterChange={handleFilterChange}
          resultCount={filteredMarkets.length}
          onReset={handleResetFilters}
        />

        {fetchError && (
          <div className={styles.errorBanner} role="alert">
            <span>{fetchError}</span>
            <Button variant="secondary" size="sm" onClick={fetchMarketsList}>
              Retry
            </Button>
          </div>
        )}

        {!fetchError && (
          <DataTable
            columns={columns}
            rows={filteredMarkets}
            rowKey="id"
            loading={loading}
            empty={
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>
                  {debouncedSearch || dayParam !== 'all' || statusParam !== 'all'
                    ? 'No matching markets found'
                    : 'No markets registered yet.'}
                </p>
                <p className={styles.emptyDesc}>
                  {debouncedSearch || dayParam !== 'all' || statusParam !== 'all'
                    ? 'Try adjusting your search query or day filters.'
                    : 'Add your first market to start organizing stalls and schedules.'}
                </p>
                {debouncedSearch || dayParam !== 'all' || statusParam !== 'all' ? (
                  <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                    Reset filters
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                    Add market
                  </Button>
                )}
              </div>
            }
          />
        )}
      </div>

      <MarketEditorSheet
        open={isSheetOpen}
        market={editingMarket}
        onClose={handleCloseSheet}
        onSaved={handleSavedSheet}
        showToast={showToast}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.name || 'market'}"?`}
        body={
          (deleteTarget?.farmerCount ?? deleteTarget?.attendingFarmersCount ?? 0) > 0
            ? `This market has ${(deleteTarget?.farmerCount ?? deleteTarget?.attendingFarmersCount ?? 0)} stall(s) attached. This will remove the market and detach all stalls. This cannot be undone.`
            : 'This will remove the market. This action cannot be undone.'
        }
        confirmLabel="Delete market"
        typeToConfirm={deleteTarget?.name}
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </AdminPage>
  );
}

export default Markets;
