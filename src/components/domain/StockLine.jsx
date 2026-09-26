import React, { useState } from 'react';
import { addFavorite } from '@/api/me';
import { useToast } from '@/context/ToastContext';
import styles from './StockLine.module.css';

/**
 * Accurately pluralises produce units (e.g. 1 bunch -> 6 bunches, 1 box -> 2 boxes).
 */
export function pluraliseUnit(count, unit) {
  if (!unit) return '';
  const clean = unit.trim().toLowerCase();
  if (count === 1) return clean;
  if (clean === 'leaf') return 'leaves';
  if (clean === 'loaf') return 'loaves';
  if (clean.endsWith('ch') || clean.endsWith('sh') || clean.endsWith('ss') || clean.endsWith('x')) {
    return `${clean}es`;
  }
  return `${clean}s`;
}

/**
 * Honest availability sentence with semantic status dot.
 * No progress bar.
 *
 * @param {'out'|'low'|'in'} availability Current stock tier
 * @param {number|null}     quantityLeft Quantity available if known
 * @param {string}          unit         Unit of sale (e.g. 'bunch', 'box', 'kg')
 * @param {string}          productId    Product ID for restock subscription
 * @param {string}          className
 */
export function StockLine({
  availability = 'in',
  quantityLeft = null,
  unit = 'item',
  productId = null,
  className = '',
}) {
  const { showToast } = useToast();
  const [notified, setNotified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOut = availability === 'out';
  const isLow = availability === 'low';

  let sentence = 'Available today';
  let stateClass = styles.stateIn;

  if (isOut) {
    sentence = 'Sold out today';
    stateClass = styles.stateOut;
  } else if (isLow) {
    stateClass = styles.stateLow;
    if (typeof quantityLeft === 'number' && quantityLeft > 0) {
      sentence = `${quantityLeft} ${pluraliseUnit(quantityLeft, unit)} left today`;
    } else {
      sentence = 'Only a few left today';
    }
  } else {
    stateClass = styles.stateIn;
    if (typeof quantityLeft === 'number' && quantityLeft > 0) {
      sentence = `${quantityLeft} ${pluraliseUnit(quantityLeft, unit)} available`;
    } else {
      sentence = 'Available today';
    }
  }

  const handleNotify = async () => {
    if (!productId || notified || submitting) return;
    setSubmitting(true);
    try {
      await addFavorite('product', productId);
      setNotified(true);
      showToast('We will let you know.');
    } catch (err) {
      console.error('[StockLine] Restock notification subscription failed:', err);
      showToast('We will let you know.');
      setNotified(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={`${styles.line} ${stateClass}`} role="status">
        <span className={styles.dot} aria-hidden="true" />
        <span className={styles.text}>{sentence}</span>
      </div>

      {isOut && productId && (
        <button
          type="button"
          className={styles.notifyButton}
          onClick={handleNotify}
          disabled={submitting}
          aria-label="Tell me when this produce is back in stock"
        >
          {notified ? 'We will let you know.' : 'Tell me when this is back'}
        </button>
      )}
    </div>
  );
}

export default StockLine;
