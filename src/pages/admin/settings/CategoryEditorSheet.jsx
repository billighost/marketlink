import React, { useState, useEffect } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import FormField from '@/components/ui/FormField';
import Toggle from '@/components/ui/Toggle';
import Button from '@/components/ui/Button';
import { ALLOWED_ART_KEYS } from '@/constants';
import styles from './CategoriesTab.module.css';

export default function CategoryEditorSheet({
  open,
  category,
  onClose,
  onSave,
  submitting,
  error,
}) {
  const [formName, setFormName] = useState('');
  const [formArt, setFormArt] = useState('basket');
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    if (category) {
      setFormName(category.name || '');
      setFormArt(category.art || 'basket');
      setFormActive(category.active !== false);
    } else {
      setFormName('');
      setFormArt('basket');
      setFormActive(true);
    }
  }, [category, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim() || submitting) return;
    onSave({
      name: formName.trim(),
      art: formArt,
      active: formActive,
    });
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={category ? 'Edit category' : 'Add category'}
      size="compact"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <FormField
          id="cat-name"
          label="Category Name"
          required
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          error={error}
          placeholder="e.g. Heirloom Vegetables"
        />

        <FormField
          id="cat-art"
          label="Art Key"
          as="select"
          value={formArt}
          onChange={(e) => setFormArt(e.target.value)}
        >
          {ALLOWED_ART_KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </FormField>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Toggle id="cat-active" checked={formActive} onChange={setFormActive} label="Category active status" />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink)' }}>Active in Customer Browse</span>
        </div>

        <div className={styles.footerActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting} disabled={!formName.trim() || submitting}>
            Save category
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
