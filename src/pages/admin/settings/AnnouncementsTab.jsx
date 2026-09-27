import React, { useState, useEffect, useCallback } from 'react';
import {
  getAdminAnnouncements,
  createAdminAnnouncement,
  updateAdminAnnouncement,
  publishAdminAnnouncement,
  deleteAdminAnnouncement,
} from '@/api/admin';
import { useToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import Button from '@/components/ui/Button';
import { formatDateShort } from '@/utils/format';
import AnnouncementEditorSheet from './AnnouncementEditorSheet';
import styles from './AnnouncementsTab.module.css';

export default function AnnouncementsTab() {
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Dialog states
  const [publishTarget, setPublishTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAnnouncementsList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminAnnouncements();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setAnnouncements(list);
    } catch (err) {
      showToast(err.message || 'Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAnnouncementsList();
  }, [fetchAnnouncementsList]);

  const handleOpenCreate = () => {
    setEditingAnn(null);
    setFormError(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (ann) => {
    setEditingAnn(ann);
    setFormError(null);
    setSheetOpen(true);
  };

  const handleSave = async (formData) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingAnn) {
        await updateAdminAnnouncement(editingAnn.id, formData);
        showToast('Announcement updated.', 'success');
      } else {
        await createAdminAnnouncement(formData);
        showToast('Announcement created.', 'success');
      }
      setSheetOpen(false);
      await fetchAnnouncementsList();
    } catch (err) {
      setFormError(err.message || 'Failed to save announcement');
      showToast(err.message || 'Failed to save announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    try {
      await publishAdminAnnouncement(publishTarget.id);
      showToast('Announcement published to site banner.', 'success');
      setPublishTarget(null);
      await fetchAnnouncementsList();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminAnnouncement(deleteTarget.id);
      showToast('Announcement deleted.', 'success');
      setDeleteTarget(null);
      await fetchAnnouncementsList();
    } catch (err) {
      throw err;
    }
  };

  const isPublished = (ann) => {
    if (!ann.publishedAt) return false;
    const now = new Date();
    const pub = new Date(ann.publishedAt);
    const exp = ann.expiresAt ? new Date(ann.expiresAt) : null;
    return pub <= now && (!exp || exp >= now);
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <p className={styles.description}>
          Platform-wide announcements displayed in the header banner across guest, customer, and farmer pages.
        </p>
        <Button variant="primary" size="sm" onClick={handleOpenCreate}>
          + New announcement
        </Button>
      </div>

      <div className={styles.announcementList} role="list" aria-label="Announcements">
        {loading ? (
          <p className={styles.description}>Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p className={styles.description}>No announcements yet.</p>
        ) : (
          announcements.map((ann) => {
            const published = isPublished(ann);
            return (
              <div key={ann.id} className={styles.card} role="listitem">
                <div className={styles.cardHeader}>
                  <div className={styles.statusGroup}>
                    <span
                      className={`${styles.statusDot} ${published ? styles.statusDotPublished : styles.statusDotDraft}`}
                      aria-hidden="true"
                    />
                    <span className={styles.statusText}>{published ? 'Published' : 'Draft'}</span>
                  </div>
                  <span className={styles.audienceTag}>Audience: {ann.audience}</span>
                </div>

                <h3 className={styles.title}>{ann.title}</h3>
                <p className={styles.bodyText}>{ann.body}</p>

                <div className={styles.cardMeta}>
                  <span className={styles.metaText}>
                    {published
                      ? `Published ${formatDateShort(ann.publishedAt)}`
                      : `Created ${formatDateShort(ann.createdAt)}`}
                  </span>

                  <div className={styles.actions}>
                    <button type="button" className={styles.actionBtn} onClick={() => handleOpenEdit(ann)}>
                      Edit
                    </button>
                    {!published && (
                      <button type="button" className={styles.publishBtn} onClick={() => setPublishTarget(ann)}>
                        Publish
                      </button>
                    )}
                    <button type="button" className={styles.deleteBtn} onClick={() => setDeleteTarget(ann)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AnnouncementEditorSheet
        open={sheetOpen}
        announcement={editingAnn}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
        submitting={submitting}
        error={formError}
      />

      <ConfirmDialog
        open={Boolean(publishTarget)}
        title="Publish this announcement?"
        body="It will appear in the top banner of every page for all visitors. This notification cannot be silently undone; use delete if you wish to remove it later."
        confirmLabel="Publish announcement"
        variant="primary"
        onConfirm={handlePublish}
        onClose={() => setPublishTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.title}"?`}
        body="This will permanently delete the announcement and remove it from the site banner for all visitors."
        confirmLabel="Delete announcement"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
