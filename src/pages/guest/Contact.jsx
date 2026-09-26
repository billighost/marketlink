import React, { useState, useRef } from 'react';
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  ChevronDown,
  Check,
  Copy,
  Send,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Store,
  HelpCircle,
  Calendar,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import siteContent from '@/content/siteContent';
import { submitContact } from '@/api/contact';
import MapView from '@/components/domain/MapView';
import styles from './Contact.module.css';

const TOPICS = [
  { id: 'order', label: 'Pre-Order Assistance', icon: '📦' },
  { id: 'farmer-help', label: 'Farmer / Producer Support', icon: '🌾' },
  { id: 'feedback', label: 'Market Feedback', icon: '💬' },
  { id: 'other', label: 'General Inquiry / Other', icon: '✨' },
];

const MARKETS_LIST = [
  'Greenwich Village Farmers Market (Abingdon Square)',
  'Union Square Greenmarket (Manhattan)',
  'Brooklyn Grand Army Plaza (Prospect Park)',
  'Chelsea Farmers Market (W 23rd St)',
  'Tompkins Square Park Greenmarket',
  'Riverside Park Market (Upper West Side)',
  'General / Not Market-Specific',
];

const FAQ_DATA = [
  {
    category: 'pickup',
    question: 'How does Saturday market pickup work?',
    answer:
      'Browse your local stalls and reserve items during the week before Friday at 6:00 PM. Growers harvest specifically for your order at Saturday dawn. Between 8:00 AM and 2:00 PM, walk up to the stall canopy, provide your name, inspect your paper tote, and pay the grower directly.',
  },
  {
    category: 'payments',
    question: 'Do I pay online or in person at the stall?',
    answer:
      'Always in person! MarketLink never charges your credit card or deducts middleman fees. You pay the grower directly at their stall via cash, credit card, debit, or SNAP/EBT tokens upon collection.',
  },
  {
    category: 'pickup',
    question: 'What if I am running late on Saturday morning?',
    answer:
      'Stallholders keep reserved pre-orders set aside until 1:00 PM. If you anticipate being delayed past 1:00 PM, call our Market Day Hotline at (212) 555-0198 or message the grower directly so they continue holding your basket.',
  },
  {
    category: 'orders',
    question: 'Can I modify or cancel a pre-order?',
    answer:
      'Yes, you can edit or cancel any pre-order at zero penalty until the Friday 6:00 PM cutoff. After 6:00 PM, manifests are delivered to farms and dawn harvesting begins, so quantities cannot be adjusted.',
  },
  {
    category: 'farmers',
    question: 'How do independent growers join MarketLink?',
    answer:
      'We welcome certified regional growers, heritage grain bakers, apiaries, and farmstead creameries within 150 miles of our markets. Fill out the contact form below choosing "Farmer / Vendor Admission" and our coordinator will guide you through farm verification and stall allocation.',
  },
  {
    category: 'payments',
    question: 'Do you accept SNAP / EBT / FMNP nutrition coupons?',
    answer:
      'Yes! Stop by the Center Pavilion Information Booth at any of our 8 markets. We process SNAP/EBT and provide $2 bonus Market Match wooden tokens for every $2 spent on fresh regional fruits and vegetables.',
  },
];

export function Contact() {
  useDocumentTitle('Contact MarketLink — Market Office & Support');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    topic: 'order',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeFaqTab, setActiveFaqTab] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);

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
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Please enter your full name.';
    if (!formData.email.trim()) {
      errs.email = 'Please provide an email address.';
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = 'Please provide a message with at least 10 characters.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.name) nameRef.current?.focus();
      else if (validationErrors.email) emailRef.current?.focus();
      else if (validationErrors.message) messageRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const res = await submitContact({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        topic: formData.topic,
        message: formData.message.trim(),
      });
      const refId = res?.data?.id || res?.id;
      setTicketId(refId ? `ML-${refId.slice(-6).toUpperCase()}` : `ML-${Date.now().toString(36).slice(-6).toUpperCase()}`);
      setSubmitted(true);
    } catch (err) {
      if (err.status === 429 || err.code === 'RATE_LIMITED') {
        setErrors({ general: "You've sent several notes recently. Please wait a moment before sending another message." });
      } else if (err.details && Array.isArray(err.details)) {
        const mapped = {};
        for (const d of err.details) {
          if (d.field) mapped[d.field] = d.message;
        }
        setErrors(mapped);
      } else {
        setErrors({ general: err.message || 'Unable to submit your message. Please check your connection.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      topic: 'order',
      message: '',
    });
    setErrors({});
    setSubmitted(false);
  };

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText(siteContent.contact.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(siteContent.contact.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const filteredFaqs =
    activeFaqTab === 'all'
      ? FAQ_DATA
      : FAQ_DATA.filter((faq) => faq.category === activeFaqTab);

  return (
    <div className={styles.page}>
      {/* ─── HERO HEADER ───────────────────────────────────────── */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.badgeRow}>
              <span className={styles.statusBadgePill}>
                <span className={styles.liveDot} />
                Market Office & Help Desk
              </span>
              <span className={styles.hoursBadgePill}>
                <Clock size={12} />
                Desk Open Saturdays 7:00 AM – 2:30 PM
              </span>
            </div>

            <h1 className={styles.heroTitle}>
              We're Here on Market Morning <br />
              <span className={styles.titleAccent}>and Every Day in Between.</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Questions about an upcoming Saturday pickup, stall allocations, or becoming a verified
              grower? Drop by the Center Pavilion Info Booth or send our coordination team a note.
            </p>
          </div>
        </div>
      </section>

      {/* ─── TWO-COLUMN MAIN WORKSPACE ─────────────────────────── */}
      <section className={styles.workspaceSection}>
        <div className="container">
          <div className={styles.workspaceGrid}>
            {/* ── LEFT COLUMN: DIRECT CONTACTS & DESK INFO ── */}
            <div className={styles.leftCol}>
              {/* Primary Info Booth Card */}
              <div className={styles.infoBoothCard}>
                <div className={styles.boothHeader}>
                  <div className={styles.boothIconWrap}>
                    <Store size={22} />
                  </div>
                  <div>
                    <h2 className={styles.boothTitle}>MarketLink Central Help Desk</h2>
                    <span className={styles.boothSub}>Community Market Operations Office</span>
                  </div>
                </div>

                <div className={styles.locationBlock}>
                  <MapPin size={16} className={styles.locationIcon} />
                  <div>
                    <strong>Central Office</strong>
                    <p>{siteContent.contact.address}</p>
                  </div>
                </div>

                {/* Operating Hours Table */}
                <div className={styles.scheduleBox}>
                  <h3 className={styles.scheduleTitle}>Market Schedule & Support Hours</h3>
                  <div className={styles.scheduleRow}>
                    <span className={styles.dayLabel}>Desk Hours</span>
                    <span className={styles.timeValue}>{siteContent.contact.hours}</span>
                  </div>
                  <div className={styles.scheduleRow}>
                    <span className={styles.dayLabel}>Weekly Pre-Order Cutoff</span>
                    <span className={styles.timeValue}>Friday 6:00 PM (Harvest Manifests Sent)</span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className={styles.contactActions}>
                  <div className={styles.contactActionItem}>
                    <div className={styles.actionIconBox}>
                      <Phone size={15} />
                    </div>
                    <div className={styles.actionDetails}>
                      <span className={styles.actionLabel}>Telephone Line</span>
                      <a href={`tel:${siteContent.contact.phone.replace(/[^0-9+]/g, '')}`} className={styles.actionLink}>
                        {siteContent.contact.phone}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className={styles.copyBtn}
                      title="Copy phone number"
                      aria-label="Copy phone number"
                    >
                      {copiedPhone ? <Check size={14} color="#175e21" /> : <Copy size={14} />}
                    </button>
                  </div>

                  <div className={styles.contactActionItem}>
                    <div className={styles.actionIconBox}>
                      <Mail size={15} />
                    </div>
                    <div className={styles.actionDetails}>
                      <span className={styles.actionLabel}>General Inquiries</span>
                      <a href={`mailto:${siteContent.contact.email}`} className={styles.actionLink}>
                        {siteContent.contact.email}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className={styles.copyBtn}
                      title="Copy email address"
                      aria-label="Copy email address"
                    >
                      {copiedEmail ? <Check size={14} color="#175e21" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Department Direct Email Directory */}
              <div className={styles.deptCard}>
                <h3 className={styles.deptTitle}>Direct Department Inboxes</h3>
                <div className={styles.deptList}>
                  <div className={styles.deptItem}>
                    <strong>Customer Pre-Orders & Pickups:</strong>
                    <a href={`mailto:${siteContent.contact.email}`}>{siteContent.contact.email}</a>
                  </div>
                  <div className={styles.deptItem}>
                    <strong>Grower & Producer Support:</strong>
                    <a href={`mailto:${siteContent.contact.email}`}>{siteContent.contact.email}</a>
                  </div>
                </div>
              </div>

              {/* Real Leaflet Map */}
              <div className={styles.mapCard}>
                <MapView
                  markers={[
                    {
                      id: 'hq',
                      lat: siteContent.contact.coordinates.lat,
                      lng: siteContent.contact.coordinates.lng,
                      label: `${siteContent.organization.name} Operations`,
                      subtitle: siteContent.contact.address,
                    },
                  ]}
                  height="260px"
                  zoom={14}
                  ariaLabel="MarketLink office location map"
                />
              </div>
            </div>

            {/* ── RIGHT COLUMN: INTERACTIVE MESSAGE FORM ── */}
            <div className={styles.rightCol}>
              <div className={styles.formCard}>
                {submitted ? (
                  <div className={styles.successState}>
                    <div className={styles.successIconBubble}>
                      <CheckCircle2 size={36} />
                    </div>
                    <h2 className={styles.successHeading}>Your note has been received!</h2>
                    <span className={styles.ticketPill}>Reference #{ticketId}</span>
                    <p className={styles.successText}>
                      Thank you for contacting MarketLink, <strong>{formData.name}</strong>. A market
                      coordinator will review your note and respond to <strong>{formData.email}</strong>{' '}
                      before market morning.
                    </p>
                    <div className={styles.successMetaBox}>
                      <div className={styles.successMetaRow}>
                        <span>Topic:</span>
                        <strong>{formData.topic}</strong>
                      </div>
                      <div className={styles.successMetaRow}>
                        <span>Target Market:</span>
                        <strong>{formData.market}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className={styles.sendAnotherBtn}
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className={styles.contactForm}>
                    <div className={styles.formHeader}>
                      <h2 className={styles.formTitle}>Leave a note for the market</h2>
                      <p className={styles.formSubtitle}>
                        Fill out the details below and we'll connect you directly with the right coordinator.
                      </p>
                    </div>

                    {/* Topic Chips */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>What is this regarding?</label>
                      <div className={styles.topicChipsGrid}>
                        {TOPICS.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, topic: t.label }))}
                            className={`${styles.topicChip} ${
                              formData.topic === t.label ? styles.topicChipActive : ''
                            }`}
                          >
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Market Selector */}
                    <div className={styles.fieldGroup}>
                      <label htmlFor="contact-market" className={styles.fieldLabel}>
                        Associated Market Location
                      </label>
                      <select
                        id="contact-market"
                        name="market"
                        value={formData.market}
                        onChange={handleChange}
                        className={styles.selectInput}
                      >
                        {MARKETS_LIST.map((m, idx) => (
                          <option key={idx} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Name & Email Row */}
                    <div className={styles.twoFieldsRow}>
                      <div className={styles.fieldGroup}>
                        <label htmlFor="contact-name" className={styles.fieldLabel}>
                          Your Full Name <span className={styles.requiredStar}>*</span>
                        </label>
                        <input
                          ref={nameRef}
                          type="text"
                          id="contact-name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g. Claire Adams"
                          className={`${styles.textInput} ${errors.name ? styles.inputError : ''}`}
                        />
                        {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                      </div>

                      <div className={styles.fieldGroup}>
                        <label htmlFor="contact-email" className={styles.fieldLabel}>
                          Email Address <span className={styles.requiredStar}>*</span>
                        </label>
                        <input
                          ref={emailRef}
                          type="email"
                          id="contact-email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="claire@example.com"
                          className={`${styles.textInput} ${errors.email ? styles.inputError : ''}`}
                        />
                        {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                      </div>
                    </div>

                    {/* Optional Phone Field */}
                    <div className={styles.fieldGroup}>
                      <label htmlFor="contact-phone" className={styles.fieldLabel}>
                        Phone Number <span className={styles.optionalTag}>(Optional, for Saturday morning SMS)</span>
                      </label>
                      <input
                        type="tel"
                        id="contact-phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(212) 555-0123"
                        className={styles.textInput}
                      />
                    </div>

                    {/* Message Area */}
                    <div className={styles.fieldGroup}>
                      <div className={styles.labelCountRow}>
                        <label htmlFor="contact-message" className={styles.fieldLabel}>
                          Your Message <span className={styles.requiredStar}>*</span>
                        </label>
                        <span className={styles.charCount}>
                          {formData.message.length} characters
                        </span>
                      </div>
                      <textarea
                        ref={messageRef}
                        id="contact-message"
                        name="message"
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us what you need help with, what stall you're looking for, or details about your farm..."
                        className={`${styles.textAreaInput} ${errors.message ? styles.inputError : ''}`}
                      />
                      {errors.message && <span className={styles.errorText}>{errors.message}</span>}
                    </div>

                    {/* Trust Note */}
                    <div className={styles.formPrivacyNote}>
                      <ShieldCheck size={15} className={styles.privacyIcon} />
                      <span>
                        We respect your privacy. Your information is only shared with our market
                        operations team and participating growers when necessary.
                      </span>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className={styles.submitBtn}
                    >
                      {submitting ? (
                        <span>Sending your note...</span>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Send Note to Market Coordinators</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SATURDAY EMERGENCY CALLOUT BANNER ──────────────────── */}
      <section className={styles.hotlineSection}>
        <div className="container">
          <div className={styles.hotlineCard}>
            <div className={styles.hotlineIconWrap}>
              <AlertCircle size={24} />
            </div>
            <div className={styles.hotlineText}>
              <h3 className={styles.hotlineTitle}>Need urgent assistance on market morning?</h3>
              <p className={styles.hotlineDesc}>
                If you are running late, can't find a specific stall under the awnings, or need immediate
                help between 7:30 AM and 2:00 PM on Saturday, call our on-duty Market Day Manager at{' '}
                <a href="tel:2125550198" className={styles.hotlinePhoneLink}>
                  (212) 555-0198
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FREQUENTLY ASKED QUESTIONS SECTION ─────────────────── */}
      <section className={styles.faqSection}>
        <div className="container">
          <div className={styles.faqHeader}>
            <span className={styles.faqKicker}>Help & Answers</span>
            <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
            <p className={styles.faqSubtitle}>
              Plain-spoken answers to common questions about Saturday pre-orders, collection, and stall policies.
            </p>

            {/* Filter Tabs */}
            <div className={styles.faqTabs}>
              <button
                type="button"
                onClick={() => setActiveFaqTab('all')}
                className={`${styles.faqTabBtn} ${activeFaqTab === 'all' ? styles.faqTabActive : ''}`}
              >
                All Questions
              </button>
              <button
                type="button"
                onClick={() => setActiveFaqTab('pickup')}
                className={`${styles.faqTabBtn} ${activeFaqTab === 'pickup' ? styles.faqTabActive : ''}`}
              >
                Pre-Orders & Pickup
              </button>
              <button
                type="button"
                onClick={() => setActiveFaqTab('payments')}
                className={`${styles.faqTabBtn} ${activeFaqTab === 'payments' ? styles.faqTabActive : ''}`}
              >
                Payments & Food Access
              </button>
              <button
                type="button"
                onClick={() => setActiveFaqTab('farmers')}
                className={`${styles.faqTabBtn} ${activeFaqTab === 'farmers' ? styles.faqTabActive : ''}`}
              >
                For Farmers & Bakers
              </button>
            </div>
          </div>

          <div className={styles.faqList}>
            {filteredFaqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className={styles.faqQuestionBtn}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.faqQText}>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className={styles.faqAnswerBody}>
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
