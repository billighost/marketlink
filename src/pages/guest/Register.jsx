import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Check,
  ShoppingBag,
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import { useAuth, homePathFor } from '@/context/AuthContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import AuthCard from '@/components/guest/AuthCard';
import AuthSwitchLink from '@/components/guest/AuthSwitchLink';
import authStyles from '@/components/guest/AuthCard.module.css';
import styles from './Register.module.css';

export function Register() {
  useDocumentTitle('Create Account — MarketLink');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { register, isAuthenticated, user } = useAuth();

  const roleFromUrl = searchParams.get('role') === 'farmer' ? 'farmer' : 'customer';
  const [role, setRole] = useState(roleFromUrl);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setSearchParams({ role: newRole }, { replace: true });
    setFieldErrors({});
    setBannerError(null);
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(homePathFor(user?.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    stallName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [bannerError, setBannerError] = useState(null);

  const password = formData.password;
  const ruleMinLength = password.length >= 8;
  const ruleHasLetter = /[a-zA-Z]/.test(password);
  const ruleHasNumber = /[0-9]/.test(password);
  const ruleHasSpecialOrLong = /[^a-zA-Z0-9]/.test(password) || password.length >= 10;

  let strengthScore = 0;
  if (password.length > 0) {
    if (ruleMinLength) strengthScore += 1;
    if (ruleHasLetter && ruleHasNumber) strengthScore += 1;
    if (ruleHasSpecialOrLong) strengthScore += 1;
    if (strengthScore === 0) strengthScore = 1;
  }
  const strengthLabels = ['', 'Needs more work', 'Fair password', 'Strong password'];
  const strengthColors = ['', '#B3261E', '#E07A2C', '#5C7048'];

  const validateField = (name, val) => {
    const trimmed = (val || '').trim();
    if (name === 'name' && role === 'customer') {
      if (!trimmed) return 'Full name is required.';
      if (trimmed.length < 2) return 'Full name must be at least 2 characters.';
    }
    if (name === 'stallName' && role === 'farmer') {
      if (!trimmed) return 'Stall or business name is required.';
      if (trimmed.length < 2) return 'Stall name must be at least 2 characters.';
    }
    if (name === 'contactPerson' && role === 'farmer') {
      if (!trimmed) return 'Contact person name is required.';
      if (trimmed.length < 2) return 'Contact person must be at least 2 characters.';
    }
    if (name === 'email') {
      if (!trimmed) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address.';
    }
    if (name === 'phone') {
      if (!trimmed) return 'Contact number is required.';
      if (trimmed.length < 7) return 'Contact number must be at least 7 characters.';
    }
    if (name === 'address') {
      if (!trimmed) return 'Address is required.';
      if (trimmed.length < 3) return 'Address must be at least 3 characters.';
    }
    if (name === 'password') {
      if (!val) return 'Password is required.';
      if (val.length < 8) return 'Password must be at least 8 characters long.';
      if (!/[a-zA-Z]/.test(val) || !/[0-9]/.test(val)) {
        return 'Password must contain at least one letter and one number.';
      }
    }
    if (name === 'confirmPassword') {
      if (!val) return 'Please confirm your password.';
      if (val !== formData.password) return 'Passwords do not match.';
    }
    return '';
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (bannerError) setBannerError(null);
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (name === 'password' && touched.confirmPassword && formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
      } else {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBannerError(null);

    const requiredKeys = role === 'customer'
      ? ['name', 'email', 'phone', 'address', 'password', 'confirmPassword']
      : ['stallName', 'contactPerson', 'email', 'phone', 'address', 'password', 'confirmPassword'];

    const newErrors = {};
    const newTouched = {};
    let firstInvalid = null;

    for (const key of requiredKeys) {
      newTouched[key] = true;
      const err = validateField(key, formData[key]);
      if (err) {
        newErrors[key] = err;
        if (!firstInvalid) firstInvalid = key;
      }
    }

    setTouched(newTouched);
    setFieldErrors(newErrors);

    if (firstInvalid) {
      document.getElementById(`register-${firstInvalid}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      let payload;
      if (role === 'customer') {
        payload = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          password: formData.password,
        };
      } else {
        payload = {
          stallName: formData.stallName.trim(),
          contactPerson: formData.contactPerson.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          password: formData.password,
        };
      }

      const data = await register(role, payload);
      const userRole = data?.user?.role || role;
      navigate(homePathFor(userRole), { replace: true });
    } catch (err) {
      if (err.code === 'EMAIL_TAKEN' || err.statusCode === 409) {
        setFieldErrors((prev) => ({
          ...prev,
          email: 'An account with this email already exists.',
        }));
        document.getElementById('register-email')?.focus();
      } else if (err.code === 'RATE_LIMITED' || err.statusCode === 429) {
        setBannerError(err.message || 'Too many accounts created from this IP. Please try again later.');
      } else if (err.details && Array.isArray(err.details)) {
        const mapped = {};
        for (const d of err.details) {
          if (d.field) mapped[d.field] = d.message;
        }
        setFieldErrors(mapped);
      } else if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network')) {
        setBannerError('Cannot reach MarketLink. Check your connection.');
      } else {
        setBannerError(err.message || 'Unable to create account. Please check your information.');
      }
    } finally {
      setLoading(false);
    }
  };

  const shopperFeatures = [
    {
      icon: <ShoppingBag size={18} aria-hidden="true" />,
      text: 'Reserve Peak Harvest Early',
      subtext: 'Secure limited heritage varieties before the stall sells out.',
    },
    {
      icon: <Check size={18} aria-hidden="true" />,
      text: 'Zero Prepayment Risk',
      subtext: 'Inspect your produce in person and pay at collection on Saturday.',
    },
    {
      icon: <ShieldCheck size={18} aria-hidden="true" />,
      text: 'Support Local Growers',
      subtext: 'Every order supports independent family farms and artisans.',
    },
  ];

  const farmerFeatures = [
    {
      icon: <Store size={18} aria-hidden="true" />,
      text: 'Live Stall Catalogue',
      subtext: 'Manage seasonal produce, set quantities, and update harvest alerts.',
    },
    {
      icon: <Check size={18} aria-hidden="true" />,
      text: 'Guaranteed Market Pre-Orders',
      subtext: 'Pack knowing your produce is already spoken for before sunrise.',
    },
    {
      icon: <ShieldCheck size={18} aria-hidden="true" />,
      text: 'Verified Market Vendor Badge',
      subtext: 'Stand out to thousands of conscious market shoppers.',
    },
  ];

  return (
    <AuthCard
      split={true}
      wide={true}
      activeTab="register"
      badge={role === 'customer' ? 'Shopper Account' : 'Stallholder Account'}
      title="Create your account"
      lead={
        role === 'customer'
          ? 'Sign up to reserve fresh Saturday produce directly from market stalls.'
          : 'Sign up to showcase your harvest and receive pre-orders for market day.'
      }
      heroTitle={
        role === 'customer'
          ? 'The fresher, simpler way to do your weekend food shop.'
          : 'Connect your stall directly with passionate local food lovers.'
      }
      heroLead={
        role === 'customer'
          ? 'Reserve sourdough, pasture-raised eggs, and heritage vegetables straight from certified independent producers.'
          : 'Receive pre-orders ahead of market day, plan your weekly harvest accurately, and reduce unsold produce.'
      }
      heroFeatures={role === 'customer' ? shopperFeatures : farmerFeatures}
      heroQuote={
        role === 'customer'
          ? 'I never miss out on heirloom tomatoes or wild honey anymore. The farmers have my bag ready when I arrive!'
          : 'Pre-orders through MarketLink allow our family farm to pick exactly what is needed on Friday morning. Zero waste!'
      }
      heroAuthor={role === 'customer' ? 'Elena K.' : 'Marcus Vance'}
      heroAuthorRole={role === 'customer' ? 'Greenwich Market customer' : 'Vance Organic Orchards'}
      footer={
        <div className={styles.cardFooterContent}>
          <span>
            Already have an account?{' '}
            <AuthSwitchLink to={PATHS.LOGIN} className={authStyles.link}>
              Sign in
            </AuthSwitchLink>
          </span>
          <div className={styles.securityRow}>
            <ShieldCheck size={14} className={styles.securityIcon} aria-hidden="true" />
            <span>Free forever • No credit card required to register</span>
          </div>
        </div>
      }
    >
      
      <fieldset className={styles.roleFieldset}>
        <legend className={styles.roleLegend}>
          Select your account role
        </legend>
        <div role="radiogroup" aria-label="Account type" className={styles.roleGrid}>
          
          <label className={`${styles.roleCard} ${role === 'customer' ? styles.roleCardActive : ''}`}>
            <input
              type="radio"
              name="accountRole"
              value="customer"
              checked={role === 'customer'}
              onChange={() => handleRoleChange('customer')}
              className={styles.roleRadio}
            />
            <div className={styles.roleIconWrap}>
              <ShoppingBag size={20} className={styles.customerIcon} aria-hidden="true" />
            </div>
            <div className={styles.roleContent}>
              <div className={styles.roleHeaderRow}>
                <span className={styles.roleTitle}>I am shopping</span>
                {role === 'customer' && <span className={styles.activePill}>Selected</span>}
              </div>
              <span className={styles.roleDesc}>
                Reserve produce and goods to collect at the Saturday market.
              </span>
            </div>
          </label>

          <label className={`${styles.roleCard} ${role === 'farmer' ? styles.roleCardActive : ''}`}>
            <input
              type="radio"
              name="accountRole"
              value="farmer"
              checked={role === 'farmer'}
              onChange={() => handleRoleChange('farmer')}
              className={styles.roleRadio}
            />
            <div className={`${styles.roleIconWrap} ${styles.farmerIconWrap}`}>
              <Store size={20} className={styles.farmerIcon} aria-hidden="true" />
            </div>
            <div className={styles.roleContent}>
              <div className={styles.roleHeaderRow}>
                <span className={styles.roleTitle}>I sell at a market</span>
                {role === 'farmer' && <span className={styles.activePill}>Selected</span>}
              </div>
              <span className={styles.roleDesc}>
                List your harvest and take pre-orders before market morning.
              </span>
            </div>
          </label>
        </div>
      </fieldset>

      {bannerError && (
        <div role="alert" className={authStyles.bannerError}>
          <p>{bannerError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className={`${authStyles.form} ${styles.registerForm}`}>
        
        <div className={styles.twoCol}>
          {role === 'customer' ? (
            <div className={authStyles.field}>
              <label htmlFor="register-name" className={authStyles.label}>
                Full name
              </label>
              <div className={authStyles.inputWrap}>
                <User size={18} className={authStyles.inputIcon} aria-hidden="true" />
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'register-name-err' : undefined}
                  className={`${authStyles.input} ${authStyles.inputWithIcon} ${fieldErrors.name ? authStyles.inputInvalid : ''}`}
                  required
                />
              </div>
              {fieldErrors.name && (
                <span id="register-name-err" role="alert" className={authStyles.errorText}>
                  {fieldErrors.name}
                </span>
              )}
            </div>
          ) : (
            <>
              <div className={authStyles.field}>
                <label htmlFor="register-stallName" className={authStyles.label}>
                  Stall or business name
                </label>
                <div className={authStyles.inputWrap}>
                  <Store size={18} className={authStyles.inputIcon} aria-hidden="true" />
                  <input
                    id="register-stallName"
                    name="stallName"
                    type="text"
                    placeholder="e.g. Sunburst Orchard"
                    value={formData.stallName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="organization"
                    aria-invalid={Boolean(fieldErrors.stallName)}
                    aria-describedby={fieldErrors.stallName ? 'register-stallName-err' : undefined}
                    className={`${authStyles.input} ${authStyles.inputWithIcon} ${fieldErrors.stallName ? authStyles.inputInvalid : ''}`}
                    required
                  />
                </div>
                {fieldErrors.stallName && (
                  <span id="register-stallName-err" role="alert" className={authStyles.errorText}>
                    {fieldErrors.stallName}
                  </span>
                )}
              </div>

              <div className={authStyles.field}>
                <label htmlFor="register-contactPerson" className={authStyles.label}>
                  Contact person
                </label>
                <div className={authStyles.inputWrap}>
                  <User size={18} className={authStyles.inputIcon} aria-hidden="true" />
                  <input
                    id="register-contactPerson"
                    name="contactPerson"
                    type="text"
                    placeholder="Your primary name"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="name"
                    aria-invalid={Boolean(fieldErrors.contactPerson)}
                    aria-describedby={fieldErrors.contactPerson ? 'register-contactPerson-err' : undefined}
                    className={`${authStyles.input} ${authStyles.inputWithIcon} ${fieldErrors.contactPerson ? authStyles.inputInvalid : ''}`}
                    required
                  />
                </div>
                {fieldErrors.contactPerson && (
                  <span id="register-contactPerson-err" role="alert" className={authStyles.errorText}>
                    {fieldErrors.contactPerson}
                  </span>
                )}
              </div>
            </>
          )}

          <div className={authStyles.field}>
            <label htmlFor="register-email" className={authStyles.label}>
              Email address
            </label>
            <div className={authStyles.inputWrap}>
              <Mail size={18} className={authStyles.inputIcon} aria-hidden="true" />
              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="email"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'register-email-err' : undefined}
                className={`${authStyles.input} ${authStyles.inputWithIcon} ${fieldErrors.email ? authStyles.inputInvalid : ''}`}
                required
              />
            </div>
            {fieldErrors.email && (
              <span id="register-email-err" role="alert" className={authStyles.errorText}>
                {fieldErrors.email}{' '}
                {fieldErrors.email.includes('already exists') && (
                  <AuthSwitchLink to={`${PATHS.LOGIN}?email=${encodeURIComponent(formData.email)}`} className={authStyles.link}>
                    Sign in instead
                  </AuthSwitchLink>
                )}
              </span>
            )}
          </div>

          <div className={authStyles.field}>
            <label htmlFor="register-phone" className={authStyles.label}>
              Contact number
            </label>
            <div className={authStyles.inputWrap}>
              <Phone size={18} className={authStyles.inputIcon} aria-hidden="true" />
              <input
                id="register-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="e.g. 07123 456789"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="tel"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? 'register-phone-err' : undefined}
                className={`${authStyles.input} ${authStyles.inputWithIcon} ${fieldErrors.phone ? authStyles.inputInvalid : ''}`}
                required
              />
            </div>
            {fieldErrors.phone && (
              <span id="register-phone-err" role="alert" className={authStyles.errorText}>
                {fieldErrors.phone}
              </span>
            )}
          </div>
          <div className={`${authStyles.field} ${role === 'farmer' ? styles.spanFull : ''}`}>
            <label htmlFor="register-address" className={authStyles.label}>
              {role === 'customer' ? 'Address or neighbourhood' : 'Farm / Stall location address'}
            </label>
            <div className={authStyles.inputWrap}>
              <MapPin size={18} className={authStyles.inputIcon} aria-hidden="true" />
              <input
                id="register-address"
                name="address"
                type="text"
                placeholder={role === 'customer' ? 'e.g. 14 Richmond Hill, London' : 'e.g. Unit 3, Elm Valley Farm, Kent'}
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="street-address"
                aria-invalid={Boolean(fieldErrors.address)}
                aria-describedby={fieldErrors.address ? 'register-address-err' : undefined}
                className={`${authStyles.input} ${authStyles.inputWithIcon} ${fieldErrors.address ? authStyles.inputInvalid : ''}`}
                required
              />
            </div>
            {fieldErrors.address && (
              <span id="register-address-err" role="alert" className={authStyles.errorText}>
                {fieldErrors.address}
              </span>
            )}
          </div>
        </div>


        <div className={styles.twoCol}>
          
          <div className={authStyles.field}>
            <label htmlFor="register-password" className={authStyles.label}>
              Password
            </label>
            <div className={authStyles.inputWrap}>
              <Lock size={18} className={authStyles.inputIcon} aria-hidden="true" />
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'register-password-err' : 'register-password-rules'}
                className={`${authStyles.input} ${authStyles.inputWithIcon} ${authStyles.inputWithToggle} ${fieldErrors.password ? authStyles.inputInvalid : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={authStyles.toggleBtn}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            {fieldErrors.password && (
              <span id="register-password-err" role="alert" className={authStyles.errorText}>
                {fieldErrors.password}
              </span>
            )}

            {password.length > 0 && (
              <div className={styles.strengthWrap} aria-live="polite">
                <div className={styles.strengthMeter}>
                  <div
                    className={`${styles.strengthBar} ${
                      strengthScore >= 1 ? styles.strengthBarActive : ''
                    }`}
                    style={{ backgroundColor: strengthScore >= 1 ? strengthColors[strengthScore] : undefined }}
                  />
                  <div
                    className={`${styles.strengthBar} ${
                      strengthScore >= 2 ? styles.strengthBarActive : ''
                    }`}
                    style={{ backgroundColor: strengthScore >= 2 ? strengthColors[strengthScore] : undefined }}
                  />
                  <div
                    className={`${styles.strengthBar} ${
                      strengthScore >= 3 ? styles.strengthBarActive : ''
                    }`}
                    style={{ backgroundColor: strengthScore >= 3 ? strengthColors[strengthScore] : undefined }}
                  />
                </div>
                <span className={styles.strengthLabel} style={{ color: strengthColors[strengthScore] }}>
                  {strengthLabels[strengthScore]}
                </span>
              </div>
            )}

          </div>

          <div className={authStyles.field}>
            <label htmlFor="register-confirmPassword" className={authStyles.label}>
              Confirm password
            </label>
            <div className={authStyles.inputWrap}>
              <Lock size={18} className={authStyles.inputIcon} aria-hidden="true" />
              <input
                id="register-confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-type your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? 'register-confirmPassword-err' : undefined}
                className={`${authStyles.input} ${authStyles.inputWithIcon} ${authStyles.inputWithToggle} ${fieldErrors.confirmPassword ? authStyles.inputInvalid : ''}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className={authStyles.toggleBtn}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <span id="register-confirmPassword-err" role="alert" className={authStyles.errorText}>
                {fieldErrors.confirmPassword}
              </span>
            )}
            {touched.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword && (
              <span className={styles.matchConfirmed}>
                <Check size={13} aria-hidden="true" /> Passwords match
              </span>
            )}
          </div>
        </div>

        <ul id="register-password-rules" className={`${authStyles.checklist} ${styles.rulesRow}`} aria-label="Password requirements">
          <li className={`${authStyles.checkItem} ${ruleMinLength ? authStyles.checkItemMet : ''}`}>
            {ruleMinLength ? <Check size={14} className={authStyles.checkIcon} /> : <span className={styles.bulletDot} />}
            <span>At least 8 characters</span>
          </li>
          <li className={`${authStyles.checkItem} ${ruleHasLetter ? authStyles.checkItemMet : ''}`}>
            {ruleHasLetter ? <Check size={14} className={authStyles.checkIcon} /> : <span className={styles.bulletDot} />}
            <span>At least one letter</span>
          </li>
          <li className={`${authStyles.checkItem} ${ruleHasNumber ? authStyles.checkItemMet : ''}`}>
            {ruleHasNumber ? <Check size={14} className={authStyles.checkIcon} /> : <span className={styles.bulletDot} />}
            <span>At least one number</span>
          </li>
        </ul>

        {role === 'farmer' && (
          <div className={authStyles.noticePanel}>
            <ShieldCheck size={20} className={styles.noticeIcon} aria-hidden="true" />
            <div>
              <strong>Stalls are verified before going live.</strong> You can set up your stall catalogue and pricing straight away. An administrator reviews it before your produce appears to customers.
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
        >
          {loading ? (
            <>
              <Loader2 size={18} className={styles.spinner} aria-hidden="true" />
              <span>Creating your account…</span>
            </>
          ) : (
            <>
              <span>Create {role === 'farmer' ? 'Stallholder' : 'Shopper'} Account</span>
              <ArrowRight size={18} className={styles.btnArrow} aria-hidden="true" />
            </>
          )}
        </button>

        <p className={styles.termsNote}>
          By registering, you agree to MarketLink's Community Guidelines and Privacy Policy.
        </p>
      </form>
    </AuthCard>
  );
}

export default Register;
