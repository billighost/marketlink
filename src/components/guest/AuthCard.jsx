import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import styles from './AuthCard.module.css';

/**
 * AuthCard — the centred card used by all six auth pages.
 *
 * Structure:
 *   - Logo
 *   - h1 title
 *   - One muted lead line
 *   - Default slot (form)
 *   - Footer slot (sign-in link, etc.)
 *
 * @param {string} title          Page heading (h1)
 * @param {string} [lead]         Muted subtitle below the heading
 * @param {React.ReactNode} children      The form or auth content
 * @param {React.ReactNode} [footer]      Link / help text at the card bottom
 */
export function AuthCard({ title, lead, children, footer }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {/* Logo */}
        <Link to={PATHS.HOME} className={styles.logoLink} aria-label="MarketLink home">
          <MarketLinkLogo size="md" />
        </Link>

        {/* Heading */}
        <h1 className={styles.title}>{title}</h1>
        {lead && <p className={styles.lead}>{lead}</p>}

        {/* Form slot */}
        <div className={styles.body}>
          {children}
        </div>

        {/* Footer slot */}
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthCard;
