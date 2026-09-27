import React, { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  reorderAdminCategories,
} from '@/api/admin';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import Button from '@/components/ui/Button';
import CategoryEditorSheet from './CategoryEditorSheet';
import styles from './CategoriesTab.module.css';

export default function CategoriesTab() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState('');

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCategoriesList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminCategories();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setCategories(list);
    } catch (err) {
      showToast(err.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategoriesList();
  }, [fetchCategoriesList]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormError(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormError(null);
    setSheetOpen(true);
  };

  const handleSave = async (formData) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingCategory) {
        await updateAdminCategory(editingCategory.id, formData);
        showToast('Category updated.', 'success');
      } else {
        const nextOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sortOrder || 0)) + 1 : 1;
        await createAdminCategory({ ...formData, sortOrder: nextOrder });
        showToast('Category created.', 'success');
      }
      setSheetOpen(false);
      await fetchCategoriesList();
    } catch (err) {
      setFormError(err.message || 'Failed to save category');
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const previousList = [...categories];
    const newList = [...categories];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    setCategories(newList);
    setAnnouncement(`Moved ${moved.name} to position ${targetIndex + 1} of ${newList.length}`);

    const payload = newList.map((cat, idx) => ({ id: cat.id, sortOrder: idx + 1 }));
    try {
      await reorderAdminCategories(payload);
    } catch (err) {
      setCategories(previousList);
      setAnnouncement(`Failed to reorder ${moved.name}. Reverted.`);
      showToast(err.message || 'Failed to reorder categories', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminCategory(deleteTarget.id);
      showToast('Category deleted.', 'success');
      setDeleteTarget(null);
      await fetchCategoriesList();
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <p className={styles.description}>
          Product categories customers filter by when browsing produce. Reorder to adjust browse sequence.
        </p>
        <Button variant="primary" size="sm" onClick={handleOpenCreate}>
          + Add category
        </Button>
      </div>

      <div role="status" aria-live="polite" className="visuallyHidden">
        {announcement}
      </div>

      <div className={styles.categoryList} role="list" aria-label="Product categories">
        {loading ? (
          <p className={styles.description}>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className={styles.description}>No categories created yet.</p>
        ) : (
          categories.map((cat, idx) => (
            <div key={cat.id} className={styles.categoryCard} role="listitem">
              <div className={styles.cardLeft}>
                <div className={styles.reorderButtons}>
                  <button
                    type="button"
                    className={styles.reorderBtn}
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    aria-label={`Move ${cat.name} up`}
                  >
                    <ChevronUp size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.reorderBtn}
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === categories.length - 1}
                    aria-label={`Move ${cat.name} down`}
                  >
                    <ChevronDown size={14} aria-hidden="true" />
                  </button>
                </div>

                <span className={styles.artBadge}>{cat.art || 'basket'}</span>

                <div className={styles.catInfo}>
                  <span className={styles.catName}>{cat.name}</span>
                  <span className={styles.catMeta}>
                    Slug: {cat.slug} · Order: {cat.sortOrder ?? idx + 1}
                  </span>
                </div>
              </div>

              <div className={styles.cardRight}>
                {cat.active === false && <span className={styles.inactiveBadge}>Inactive</span>}
                <button type="button" className={styles.actionBtn} onClick={() => handleOpenEdit(cat)}>
                  Edit
                </button>
                <button type="button" className={styles.deleteBtn} onClick={() => setDeleteTarget(cat)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <CategoryEditorSheet
        open={sheetOpen}
        category={editingCategory}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
        submitting={submitting}
        error={formError}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete category "${deleteTarget?.name}"?`}
        body="Deleting this category will remove it from customer browse filters. If products reference this category, deletion will be refused."
        confirmLabel="Delete category"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
