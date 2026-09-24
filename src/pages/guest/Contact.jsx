import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import PageHeader from '@/components/layout/PageHeader';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import WaveDivider from '@/components/layout/WaveDivider';
import Illustration from '@/components/domain/Illustration';
import styles from './Contact.module.css';

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'How do pre-orders work on Saturday morning?',
    answer:
      'Browse your favourite Elm Street stalls and reserve your produce before Friday at 6pm. The Farmers harvest specifically for your order at dawn. On Saturday between 8am and 1pm, walk up to the stall, give your name, collect your items, and pay the Farmer directly.',
  },
  {
    id: 'faq-2',
    question: 'Do I pay online or in person?',
    answer:
      'Always in person. MarketLink never charges your card or handles money. You pay the Farmer directly at their stall via cash, card, or market tokens upon collection.',
  },
  {
    id: 'faq-3',
    question: 'Can I change or cancel my order?',
    answer:
      'Yes, you can edit or cancel any pre-order up until the Friday 6pm cut-off. After 6pm, growers begin harvesting and bakers start their overnight bake, so quantities are finalized.',
  },
  {
    id: 'faq-4',
    question: 'Do you deliver to my home?',
    answer:
      'No. MarketLink is exclusively for pickup at Elm Street Market Square. There are no delivery vans, courier fees, or central warehouses. Food travels directly from farm to stall.',
  },
];

/**
 * Contact page: Hand-set stall sign, validated message form,
 * illustrated market map, and authentic market FAQ.
 */
export function Contact() {
  useDocumentTitle('Contact · MarketLink');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'Question about Saturday pickup',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const messageRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Please enter a message.';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.name) {
        nameRef.current?.focus();
      } else if (validationErrors.email) {
        emailRef.current?.focus();
      } else if (validationErrors.message) {
        messageRef.current?.focus();
      }
      return;
    }
    setSubmitted(true);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      topic: 'Question about Saturday pickup',
      message: '',
    });
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <PageHeader
          title="Contact the market"
          subtitle="Questions about an order, a stall, or joining Elm Street Market? We read every note."
          backTo={PATHS.HOME}
          backLabel="Home"
        />

        {/* ---------------- TWO COLUMNS: STALL SIGN DETAILS & MESSAGE FORM ---------------- */}
        <div className={styles.contactGrid}>
          {/* Hand-set stall sign */}
          <div className={styles.stallSignOuter}>
            <div className={styles.stallSignInner}>
              <div className={styles.signHeader}>
                <h2 className={styles.signTitle}>Elm Street Market Stall</h2>
                <p className={styles.signSub}>
                  Managed by the Elm Street Farmers Association.
                </p>
              </div>

              <div className={styles.signSchedule}>
                <h3 className={styles.signSectionLabel}>Market Hours</h3>
                <div className={styles.scheduleTable}>
                  <div className={styles.scheduleRow}>
                    <span className={styles.scheduleDay}>Saturdays</span>
                    <span className={styles.scheduleHours}>8:00 AM – 1:00 PM (Market Day)</span>
                  </div>
                  <div className={styles.scheduleRow}>
                    <span className={styles.scheduleDay}>Friday Pre-Order Cut-Off</span>
                    <span className={styles.scheduleHours}>6:00 PM Sharp</span>
                  </div>
                  <div className={styles.scheduleRow}>
                    <span className={styles.scheduleDay}>Sunday – Thursday</span>
                    <span className={styles.scheduleHours}>Growers in the fields</span>
                  </div>
                </div>
              </div>

              <ul className={styles.signDetailsList} role="list">
                <li className={styles.signDetailItem}>
                  <span className={styles.signDetailLabel}>Location</span>
                  <span className={styles.signDetailValue}>
                    142 Elm Street, Market Square (behind Town Hall)
                  </span>
                </li>

                <li className={styles.signDetailItem}>
                  <span className={styles.signDetailLabel}>Market Phone</span>
                  <span className={styles.signDetailValue}>(555) 234-5678 (Saturdays 7am–2pm)</span>
                </li>

                <li className={styles.signDetailItem}>
                  <span className={styles.signDetailLabel}>Email Enquiries</span>
                  <span className={styles.signDetailValue}>hello@marketlink.local</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Form Card or Confirmation State */}
          <div className={styles.formCard}>
            {submitted ? (
              <div className={styles.successState}>
                <Illustration name="paper-bag-pears" size="lg" className={styles.successIllustration} />
                <h3 className={styles.successTitle}>Thanks, your note is received.</h3>
                <p className={styles.successText}>
                  We read every message before market day. A coordinator will get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className={styles.sendAnotherButton}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className={styles.form}>
                <h2 className={styles.cardHeading}>Leave a note for the market</h2>
                <p className={styles.cardSub}>
                  Have a question about a stall, want to reserve something special, or need help with a pre-order?
                </p>

                <FormField
                  ref={nameRef}
                  label="Your name"
                  id="contact-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  autoComplete="name"
                  required
                />

                <FormField
                  ref={emailRef}
                  label="Email address"
                  id="contact-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  autoComplete="email"
                  required
                />

                <FormField
                  label="Topic"
                  id="contact-topic"
                  as="select"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  required
                >
                  <option value="Question about Saturday pickup">Question about Saturday pickup</option>
                  <option value="I'm a Farmer and want to join">I'm a Farmer and want to join</option>
                  <option value="Question about an item or stall">Question about an item or stall</option>
                  <option value="Feedback for market coordinators">Feedback for market coordinators</option>
                </FormField>

                <FormField
                  ref={messageRef}
                  label="Message"
                  id="contact-message"
                  as="textarea"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  error={errors.message}
                  required
                />

                <p className={styles.helperText}>
                  Market coordinators review incoming messages every Thursday and Friday.
                </p>

                <div className={styles.submitRow}>
                  <Button type="submit" variant="primary" size="md">
                    Send note
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ---------------- ILLUSTRATED MARKET MAP ---------------- */}
        <section className={styles.mapSection}>
          <h2 className={styles.sectionHeading}>Find the stalls on Elm Street</h2>
          <div className={styles.mapWrapper}>
            <img
              src="/images/elm-street-map.jpg"
              alt="Illustrated architectural map of Elm Street Market Square showing stalls 1 to 12, High Street, Town Hall, and Elm Street"
              className={styles.mapImage}
              loading="lazy"
            />
            <div className={styles.mapMetaBar}>
              <p className={styles.mapAddress}>
                Elm Street Market Square · 142 Elm Street (Behind Town Hall)
              </p>
              <p className={styles.mapTip}>
                Tip: High Street parking is free for two hours on Saturdays.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ---------------- FAQ ACCORDION IN CANVAS BAND ---------------- */}
      <WaveDivider shape="soft" />
      <section className={styles.faqSection}>
        <div className="containerNarrow">
          <div className={styles.faqHeader}>
            <h2 className={styles.sectionHeading}>Frequently asked questions</h2>
            <p className={styles.sectionSubtitle}>
              Plain answers about orders, pickups, and market days.
            </p>
          </div>

          <div className={styles.faqList}>
            {FAQ_ITEMS.map((faq) => (
              <details key={faq.id} className={styles.faqDetails}>
                <summary className={styles.faqSummary}>
                  <span className={styles.faqQuestion}>{faq.question}</span>
                  <ChevronDown size={20} strokeWidth={1.5} className={styles.faqChevron} aria-hidden="true" />
                </summary>
                <div className={styles.faqAnswer}>
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
      <WaveDivider shape="gentle" flip />
    </div>
  );
}

export default Contact;
