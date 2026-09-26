import React from 'react';
import styles from './SectionRows.module.css';

/**
 * SectionRows: Grouped settings rows panel.
 * Used for You (Profile), Notification Preferences, and Saved Markets.
 *
 * @param {string} [title] Group header text above panel
 * @param {React.ReactNode} children Rows inside panel (usually ListRow)
 * @param {string} [className]
 */
export function SectionRows({ title, children, className = '', ...rest }) {
  return (
    <section className={`${styles.group} ${className}`} aria-label={title || undefined} {...rest}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <div className={styles.panel}>{children}</div>
    </section>
  );
}

export default SectionRows;
