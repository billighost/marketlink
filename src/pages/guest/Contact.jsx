import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  HelpCircle,
  ShoppingBag,
  Store,
  Building2,
  ChevronDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import GuestPage from '@/components/guest/GuestPage';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import MapView from '@/components/domain/MapView';
import { submitContact } from '@/api/contact';
import styles from './Contact.module.css';

/** CONTACT DETAILS */
export const CONTACT_DETAILS = {
  email: 'hello@marketlink.example',
  phone: '+44 117 000 0000',
  address: '142 Orchard Grove Way, Suite 200, Bristol, BS1 5TY',
  lat: 51.4545,
  lng: -2.5879,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = [
  { value: 'order', label: 'Order or Pickup inquiry' },
  { value: 'farmer-help', label: 'Farmer or Stallholder support' },
  { value: 'partnership', label: 'Market pavilion or council partnership' },
  { value: 'feedback', label: 'Platform feedback or feature request' },
  { value: 'other', label: 'Other inquiry' },
];

const FAQS = [
  {
    q: 'How do I locate my pickup code on market day?',
    a: 'Your 6-character Pickup Code is sent to your email confirmation immediately upon ordering. You can also view it anytime by navigating to your Order History or opening the Market Route Planner on your phone.',
  },
  {
    q: 'Can a friend or family member collect my pre-order for me?',
    a: 'Yes! Simply forward your confirmation email or tell them your 6-character pickup code and full name. Stallholders only require the matching code to release your pre-packed box.',
  },
  {
    q: 'What if a stallholder is delayed or experiences a harvest shortage?',
    a: 'If a producer runs short of a specific item due to morning frost or harvest conditions, they mark it in their stall dashboard immediately. You will receive an intelligent restock alert and your order balance is automatically adjusted.',
  },
  {
    q: 'Do markets remain open during rainy or windy weather?',
    a: 'Yes! All MarketLink markets operate inside covered historic pavilions, glasshouses, or under all-weather architectural canopies. Markets run every Saturday rain or shine.',
  },
  {
    q: 'How does an independent grower or baker join MarketLink?',
    a: 'Smallholders, urban growers, and artisan producers can register directly via our Vendor portal. Applications are vetted within 2 business days to verify local sourcing standards.',
  },
];

export function Contact() {
  useDocumentTitle('Contact & Community Hub · MarketLink');

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
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

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

    if (honeypot) {
      setSubmittedEmail(form.email);
      return;
    }

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
      {/* ── Guest Hero Banner ── */}
      <section className={styles.hero} aria-labelledby="contact-hero-title">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroBadge}>
          <HelpCircle size={14} />
          <span>Community Help & Support Desk</span>
        </div>
        <h1 id="contact-hero-title" className={styles.title}>
          We’re Here to Help You Connect with Local Food
        </h1>
        <p className={styles.lead}>
          Have a question about Saturday market collections, stall availability, or opening an independent producer stall? Reach out to our community operations team.
        </p>
      </section>

      {/* ── Support Channels Quick Bar ── */}
      <div className={styles.channelsGrid}>
        <div className={styles.channelCard}>
          <div className={styles.channelIconWrap}>
            <ShoppingBag size={20} />
          </div>
          <h2 className={styles.channelTitle}>Buyer & Order Support</h2>
          <p className={styles.channelDesc}>
            Assistance with pickup codes, stall routes, and order confirmations for Saturday market day.
          </p>
          <a href={`mailto:${CONTACT_DETAILS.email}?subject=Buyer%20Order%20Help`} className={styles.channelLink}>
            <span>support@marketlink.example</span>
            <ArrowRight size={13} />
          </a>
        </div>

        <div className={styles.channelCard}>
          <div className={styles.channelIconWrap}>
            <Store size={20} />
          </div>
          <h2 className={styles.channelTitle}>Grower & Stall Onboarding</h2>
          <p className={styles.channelDesc}>
            Join our producer collective, list your seasonal crop availability, and streamline pre-orders.
          </p>
          <Link to="/register?role=vendor" className={styles.channelLink}>
            <span>Apply to host a stall</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className={styles.channelCard}>
          <div className={styles.channelIconWrap}>
            <Building2 size={20} />
          </div>
          <h2 className={styles.channelTitle}>Pavilion & City Partnerships</h2>
          <p className={styles.channelDesc}>
            Inquiries for council authorities, heritage market trustees, and regional agricultural hubs.
          </p>
          <a href={`mailto:partnerships@marketlink.example`} className={styles.channelLink}>
            <span>partnerships@marketlink.example</span>
            <ArrowRight size={13} />
          </a>
        </div>
      </div>

      {/* ── Form + Office Details Section ── */}
      <div className={styles.layout}>
        {/* Form Column */}
        <section className={styles.formColumn}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Send Our Team a Message</h2>
            <p className={styles.formLead}>We typically respond within 2–4 hours during market preparation hours.</p>
          </div>

          {submittedEmail ? (
            <div className={styles.success} role="region" aria-label="Submission confirmation">
              <h3 className={styles.successHeading}>Thank you for reaching out</h3>
              <p className={styles.successText}>
                Thanks. Your message was received. We will reply to you at <strong>{submittedEmail}</strong>.
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
            <h2 className={styles.detailsHeading}>Direct Contact Information</h2>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Email Inquiries</span>
              <a href={`mailto:${CONTACT_DETAILS.email}`} className={styles.detailValue}>
                {CONTACT_DETAILS.email}
              </a>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Market Day Help Desk</span>
              <a href={`tel:${CONTACT_DETAILS.phone.replace(/\s+/g, '')}`} className={styles.detailValue}>
                {CONTACT_DETAILS.phone}
              </a>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Headquarters & Coordination Hub</span>
              <p className={styles.addressText}>{CONTACT_DETAILS.address}</p>
            </div>

            {/* Operating Hours Card */}
            <div className={styles.hoursCard}>
              <div className={styles.hoursTitle}>
                <Clock size={14} />
                <span>Operating & Assistance Hours</span>
              </div>
              <ul className={styles.hoursList}>
                <li className={styles.hoursRow}>
                  <span>Saturday Market Day Desk</span>
                  <strong>7:30 AM – 2:30 PM</strong>
                </li>
                <li className={styles.hoursRow}>
                  <span>Producer & Stall Support</span>
                  <strong>Mon – Thu 9:00 AM – 5:00 PM</strong>
                </li>
                <li className={styles.hoursRow}>
                  <span>Online Email Responses</span>
                  <strong>Under 4 hours</strong>
                </li>
              </ul>
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
                    title: 'MarketLink Central Hub',
                  },
                ]}
                height="240px"
                zoom={15}
                ariaLabel="Map showing the MarketLink coordination office"
              />
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${CONTACT_DETAILS.lat}%2C${CONTACT_DETAILS.lng}`}
                aria-label="Get directions to MarketLink on OpenStreetMap (opens in a new tab)"
                className={styles.directionsLink}
              >
                Get directions to office &rarr;
              </a>
            </div>
          )}
        </aside>
      </div>

      {/* ── Frequently Asked Questions ── */}
      <section className={styles.faqSection} aria-labelledby="contact-faqs-heading">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionPre}>Quick Answers</div>
          <h2 id="contact-faqs-heading" className={styles.sectionTitle}>
            Common Questions Before Visiting
          </h2>
          <p className={styles.sectionSub}>
            Find instant answers to our most frequent guest inquiries regarding pre-orders, stall pickup, and market day logistics.
          </p>
        </div>

        <div className={styles.faqList}>
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className={styles.faqItem}>
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div id={`faq-answer-${idx}`} className={styles.faqAnswer}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </GuestPage>
  );
}

export default Contact;
