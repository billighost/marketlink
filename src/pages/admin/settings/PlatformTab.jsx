import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getPlatformSettings, updatePlatformSettings } from '@/api/admin';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import Button from '@/components/ui/Button';
import styles from './PlatformTab.module.css';

const KNOWN_SETTINGS = [
  {
    key: 'maxItemsPerOrder',
    title: 'Maximum Items per Order',
    help: 'Upper limit on produce quantity items a single customer order can contain (1–30).',
    min: 1,
    max: 30,
    step: 1,
  },
  {
    key: 'defaultCutoffMinutes',
    title: 'Default Cutoff Window (Minutes)',
    help: 'Default lead time before market opening when orders close (30–4320 minutes, e.g. 720 = 12 hours).',
    min: 30,
    max: 4320,
    step: 30,
  },
  {
    key: 'lowStockDefault',
    title: 'Low Stock Alert Threshold',
    help: 'Default quantity threshold below which produce shows low-stock warning chips (0–100).',
    min: 0,
    max: 100,
    step: 1,
  },
];

export default function PlatformTab() {
  const { showToast } = useToast();
  const [originalSettings, setOriginalSettings] = useState({});
  const [formSettings, setFormSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPlatformSettings();
      const data = res?.data || res || {};
      setOriginalSettings(data);
      setFormSettings(data);
    } catch (err) {
      showToast(err.message || 'Failed to load platform settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key, val) => {
    setFormSettings((prev) => ({
      ...prev,
      [key]: val === '' ? '' : Number(val),
    }));
  };

  const changedKeys = useMemo(() => {
    return Object.keys(formSettings).filter(
      (k) => formSettings[k] !== originalSettings[k] && formSettings[k] !== ''
    );
  }, [formSettings, originalSettings]);

  const isDirty = changedKeys.length > 0;

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!isDirty || submitting) return;
    setConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setSubmitting(true);
    const patch = {};
    for (const k of changedKeys) {
      patch[k] = formSettings[k];
    }

    try {
      const updated = await updatePlatformSettings(patch);
      const data = updated?.data || updated || {};
      setOriginalSettings(data);
      setFormSettings(data);
      showToast('Platform settings updated.', 'success');
      setConfirmOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to update settings', 'error');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Identify any unknown keys returned by the API
  const knownKeysSet = new Set(KNOWN_SETTINGS.map((s) => s.key));
  const unknownKeys = Object.keys(formSettings).filter((k) => !knownKeysSet.has(k));

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        System-wide configuration parameters affecting order limits, cutoff rules, and inventory alerts.
      </p>

      {loading ? (
        <p className={styles.description}>Loading settings...</p>
      ) : (
        <form onSubmit={handleSaveClick} className={styles.form}>
          {KNOWN_SETTINGS.map((field) => (
            <div key={field.key} className={styles.settingGroup}>
              <div className={styles.settingHeader}>
                <label htmlFor={`setting-${field.key}`} className={styles.settingTitle}>
                  {field.title}
                </label>
              </div>
              <p className={styles.settingHelp}>{field.help}</p>
              <input
                id={`setting-${field.key}`}
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                className={styles.numInput}
                value={formSettings[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            </div>
          ))}

          {unknownKeys.length > 0 && (
            <div className={styles.settingGroup}>
              <h3 className={styles.settingTitle}>Additional Configuration (Read-only)</h3>
              {unknownKeys.map((k) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <span className={styles.settingHelp}>{k}</span>
                  <div className={styles.readOnlyValue}>{JSON.stringify(formSettings[k])}</div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.actions}>
            <Button
              type="submit"
              variant="primary"
              disabled={!isDirty || submitting}
              loading={submitting}
            >
              Save changes
            </Button>
            {!isDirty && <span className={styles.savedNotice}>Settings up to date.</span>}
          </div>
        </form>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Update platform settings?"
        body={`You are changing: ${changedKeys.join(', ')}. These changes take effect immediately across all markets and customer orders.`}
        confirmLabel="Save settings"
        variant="primary"
        onConfirm={handleConfirmSave}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
