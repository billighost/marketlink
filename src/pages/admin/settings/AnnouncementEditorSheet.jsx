import React, { useState, useEffect } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import { ANNOUNCEMENT_AUDIENCES } from '@/constants';
import styles from './AnnouncementsTab.module.css';

const MAX_BODY_LENGTH = 600;

export default function AnnouncementEditorSheet({
  open,
  announcement,
  onClose,
  onSave,
  submitting,
  error,
}) {
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formAudience, setFormAudience] = useState('all');

  useEffect(() => {
    if (announcement) {
      setFormTitle(announcement.title || '');
      setFormBody(announcement.body || '');
      setFormAudience(announcement.audience || 'all');
    } else {
      setFormTitle('');
      setFormBody('');
      setFormAudience('all');
    }
  }, [announcement, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim() || submitting) return;
    onSave({
      title: formTitle.trim(),
      body: formBody.trim(),
      audience: formAudience,
    });
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={announcement ? 'Edit announcement' : 'New announcement'}
      size="tall"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <FormField
          id="ann-title"
          label="Announcement Title"
          required
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          error={error}
          placeholder="e.g. Elm Street Market closed this Saturday"
        />

        <FormField
          id="ann-audience"
          label="Target Audience"
          as="select"
          value={formAudience}
          onChange={(e) => setFormAudience(e.target.value)}
        >
          {ANNOUNCEMENT_AUDIENCES.map((aud) => (
            <option key={aud} value={aud}>
              {aud === 'all' ? 'All users (platform-wide)' : aud === 'customer' ? 'Customers only' : 'Farmers only'}
            </option>
          ))}
        </FormField>

        <FormField
          id="ann-body"
          label="Announcement Message"
          as="textarea"
          rows={4}
          required
          maxLength={MAX_BODY_LENGTH}
          value={formBody}
          onChange={(e) => setFormBody(e.target.value)}
          placeholder="Write the announcement text that appears in the top site banner..."
        />
        <div className={styles.charCount}>
          {formBody.length} / {MAX_BODY_LENGTH} characters
        </div>

        <div className={styles.previewContainer}>
          <span className={styles.previewLabel}>Live Preview (Top Banner)</span>
          <aside className={styles.previewBar} aria-label="Announcement banner preview">
            <div className={styles.previewContent}>
              {formTitle.trim() && <span className={styles.previewTitle}>{formTitle.trim()}:</span>}
              <span className={styles.previewMessage}>
                {formBody.trim() || 'Announcement banner preview text will appear here.'}
              </span>
            </div>
          </aside>
        </div>

        <div className={styles.footerActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={!formTitle.trim() || !formBody.trim() || submitting}
          >
            Save announcement
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
