import React from 'react';
import { ChevronDown, Mail, MapPin } from 'lucide-react';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Help.module.css';

const FAQS = [
  {
    q: 'How does pre-ordering work?',
    a: 'Browse produce, baked goods, and pantry items from farmers attending Saturday market. Add items to your basket and place your pre-order before Friday at 6:00 pm. The farmers harvest and pack your order Friday evening and bring it to their stall Saturday morning.',
  },
  {
    q: 'When and how do I pay for my order?',
    a: 'You pay in person at each stall when you pick up your items on Saturday. All stalls accept cash and major credit/debit cards. MarketLink never charges your card online.',
  },
  {
    q: 'What if I am late or cannot make my pickup window?',
    a: 'If you are running late within market hours (8 am – 1 pm), your items will remain held at the stall. If you cannot attend at all, please cancel your order in the app or contact the market coordinator so the farmer can release items to walk-up customers.',
  },
  {
    q: 'How fresh is the produce?',
    a: 'Everything listed on MarketLink is harvested within 24 to 36 hours of Saturday morning. Most vegetables and berries are picked Friday morning or dawn Saturday.',
  },
  {
    q: 'Can I add special notes for the farmer?',
    a: 'Yes! When placing your pre-order in the cart, there is an optional note field where you can request ripe fruit, specific cuts, or packaging preferences.',
  },
];

/**
 * Help and FAQ page for Customer profile.
 */
export function Help() {
  useDocumentTitle('Help & FAQ · MarketLink');

  return (
    <Page width="read">
      <PageTitle
        title="Help & FAQ"
        backTo="/buyer/profile"
        backLabel="Back to you"
      />
      <div className={styles.container}>
        <div className={styles.faqList}>
          {FAQS.map((faq, idx) => (
            <details key={idx} className={styles.faqItem}>
              <summary className={styles.summary}>
                <span className={styles.question}>{faq.q}</span>
                <ChevronDown size={18} className={styles.chevron} aria-hidden="true" />
              </summary>
              <div className={styles.answer}>
                <p>{faq.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className={styles.contactCard}>
          <h3 className={styles.contactTitle}>Still have questions?</h3>
          <p className={styles.contactDesc}>
            Our market coordinators are happy to assist before, during, or after Saturday market.
          </p>
          <div className={styles.contactInfo}>
            <div className={styles.contactRow}>
              <Mail size={16} className={styles.contactIcon} aria-hidden="true" />
              <a href="mailto:support@marketlink.org" className={styles.contactLink}>
                support@marketlink.org
              </a>
            </div>
            <div className={styles.contactRow}>
              <MapPin size={16} className={styles.contactIcon} aria-hidden="true" />
              <span>Market Info Booth · Near Main Entrance</span>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

export default Help;
