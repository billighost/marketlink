import React from 'react';
import styles from './AdminPage.module.css';

/**
 * Admin page frame: the single <h1>, one context line, a primary action slot,
 * and the content column. Every admin page renders exactly one of these.
 *
 * @param {string}          title    the h1, sentence case
 * @param {React.ReactNode} context  one muted line, e.g. "12 awaiting approval"
 * @param {React.ReactNode} action   the ONE primary button, right-aligned
 * @param {React.ReactNode} children
 */
export function AdminPage({ title, context, action, children }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <h1 className={styles.title}>{title}</h1>
          {context && <p className={styles.context}>{context}</p>}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </header>
      <div className={styles.content}>{children}</div>
    </div>
  );
}

export default AdminPage;
