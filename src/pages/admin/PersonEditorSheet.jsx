import React, { useState, useEffect } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import FormField from '@/components/ui/FormField';
import Toggle from '@/components/ui/Toggle';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { createAdminPerson, updateAdminPerson } from '@/api/admin';
import styles from './People.module.css';

export function PersonEditorSheet({ open, person, initialRole = 'farmer', onClose, onSaved, showToast }) {
  const isEditing = Boolean(person);

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('active');
  const [password, setPassword] = useState('');
  const [stallName, setStallName] = useState('');
  const [stallNumber, setStallNumber] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [listingEnabled, setListingEnabled] = useState(true);

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (person) {
      setRole(person.role || 'farmer');
      setName(person.name || '');
      setEmail(person.email || '');
      setPhone(person.phone || '');
      setStatus(person.status || 'active');
      setPassword('');
      setStallName(person.stallName || '');
      setStallNumber(person.stallNumber || '');
      setSpecialty(person.specialty || '');
      setListingEnabled(person.listingEnabled !== false);
    } else {
      setRole(initialRole);
      setName('');
      setEmail('');
      setPhone('');
      setStatus('active');
      setPassword('');
      setStallName('');
      setStallNumber('');
      setSpecialty('');
      setListingEnabled(true);
    }
    setFieldErrors({});
    setGeneralError('');
    setIsDirty(false);
  }, [open, person, initialRole]);

  const handleFieldChange = (setter) => (e) => {
    setter(e.target.value);
    setIsDirty(true);
  };

  const handleAttemptClose = () => {
    if (isDirty) {
      setDiscardConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const validate = () => {
    const errors = {};
    if (!name.trim() || name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'A valid email address is required.';
    }
    if (role === 'farmer' && !stallName.trim() && !name.trim()) {
      errors.stallName = 'Stall name or person name is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setGeneralError('');

    const payload = {
      role,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
      status,
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    if (role === 'farmer') {
      payload.stallName = (stallName.trim() || `${name.trim()}'s Stall`);
      payload.stallNumber = stallNumber.trim() || null;
      payload.specialty = specialty.trim() || '';
      payload.listingEnabled = listingEnabled;
    }

    try {
      if (isEditing) {
        await updateAdminPerson(person.id, payload);
        showToast?.('Person details updated successfully.', 'success');
      } else {
        await createAdminPerson(payload);
        showToast?.('Account created successfully.', 'success');
      }
      setIsDirty(false);
      onSaved?.();
    } catch (err) {
      setGeneralError(err?.message || 'Failed to save person details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <BottomSheet
        open={open}
        onClose={handleAttemptClose}
        title={isEditing ? `Edit ${person?.name || 'Account'}` : 'Create New Account'}
      >
        <form onSubmit={handleSubmit} className={styles.editorForm}>
          {generalError && (
            <div className={styles.errorBanner} role="alert">
              <span>{generalError}</span>
            </div>
          )}

          {/* Role Selection (Only changeable when creating) */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>Account Role</label>
            <div className={styles.roleToggleGroup}>
              <button
                type="button"
                disabled={isEditing}
                className={`${styles.roleToggleBtn} ${role === 'farmer' ? styles.roleToggleBtnActive : ''}`}
                onClick={() => {
                  setRole('farmer');
                  setIsDirty(true);
                }}
              >
                🌾 Farmer / Producer
              </button>
              <button
                type="button"
                disabled={isEditing}
                className={`${styles.roleToggleBtn} ${role === 'customer' ? styles.roleToggleBtnActive : ''}`}
                onClick={() => {
                  setRole('customer');
                  setIsDirty(true);
                }}
              >
                🛒 Customer / Buyer
              </button>
            </div>
          </div>

          {/* Primary Account Info */}
          <div className={styles.formSection}>
            <div className={styles.formGrid}>
              <FormField
                label="Full Name"
                required
                error={fieldErrors.name}
              >
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={handleFieldChange(setName)}
                  disabled={submitting}
                />
              </FormField>

              <FormField
                label="Email Address"
                required
                error={fieldErrors.email}
              >
                <input
                  type="email"
                  className={styles.formInput}
                  placeholder="jane@example.com"
                  value={email}
                  onChange={handleFieldChange(setEmail)}
                  disabled={submitting}
                />
              </FormField>
            </div>

            <div className={styles.formGrid}>
              <FormField label="Phone Number" error={fieldErrors.phone}>
                <input
                  type="tel"
                  className={styles.formInput}
                  placeholder="+44 7700 900077"
                  value={phone}
                  onChange={handleFieldChange(setPhone)}
                  disabled={submitting}
                />
              </FormField>

              <FormField label="Account Status">
                <select
                  className={styles.formSelect}
                  value={status}
                  onChange={handleFieldChange(setStatus)}
                  disabled={submitting}
                >
                  <option value="active">Active (Verified)</option>
                  <option value="pending">Pending Approval</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive / Deactivated</option>
                </select>
              </FormField>
            </div>

            <FormField
              label={isEditing ? 'Change Password (leave empty to keep current)' : 'Account Password'}
              caption={!isEditing && !password ? 'If left blank, a temporary default password will be generated automatically.' : undefined}
            >
              <input
                type="password"
                className={styles.formInput}
                placeholder={isEditing ? 'Enter new password if changing' : 'e.g. SecurePassword123!'}
                value={password}
                onChange={handleFieldChange(setPassword)}
                disabled={submitting}
                autoComplete="new-password"
              />
            </FormField>
          </div>

          {/* Farmer Specific Details */}
          {role === 'farmer' && (
            <div className={styles.formSection}>
              <h4 className={styles.sectionHeaderTitle}>Stall & Farm Details</h4>

              <div className={styles.formGrid}>
                <FormField
                  label="Stall / Farm Name"
                  required
                  error={fieldErrors.stallName}
                >
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Riverbend Organic Farm"
                    value={stallName}
                    onChange={handleFieldChange(setStallName)}
                    disabled={submitting}
                  />
                </FormField>

                <FormField label="Stall Number / Pitch">
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. A-14"
                    value={stallNumber}
                    onChange={handleFieldChange(setStallNumber)}
                    disabled={submitting}
                  />
                </FormField>
              </div>

              <FormField label="Farming Specialty">
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Organic Heritage Vegetables & Berries"
                  value={specialty}
                  onChange={handleFieldChange(setSpecialty)}
                  disabled={submitting}
                />
              </FormField>

              <div className={styles.toggleRow}>
                <div>
                  <span className={styles.toggleLabel}>Catalogue Listing Active</span>
                  <span className={styles.toggleSublabel}>Allow customers to view stall and order produce</span>
                </div>
                <Toggle
                  checked={listingEnabled}
                  onChange={(checked) => {
                    setListingEnabled(checked);
                    setIsDirty(true);
                  }}
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className={styles.formFooter}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleAttemptClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              disabled={submitting}
            >
              {isEditing ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* Discard changes confirmation dialog */}
      <ConfirmDialog
        open={discardConfirmOpen}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this form. Are you sure you want to close without saving?"
        confirmLabel="Discard Changes"
        variant="danger"
        onConfirm={() => {
          setDiscardConfirmOpen(false);
          setIsDirty(false);
          onClose();
        }}
        onCancel={() => setDiscardConfirmOpen(false)}
      />
    </>
  );
}

export default PersonEditorSheet;
