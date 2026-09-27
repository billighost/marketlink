import React from 'react';
import styles from './Hero.module.css';

/**
 * Hero — the one large header block. Used on Home and About only.
 *
 * White background, large Idiqlat title, optional image beside it at 768+.
 * No dark overlay, no background image with a scrim — that pattern makes every
 * template look the same. The copy and real content are the argument.
 *
 * @param {string} title                 Displayed in --font-head (Idiqlat)
 * @param {string} [lead]                Subtitle / lead paragraph (Inter)
 * @param {React.ReactNode} [primary]    Primary CTA — counts as one beet accent
 * @param {React.ReactNode} [secondary]  Secondary action (must not be beet)
 * @param {React.ReactNode} [image]      Optional visual; shown beside text at 768+
 */
export function Hero({ title, lead, primary, secondary, image }) {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h1 className={styles.title}>{title}</h1>
          {lead && <p className={styles.lead}>{lead}</p>}
          {(primary || secondary) && (
            <div className={styles.actions}>
              {primary}
              {secondary}
            </div>
          )}
        </div>
        {image && (
          <div className={styles.imageSlot} aria-hidden="true">
            {image}
          </div>
        )}
      </div>
    </section>
  );
}

export default Hero;
