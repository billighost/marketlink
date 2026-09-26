import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from './PageTitle.module.css';

/**
 * The single <h1> block for a buyer page.
 * Density rule: title + at most ONE muted context line. Never two lines of context.
 *
 * @param {string}          title      the h1 text, sentence case
 * @param {React.ReactNode} context    one short muted line under the title
 * @param {string}          backTo     route to return to; renders a back link when present
 * @param {string}          backLabel  e.g. "Back to stalls"
 * @param {React.ReactNode} actions    right-aligned controls, desktop only
 */
export function PageTitle({ title, context, backTo, backLabel = 'Back', actions, className = '' }) {
  return (
    <header className={`${styles.header} ${className}`}>
      {backTo && (
        <Link to={backTo} className={styles.back}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>{backLabel}</span>
        </Link>
      )}
      <div className={styles.row}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{title}</h1>
          {context && <p className={styles.context}>{context}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}

export default PageTitle;
