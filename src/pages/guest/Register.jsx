import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import { useAuth, homePathFor } from '@/context/AuthContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import AuthCard from '@/components/guest/AuthCard';
import authStyles from '@/components/guest/AuthCard.module.css';
import styles from './Register.module.css';

export function Register() {
  useDocumentTitle('Create Account — MarketLink');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { register, isAuthenticated, user } = useAuth();

  // Role: preselected from query param ?role=farmer, default 'customer'
  const roleFromUrl = searchParams.get('role') === 'farmer' ? 'farmer' : 'customer';
  const [role, setRole] = useState(roleFromUrl);

  // Sync role changes to URL
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

  // Form states
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

  // Password rules
  const password = formData.password;
  const ruleMinLength = password.length >= 8;
  const ruleHasLetter = /[a-zA-Z]/.test(password);
  const ruleHasNumber = /[0-9]/.test(password);

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

    // Validate all fields
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

  return (
    <AuthCard
      title="Create your account"
      lead={role === 'customer' ? 'Sign up to reserve Saturday produce at the market.' : 'Sign up to list produce and receive market pre-orders.'}
      wide={true}
      footer={
        <span>
          Already have an account?{' '}
          <Link to={PATHS.LOGIN} className={authStyles.link}>
            Sign in
          </Link>
        </span>
      }
    >
      {/* Role selector first: real radio group */}
      <fieldset className={styles.roleFieldset}>
        <legend className="srOnly">Choose account type</legend>
        <div role="radiogroup" aria-label="Account type" className={styles.roleGrid}>
          {/* Customer Option */}
          <label className={`${styles.roleCard} ${role === 'customer' ? styles.roleCardActive : ''}`}>
            <input
              type="radio"
              name="accountRole"
              value="customer"
              checked={role === 'customer'}
              onChange={() => handleRoleChange('customer')}
              className={styles.roleRadio}
            />
            <div className={styles.roleContent}>
              <span className={styles.roleTitle}>I am shopping</span>
              <span className={styles.roleDesc}>Reserve produce and collect it at the stall.</span>
            </div>
          </label>

          {/* Farmer Option */}
          <label className={`${styles.roleCard} ${role === 'farmer' ? styles.roleCardActive : ''}`}>
            <input
              type="radio"
              name="accountRole"
              value="farmer"
              checked={role === 'farmer'}
              onChange={() => handleRoleChange('farmer')}
              className={styles.roleRadio}
            />
            <div className={styles.roleContent}>
              <span className={styles.roleTitle}>I sell at a market</span>
              <span className={styles.roleDesc}>List stock and take pre-orders.</span>
            </div>
          </label>
        </div>
      </fieldset>

      {/* Banner error */}
      {bannerError && (
        <div role="alert" className={authStyles.bannerError}>
          <p>{bannerError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className={authStyles.form}>
        {/* Section Heading: Identity */}
        <h2 className={styles.sectionHeading}>
          {role === 'customer' ? 'About you' : 'Your stall'}
        </h2>

        <div className={styles.twoCol}>
          {role === 'customer' ? (
            <div className={authStyles.field}>
              <label htmlFor="register-name" className={authStyles.label}>
                Full name
              </label>
              <input
                id="register-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="name"
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'register-name-err' : undefined}
                className={`${authStyles.input} ${fieldErrors.name ? authStyles.inputInvalid : ''}`}
                required
              />
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
                  Stall / business name
                </label>
                <input
                  id="register-stallName"
                  name="stallName"
                  type="text"
                  value={formData.stallName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="organization"
                  aria-invalid={Boolean(fieldErrors.stallName)}
                  aria-describedby={fieldErrors.stallName ? 'register-stallName-err' : undefined}
                  className={`${authStyles.input} ${fieldErrors.stallName ? authStyles.inputInvalid : ''}`}
                  required
                />
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
                <input
                  id="register-contactPerson"
                  name="contactPerson"
                  type="text"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.contactPerson)}
                  aria-describedby={fieldErrors.contactPerson ? 'register-contactPerson-err' : undefined}
                  className={`${authStyles.input} ${fieldErrors.contactPerson ? authStyles.inputInvalid : ''}`}
                  required
                />
                {fieldErrors.contactPerson && (
                  <span id="register-contactPerson-err" role="alert" className={authStyles.errorText}>
                    {fieldErrors.contactPerson}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Email field */}
          <div className={authStyles.field}>
            <label htmlFor="register-email" className={authStyles.label}>
              Email
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'register-email-err' : undefined}
              className={`${authStyles.input} ${fieldErrors.email ? authStyles.inputInvalid : ''}`}
              required
            />
            {fieldErrors.email && (
              <span id="register-email-err" role="alert" className={authStyles.errorText}>
                {fieldErrors.email}{' '}
                {fieldErrors.email.includes('already exists') && (
                  <Link to={`${PATHS.LOGIN}?email=${encodeURIComponent(formData.email)}`} className={authStyles.link}>
                    Sign in instead
                  </Link>
                )}
              </span>
            )}
          </div>

          {/* Contact number */}
          <div className={authStyles.field}>
            <label htmlFor="register-phone" className={authStyles.label}>
              Contact number
            </label>
            <input
              id="register-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="tel"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'register-phone-err' : undefined}
              className={`${authStyles.input} ${fieldErrors.phone ? authStyles.inputInvalid : ''}`}
              required
            />
            {fieldErrors.phone && (
              <span id="register-phone-err" role="alert" className={authStyles.errorText}>
                {fieldErrors.phone}
              </span>
            )}
          </div>
        </div>

        {/* Address field (full width in 2-col layout) */}
        <div className={authStyles.field}>
          <label htmlFor="register-address" className={authStyles.label}>
            Address
          </label>
          <input
            id="register-address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="street-address"
            aria-invalid={Boolean(fieldErrors.address)}
            aria-describedby={fieldErrors.address ? 'register-address-err' : undefined}
            className={`${authStyles.input} ${fieldErrors.address ? authStyles.inputInvalid : ''}`}
            required
          />
          {fieldErrors.address && (
            <span id="register-address-err" role="alert" className={authStyles.errorText}>
              {fieldErrors.address}
            </span>
          )}
        </div>

        {/* Section Heading: Security */}
        <h2 className={styles.sectionHeading}>Security</h2>

        <div className={styles.twoCol}>
          {/* Password */}
          <div className={authStyles.field}>
            <label htmlFor="register-password" className={authStyles.label}>
              Password
            </label>
            <div className={authStyles.inputWrap}>
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'register-password-err' : 'register-password-rules'}
                className={`${authStyles.input} ${authStyles.inputWithToggle} ${fieldErrors.password ? authStyles.inputInvalid : ''}`}
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

            {/* Live password rule checklist */}
            <ul id="register-password-rules" className={authStyles.checklist} aria-label="Password requirements">
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
          </div>

          {/* Confirm Password */}
          <div className={authStyles.field}>
            <label htmlFor="register-confirmPassword" className={authStyles.label}>
              Confirm password
            </label>
            <div className={authStyles.inputWrap}>
              <input
                id="register-confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? 'register-confirmPassword-err' : undefined}
                className={`${authStyles.input} ${authStyles.inputWithToggle} ${fieldErrors.confirmPassword ? authStyles.inputInvalid : ''}`}
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
          </div>
        </div>

        {/* Farmer approval notice directly above submit */}
        {role === 'farmer' && (
          <div className={authStyles.noticePanel}>
            <strong>Stalls are reviewed before they go live.</strong> You can set up your stall straight away. An
            administrator approves it before your produce appears to customers.
          </div>
        )}

        {/* Submit button — the ONE beet element */}
        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  );
}

export default Register;
