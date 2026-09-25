import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getAnnouncements } from '@/api/announcements';
import styles from './AnnouncementBar.module.css';

/**
 * Slim dismissible announcement bar (one at a time, newest first).
 * Dismissal remembered in sessionStorage per announcement ID.
 */
export function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await getAnnouncements();
        if (cancelled || !Array.isArray(list) || list.length === 0) return;

        // Filter out dismissed announcements
        for (const item of list) {
          const dismissed = sessionStorage.getItem(`marketlink_announcement_dismissed_${item.id}`);
          if (!dismissed) {
            setAnnouncement(item);
            break;
          }
        }
      } catch {
        // Graceful silent failure for announcements
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!announcement) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(`marketlink_announcement_dismissed_${announcement.id}`, 'true');
    } catch {
      // ignore
    }
    setAnnouncement(null);
  };

  return (
    <aside className={styles.announcementBar} aria-label="Site announcement">
      <div className={styles.content}>
        {announcement.title && <span className={styles.title}>{announcement.title}:</span>}
        <span className={styles.message}>{announcement.message}</span>
      </div>
      <button
        type="button"
        className={styles.closeButton}
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}

export default AnnouncementBar;
