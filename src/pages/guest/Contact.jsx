import React, { useState, useRef } from 'react';
import { MapPin, Phone, Mail, Clock, Check, ChevronDown } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import PageHeader from '@/components/layout/PageHeader';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import WaveDivider from '@/components/layout/WaveDivider';
import MapPlaceholder from '@/components/domain/MapPlaceholder';
import { FAQ_ITEMS } from '@/data/placeholders';
import styles from './Contact.module.css';

/**
 * Contact page with team contact details, validated message form,
 * interactive map placeholder, and native <details> FAQ band.
 */
export function Contact() {
  useDocumentTitle('Contact · MarketLink');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'Question about an order',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Field refs for focus management on validation failure
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
      newErrors.email = 'Please enter a valid email address with @ and a dot.';
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
      // Focus first invalid field
      if (validationErrors.name) {
        nameRef.current?.focus();
      } else if (validationErrors.email) {
        emailRef.current?.focus();
      } else if (validationErrors.message) {
        messageRef.current?.focus();
      }
      return;
    }

    // Success state
    setSubmitted(true);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      topic: 'Question about an order',
      message: '',
    });
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <PageHeader
          title="Contact us"
          subtitle="Questions about an order, a stall, or the app? We read every message."
          backTo={PATHS.HOME}
          backLabel="Home"
        />

        {/* ---------------- TWO COLUMNS: DETAILS & FORM ---------------- */}
        <div className={styles.contactGrid}>
          {/* Details Card */}
          <Card className={styles.detailsCard}>
            <h2 className={styles.cardHeading}>Get in touch</h2>
            <p className={styles.cardSub}>
              Have a question about Saturday market morning or want to register a new stall?
              Here is how to reach our community team.
            </p>

            <ul className={styles.detailsList} role="list">
              <li className={styles.detailItem}>
                <div className={styles.iconCircle} aria-hidden="true">
                  <MapPin size={18} strokeWidth={1.5} />
                </div>
                <div className={styles.detailText}>
                  <strong className={styles.detailLabel}>Market Location</strong>
                  <span>142 Elm Street, Market Square</span>
                </div>
              </li>

              <li className={styles.detailItem}>
                <div className={styles.iconCircle} aria-hidden="true">
                  <Phone size={18} strokeWidth={1.5} />
                </div>
                <div className={styles.detailText}>
                  <strong className={styles.detailLabel}>Phone</strong>
                  <span>(555) 234-5678</span>
                </div>
              </li>

              <li className={styles.detailItem}>
                <div className={styles.iconCircle} aria-hidden="true">
                  <Mail size={18} strokeWidth={1.5} />
                </div>
                <div className={styles.detailText}>
                  <strong className={styles.detailLabel}>Email</strong>
                  <span>hello@marketlink.local</span>
                </div>
              </li>

              <li className={styles.detailItem}>
                <div className={styles.iconCircle} aria-hidden="true">
                  <Clock size={18} strokeWidth={1.5} />
                </div>
                <div className={styles.detailText}>
                  <strong className={styles.detailLabel}>Stall Hours</strong>
                  <span>Saturdays 8:00 AM – 1:00 PM</span>
                </div>
              </li>
            </ul>
          </Card>

          {/* Form Card or Confirmation Card */}
          <Card className={styles.formCard}>
            {submitted ? (
              <div className={styles.successState}>
                <div className={styles.successIconCircle} aria-hidden="true">
                  <Check size={28} strokeWidth={1.5} className={styles.successIcon} />
                </div>
                <h3 className={styles.successTitle}>Thanks, your message is on its way.</h3>
                <p className={styles.successText}>
                  We received your note and will get back to you within two working days.
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
                <h2 className={styles.cardHeading}>Send us a message</h2>

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
                  label="Email"
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
                  <option value="Question about an order">Question about an order</option>
                  <option value="I'm a Farmer and need help">I'm a Farmer and need help</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Something else">Something else</option>
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
                  We usually reply within two working days.
                </p>

                <div className={styles.submitRow}>
                  <Button type="submit" variant="primary" size="md">
                    Send message
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* ---------------- MAP PLACEHOLDER ---------------- */}
        <section className={styles.mapSection}>
          <h2 className={styles.sectionHeading}>Find the market</h2>
          <MapPlaceholder />
        </section>
      </div>

      {/* ---------------- FAQ IN CANVAS BAND ---------------- */}
      <WaveDivider shape="soft" />
      <section className={styles.faqSection}>
        <div className="containerNarrow">
          <div className={styles.faqHeader}>
            <h2 className={styles.sectionHeading}>Frequently asked questions</h2>
            <p className={styles.sectionSubtitle}>
              Quick answers about orders, pickups, and market days.
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
