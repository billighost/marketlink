import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import Illustration from '@/components/domain/Illustration';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useOnboarding } from '@/context/OnboardingContext';
import styles from './Help.module.css';

const HOW_IT_WORKS_STEPS = [
  {
    num: 1,
    title: 'Find a stall.',
    desc: 'Browse fresh produce or see which local growers are trading at the market today.',
    illustration: 'stall',
  },
  {
    num: 2,
    title: 'Reserve what you want.',
    desc: 'Add items to your basket against live grower inventory before morning cutoffs.',
    illustration: 'basket',
  },
  {
    num: 3,
    title: 'Pick a collection window.',
    desc: 'Each farm stall schedules its own morning pickup slots and order cutoff times.',
    illustration: 'basket-door',
  },
  {
    num: 4,
    title: 'Collect and pay at the stall.',
    desc: 'Show your 4-letter collection code at the stall counter. All orders are collected in person and paid in cash. There is no online payment and no delivery.',
    illustration: 'crate-carrots',
  },
];

const FAQS = [
  {
    q: 'Do I pay online?',
    a: 'No. MarketLink never processes online payments or credit cards. You inspect your fresh produce at the stall, show your pickup collection code, and pay the farmer directly in cash.',
  },
  {
    q: 'What if I am late?',
    a: 'Your reserved order is held safely at the stall throughout your chosen pickup window. If you run late during market trading hours, stalls keep your packed bag aside. If you cannot attend, cancel your order early so produce can be made available to walk-up visitors.',
  },
  {
    q: 'Can I change my order?',
    a: 'You can adjust quantities, add notes, or change collection windows directly on your order detail page up until the stall cutoff time (typically Friday evening or early Saturday morning).',
  },
  {
    q: 'What is a cutoff time?',
    a: 'The cutoff time is the deadline set by each farmer before market morning. This gives growers the time needed to harvest, wash, pack, and crate your produce for market day.',
  },
  {
    q: 'What is my collection code?',
    a: 'Every pre-order generates a unique 4-character code (such as MK-2049 or 4 letters) displayed on your order confirmation and active orders screen. Simply show or read this code to the farmer when picking up.',
  },
  {
    q: 'How do restock alerts work?',
    a: 'When an item in your Saved list is sold out, tap "Tell me when this is back". When the grower logs a new harvest or brings extra crates to market, you receive an in-app alert.',
  },
  {
    q: 'What if something is sold out?',
    a: 'Produce stock is updated live by farmers. If an item sells out before you reserve it, you can bookmark it in your Saved tab to request a restock alert or explore similar produce from other attending stalls.',
  },
  {
    q: 'How do I change my home market?',
    a: 'Go to You > Saved markets. You can select any saved location and tap "Set as home market". Stalls, produce feeds, and morning clocks will reflect that location.',
  },
];

export function Help() {
  useDocumentTitle('How MarketLink works · MarketLink');
  const { openRestartModal } = useOnboarding();

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <Page width="read">
      <PageTitle
        title="How MarketLink works"
        context="Local farmers, in-person pickups, and community markets."
        backTo="/buyer/profile"
        backLabel="Back to you"
      />

      <div className={styles.container}>
        {/* Interactive Tour CTA Banner */}
        <div
          style={{
            background: 'var(--color-canvas-soft)',
            border: '1px solid var(--color-wood-line)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4) var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-beet-tint)',
                color: 'var(--color-beet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 'var(--text-h4)', color: 'var(--color-ink)', margin: 0 }}>
                New to MarketLink?
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--color-ink-soft)', margin: '2px 0 0 0' }}>
                Take our 2-minute interactive tour to see how to browse produce, reserve crates, and collect orders.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openRestartModal('buyer')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 var(--space-4)',
              height: 'var(--control-h-sm, 36px)',
              background: 'var(--color-beet)',
              color: 'var(--color-on-primary, #FFF7F2)',
              border: '1px solid var(--color-beet-dark)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(122, 46, 59, 0.2)',
            }}
          >
            <span>Start Interactive Tour</span>
          </button>
        </div>

        {/* Block 1: How MarketLink works */}
        <section className={styles.section} aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" className={styles.sectionTitle}>
            How it works
          </h2>
          <div className={styles.stepsList}>
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.num} className={styles.stepCard}>
                <div className={styles.stepNumber} aria-hidden="true">
                  {step.num}
                </div>
                <div className={styles.stepIllustration}>
                  <Illustration name={step.illustration} size="sm" />
                </div>
                <div className={styles.stepBody}>
                  <h3 className={styles.stepHeading}>{step.title}</h3>
                  <p className={styles.stepText}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Block 2: Common questions */}
        <section className={styles.section} aria-labelledby="faq-heading">
          <h2 id="faq-heading" className={styles.sectionTitle}>
            Common questions
          </h2>
          <div className={styles.accordion} role="presentation">
            {FAQS.map((faq, idx) => {
              const isOpen = openIndex === idx;
              const buttonId = `faq-btn-${idx}`;
              const regionId = `faq-region-${idx}`;

              return (
                <div key={idx} className={styles.accordionItem}>
                  <button
                    id={buttonId}
                    type="button"
                    className={styles.accordionButton}
                    aria-expanded={isOpen}
                    aria-controls={regionId}
                    onClick={() => toggleFaq(idx)}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`${styles.chevron} ${isOpen ? styles.chevronRotated : ''}`}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={regionId}
                      role="region"
                      aria-labelledby={buttonId}
                      className={styles.accordionRegion}
                    >
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </Page>
  );
}

export default Help;
