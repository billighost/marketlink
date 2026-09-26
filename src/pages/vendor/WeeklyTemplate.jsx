import React, { useState, useEffect } from 'react';
import { getWeeklyTemplate, updateWeeklyTemplate } from '@/api/farmer';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';
import Skeleton from '@/components/ui/Skeleton';
import styles from './WeeklyTemplate.module.css';

export function WeeklyTemplate({ onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await getWeeklyTemplate();
        if (isMounted) {
          const list = (res?.data || []).map((it) => ({
            ...it,
            productName: it.productName || it.name || 'Produce Item',
            enabled: Boolean(it.enabled ?? it.weekly?.enabled),
            defaultQuantity: it.defaultQuantity ?? it.weekly?.defaultQty ?? 10,
          }));
          setItems(list);
        }
      } catch (err) {
        if (isMounted) setError(err?.message || 'Could not load weekly template.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = (idx, enabled) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], enabled };
      return copy;
    });
  };

  const handleQtyChange = (idx, defaultQuantity) => {
    const qty = Math.max(0, parseInt(defaultQuantity || '0', 10));
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], defaultQuantity: qty };
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await updateWeeklyTemplate(
        items.map((it) => ({
          productId: it.productId,
          enabled: Boolean(it.enabled),
          defaultQty: Number(it.defaultQuantity || 0),
          defaultQuantity: Number(it.defaultQuantity || 0),
        }))
      );
      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save weekly template.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height="32px" width="60%" />
        <Skeleton height="60px" />
        <Skeleton height="60px" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.intro}>
        Configure default restock quantities for each product. Applying the template resets listed items to these numbers at the start of each harvest week.
      </p>

      {error && (
        <div className={styles.errorBox} role="alert">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <p className={styles.emptyText}>No products found in your catalog.</p>
      ) : (
        <div className={styles.list}>
          {items.map((item, idx) => (
            <div key={item.productId || idx} className={styles.row}>
              <div className={styles.rowInfo}>
                <span className={styles.productName}>{item.productName}</span>
                <span className={styles.unitText}>{item.unit ? `per ${item.unit}` : ''}</span>
              </div>

              <div className={styles.rowControls}>
                {item.enabled && (
                  <div className={styles.qtyBox}>
                    <input
                      type="number"
                      value={item.defaultQuantity}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                      min={0}
                      max={10000}
                      className={styles.qtyInput}
                      aria-label={`Default quantity for ${item.productName}`}
                      disabled={saving}
                    />
                  </div>
                )}
                <Toggle
                  checked={Boolean(item.enabled)}
                  onChange={(checked) => handleToggle(idx, checked)}
                  disabled={saving}
                  label={`Enable weekly reset for ${item.productName}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={saving || items.length === 0}
          loading={saving}
          className={styles.saveBtn}
        >
          Save template
        </Button>
      </div>
    </div>
  );
}

export default WeeklyTemplate;
