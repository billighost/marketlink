import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, ShoppingBag, Store, Star, Check } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import styles from './AuthCard.module.css';

export function AuthCard({
  title,
  lead,
  badge,
  children,
  footer,
  wide = false,
  split = false,
  activeTab = null,
  heroTitle,
  heroLead,
  heroFeatures,
  heroMiddle,
  heroQuote,
  heroAuthor,
  heroAuthorRole,
  className = '',
}) {
  const features = heroFeatures || [
    {
      icon: <ShoppingBag size={18} aria-hidden="true" />,
      text: 'Direct Stall Pre-Orders',
      subtext: 'Reserve peak-harvest produce before Saturday market opens.',
    },
    {
      icon: <Store size={18} aria-hidden="true" />,
      text: '100% Independent Producers',
      subtext: 'Support hyper-local family farms, bakers, and urban growers.',
    },
    {
      icon: <ShieldCheck size={18} aria-hidden="true" />,
      text: 'No Prepayment Required',
      subtext: 'Check freshness in person and pay when collecting at the stall.',
    },
  ];

  const quote = heroQuote || 'MarketLink makes Saturday mornings effortless. I grab artisan sourdough and heritage greens without waiting in queues.';
  const author = heroAuthor || 'Sophie M.';
  const authorRole = heroAuthorRole || 'Market regular, Broadway Market';

  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.card} ${split ? styles.splitCard : ''} ${
          wide ? styles.cardWide : ''
        } ${className}`}
      >
        
        {split && (
          <aside className={styles.showcaseSide} aria-label="About MarketLink">
            <div className={styles.showcaseGlow} aria-hidden="true" />
            <div className={styles.showcaseContent}>
              
              <div className={styles.showcaseBrand}>
                <Link to={PATHS.HOME} className={styles.showcaseLogoLink} aria-label="MarketLink home">
                  <MarketLinkLogo size="md" />
                </Link>
                <span className={styles.showcasePill}>
                  <Sparkles size={13} className={styles.pillIcon} aria-hidden="true" />
                  Farm to Table
                </span>
              </div>

              <div className={styles.showcasePitch}>
                <h2 className={styles.showcaseHeading}>
                  {heroTitle || 'The fresher way to do your weekend grocery shop.'}
                </h2>
                <p className={styles.showcaseLead}>
                  {heroLead || 'Connect directly with certified local farmers and reserve weekly harvest before stalls sell out.'}
                </p>
              </div>

              <ul className={styles.featureList}>
                {features.map((feat, idx) => (
                  <li key={idx} className={styles.featureItem}>
                    <div className={styles.featureIconWrap}>
                      {feat.icon}
                    </div>
                    <div className={styles.featureTextWrap}>
                      <strong className={styles.featureTitle}>{feat.text}</strong>
                      <span className={styles.featureDesc}>{feat.subtext}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {heroMiddle && (
                <div className={styles.showcaseMiddle}>
                  {heroMiddle}
                </div>
              )}

              <div className={styles.testimonialCard}>
                <div className={styles.starRow} aria-label="5 out of 5 stars rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={styles.starFilled} fill="currentColor" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className={styles.quoteText}>
                  “{quote}”
                </blockquote>
                <div className={styles.quoteAuthorRow}>
                  <span className={styles.quoteAuthor}>{author}</span>
                  <span className={styles.quoteDot} aria-hidden="true">•</span>
                  <span className={styles.quoteRole}>{authorRole}</span>
                </div>
              </div>

              <div className={styles.trustRow}>
                <span className={styles.trustBadge}>
                  <Check size={12} className={styles.trustCheck} aria-hidden="true" /> Over 40+ stalls
                </span>
                <span className={styles.trustBadge}>
                  <Check size={12} className={styles.trustCheck} aria-hidden="true" /> 100% Organic & Local
                </span>
                <span className={styles.trustBadge}>
                  <Check size={12} className={styles.trustCheck} aria-hidden="true" /> SSL Encrypted
                </span>
              </div>
            </div>
          </aside>
        )}

        <section className={styles.formSide} aria-label={title}>
          
          {(!split) && (
            <Link to={PATHS.HOME} className={styles.logoLink} aria-label="MarketLink home">
              <MarketLinkLogo size="md" />
            </Link>
          )}

          {activeTab && (
            <div className={styles.tabSwitcher} role="tablist" aria-label="Authentication selection">
              <Link
                to={PATHS.LOGIN}
                role="tab"
                aria-selected={activeTab === 'login'}
                className={`${styles.tabBtn} ${activeTab === 'login' ? styles.tabBtnActive : ''}`}
              >
                Sign In
              </Link>
              <Link
                to={PATHS.REGISTER}
                role="tab"
                aria-selected={activeTab === 'register'}
                className={`${styles.tabBtn} ${activeTab === 'register' ? styles.tabBtnActive : ''}`}
              >
                Create Account
              </Link>
            </div>
          )}

          <header className={styles.header}>
            {badge && <span className={styles.formBadge}>{badge}</span>}
            <h1 className={styles.title}>{title}</h1>
            {lead && <p className={styles.lead}>{lead}</p>}
          </header>

          <div className={styles.body}>
            {children}
          </div>

          {footer && (
            <footer className={styles.footer}>
              {footer}
            </footer>
          )}
        </section>
      </div>
    </div>
  );
}

export default AuthCard;
