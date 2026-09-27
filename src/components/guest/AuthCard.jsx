import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import styles from './AuthCard.module.css';

/**
 * AuthCard — the centred card used by all seven auth pages.
 *
 * Structure:
 *   - Immersive background image (market-morning.jpg) with soft scrim
 *   - Logo
 *   - h1 title (Idiqlat, weight 400)
 *   - One muted lead line
 *   - Default slot (form / content)
 *   - Footer slot (sign-in link, etc.)
 *
 * @param {string} title              Page heading (h1)
 * @param {string} [lead]             Muted subtitle below the heading
 * @param {React.ReactNode} children  The form or auth content
 * @param {React.ReactNode} [footer]  Link / help text at the card bottom
 * @param {boolean} [wide=false]      Wider container (840px at 768px+) for Register
 * @param {string} [className]        Optional additional CSS class
 */
export function AuthCard({ title, lead, children, footer, wide = false, className = '' }) {
  return (
    <div className={styles.wrap}>
      {/* Immersive background from previous auth showcase */}
      <div className={styles.bgOverlay} aria-hidden="true">
        <img
          src="/images/market-morning.jpg"
          alt=""
          className={styles.bgImg}
        />
        <div className={styles.scrim} />
      </div>

      <div className={`${styles.card} ${wide ? styles.cardWide : ''} ${className}`}>
        {/* Logo */}
        <Link to={PATHS.HOME} className={styles.logoLink} aria-label="MarketLink home">
          <MarketLinkLogo size="md" />
        </Link>

        {/* Heading */}
        <h1 className={styles.title}>{title}</h1>
        {lead && <p className={styles.lead}>{lead}</p>}

        {/* Body slot */}
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
