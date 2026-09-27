import React, { useEffect } from 'react';
import { useSmartBasket } from '@/context/SmartBasketContext';
import SmartBasketExperience from '@/components/domain/SmartBasketExperience';
import styles from './SmartBasketModal.module.css';

/**
 * SmartBasketModal wraps the unified SmartBasketExperience inside an interactive modal.
 * Triggered from floating actions, top bar, or category banners across the buyer app.
 */
export function SmartBasketModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialBudget,
  initialCategories,
  marketId,
  prompt,
  day,
}) {
  const context = useSmartBasket();
  const isOpen = propIsOpen !== undefined ? propIsOpen : context.isOpen;
  const onClose = propOnClose || context.closeSmartBasket;
  const ctxParams = context.initialParams || {};

  const effectiveBudget = initialBudget || ctxParams.budget || 10000;
  const effectiveCategories = initialCategories || ctxParams.categories;
  const effectiveMarketId = marketId || ctxParams.marketId;
  const effectivePrompt = prompt || ctxParams.prompt;
  const effectiveDay = day || ctxParams.day;

  // Prevent background scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('noScroll');
    } else {
      document.body.classList.remove('noScroll');
    }
    return () => {
      document.body.classList.remove('noScroll');
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-basket-modal-title"
      onClick={onClose}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <SmartBasketExperience
          initialParams={{
            budget: effectiveBudget,
            categories: effectiveCategories,
            marketId: effectiveMarketId,
            prompt: effectivePrompt,
            day: effectiveDay,
          }}
          embedded={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

export default SmartBasketModal;
