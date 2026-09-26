import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { updateProfile, changePassword, signOutAllDevices } from '@/api/me';
import FormField from '@/components/ui/FormField';
import ConfirmStep from '@/components/ui/ConfirmStep';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './ProfileDetails.module.css';

export function ProfileDetails() {
  const { user, refreshUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useDocumentTitle('Personal details · MarketLink');

  // Personal details state
  const initialName = user?.name || '';
  const initialPhone = user?.phone || '';
  const initialAddress = user?.address || '';

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [fieldErrors, setFieldErrors] = useState({});
  const [savingDetails, setSavingDetails] = useState(false);

  // Sync state if user updates
  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setAddress(user?.address || '');
  }, [user]);

  // Dirty state checking
  const isDirty =
    name !== initialName ||
    phone !== initialPhone ||
    address !== initialAddress;

  // beforeunload listener when dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Save personal details
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFieldErrors({ name: 'Name is required.' });
      return;
    }

    setSavingDetails(true);
    setFieldErrors({});

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      });
      await refreshUser();
      showToast({ message: 'Personal details updated.', type: 'success' });
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        const errorsObj = {};
        err.details.forEach((d) => {
          if (d.field) errorsObj[d.field] = d.message;
        });
        setFieldErrors(errorsObj);
      } else {
        showToast({ message: err.message || 'Unable to save personal details.' });
      }
    } finally {
      setSavingDetails(false);
    }
  };

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Enter your current password.';
    }
    if (!newPassword || newPassword.length < 8) {
      errors.newPassword = 'New password must be at least 8 characters.';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setSavingPassword(true);
    setPasswordErrors({});

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });
      showToast({ message: 'Password changed successfully.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.details && Array.isArray(err.details)) {
        const errorsObj = {};
        err.details.forEach((d) => {
          if (d.field) errorsObj[d.field] = d.message;
        });
        setPasswordErrors(errorsObj);
      } else {
        setPasswordErrors({ currentPassword: err.message || 'Could not update password.' });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  // Sign out of all devices state
  const [isSignOutAllConfirm, setIsSignOutAllConfirm] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const handleSignOutAllDevices = async () => {
    setSigningOutAll(true);
    try {
      await signOutAllDevices();
      logout();
      showToast({ message: 'Signed out of all devices.' });
      navigate('/login');
    } catch (err) {
      showToast({ message: err.message || 'Could not sign out of all devices.' });
      setSigningOutAll(false);
      setIsSignOutAllConfirm(false);
    }
  };

  return (
    <Page width="read">
      <PageTitle
        title="Personal details"
        context="Your registration and contact details."
        backTo="/buyer/profile"
        backLabel="Back to you"
      />

      <div className={styles.container}>
        {/* Section 1: Details */}
        <section className={styles.section} aria-labelledby="details-heading">
          <h2 id="details-heading" className={styles.sectionTitle}>
            Account details
          </h2>
          <p className={styles.sectionDesc}>
            These details identify your pre-orders and pickup collection codes.
          </p>

          <form onSubmit={handleSaveDetails}>
            <div className={styles.fields}>
              <FormField
                id="name"
                label="Full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={fieldErrors.name}
                required
              />

              <FormField
                id="email"
                label="Email address"
                type="email"
                value={user?.email || ''}
                disabled
                hint="Contact support if you need to update your registered email."
              />

              <FormField
                id="phone"
                label="Contact number"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                error={fieldErrors.phone}
                placeholder="07700 900077"
                hint="Used for morning pickup and stall reminder alerts."
              />

              <FormField
                id="address"
                label="Address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: undefined }));
                }}
                error={fieldErrors.address}
                placeholder="Street address, Town, Postcode"
                hint="Your registered residential location."
              />
            </div>

            <footer className={styles.footer}>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={savingDetails || !isDirty}
              >
                {savingDetails ? 'Saving...' : 'Save changes'}
              </button>
            </footer>
          </form>
        </section>

        {/* Section 2: Change password */}
        <section className={styles.section} aria-labelledby="password-heading">
          <h2 id="password-heading" className={styles.sectionTitle}>
            Change password
          </h2>
          <p className={styles.sectionDesc}>
            Update the credentials used to sign in to your MarketLink account.
          </p>

          <form onSubmit={handlePasswordSubmit}>
            <div className={styles.fields}>
              <FormField
                id="currentPassword"
                label="Current password"
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordErrors.currentPassword) {
                    setPasswordErrors((prev) => ({ ...prev, currentPassword: undefined }));
                  }
                }}
                error={passwordErrors.currentPassword}
                autoComplete="current-password"
                required
              />

              <FormField
                id="newPassword"
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordErrors.newPassword) {
                    setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }));
                  }
                }}
                error={passwordErrors.newPassword}
                hint="At least 8 characters."
                autoComplete="new-password"
                required
              />

              <FormField
                id="confirmPassword"
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordErrors.confirmPassword) {
                    setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                error={passwordErrors.confirmPassword}
                autoComplete="new-password"
                required
              />
            </div>

            <footer className={styles.footer}>
              <button
                type="submit"
                className={styles.dangerBtn}
                disabled={savingPassword || !currentPassword || !newPassword}
              >
                {savingPassword ? 'Updating...' : 'Update password'}
              </button>
            </footer>
          </form>
        </section>

        {/* Section 3: Sign out of all devices */}
        <section className={styles.section} aria-labelledby="sessions-heading">
          <h2 id="sessions-heading" className={styles.sectionTitle}>
            Active sessions
          </h2>
          <p className={styles.sectionDesc}>
            If you signed in on a public or shared computer, you can invalidate all existing sessions.
          </p>

          {!isSignOutAllConfirm ? (
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={() => setIsSignOutAllConfirm(true)}
            >
              Sign out of all devices
            </button>
          ) : (
            <ConfirmStep
              title="Sign out everywhere?"
              message="This will terminate all active logins across all browsers and devices. You will need to sign in again."
              confirmLabel="Sign out everywhere"
              confirmVariant="danger"
              onConfirm={handleSignOutAllDevices}
              onCancel={() => setIsSignOutAllConfirm(false)}
              isLoading={signingOutAll}
            />
          )}
        </section>
      </div>
    </Page>
  );
}

export default ProfileDetails;
