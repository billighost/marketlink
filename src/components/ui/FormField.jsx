import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './FormField.module.css';

/**
 * Accessible form field component wrapping label, control, hint, and error alert.
 */
export const FormField = forwardRef(function FormField(
  {
    label,
    id,
    type = 'text',
    as = 'input',
    hint,
    error,
    required = false,
    className = '',
    children,
    rightAccessory,
    ...rest
  },
  ref
) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const Component = as;

  const controlProps = {
    id,
    ref,
    required,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
    className: `${styles.control} ${error ? styles.controlError : ''} ${as === 'textarea' ? styles.textarea : ''}`,
    ...rest,
  };

  return (
    <div className={`${styles.fieldGroup} ${className}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          <span>{label}</span>
          {required && <span className={styles.requiredMark} aria-hidden="true">*</span>}
        </label>
      )}

      <div className={`${styles.controlWrapper} ${error ? styles.controlWrapperError : ''}`}>
        {as === 'select' ? (
          <select {...controlProps}>
            {children}
          </select>
        ) : as === 'textarea' ? (
          <textarea rows={rest.rows || 4} {...controlProps} />
        ) : (
          <input type={type} {...controlProps} />
        )}
        {rightAccessory && (
          <div className={styles.accessory}>{rightAccessory}</div>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}

      {error && (
        <div id={errorId} role="alert" className={styles.error}>
          <AlertCircle size={16} strokeWidth={1.5} aria-hidden="true" className={styles.errorIcon} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

export default FormField;
