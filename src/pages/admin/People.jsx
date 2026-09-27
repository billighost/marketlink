import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminFarmers, getAdminCustomers } from '@/api/admin';
import { useAdmin } from '@/layouts/AdminLayout';
import { useToast } from '@/components/ui/Toast';
import AdminPage from '@/components/admin/AdminPage';
import DataTable from '@/components/admin/DataTable';
import FilterBar from '@/components/admin/FilterBar';
import BulkBar from '@/components/admin/BulkBar';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import PersonDetailSheet from './PersonDetailSheet';
import { createFarmerColumns, createCustomerColumns, renderStatusBadge } from './peopleColumns';
import usePeopleActions from './usePeopleActions';
import styles from './People.module.css';

export function People() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshOverview } = useAdmin();
  const { showToast } = useToast();

  // Tab: 'farmers' | 'customers'
  const tabParam = searchParams.get('tab') || (searchParams.get('role') === 'customer' ? 'customers' : 'farmers');
  const activeTab = tabParam === 'customers' ? 'customers' : 'farmers';

  // Status filter from URL
  const statusParam = searchParams.get('status') || 'all';

  // Search query from URL
  const queryParam = searchParams.get('q') || searchParams.get('search') || '';

  const [search, setSearch] = useState(queryParam);
  const [debouncedSearch, setDebouncedSearch] = useState(queryParam);

  const [farmersList, setFarmersList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [farmerCounts, setFarmerCounts] = useState({ total: 0, pending: 0 });
  const [customerCounts, setCustomerCounts] = useState({ total: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Detail Sheet
  const [selectedPerson, setSelectedPerson] = useState(null);

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

  // Synchronize local search if URL changes externally
  useEffect(() => {
    if (queryParam !== search) {
      setSearch(queryParam);
      setDebouncedSearch(queryParam);
    }
  }, [queryParam]);

  // Fetch People data
  const fetchPeople = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isFarmers = activeTab === 'farmers';
      const query = { limit: 100 };

      // Map status
      if (statusParam && statusParam !== 'all') {
        if (statusParam === 'approved') {
          query.status = 'active';
        } else {
          query.status = statusParam;
        }
      }

      if (debouncedSearch.trim()) {
        query.search = debouncedSearch.trim();
      }

      if (isFarmers) {
        const res = await getAdminFarmers(query);
        const data = res?.data || [];
        setFarmersList(data);
      } else {
        const res = await getAdminCustomers(query);
        const data = res?.data || [];
        setCustomersList(data);
      }

      // Concurrently fetch counts for tab badges and context header
      const [allFarmersRes, allCustomersRes] = await Promise.all([
        getAdminFarmers({ limit: 100 }),
        getAdminCustomers({ limit: 100 }),
      ]);

      const allFarmers = allFarmersRes?.data || [];
      const pendingCount = allFarmers.filter((f) => f.status === 'pending').length;
      setFarmerCounts({ total: allFarmers.length, pending: pendingCount });

      const allCustomers = allCustomersRes?.data || [];
      setCustomerCounts({ total: allCustomers.length });
    } catch (err) {
      setError(err?.message || 'Failed to load people.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusParam, debouncedSearch]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  // Tab switching
  const handleTabChange = (newTab) => {
    setSelectedIds([]);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      next.delete('status'); // reset status on tab change
      return next;
    });
  };

  // Status filter change
  const handleStatusChange = (newStatus) => {
    setSelectedIds([]);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newStatus && newStatus !== 'all') {
        next.set('status', newStatus);
      } else {
        next.delete('status');
      }
      return next;
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedIds([]);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('status');
      next.delete('q');
      next.delete('search');
      return next;
    });
  };

  // Actions hook for dialogs, mutations, and bulk actions
  const {
    dialogConfig,
    setDialogConfig,
    busyId,
    triggerApproveFarmer,
    triggerRejectFarmer,
    triggerSuspendFarmer,
    triggerReinstateFarmer,
    triggerDeactivateCustomer,
    triggerActivateCustomer,
    handleBulkApprove: execBulkApprove,
    handleBulkReject: execBulkReject,
  } = usePeopleActions({
    farmersList,
    fetchPeople,
    refreshOverview,
    showToast,
    setSelectedPerson,
    setSelectedIds,
  });

  const handleBulkApprove = () => execBulkApprove(selectedIds);
  const handleBulkReject = () => execBulkReject(selectedIds);



  // Sorting & Data Preparation
  const sortedFarmers = useMemo(() => {
    return [...farmersList].sort((a, b) => {
      const aPending = a.status === 'pending';
      const bPending = b.status === 'pending';
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [farmersList]);

  const sortedCustomers = useMemo(() => {
    return [...customersList].sort((a, b) => {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [customersList]);

  // Columns configuration
  const farmerColumns = useMemo(
    () =>
      createFarmerColumns({
        busyId,
        renderStatusBadge,
        triggerApproveFarmer,
        triggerRejectFarmer,
        triggerSuspendFarmer,
        triggerReinstateFarmer,
        setSelectedPerson,
      }),
    [busyId]
  );

  const customerColumns = useMemo(
    () =>
      createCustomerColumns({
        busyId,
        triggerDeactivateCustomer,
        triggerActivateCustomer,
        setSelectedPerson,
      }),
    [busyId]
  );

  // FilterBar configuration
  const filters = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        value: statusParam,
        options:
          activeTab === 'farmers'
            ? [
                { value: 'all', label: 'All statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'active', label: 'Approved' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'rejected', label: 'Rejected' },
              ]
            : [
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
      },
    ],
    [activeTab, statusParam]
  );

  const activeRowCount = activeTab === 'farmers' ? sortedFarmers.length : sortedCustomers.length;

  return (
    <AdminPage
      title="People"
      context={`${farmerCounts.total} farmers · ${customerCounts.total} customers`}
    >
      <div className={styles.container}>
        {/* Navigation Tabs */}
        <Tabs
          tabs={[
            { id: 'farmers', label: 'Farmers', count: farmerCounts.total },
            { id: 'customers', label: 'Customers', count: customerCounts.total },
          ]}
          active={activeTab}
          onChange={handleTabChange}
        />

        {/* Filter & Search Bar */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFilterChange={(_, value) => handleStatusChange(value)}
          resultCount={activeRowCount}
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
              onClick={fetchPeople}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Data Table */}
        {!error && (
          <DataTable
            columns={activeTab === 'farmers' ? farmerColumns : customerColumns}
            rows={activeTab === 'farmers' ? sortedFarmers : sortedCustomers}
            rowKey="id"
            loading={loading}
            selected={activeTab === 'farmers' ? selectedIds : []}
            onSelect={activeTab === 'farmers' ? setSelectedIds : undefined}
            onRowClick={(row) => setSelectedPerson(row)}
            empty={
              <EmptyState
                title={
                  statusParam !== 'all' || debouncedSearch
                    ? `No ${activeTab} match these filters`
                    : `No ${activeTab} have registered yet.`
                }
                action={
                  statusParam !== 'all' || debouncedSearch ? (
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
            }
          />
        )}

        {/* Bulk Actions Bar */}
        {activeTab === 'farmers' && selectedIds.length > 0 && (
          <BulkBar selected={selectedIds} onClear={() => setSelectedIds([])}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={handleBulkApprove}
            >
              Bulk Approve
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
              onClick={handleBulkReject}
            >
              Bulk Reject
            </button>
          </BulkBar>
        )}

        {/* Person Detail Sheet */}
        <PersonDetailSheet
          selectedPerson={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          renderStatusBadge={renderStatusBadge}
          onApproveFarmer={triggerApproveFarmer}
          onRejectFarmer={triggerRejectFarmer}
          onSuspendFarmer={triggerSuspendFarmer}
          onReinstateFarmer={triggerReinstateFarmer}
          onDeactivateCustomer={triggerDeactivateCustomer}
          onActivateCustomer={triggerActivateCustomer}
        />

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

export default People;
