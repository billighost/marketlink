import React, { useEffect, useRef } from 'react';
import { Play, RotateCcw, X } from 'lucide-react';
import Illustration from '@/components/domain/Illustration';
import styles from './Onboarding.module.css';

/**
 * RestartModal prompts user before launching the product tour again.
 */
export function RestartModal({
  isOpen,
  role = 'buyer',
  onConfirm,
  onClose,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    modalRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onConfirm, onClose]);

  if (!isOpen) return null;

  const isVendor = role === 'vendor' || role === 'farmer';

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={styles.restartCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="restart-modal-title"
        tabIndex={-1}
      >
        <button
          type="button"
          onClick={onClose}
          className={styles.welcomeCloseBtn}
          aria-label="Close dialog"
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        <div className={styles.restartIconBadge}>
          <RotateCcw size={22} className={styles.restartRotateIcon} />
        </div>

        <h3 id="restart-modal-title" className={styles.restartTitle}>
          Restart the MarketLink Tour?
        </h3>

        <p className={styles.restartDesc}>
          {isVendor
            ? 'We will walk you through your grower cockpit, stock availability controls, order fulfillment queues, and pickup verification tools.'
            : 'We will guide you through exploring local markets, browsing harvest feeds, reserving produce, and using the market route planner.'}
        </p>

        <div className={styles.restartActions}>
          <button
            type="button"
            onClick={onConfirm}
            className={styles.startTourBtn}
            autoFocus
          >
            <Play size={16} fill="currentColor" />
            <span>Start Tour</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className={styles.cancelBtn}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default RestartModal;
