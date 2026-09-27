import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import styles from './Footer.module.css';

/**
 * Guest Footer — four columns, canvas background (one warm anchor at page foot).
 *
 * Columns:
 *   1. Explore       — Markets, Stalls, Produce
 *   2. MarketLink    — About, Contact, How it works (→ About)
 *   3. Account       — Sign in, Sign up as a customer, Sell at a market
 *   4. Brand         — wordmark, product sentence, copyright, OSM attribution
 *
 * "Reserve online. Collect and pay at the stall." — this is the product in one
 * sentence. It belongs on every page and is never omitted.
 *
 * OpenStreetMap attribution is a licence requirement (ODbL). The public site
 * renders maps on /markets, /markets/:id, /farmers/:id and /contact.
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          {/* Brand Col (Top on mobile, Col 4 on Desktop) */}
          <div className={styles.brandCol}>
            <Link to={PATHS.HOME || '/'} className={styles.brandLink} aria-label="MarketLink home">
              <MarketLinkLogo
                size="md"
                marketColor="#FFFFFF"
                linkColor="#A8D5BA"
                leafColor="#A8D5BA"
              />
            </Link>
            <p className={styles.productLine}>
              Reserve online. Collect and pay at the stall.
            </p>
          </div>

          {/* Col 1: Explore */}
          <div className={styles.col}>
            <h2 className={styles.colTitle}>Explore</h2>
            <ul className={styles.linkList} role="list">
              <li><Link to={PATHS.MARKETS || '/markets'} className={styles.link}>Markets</Link></li>
              <li><Link to={PATHS.FARMERS || '/farmers'} className={styles.link}>Stalls</Link></li>
              <li><Link to={PATHS.PRODUCTS || '/products'} className={styles.link}>Produce</Link></li>
            </ul>
          </div>

          {/* Col 2: MarketLink */}
          <div className={styles.col}>
            <h2 className={styles.colTitle}>MarketLink</h2>
            <ul className={styles.linkList} role="list">
              <li><Link to={PATHS.ABOUT || '/about'} className={styles.link}>About</Link></li>
              <li><Link to={PATHS.CONTACT || '/contact'} className={styles.link}>Contact</Link></li>
              <li><Link to={PATHS.ABOUT || '/about'} className={styles.link}>How it works</Link></li>
            </ul>
          </div>

          {/* Col 3: Account */}
          <div className={styles.col}>
            <h2 className={styles.colTitle}>Account</h2>
            <ul className={styles.linkList} role="list">
              <li><Link to={PATHS.LOGIN || '/login'} className={styles.link}>Sign in</Link></li>
              <li><Link to={`${PATHS.REGISTER || '/register'}?role=customer`} className={styles.link}>Sign up as a customer</Link></li>
              <li><Link to={`${PATHS.REGISTER || '/register'}?role=farmer`} className={styles.link}>Sell at a market</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} MarketLink. All rights reserved.
          </p>
          <p className={styles.osmAttribution}>
            Maps ©{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              className={styles.osmLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenStreetMap contributors
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
