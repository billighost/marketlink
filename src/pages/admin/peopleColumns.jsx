import React from 'react';
import Badge from '@/components/ui/Badge';
import { formatDateShort } from '@/utils/format';
import { ExternalLink } from 'lucide-react';
import styles from './People.module.css';

export function renderStatusBadge(status) {
  switch (status) {
    case 'pending':
      return <Badge tone="warning">Pending</Badge>;
    case 'active':
    case 'approved':
      return <Badge tone="success">Approved</Badge>;
    case 'suspended':
      return <Badge tone="danger">Suspended</Badge>;
    case 'rejected':
      return <Badge tone="neutral">Rejected</Badge>;
    case 'inactive':
      return <Badge tone="neutral">Inactive</Badge>;
    default:
      return <Badge tone="neutral">{status || 'Unknown'}</Badge>;
  }
}

export function createFarmerColumns({
  busyId,
  renderStatusBadge,
  triggerApproveFarmer,
  triggerRejectFarmer,
  triggerSuspendFarmer,
  triggerReinstateFarmer,
  setSelectedPerson,
}) {
  return [
    {
      key: 'stallName',
      header: 'Stall',
      render: (val, row) => {
        const r = row || {};
        const stallId = r.farmerId || r.id;
        return (
          <a
            href={`/stalls/${stallId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.stallLink}
            onClick={(e) => e.stopPropagation()}
            title="View public stall in new tab"
          >
            <span>{r.stallName || r.name || val || 'Unnamed Stall'}</span>
            <ExternalLink size={12} className={styles.externalIcon} aria-hidden="true" />
          </a>
        );
      },
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (val, row) => {
        const r = row || {};
        return (
          <div className={styles.contactCell}>
            <span className={styles.contactName}>{r.name || '—'}</span>
            <span className={styles.contactEmail}>{r.email || ''}</span>
          </div>
        );
      },
    },
    {
      key: 'market',
      header: 'Market / Stall #',
      hideBelow: 768,
      render: (val, row) => {
        const r = row || {};
        return (
          <span className={styles.marketText}>
            {r.stallNumber ? `Stall #${r.stallNumber}` : (r.marketName || '—')}
          </span>
        );
      },
    },
    {
      key: 'products',
      header: 'Listings',
      align: 'right',
      render: (val, row) => {
        const r = row || {};
        return (
          <span className={styles.tabularNum}>
            {r.productsCount ?? (r.listingEnabled ? 'Active' : '0')}
          </span>
        );
      },
    },
    {
      key: 'joined',
      header: 'Joined',
      hideBelow: 1024,
      render: (val, row) => {
        const r = row || {};
        return (
          <span className={styles.dateText}>{formatDateShort(r.createdAt)}</span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (val, row) => {
        const r = row || {};
        return renderStatusBadge(r.status || val);
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (val, row) => {
        const r = row || {};
        const isBusy = busyId === (r.farmerId || r.id);
        return (
          <div className={styles.actionsCell}>
            {r.status === 'pending' && (
              <>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                  onClick={(e) => triggerApproveFarmer(r, e)}
                  disabled={isBusy}
                  aria-label={`Approve ${r.stallName || r.name}`}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={(e) => triggerRejectFarmer(r, e)}
                  disabled={isBusy}
                  aria-label={`Reject ${r.stallName || r.name}`}
                >
                  Reject
                </button>
              </>
            )}

            {(r.status === 'active' || r.status === 'approved') && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                onClick={(e) => triggerSuspendFarmer(r, e)}
                disabled={isBusy}
                aria-label={`Suspend ${r.stallName || r.name}`}
              >
                Suspend
              </button>
            )}

            {r.status === 'suspended' && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                onClick={(e) => triggerReinstateFarmer(r, e)}
                disabled={isBusy}
                aria-label={`Reinstate ${r.stallName || r.name}`}
              >
                Reinstate
              </button>
            )}

            <button
              type="button"
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPerson(r);
              }}
              aria-label={`View details for ${r.stallName || r.name}`}
            >
              Details
            </button>
          </div>
        );
      },
    },
  ];
}

export function createCustomerColumns({
  busyId,
  triggerDeactivateCustomer,
  triggerActivateCustomer,
  setSelectedPerson,
}) {
  return [
    {
      key: 'name',
      header: 'Customer',
      render: (val, row) => {
        const r = row || {};
        return (
          <div className={styles.contactCell}>
            <span className={styles.contactName}>{r.name || val || '—'}</span>
          </div>
        );
      },
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (val, row) => {
        const r = row || {};
        return (
          <div className={styles.contactCell}>
            <span className={styles.contactEmail}>{r.email || ''}</span>
            {r.phone && <span className={styles.phoneText}>{r.phone}</span>}
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Phone',
      hideBelow: 768,
      render: (val, row) => {
        const r = row || {};
        return <span className={styles.phoneText}>{r.phone || val || '—'}</span>;
      },
    },
    {
      key: 'joined',
      header: 'Joined',
      hideBelow: 1024,
      render: (val, row) => {
        const r = row || {};
        return (
          <span className={styles.dateText}>{formatDateShort(r.createdAt)}</span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (val, row) => {
        const r = row || {};
        const status = r.status || val;
        return (
          <Badge tone={status === 'active' ? 'success' : 'neutral'}>
            {status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (val, row) => {
        const r = row || {};
        const isBusy = busyId === r.id;
        return (
          <div className={styles.actionsCell}>
            {r.status === 'active' ? (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                onClick={(e) => triggerDeactivateCustomer(r, e)}
                disabled={isBusy}
                aria-label={`Deactivate ${r.name}`}
              >
                Deactivate
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                onClick={(e) => triggerActivateCustomer(r, e)}
                disabled={isBusy}
                aria-label={`Activate ${r.name}`}
              >
                Activate
              </button>
            )}

            <button
              type="button"
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPerson(r);
              }}
              aria-label={`View details for ${r.name}`}
            >
              Details
            </button>
          </div>
        );
      },
    },
  ];
}
