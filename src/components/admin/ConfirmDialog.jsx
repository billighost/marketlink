import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

/**
 * Two-step destructive confirmation.
 *
 * @param {boolean}  open
 * @param {string}   title        "Remove this listing?"
 * @param {string}   body         what will happen, in plain words
 * @param {string}   confirmLabel "Remove listing"
 * @param {boolean}  requireReason  when true, a reason textarea is shown and required
 * @param {string}   typeToConfirm  when set, the operator must type this string exactly
 * @param {Function} onConfirm    (reason) => Promise
 * @param {Function} onClose
 */
export function ConfirmDialog({
  open = false,
  title = 'Are you sure?',
  body,
  confirmLabel = 'Confirm',
  requireReason = false,
  typeToConfirm,
  variant = 'danger',
  loadingLabel,
  onConfirm,
  onClose,
}) {
  const [reason, setReason] = useState('');
  const [typedString, setTypedString] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);
  const reasonInputRef = useRef(null);
  const typeInputRef = useRef(null);
  const confirmBtnRef = useRef(null);

  // Store the trigger element and handle focus trapping
  useEffect(() => {
    if (!open) {
      setError(null);
      setLoading(false);
      return;
    }

    previousActiveElement.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus initial interactive element
    const timer = setTimeout(() => {
      if (typeToConfirm && typeInputRef.current) {
        typeInputRef.current.focus();
      } else if (requireReason && reasonInputRef.current) {
        reasonInputRef.current.focus();
      } else if (confirmBtnRef.current) {
        confirmBtnRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [open, requireReason, typeToConfirm, loading, onClose]);

  if (!open) return null;

  const isTypeValid = !typeToConfirm || typedString === typeToConfirm;
  const isReasonValid = !requireReason || reason.trim().length > 0;
  const canConfirm = isTypeValid && isReasonValid && !loading;

  const handleConfirmClick = async () => {
    if (!canConfirm || !onConfirm) return;
    setLoading(true);
    setError(null);

    try {
      await onConfirm(reason.trim());
      // Successful execution: clear state and close
      setReason('');
      setTypedString('');
      setError(null);
      setLoading(false);
      onClose?.();
    } catch (err) {
      // KEEP DIALOG OPEN ON ERROR and show server message
      setLoading(false);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'An error occurred while performing this action.';
      setError(message);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose?.();
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleBackdropClick}
      aria-hidden={!open}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className={styles.header}>
          <h2 id="confirm-dialog-title" className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => !loading && onClose?.()}
            aria-label="Close dialog"
            disabled={loading}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {body && <p className={styles.bodyText}>{body}</p>}

        {error && (
          <div className={styles.errorBanner} role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {typeToConfirm && (
          <div className={styles.fieldGroup}>
            <label htmlFor="confirm-type-input" className={styles.fieldLabel}>
              Confirmation required
            </label>
            <span className={styles.typeInstruction}>
              Please type <span className={styles.typeHighlight}>{typeToConfirm}</span> to confirm.
            </span>
            <input
              id="confirm-type-input"
              ref={typeInputRef}
              type="text"
              className={styles.input}
              value={typedString}
              onChange={(e) => setTypedString(e.target.value)}
              placeholder={typeToConfirm}
              disabled={loading}
              autoComplete="off"
            />
          </div>
        )}

        {requireReason && (
          <div className={styles.fieldGroup}>
            <label htmlFor="confirm-reason-input" className={styles.fieldLabel}>
              Reason <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="confirm-reason-input"
              ref={reasonInputRef}
              className={styles.textarea}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the reason for this action..."
              required
              disabled={loading}
            />
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => !loading && onClose?.()}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={variant === 'primary' ? styles.primaryButton : styles.dangerButton}
            onClick={handleConfirmClick}
            disabled={!canConfirm}
          >
            {loading ? (loadingLabel || 'Processing…') : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
