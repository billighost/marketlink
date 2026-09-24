import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  User,
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Leaf,
  ShoppingBag,
  Award,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import styles from './Register.module.css';

const FARM_CATEGORIES = [
  'Vegetables & Leafy Greens',
  'Orchard Fruits & Berries',
  'Artisan Bakery & Grains',
  'Dairy, Butter & Farmhouse Cheese',
  'Raw Honey & Fruit Preserves',
  'Cut Flowers & Potted Herbs',
  'Pasture-Raised Poultry & Meats',
];

const PREFERRED_MARKETS = [
  'Greenwich Village Farmers Market (Abingdon Square)',
  'Union Square Greenmarket (Manhattan)',
  'Brooklyn Grand Army Plaza (Prospect Park)',
  'Chelsea Farmers Market (W 23rd St)',
  'Tompkins Square Greenmarket (East Village)',
  'Riverside Park Market (Upper West Side)',
];

export function Register() {
  useDocumentTitle('Create Account — MarketLink');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleParam = searchParams.get('role')?.toLowerCase();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(
    roleParam === 'customer' || roleParam === 'farmer' ? roleParam : 'customer'
  );

  useEffect(() => {
    if (roleParam === 'customer' || roleParam === 'farmer') {
      setRole(roleParam);
      setStep(2);
    }
  }, [roleParam]);

  const [customerData, setCustomerData] = useState({
    fullName: '',
    email: '',
    phone: '',
    market: 'Greenwich Village Farmers Market (Abingdon Square)',
    password: '',
    confirmPassword: '',
    agreedTerms: true,
  });

  const [farmerData, setFarmerData] = useState({
    farmName: '',
    contactPerson: '',
    category: 'Vegetables & Leafy Greens',
    farmLocation: 'Hudson Valley, NY',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreedTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const firstInputRef = useRef(null);

  const handleCustomerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomerData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFarmerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFarmerData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateStep2 = () => {
    const newErrors = {};
    const data = role === 'customer' ? customerData : farmerData;

    if (role === 'customer') {
      if (!data.fullName.trim()) newErrors.fullName = 'Please enter your full name.';
    } else {
      if (!data.farmName.trim()) newErrors.farmName = 'Please enter your farm or business name.';
      if (!data.contactPerson.trim()) newErrors.contactPerson = 'Please enter a contact name.';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Please provide an email address.';
    } else if (!data.email.includes('@') || !data.email.includes('.')) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!data.phone.trim()) {
      newErrors.phone = 'Please provide a contact phone number.';
    }

    if (!data.password) {
      newErrors.password = 'Please create a password.';
    } else if (data.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (!data.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!data.agreedTerms) {
      newErrors.agreedTerms = 'You must agree to MarketLink community standards.';
    }

    return newErrors;
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!role) return;
    setStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    const valErrors = validateStep2();
    if (Object.keys(valErrors).length > 0) {
      setErrors(valErrors);
      firstInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep(3);
    }, 600);
  };

  const activeName =
    role === 'customer' ? customerData.fullName : farmerData.contactPerson;

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerContainer}>
        {/* ── LEFT SHOWCASE PANEL ── */}
        <div className={styles.showcasePanel}>
          <img
            src="/images/riverbend-farm.jpg"
            alt="Organic farm fields in the morning"
            className={styles.showcaseBgImg}
          />
          <div className={styles.showcaseOverlay}>
            <div className={styles.showcaseTop}>
              <div className={styles.showcaseLogoWrap}>
                <MarketLinkLogo size="md" />
              </div>
              <span className={styles.showcaseBadge}>
                <Sparkles size={13} />
                Community Food Network
              </span>
            </div>

            <div className={styles.showcaseQuoteBlock}>
              <h2 className={styles.showcaseHeading}>
                {role === 'farmer'
                  ? 'Connect directly with neighbours who value your harvest.'
                  : 'Saturday mornings, simplified and guaranteed.'}
              </h2>
              <p className={styles.showcaseLead}>
                {role === 'farmer'
                  ? 'Zero commission markups. Receive exact Friday pre-order manifests so you harvest strictly to demand at dawn.'
                  : 'Reserve crisp heirloom crops throughout the week. Sleep in knowing your brown paper tote is set aside under the canopy.'}
              </p>

              <div className={styles.showcasePoints}>
                <div className={styles.showcasePoint}>
                  <ShieldCheck size={16} className={styles.pointCheck} />
                  <span>100% Certified Producer-Only standards</span>
                </div>
                <div className={styles.showcasePoint}>
                  <CheckCircle2 size={16} className={styles.pointCheck} />
                  <span>Zero subscription fees · Pay directly at the stall</span>
                </div>
                <div className={styles.showcasePoint}>
                  <Leaf size={16} className={styles.pointCheck} />
                  <span>Reduce food waste by harvesting strictly to order</span>
                </div>
              </div>
            </div>

            <div className={styles.showcaseFooter}>
              <div className={styles.footerStepIndicator}>
                <span>Step {step} of 3</span>
                <div className={styles.stepProgressDots}>
                  <span className={`${styles.dot} ${step >= 1 ? styles.dotActive : ''}`} />
                  <span className={`${styles.dot} ${step >= 2 ? styles.dotActive : ''}`} />
                  <span className={`${styles.dot} ${step >= 3 ? styles.dotActive : ''}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT REGISTRATION FORM PANEL ── */}
        <div className={styles.formPanel}>
          <div className={styles.formInner}>
            {/* Top Navigation Row */}
            <div className={styles.navRow}>
              {step === 2 && !roleParam ? (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={styles.backBtn}
                >
                  <ArrowLeft size={14} />
                  <span>Change account type</span>
                </button>
              ) : (
                <Link to={PATHS.HOME} className={styles.backBtn}>
                  <ArrowLeft size={14} />
                  <span>Back to home</span>
                </Link>
              )}

              <span className={styles.stepCounterText}>Step {step} of 3</span>
            </div>

            {/* ── STEP 1: CHOOSE ROLE ── */}
            {step === 1 && (
              <div className={styles.stepBlock}>
                <div className={styles.formHeader}>
                  <span className={styles.formKicker}>Get Started with MarketLink</span>
                  <h1 className={styles.formTitle}>How will you use MarketLink?</h1>
                  <p className={styles.formSubtitle}>
                    Choose the account type that best describes your weekend market routine.
                  </p>
                </div>

                <form onSubmit={handleStep1Submit} className={styles.roleSelectionForm}>
                  <div className={styles.roleCardsGrid}>
                    {/* Customer Card */}
                    <label
                      className={`${styles.roleOptionCard} ${
                        role === 'customer' ? styles.roleOptionActive : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="accountRole"
                        value="customer"
                        checked={role === 'customer'}
                        onChange={() => setRole('customer')}
                        className={styles.roleRadioHidden}
                      />
                      <div className={styles.roleIconBox}>
                        <ShoppingBag size={22} />
                      </div>
                      <div className={styles.roleCardText}>
                        <div className={styles.roleTitleRow}>
                          <strong className={styles.roleCardTitle}>Market Shopper / Household</strong>
                          {role === 'customer' && (
                            <CheckCircle2 size={16} className={styles.roleActiveCheck} />
                          )}
                        </div>
                        <p className={styles.roleCardDesc}>
                          I want to browse local markets, reserve heirloom produce and fresh sourdough
                          during the week, and pay farmers directly at pickup.
                        </p>
                      </div>
                    </label>

                    {/* Farmer Card */}
                    <label
                      className={`${styles.roleOptionCard} ${
                        role === 'farmer' ? styles.roleOptionActive : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="accountRole"
                        value="farmer"
                        checked={role === 'farmer'}
                        onChange={() => setRole('farmer')}
                        className={styles.roleRadioHidden}
                      />
                      <div className={styles.roleIconBox}>
                        <Store size={22} />
                      </div>
                      <div className={styles.roleCardText}>
                        <div className={styles.roleTitleRow}>
                          <strong className={styles.roleCardTitle}>Farmer / Artisan Producer</strong>
                          {role === 'farmer' && (
                            <CheckCircle2 size={16} className={styles.roleActiveCheck} />
                          )}
                        </div>
                        <p className={styles.roleCardDesc}>
                          I cultivate regional crops, bake breads, make cheese, or harvest honey and
                          want to list weekly pre-order availability for Saturday stalls.
                        </p>
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className={styles.continueBtn}
                  >
                    <span>Continue as {role === 'customer' ? 'Shopper' : 'Producer'}</span>
                    <ArrowRight size={16} />
                  </button>

                  <div className={styles.formFooterPrompt}>
                    <p>
                      Already have an account?{' '}
                      <Link to={PATHS.LOGIN} className={styles.loginLink}>
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            )}

            {/* ── STEP 2: PROFILE DETAILS ── */}
            {step === 2 && (
              <div className={styles.stepBlock}>
                <div className={styles.formHeader}>
                  <span className={styles.formKicker}>
                    {role === 'customer' ? 'Shopper Registration' : 'Producer Admission'}
                  </span>
                  <h1 className={styles.formTitle}>
                    {role === 'customer'
                      ? 'Create your customer account'
                      : 'Register your farm or bakery stall'}
                  </h1>
                  <p className={styles.formSubtitle}>
                    {role === 'customer'
                      ? 'Pre-order from 40+ family farms and pick up your bag every Saturday.'
                      : 'Join our verified producer-only directory across 8 historic New York markets.'}
                  </p>
                </div>

                <form onSubmit={handleStep2Submit} noValidate className={styles.detailsForm}>
                  {role === 'customer' ? (
                    /* Customer Form Fields */
                    <>
                      <div className={styles.fieldGroup}>
                        <label htmlFor="reg-fullname" className={styles.fieldLabel}>
                          Full Name <span className={styles.requiredStar}>*</span>
                        </label>
                        <div className={`${styles.inputWrapper} ${errors.fullName ? styles.inputError : ''}`}>
                          <User size={16} className={styles.fieldIcon} />
                          <input
                            ref={firstInputRef}
                            id="reg-fullname"
                            type="text"
                            name="fullName"
                            value={customerData.fullName}
                            onChange={handleCustomerChange}
                            placeholder="e.g. Eleanor Vance"
                            autoComplete="name"
                            className={styles.textInput}
                            required
                          />
                        </div>
                        {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
                      </div>

                      <div className={styles.twoFieldsGrid}>
                        <div className={styles.fieldGroup}>
                          <label htmlFor="reg-email" className={styles.fieldLabel}>
                            Email Address <span className={styles.requiredStar}>*</span>
                          </label>
                          <div className={`${styles.inputWrapper} ${errors.email ? styles.inputError : ''}`}>
                            <Mail size={16} className={styles.fieldIcon} />
                            <input
                              id="reg-email"
                              type="email"
                              name="email"
                              value={customerData.email}
                              onChange={handleCustomerChange}
                              placeholder="name@example.com"
                              autoComplete="email"
                              className={styles.textInput}
                              required
                            />
                          </div>
                          {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                        </div>

                        <div className={styles.fieldGroup}>
                          <label htmlFor="reg-phone" className={styles.fieldLabel}>
                            Mobile Phone <span className={styles.requiredStar}>*</span>
                          </label>
                          <div className={`${styles.inputWrapper} ${errors.phone ? styles.inputError : ''}`}>
                            <Phone size={16} className={styles.fieldIcon} />
                            <input
                              id="reg-phone"
                              type="tel"
                              name="phone"
                              value={customerData.phone}
                              onChange={handleCustomerChange}
                              placeholder="(212) 555-0123"
                              autoComplete="tel"
                              className={styles.textInput}
                              required
                            />
                          </div>
                          {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label htmlFor="reg-market" className={styles.fieldLabel}>
                          Primary Market You Shop
                        </label>
                        <div className={styles.inputWrapper}>
                          <MapPin size={16} className={styles.fieldIcon} />
                          <select
                            id="reg-market"
                            name="market"
                            value={customerData.market}
                            onChange={handleCustomerChange}
                            className={styles.selectInput}
                          >
                            {PREFERRED_MARKETS.map((m, idx) => (
                              <option key={idx} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Farmer Form Fields */
                    <>
                      <div className={styles.twoFieldsGrid}>
                        <div className={styles.fieldGroup}>
                          <label htmlFor="reg-farmname" className={styles.fieldLabel}>
                            Farm or Bakery Name <span className={styles.requiredStar}>*</span>
                          </label>
                          <div className={`${styles.inputWrapper} ${errors.farmName ? styles.inputError : ''}`}>
                            <Store size={16} className={styles.fieldIcon} />
                            <input
                              ref={firstInputRef}
                              id="reg-farmname"
                              type="text"
                              name="farmName"
                              value={farmerData.farmName}
                              onChange={handleFarmerChange}
                              placeholder="e.g. Riverbend Organic Farm"
                              className={styles.textInput}
                              required
                            />
                          </div>
                          {errors.farmName && <span className={styles.errorText}>{errors.farmName}</span>}
                        </div>

                        <div className={styles.fieldGroup}>
                          <label htmlFor="reg-contact" className={styles.fieldLabel}>
                            Primary Contact Name <span className={styles.requiredStar}>*</span>
                          </label>
                          <div className={`${styles.inputWrapper} ${errors.contactPerson ? styles.inputError : ''}`}>
                            <User size={16} className={styles.fieldIcon} />
                            <input
                              id="reg-contact"
                              type="text"
                              name="contactPerson"
                              value={farmerData.contactPerson}
                              onChange={handleFarmerChange}
                              placeholder="e.g. Elena Vance"
                              className={styles.textInput}
                              required
                            />
                          </div>
                          {errors.contactPerson && (
                            <span className={styles.errorText}>{errors.contactPerson}</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label htmlFor="reg-category" className={styles.fieldLabel}>
                          Primary Harvest Category
                        </label>
                        <div className={styles.inputWrapper}>
                          <Leaf size={16} className={styles.fieldIcon} />
                          <select
                            id="reg-category"
                            name="category"
                            value={farmerData.category}
                            onChange={handleFarmerChange}
                            className={styles.selectInput}
                          >
                            {FARM_CATEGORIES.map((cat, idx) => (
                              <option key={idx} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className={styles.twoFieldsGrid}>
                        <div className={styles.fieldGroup}>
                          <label htmlFor="reg-farmer-email" className={styles.fieldLabel}>
                            Business Email <span className={styles.requiredStar}>*</span>
                          </label>
                          <div className={`${styles.inputWrapper} ${errors.email ? styles.inputError : ''}`}>
                            <Mail size={16} className={styles.fieldIcon} />
                            <input
                              id="reg-farmer-email"
                              type="email"
                              name="email"
                              value={farmerData.email}
                              onChange={handleFarmerChange}
                              placeholder="grower@farm.org"
                              className={styles.textInput}
                              required
                            />
                          </div>
                          {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                        </div>

                        <div className={styles.fieldGroup}>
                          <label htmlFor="reg-farmer-phone" className={styles.fieldLabel}>
                            Phone Number <span className={styles.requiredStar}>*</span>
                          </label>
                          <div className={`${styles.inputWrapper} ${errors.phone ? styles.inputError : ''}`}>
                            <Phone size={16} className={styles.fieldIcon} />
                            <input
                              id="reg-farmer-phone"
                              type="tel"
                              name="phone"
                              value={farmerData.phone}
                              onChange={handleFarmerChange}
                              placeholder="(555) 012-3456"
                              className={styles.textInput}
                              required
                            />
                          </div>
                          {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Password & Confirm Password Row */}
                  <div className={styles.twoFieldsGrid}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="reg-password" className={styles.fieldLabel}>
                        Password <span className={styles.requiredStar}>*</span>
                      </label>
                      <div
                        className={`${styles.inputWrapper} ${
                          errors.password ? styles.inputError : ''
                        }`}
                      >
                        <Lock size={16} className={styles.fieldIcon} />
                        <input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={
                            role === 'customer'
                              ? customerData.password
                              : farmerData.password
                          }
                          onChange={
                            role === 'customer'
                              ? handleCustomerChange
                              : handleFarmerChange
                          }
                          placeholder="Min. 8 characters"
                          className={styles.textInput}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={styles.togglePasswordBtn}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="reg-confirm-password" className={styles.fieldLabel}>
                        Confirm Password <span className={styles.requiredStar}>*</span>
                      </label>
                      <div
                        className={`${styles.inputWrapper} ${
                          errors.confirmPassword ? styles.inputError : ''
                        }`}
                      >
                        <Lock size={16} className={styles.fieldIcon} />
                        <input
                          id="reg-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={
                            role === 'customer'
                              ? customerData.confirmPassword
                              : farmerData.confirmPassword
                          }
                          onChange={
                            role === 'customer'
                              ? handleCustomerChange
                              : handleFarmerChange
                          }
                          placeholder="Repeat password"
                          className={styles.textInput}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className={styles.togglePasswordBtn}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <span className={styles.errorText}>{errors.confirmPassword}</span>
                      )}
                    </div>
                  </div>

                  {/* Terms & Standards Checkbox */}
                  <div className={styles.termsRow}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="agreedTerms"
                        checked={
                          role === 'customer'
                            ? customerData.agreedTerms
                            : farmerData.agreedTerms
                        }
                        onChange={
                          role === 'customer'
                            ? handleCustomerChange
                            : handleFarmerChange
                        }
                        className={styles.checkboxInput}
                      />
                      <span>
                        I agree to MarketLink's community pledge and 100% Producer-Only standards.
                      </span>
                    </label>
                    {errors.agreedTerms && (
                      <span className={styles.errorText}>{errors.agreedTerms}</span>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={styles.submitBtn}
                  >
                    {submitting ? (
                      <span>Creating your account...</span>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className={styles.formFooterPrompt}>
                    <p>
                      Already registered?{' '}
                      <Link to={PATHS.LOGIN} className={styles.loginLink}>
                        Sign in to your account
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            )}

            {/* ── STEP 3: REGISTRATION SUCCESS CELEBRATION ── */}
            {step === 3 && (
              <div className={styles.successBlock}>
                <div className={styles.successIconBubble}>
                  <CheckCircle2 size={44} />
                </div>
                <h2 className={styles.successHeading}>Welcome to MarketLink, {activeName || 'Friend'}!</h2>
                <span className={styles.successBadgePill}>
                  ✓ Verified {role === 'customer' ? 'Customer' : 'Producer'} Account
                </span>

                <p className={styles.successMessage}>
                  {role === 'customer'
                    ? 'Your account is ready for Saturday market pre-orders. Browse this week’s freshly picked harvest and hold your favorite crops safely under the canopy.'
                    : 'Your farm stall application has been submitted to our regional market operations desk. Our coordinator will contact you shortly to confirm your stall location.'}
                </p>

                <div className={styles.successActionButtons}>
                  <Link to={PATHS.MARKETS} className={styles.successPrimaryBtn}>
                    <span>Explore Farmers Markets</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link to={PATHS.PRODUCTS} className={styles.successSecondaryBtn}>
                    <span>Browse Seasonal Harvest</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
