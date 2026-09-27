import React, { useState } from 'react';
import {
  approveFarmer,
  rejectFarmer,
  suspendFarmer,
  reinstateFarmer,
  deactivateCustomer,
  activateCustomer,
} from '@/api/admin';
import styles from './People.module.css';

export function usePeopleActions({
  farmersList,
  fetchPeople,
  refreshOverview,
  showToast,
  setSelectedPerson,
  setSelectedIds,
}) {
  const [dialogConfig, setDialogConfig] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const runAction = async (actionFn, id, reason, successMsg) => {
    setBusyId(id);
    try {
      await actionFn(id, reason);
      await fetchPeople();
      refreshOverview();
      showToast(successMsg);
      setDialogConfig(null);
      setSelectedPerson(null);
    } catch (err) {
      throw err;
    } finally {
      setBusyId(null);
    }
  };

  const triggerApproveFarmer = (farmer, e) => {
    e?.stopPropagation();
    const id = farmer.farmerId || farmer.id;
    const name = farmer.stallName || farmer.name;
    setDialogConfig({
      open: true,
      title: 'Approve this farmer?',
      body: 'They will be able to list products and appear in the public catalogue.',
      confirmLabel: 'Approve',
      requireReason: false,
      variant: 'primary',
      onConfirm: async () => {
        await runAction(approveFarmer, id, null, `Approved ${name}`);
      },
    });
  };

  const triggerRejectFarmer = (farmer, e) => {
    e?.stopPropagation();
    const id = farmer.farmerId || farmer.id;
    const name = farmer.stallName || farmer.name;
    setDialogConfig({
      open: true,
      title: 'Reject this registration?',
      body: 'They will not be able to list products. They will see your reason.',
      confirmLabel: 'Reject application',
      requireReason: true,
      variant: 'danger',
      onConfirm: async (reason) => {
        await runAction(rejectFarmer, id, reason, `Rejected application for ${name}`);
      },
    });
  };

  const triggerSuspendFarmer = (farmer, e) => {
    e?.stopPropagation();
    const id = farmer.farmerId || farmer.id;
    const name = farmer.stallName || farmer.name;
    setDialogConfig({
      open: true,
      title: 'Suspend this farmer?',
      body: 'Their listings will be hidden from the catalogue immediately. Existing orders are not cancelled.',
      confirmLabel: 'Suspend farmer',
      requireReason: true,
      variant: 'danger',
      onConfirm: async (reason) => {
        await runAction(suspendFarmer, id, reason, `Suspended ${name}`);
      },
    });
  };

  const triggerReinstateFarmer = (farmer, e) => {
    e?.stopPropagation();
    const id = farmer.farmerId || farmer.id;
    const name = farmer.stallName || farmer.name;
    setDialogConfig({
      open: true,
      title: 'Reinstate this farmer?',
      body: 'Their listings will return to the public catalogue.',
      confirmLabel: 'Reinstate',
      requireReason: false,
      variant: 'primary',
      onConfirm: async () => {
        await runAction(reinstateFarmer, id, null, `Reinstated ${name}`);
      },
    });
  };

  const triggerDeactivateCustomer = (customer, e) => {
    e?.stopPropagation();
    const id = customer.id;
    const name = customer.name;
    setDialogConfig({
      open: true,
      title: 'Deactivate this account?',
      body: 'They will not be able to sign in or place orders.',
      confirmLabel: 'Deactivate account',
      requireReason: true,
      variant: 'danger',
      onConfirm: async (reason) => {
        await runAction(deactivateCustomer, id, reason, `Deactivated ${name}`);
      },
    });
  };

  const triggerActivateCustomer = (customer, e) => {
    e?.stopPropagation();
    const id = customer.id;
    const name = customer.name;
    setDialogConfig({
      open: true,
      title: 'Activate this account?',
      body: 'They will be able to sign in and place orders again.',
      confirmLabel: 'Activate account',
      requireReason: false,
      variant: 'primary',
      onConfirm: async () => {
        await runAction(activateCustomer, id, null, `Activated ${name}`);
      },
    });
  };

  const handleBulkApprove = (selectedIds) => {
    const selectedFarmers = farmersList.filter((f) => selectedIds.includes(f.id));
    setDialogConfig({
      open: true,
      title: `Approve ${selectedFarmers.length} farmers?`,
      body: (
        <div>
          <p style={{ margin: '0 0 var(--space-2) 0' }}>
            They will be able to list products and appear in the public catalogue.
          </p>
          <div className={styles.bulkDialogList}>
            {selectedFarmers.map((f) => (
              <div key={f.id} className={styles.bulkDialogItem}>
                <strong>{f.stallName || f.name}</strong>
                <span>{f.email}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      confirmLabel: 'Approve selected',
      requireReason: false,
      variant: 'primary',
      onConfirm: async () => {
        const ok = [];
        const failed = [];
        for (const f of selectedFarmers) {
          try {
            await approveFarmer(f.farmerId || f.id);
            ok.push(f.id);
          } catch (err) {
            failed.push(f.id);
          }
        }
        await fetchPeople();
        refreshOverview();
        setSelectedIds(failed);
        if (failed.length === 0) {
          showToast(`${ok.length} approved.`);
        } else {
          showToast(`${ok.length} approved. ${failed.length} failed.`);
        }
      },
    });
  };

  const handleBulkReject = (selectedIds) => {
    const selectedFarmers = farmersList.filter((f) => selectedIds.includes(f.id));
    setDialogConfig({
      open: true,
      title: `Reject ${selectedFarmers.length} registrations?`,
      body: (
        <div>
          <p style={{ margin: '0 0 var(--space-2) 0' }}>
            They will not be able to list products. The reason you enter will be sent to all selected farmers.
          </p>
          <div className={styles.bulkDialogList}>
            {selectedFarmers.map((f) => (
              <div key={f.id} className={styles.bulkDialogItem}>
                <strong>{f.stallName || f.name}</strong>
                <span>{f.email}</span>
              </div>
            ))}
          </div>
        </div>
      ),
      confirmLabel: 'Reject selected',
      requireReason: true,
      variant: 'danger',
      onConfirm: async (reason) => {
        const ok = [];
        const failed = [];
        for (const f of selectedFarmers) {
          try {
            await rejectFarmer(f.farmerId || f.id, reason);
            ok.push(f.id);
          } catch (err) {
            failed.push(f.id);
          }
        }
        await fetchPeople();
        refreshOverview();
        setSelectedIds(failed);
        if (failed.length === 0) {
          showToast(`${ok.length} rejected.`);
        } else {
          showToast(`${ok.length} rejected. ${failed.length} failed.`);
        }
      },
    });
  };

  return {
    dialogConfig,
    setDialogConfig,
    busyId,
    triggerApproveFarmer,
    triggerRejectFarmer,
    triggerSuspendFarmer,
    triggerReinstateFarmer,
    triggerDeactivateCustomer,
    triggerActivateCustomer,
    handleBulkApprove,
    handleBulkReject,
  };
}

export default usePeopleActions;
