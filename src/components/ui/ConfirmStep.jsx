import React, { useState } from 'react';
import Button from './Button';
import styles from './ConfirmStep.module.css';

/**
 * Reusable in-sheet confirmation step with optional reason field and warning banner.
 */
export function ConfirmStep({
  title,
  message,
  warning,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  cancelLabel = 'Cancel',
  requireReason = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Please explain the reason...',
  onConfirm,
  onCancel,
  isLoading = false,
  error = '',
  className = '',
}) {
  const [reason, setReason] = useState('');
  const [fieldError, setFieldError] = useState('');

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setFieldError('A reason is required.');
      return;
    }
    setFieldError('');
    if (onConfirm) {
      onConfirm(reason.trim());
    }
  };

  return (
    <div className={`${styles.confirmBlock} ${className}`}>
      {title && <h3 className={styles.title}>{title}</h3>}
      {message && <p className={styles.message}>{message}</p>}

      {warning && (
        <div className={styles.warningBox} role="alert">
          {warning}
        </div>
      )}

      {requireReason && (
        <div className={styles.reasonGroup}>
          <label htmlFor="confirm-step-reason" className={styles.reasonLabel}>
            {reasonLabel} <span className={styles.required}>*</span>
          </label>
          <textarea
            id="confirm-step-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (fieldError) setFieldError('');
            }}
            placeholder={reasonPlaceholder}
            className={`${styles.reasonTextarea} ${fieldError ? styles.hasError : ''}`}
            rows={3}
            disabled={isLoading}
          />
          {fieldError && <span className={styles.errorText}>{fieldError}</span>}
        </div>
      )}

      {error && (
        <div className={styles.errorBox} role="alert">
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <Button
          type="button"
          variant={confirmVariant}
          size="md"
          onClick={handleConfirm}
          disabled={isLoading}
          loading={isLoading}
          className={styles.confirmBtn}
        >
          {confirmLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}

export default ConfirmStep;
