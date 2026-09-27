import React from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import { formatDateShort } from '@/utils/format';
import styles from './People.module.css';

export function PersonDetailSheet({
  selectedPerson,
  onClose,
  renderStatusBadge,
  onApproveFarmer,
  onRejectFarmer,
  onSuspendFarmer,
  onReinstateFarmer,
  onDeactivateCustomer,
  onActivateCustomer,
  onEditPerson,
  onDeletePerson,
}) {
  const initial = (
    selectedPerson?.stallName ||
    selectedPerson?.name ||
    '?'
  )[0].toUpperCase();

  const isFarmer = selectedPerson?.role === 'farmer';

  return (
    <BottomSheet
      open={Boolean(selectedPerson)}
      onClose={onClose}
      title={isFarmer ? (selectedPerson?.stallName || selectedPerson?.name) : selectedPerson?.name}
    >
      {selectedPerson && (
        <div className={styles.detailDrawer}>
          {/* Profile Header Banner */}
          <div className={styles.detailProfileCard}>
            <div className={styles.avatarEmblem} aria-hidden="true">
              {initial}
            </div>
            <div className={styles.detailTitleGroup}>
              <h3 className={styles.detailTitle}>
                {selectedPerson.stallName || selectedPerson.name}
              </h3>
              <p className={styles.detailSubtitle}>
                {isFarmer ? 'Farmer / Stallholder' : 'Customer Account'}
                {selectedPerson.stallName && selectedPerson.name
                  ? ` • Contact: ${selectedPerson.name}`
                  : ''}
              </p>
            </div>
            <div className={styles.detailBadgeWrap}>
              {renderStatusBadge(selectedPerson.status)}
            </div>
          </div>

          {/* Account Details Card */}
          <div className={styles.detailCard}>
            <div className={styles.detailSectionHeader}>
              <h4 className={styles.detailSectionTitle}>
                {isFarmer ? 'Stall & Contact Information' : 'Account Information'}
              </h4>
            </div>
            <div className={styles.detailGrid}>
              {selectedPerson.email && (
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Email</span>
                  <span className={styles.detailFieldValue}>{selectedPerson.email}</span>
                </div>
              )}
              {selectedPerson.phone && (
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Phone</span>
                  <span className={styles.detailFieldValue}>{selectedPerson.phone}</span>
                </div>
              )}
              {selectedPerson.stallNumber && (
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Stall Number</span>
                  <span className={styles.detailFieldValue}>#{selectedPerson.stallNumber}</span>
                </div>
              )}
              {selectedPerson.listingEnabled !== undefined && (
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Catalogue Listing</span>
                  <span className={styles.detailFieldValue}>
                    {selectedPerson.listingEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Activity & History Card */}
          <div className={styles.detailCard}>
            <div className={styles.detailSectionHeader}>
              <h4 className={styles.detailSectionTitle}>Platform Activity</h4>
            </div>
            <div className={styles.detailGrid}>
              {selectedPerson.createdAt && (
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Member Since</span>
                  <span className={styles.detailFieldValue}>
                    {formatDateShort(selectedPerson.createdAt)}
                  </span>
                </div>
              )}
              {selectedPerson.updatedAt && (
                <div className={styles.detailField}>
                  <span className={styles.detailFieldLabel}>Last Activity</span>
                  <span className={styles.detailFieldValue}>
                    {formatDateShort(selectedPerson.updatedAt)}
                  </span>
                </div>
              )}
              <div className={styles.detailField}>
                <span className={styles.detailFieldLabel}>Account Role</span>
                <span className={styles.detailFieldValue}>
                  {isFarmer ? 'Farmer' : 'Customer'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.detailActions}>
            {onEditPerson && (
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => onEditPerson(selectedPerson)}
              >
                Edit Account Details
              </button>
            )}

            {isFarmer ? (
              <>
                {selectedPerson.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      onClick={(e) => onApproveFarmer(selectedPerson, e)}
                    >
                      Approve Farmer
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={(e) => onRejectFarmer(selectedPerson, e)}
                    >
                      Reject Application
                    </button>
                  </>
                )}
                {(selectedPerson.status === 'active' || selectedPerson.status === 'approved') && (
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    onClick={(e) => onSuspendFarmer(selectedPerson, e)}
                  >
                    Suspend Farmer
                  </button>
                )}
                {selectedPerson.status === 'suspended' && (
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                    onClick={(e) => onReinstateFarmer(selectedPerson, e)}
                  >
                    Reinstate Farmer
                  </button>
                )}
              </>
            ) : (
              <>
                {selectedPerson.status === 'active' ? (
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                    onClick={(e) => onDeactivateCustomer(selectedPerson, e)}
                  >
                    Deactivate Customer
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                    onClick={(e) => onActivateCustomer(selectedPerson, e)}
                  >
                    Activate Customer
                  </button>
                )}
              </>
            )}

            {onDeletePerson && (
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                style={{ marginLeft: 'auto' }}
                onClick={() => onDeletePerson(selectedPerson)}
              >
                Delete Account
              </button>
            )}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

export default PersonDetailSheet;
