import React from 'react';
import styles from './Section.module.css';

/**
 * A titled block inside a buyer page. Renders an h2 with an optional right-side action.
 * Use for every "Also on this stall", "Reviews", "On the table today" group.
 *
 * @param {string}          title     h2 text, sentence case
 * @param {string}          subtitle  one muted line under the h2
 * @param {React.ReactNode} action    right-aligned link or button, e.g. "See all"
 */
export function Section({ title, subtitle, action, children, className = '', ...rest }) {
  return (
    <section className={`${styles.section} ${className}`} {...rest}>
      {(title || action) && (
        <div className={styles.head}>
          <div className={styles.headText}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export default Section;
