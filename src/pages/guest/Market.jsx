import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Coffee,
  ChevronDown,
  ArrowRight,
  Store,
  Users,
} from 'lucide-react';
import Page from '@/components/layout/Page';
import MarketsView from '@/components/catalogue/MarketsView';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Market.module.css';

const MARKET_FEATURES = [
  {
    icon: ShoppingBag,
    title: 'Peak Morning Harvests',
    desc: 'Growers harvest on Friday evening and Saturday dawn. Stalls open at 8:00 AM with fresh produce at peak flavor.',
  },
  {
    icon: ShieldCheck,
    title: 'Guaranteed Pickup Slots',
    desc: 'Pre-order from any stall throughout the week. Your box is packed, labeled with your pickup code, and waiting.',
  },
  {
    icon: Coffee,
    title: 'Vibrant Community Atmosphere',
    desc: 'Enjoy woodfired sourdough, artisanal cheeses, hot batch-brew coffee, and live community conversation.',
  },
];

const MARKET_FAQS = [
  {
    q: 'Do I need a ticket or registration to enter the market?',
    a: 'No tickets are needed! All MarketLink farmers markets are free and open to the entire community. You can walk in, browse freely, or head straight to stalls to collect your pre-orders.',
  },
  {
    q: 'When are the busiest and best times to visit?',
    a: 'Stalls open at 8:00 AM. For the widest produce variety, visit between 8:00 AM and 10:30 AM. For a relaxed stroll and coffee, late mornings around 11:30 AM are wonderfully unhurried.',
  },
  {
    q: 'Are dogs allowed in the market pavilions?',
    a: 'Yes, friendly dogs on short leads are welcome across outdoor open walkways. Please keep dogs clear of display counters and food preparation areas.',
  },
  {
    q: 'How do I pick up my pre-ordered produce?',
    a: 'Walk directly to the farmer’s stall and show your 6-character Pickup Code from your order receipt or Market Route Planner. Your items are pre-packed and ready.',
  },
  {
    q: 'What payment methods do stalls accept?',
    a: 'All stalls accept contactless card payments, Apple Pay, Google Pay, and cash. Pre-orders placed online are confirmed with zero upfront charge and paid upon collection.',
  },
];

/**
 * Public markets index page with rich guest guidance, highlights, and FAQ.
 */
export function Market() {
  useDocumentTitle('Farmers Markets · MarketLink');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <Page width="wide" className={styles.page}>
      {/* ── Guest Hero Banner ── */}
      <section className={styles.hero} aria-labelledby="markets-hero-title">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroBadge}>
          <MapPin size={13} aria-hidden="true" />
          <span>Regional Farmers Markets</span>
        </div>
        <h1 id="markets-hero-title" className={styles.heroTitle}>
          Discover Your Neighborhood Markets
        </h1>
        <p className={styles.heroLead}>
          Explore authentic farmers markets operating across your region. Walk the stalls, meet local growers, and pick up fresh seasonal harvest every Saturday morning.
        </p>

        <div className={styles.heroPills}>
          <span className={styles.heroPill}>
            <Store size={13} aria-hidden="true" />
            Covered Pavilions
          </span>
          <span className={styles.heroPill}>
            <Clock size={13} aria-hidden="true" />
            Saturdays 8:00 AM – 2:00 PM
          </span>
          <span className={styles.heroPill}>
            <ShieldCheck size={13} aria-hidden="true" />
            100% Verified Local Growers
          </span>
          <span className={styles.heroPill}>
            <Sparkles size={13} aria-hidden="true" />
            Free Community Admission
          </span>
        </div>
      </section>

      {/* ── Interactive Market Catalog (Map & List) ── */}
      <MarketsView audience="guest" />

      {/* ── Why Shop Local Markets Highlights ── */}
      <section className={styles.featuresSection} aria-labelledby="why-visit-heading">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionPre}>The Market Experience</div>
          <h2 id="why-visit-heading" className={styles.sectionTitle}>
            Built Around Pure Freshness & Community
          </h2>
          <p className={styles.sectionSub}>
            Every market pavilion in our network connects you directly with regional farms without cold-storage delays or supermarket markups.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {MARKET_FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className={styles.featureCard}>
                <div className={styles.featureIconWrap}>
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h3 className={styles.featureTitle}>{feat.title}</h3>
                <p className={styles.featureDesc}>{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Market Day Visiting Guide FAQ ── */}
      <section className={styles.faqSection} aria-labelledby="market-faq-heading">
        <div className={styles.faqHeader}>
          <h2 id="market-faq-heading" className={styles.faqTitle}>
            Visiting Market Day · Frequently Asked Questions
          </h2>
          <p className={styles.faqSub}>
            Everything you need to know about parking, timing, and pre-order collections.
          </p>
        </div>

        <div className={styles.faqList}>
          {MARKET_FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className={styles.faqItem}>
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && <div className={styles.faqAnswer}>{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Callout Banner for Producers ── */}
      <aside className={styles.calloutBanner} aria-label="Producer invitation">
        <div className={styles.calloutText}>
          <h3>Are you a grower or artisan food producer?</h3>
          <p>Bring your harvest to verified local markets. Manage pre-orders, inventory, and Saturday slots with zero listing fees.</p>
        </div>
        <Link to="/register" className={styles.calloutAction}>
          <span>Join as a Stallholder</span>
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </aside>
    </Page>
  );
}

export default Market;
