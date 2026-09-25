import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getAdminFarmers,
  getAdminCustomers,
  approveFarmer,
  rejectFarmer,
  suspendFarmer,
  reinstateFarmer,
  deactivateCustomer,
  activateCustomer,
} from '@/api/admin';
import { useAdmin } from '@/layouts/AdminLayout';
import Chip from '@/components/ui/Chip';
import Button from '@/components/ui/Button';
import StatusDot from '@/components/ui/StatusDot';
import Skeleton from '@/components/ui/Skeleton';
import BottomSheet from '@/components/ui/BottomSheet';
import ConfirmStep from '@/components/ui/ConfirmStep';
import Toast from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { formatDateShort } from '@/utils/format';
import { Search, UserCheck, UserX, AlertTriangle, ShieldCheck } from 'lucide-react';
import styles from './People.module.css';

const FARMER_STATUS_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'active', label: 'Active' },
  { id: 'suspended', label: 'Suspended' },
  { id: 'rejected', label: 'Rejected' },
];

const CUSTOMER_STATUS_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
];

export function People() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshOverview } = useAdmin();

  // Tab: 'farmers' | 'customers'
  const initialRole = searchParams.get('role') === 'customer' ? 'customers' : 'farmers';
  const initialStatus = searchParams.get('status') || 'all';

  const [activeTab, setActiveTab] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  // Selected Person Modal Sheet
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [modalAction, setModalAction] = useState('none'); // 'none' | 'reject' | 'suspend' | 'deactivate'
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Load people list
  const fetchPeople = useCallback(
    async (cursor = null, isLoadMore = false) => {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);
      setError('');

      try {
        const query = { limit: 20 };
        if (cursor) query.cursor = cursor;
        if (debouncedSearch.trim()) query.search = debouncedSearch.trim();
        if (statusFilter !== 'all') query.status = statusFilter;

        let res;
        if (activeTab === 'farmers') {
          res = await getAdminFarmers(query);
        } else {
          res = await getAdminCustomers(query);
        }

        const list = res?.data || [];
        const meta = res?.meta || {};

        setPeople((prev) => (isLoadMore ? [...prev, ...list] : list));
        setNextCursor(meta.nextCursor || null);
        setHasMore(Boolean(meta.hasMore));
      } catch (err) {
        setError(err?.message || 'Could not load users.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, statusFilter, debouncedSearch]
  );

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  // Direct status action handler (approve, reinstate, activate)
  const handleDirectAction = async (actionFn, person, successMsg) => {
    setActionLoading(true);
    setActionError('');
    try {
      const res = await actionFn(person.id);
      setToastMessage(successMsg || `${person.name || person.stallName} updated.`);
      setToastType('success');
      setSelectedPerson(null);
      setModalAction('none');
      fetchPeople();
      refreshOverview();
    } catch (err) {
      setActionError(err?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Step action handler with reason (reject, suspend, deactivate)
  const handleReasonAction = async (actionFn, reason) => {
    setActionLoading(true);
    setActionError('');
    try {
      await actionFn(selectedPerson.id, reason);
      const name = selectedPerson.name || selectedPerson.stallName;
      setToastMessage(`${name} status updated.`);
      setToastType('success');
      setSelectedPerson(null);
      setModalAction('none');
      fetchPeople();
      refreshOverview();
    } catch (err) {
      setActionError(err?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChipList = () => {
    return activeTab === 'farmers' ? FARMER_STATUS_CHIPS : CUSTOMER_STATUS_CHIPS;
  };

  return (
    <div className={styles.container}>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onDismiss={() => setToastMessage('')}
        />
      )}

      {/* Page Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>People</h1>
        <p className={styles.subtitle}>
          Manage registered Farmers, stall approvals, and Customer accounts.
        </p>
      </header>

      {/* Tabs: Farmers | Customers */}
      <div className={styles.tabsRow} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'farmers'}
          className={`${styles.tabBtn} ${activeTab === 'farmers' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('farmers');
            setStatusFilter('all');
          }}
        >
          Farmers
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'customers'}
          className={`${styles.tabBtn} ${activeTab === 'customers' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            setActiveTab('customers');
            setStatusFilter('all');
          }}
        >
          Customers
        </button>
      </div>

      {/* Search and Status Filter Row */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab === 'farmers' ? 'stalls' : 'customers'}...`}
            className={styles.searchInput}
            aria-label={`Search ${activeTab}`}
          />
        </div>

        <div className={styles.chipsRow} role="radiogroup" aria-label="Status filter">
          {getStatusChipList().map((chip) => (
            <Chip
              key={chip.id}
              label={chip.label}
              selected={statusFilter === chip.id}
              onClick={() => setStatusFilter(chip.id)}
            />
          ))}
        </div>
      </div>

      {/* Table / Responsive List */}
      {loading ? (
        <div className={styles.loadingBox}>
          <Skeleton height="56px" />
          <Skeleton height="56px" />
          <Skeleton height="56px" />
        </div>
      ) : error ? (
        <ErrorState title="Couldn't load this" text={error} onRetry={() => fetchPeople()} />
      ) : people.length === 0 ? (
        <EmptyState
          title="No one matches"
          text="Try another status or search."
          actionLabel="Clear filters"
          onAction={() => {
            setSearch('');
            setStatusFilter('all');
          }}
        />
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Status</th>
                <th scope="col">Joined</th>
                <th scope="col" className={styles.actionHeader}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => {
                const displayName =
                  activeTab === 'farmers'
                    ? person.stallName || person.name || 'Unnamed Stall'
                    : person.name || 'Customer';

                return (
                  <tr key={person.id} className={styles.tableRow}>
                    <td data-label="Name" className={styles.nameCell}>
                      <strong>{displayName}</strong>
                      {activeTab === 'farmers' && person.contactPerson && (
                        <span className={styles.subtleText}>{person.contactPerson}</span>
                      )}
                    </td>
                    <td data-label="Email" className={styles.emailCell}>
                      {person.email}
                    </td>
                    <td data-label="Status" className={styles.statusCell}>
                      <span className={styles.statusBadge}>
                        <StatusDot
                          status={
                            person.status === 'active'
                              ? 'completed'
                              : person.status === 'pending'
                              ? 'placed'
                              : 'cancelled'
                          }
                        />
                        <span>{person.status}</span>
                      </span>
                    </td>
                    <td data-label="Joined" className={styles.dateCell}>
                      {person.createdAt ? formatDateShort(person.createdAt) : '—'}
                    </td>
                    <td data-label="Action" className={styles.actionCell}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedPerson(person)}
                      >
                        Open
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className={styles.loadMoreWrapper}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => fetchPeople(nextCursor, true)}
            loading={loadingMore}
            disabled={loadingMore}
          >
            Load more people
          </Button>
        </div>
      )}

      {/* Person Detail Sheet */}
      {selectedPerson && (
        <BottomSheet
          isOpen={true}
          onClose={() => {
            setSelectedPerson(null);
            setModalAction('none');
          }}
          size="tall"
          title={
            activeTab === 'farmers'
              ? selectedPerson.stallName || 'Farmer Stall'
              : selectedPerson.name || 'Customer Profile'
          }
        >
          {modalAction === 'none' ? (
            <div className={styles.sheetContent}>
              {actionError && (
                <div className={styles.actionError} role="alert">
                  <AlertTriangle size={16} aria-hidden="true" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className={styles.personHeader}>
                <div className={styles.profileBadge}>
                  <StatusDot
                    status={
                      selectedPerson.status === 'active'
                        ? 'completed'
                        : selectedPerson.status === 'pending'
                        ? 'placed'
                        : 'cancelled'
                    }
                  />
                  <span>{selectedPerson.status?.toUpperCase()}</span>
                </div>
                <span className={styles.personEmail}>{selectedPerson.email}</span>
                {selectedPerson.phone && (
                  <span className={styles.personPhone}>{selectedPerson.phone}</span>
                )}
              </div>

              {activeTab === 'farmers' && (
                <div className={styles.farmerDetailsBox}>
                  {selectedPerson.specialty && (
                    <div className={styles.detailRow}>
                      <strong>Specialty:</strong> <span>{selectedPerson.specialty}</span>
                    </div>
                  )}
                  {selectedPerson.address && (
                    <div className={styles.detailRow}>
                      <strong>Address:</strong> <span>{selectedPerson.address}</span>
                    </div>
                  )}
                  {selectedPerson.since && (
                    <div className={styles.detailRow}>
                      <strong>Since:</strong> <span>{selectedPerson.since}</span>
                    </div>
                  )}
                  {selectedPerson.story && (
                    <div className={styles.storyRow}>
                      <strong>Story:</strong>
                      <p>{selectedPerson.story}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons Map based on spec D6 */}
              <div className={styles.sheetActions}>
                {activeTab === 'farmers' ? (
                  <>
                    {selectedPerson.status === 'pending' && (
                      <>
                        <Button
                          type="button"
                          variant="primary"
                          size="lg"
                          onClick={() =>
                            handleDirectAction(
                              approveFarmer,
                              selectedPerson,
                              `${selectedPerson.stallName || 'Farmer'} is approved.`
                            )
                          }
                          disabled={actionLoading}
                          loading={actionLoading}
                        >
                          Approve stall
                        </Button>
                        <button
                          type="button"
                          onClick={() => setModalAction('reject')}
                          className={styles.dangerTextBtn}
                        >
                          Reject application
                        </button>
                      </>
                    )}

                    {selectedPerson.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => setModalAction('suspend')}
                        className={styles.dangerTextBtn}
                      >
                        Suspend stall
                      </button>
                    )}

                    {selectedPerson.status === 'suspended' && (
                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        onClick={() =>
                          handleDirectAction(
                            reinstateFarmer,
                            selectedPerson,
                            `${selectedPerson.stallName || 'Farmer'} reinstated.`
                          )
                        }
                        disabled={actionLoading}
                        loading={actionLoading}
                      >
                        Reinstate stall
                      </Button>
                    )}

                    {selectedPerson.status === 'rejected' && (
                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        onClick={() =>
                          handleDirectAction(
                            approveFarmer,
                            selectedPerson,
                            `${selectedPerson.stallName || 'Farmer'} is approved.`
                          )
                        }
                        disabled={actionLoading}
                        loading={actionLoading}
                      >
                        Approve stall
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {selectedPerson.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => setModalAction('deactivate')}
                        className={styles.dangerTextBtn}
                      >
                        Deactivate account
                      </button>
                    )}

                    {selectedPerson.status === 'inactive' && (
                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        onClick={() =>
                          handleDirectAction(
                            activateCustomer,
                            selectedPerson,
                            `${selectedPerson.name} activated.`
                          )
                        }
                        disabled={actionLoading}
                        loading={actionLoading}
                      >
                        Activate account
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : modalAction === 'reject' ? (
            <ConfirmStep
              title="Reject stall application"
              message={`Reject ${selectedPerson.stallName}? Please provide a reason that will be communicated to the farmer.`}
              confirmLabel="Reject application"
              confirmVariant="danger"
              cancelLabel="Back"
              requireReason={true}
              reasonLabel="Reason for rejection"
              reasonPlaceholder="e.g. Missing required certifications or outside delivery zone..."
              onConfirm={(reason) => handleReasonAction(rejectFarmer, reason)}
              onCancel={() => setModalAction('none')}
              isLoading={actionLoading}
              error={actionError}
            />
          ) : modalAction === 'suspend' ? (
            <ConfirmStep
              title="Suspend farmer stall"
              message={`Suspending ${selectedPerson.stallName} will immediately delist all their products and sign them out.`}
              confirmLabel="Suspend stall"
              confirmVariant="danger"
              cancelLabel="Back"
              requireReason={true}
              reasonLabel="Reason for suspension"
              reasonPlaceholder="e.g. Policy violation or quality concerns..."
              onConfirm={(reason) => handleReasonAction(suspendFarmer, reason)}
              onCancel={() => setModalAction('none')}
              isLoading={actionLoading}
              error={actionError}
            />
          ) : (
            <ConfirmStep
              title="Deactivate customer account"
              message={`Deactivate ${selectedPerson.name || selectedPerson.email}? The customer will be signed out immediately.`}
              confirmLabel="Deactivate account"
              confirmVariant="danger"
              cancelLabel="Back"
              requireReason={true}
              reasonLabel="Reason"
              reasonPlaceholder="e.g. Inappropriate behavior or requested closure..."
              onConfirm={(reason) => handleReasonAction(deactivateCustomer, reason)}
              onCancel={() => setModalAction('none')}
              isLoading={actionLoading}
              error={actionError}
            />
          )}
        </BottomSheet>
      )}
    </div>
  );
}

export default People;
