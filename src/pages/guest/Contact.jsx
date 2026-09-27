import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import GuestPage from '@/components/guest/GuestPage';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import MapView from '@/components/domain/MapView';
import { submitContact } from '@/api/contact';
import styles from './Contact.module.css';

/** CONTACT DETAILS — fill in real contact details before submission. */
export const CONTACT_DETAILS = {
  email: 'hello@marketlink.example',
  phone: '+44 117 000 0000',
  address: '142 Orchard Grove Way, Suite 200, Bristol, BS1 5TY',
  lat: 51.4545,
  lng: -2.5879,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = [
  { value: 'order', label: 'Order inquiry' },
  { value: 'farmer-help', label: 'Farmer assistance' },
  { value: 'feedback', label: 'General feedback' },
  { value: 'other', label: 'Other inquiry' },
];

export function Contact() {
  useDocumentTitle('Contact Us · MarketLink');

  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: '',
    message: '',
  });

  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState(null);

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value || !value.trim()) return 'Name is required.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        if (value.trim().length > 100) return 'Name must be at most 100 characters.';
        return null;
      case 'email':
        if (!value || !value.trim()) return 'Email is required.';
        if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address.';
        return null;
      case 'topic':
        if (!value) return 'Please select a topic.';
        if (!TOPICS.some((t) => t.value === value)) return 'Invalid topic selected.';
        return null;
      case 'message':
        if (!value || !value.trim()) return 'Message is required.';
        if (value.trim().length < 5) return 'Message must be at least 5 characters.';
        if (value.trim().length > 2000) return 'Message must be at most 2000 characters.';
        return null;
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSubmitError(null);
    setRateLimited(false);

    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const isValid =
    form.name.trim().length >= 2 &&
    EMAIL_REGEX.test(form.email.trim()) &&
    Boolean(form.topic) &&
    form.message.trim().length >= 5 &&
    !Object.values(errors).some(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Honeypot bot protection: silently abandon submit if filled
    if (honeypot) {
      setSubmittedEmail(form.email);
      return;
    }

    // Full validation pass
    const newErrors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      topic: validateField('topic', form.topic),
      message: validateField('message', form.message),
    };

    setTouched({ name: true, email: true, topic: true, message: true });
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setRateLimited(false);

    try {
      await submitContact({
        name: form.name.trim(),
        email: form.email.trim(),
        topic: form.topic,
        message: form.message.trim(),
      });

      setSubmittedEmail(form.email.trim());
    } catch (err) {
      if (err.status === 429) {
        setRateLimited(true);
      } else if (err.status === 422 && Array.isArray(err.details)) {
        const fieldErrors = {};
        err.details.forEach((d) => {
          if (d.field) fieldErrors[d.field] = d.message;
        });
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      } else {
        setSubmitError(err.message || 'Failed to send message. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasCoords =
    typeof CONTACT_DETAILS.lat === 'number' &&
    typeof CONTACT_DETAILS.lng === 'number' &&
    !isNaN(CONTACT_DETAILS.lat) &&
    !isNaN(CONTACT_DETAILS.lng);

  return (
    <GuestPage width="wide" className={styles.contactPage}>
      <header className={styles.header}>
        <h1 className={styles.title}>Contact us</h1>
        <p className={styles.lead}>
          Questions about a market, a stall, or your account.
        </p>
      </header>

      <div className={styles.layout}>
        {/* Form Column */}
        <section className={styles.formColumn}>
          {submittedEmail ? (
            <div className={styles.success} role="region" aria-label="Submission confirmation">
              <h2 className={styles.successHeading}>Thank you for reaching out</h2>
              <p className={styles.successText}>
                Thanks. We will reply to you at <strong>{submittedEmail}</strong>.
              </p>
              <Link to="/" className={styles.returnLink}>
                Back to home &rarr;
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              {/* Bot honeypot */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className={styles.honeypot}
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />

              {rateLimited && (
                <div role="alert" className={styles.rateAlert}>
                  Too many messages just now. Try again in a few minutes.
                </div>
              )}

              {submitError && (
                <div role="alert" className={styles.errorAlert}>
                  {submitError}
                </div>
              )}

              <FormField
                label="Name"
                id="name"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.name ? errors.name : undefined}
              />

              <FormField
                label="Email"
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email ? errors.email : undefined}
              />

              <FormField
                label="Topic"
                id="topic"
                name="topic"
                as="select"
                required
                value={form.topic}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.topic ? errors.topic : undefined}
              >
                <option value="">Select a topic</option>
                {TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </FormField>

              <FormField
                label="Message"
                id="message"
                name="message"
                as="textarea"
                rows={5}
                maxLength={2000}
                required
                value={form.message}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.message ? errors.message : undefined}
                hint={`${form.message.length} / 2000`}
              />

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || !isValid}
                  loading={submitting}
                >
                  {submitting ? 'Sending…' : 'Send message'}
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* Details and Map Column */}
        <aside className={styles.detailsColumn}>
          <div className={styles.detailsBlock}>
            <h2 className={styles.detailsHeading}>Get in touch</h2>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Email</span>
              <a href={`mailto:${CONTACT_DETAILS.email}`} className={styles.detailValue}>
                {CONTACT_DETAILS.email}
              </a>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Phone</span>
              <a href={`tel:${CONTACT_DETAILS.phone.replace(/\s+/g, '')}`} className={styles.detailValue}>
                {CONTACT_DETAILS.phone}
              </a>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Where we are</span>
              <p className={styles.addressText}>{CONTACT_DETAILS.address}</p>
            </div>
          </div>

          {/* Map: ONLY render when valid coordinates exist. Never empty grey box */}
          {hasCoords && (
            <div className={styles.mapBlock}>
              <MapView
                markers={[
                  {
                    id: 'hq',
                    lat: CONTACT_DETAILS.lat,
                    lng: CONTACT_DETAILS.lng,
                    title: 'MarketLink',
                  },
                ]}
                height="240px"
                zoom={15}
                ariaLabel="Map showing the MarketLink office"
              />
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${CONTACT_DETAILS.lat}%2C${CONTACT_DETAILS.lng}`}
                aria-label="Get directions to MarketLink on OpenStreetMap (opens in a new tab)"
                className={styles.directionsLink}
              >
                Get directions &rarr;
              </a>
            </div>
          )}
        </aside>
      </div>
    </GuestPage>
  );
}

export default Contact;
