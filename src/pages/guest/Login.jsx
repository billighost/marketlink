import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import { useAuth, homePathFor } from '@/context/AuthContext';
import { resendVerification } from '@/api/auth';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import AuthCard from '@/components/guest/AuthCard';
import authStyles from '@/components/guest/AuthCard.module.css';
import styles from './Login.module.css';

/**
 * Validates redirect destination to prevent open-redirect vulnerabilities.
 * Only same-origin relative paths starting with a single '/' are accepted.
 */
export const safeNext = (raw) => {
  if (!raw) return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
};

export function Login() {
  useDocumentTitle('Sign In — MarketLink');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  // Field errors: validate on blur
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Page-level alerts
  const [bannerError, setBannerError] = useState(null);
  const [isUnverified, setIsUnverified] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      const rawNext = searchParams.get('next') || location.state?.from?.pathname;
      const dest = safeNext(rawNext) || homePathFor(user?.role);
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, searchParams, location, navigate]);

  const validateField = (name, val) => {
    if (name === 'email') {
      const trimmed = val.trim();
      if (!trimmed) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address.';
    }
    if (name === 'password') {
      if (!val) return 'Password is required.';
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
    if (name === 'email') {
      setEmail(value);
      setIsUnverified(false);
      setResendStatus(null);
    }
    if (name === 'password') setPassword(value);
    if (bannerError) setBannerError(null);
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBannerError(null);
    setIsUnverified(false);
    setResendStatus(null);

    const emailErr = validateField('email', email);
    const passwordErr = validateField('password', password);
    if (emailErr || passwordErr) {
      setFieldErrors({ email: emailErr, password: passwordErr });
      setTouched({ email: true, password: true });
      if (emailErr) emailRef.current?.focus();
      else if (passwordErr) passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      const role = data?.user?.role;
      const rawNext = searchParams.get('next') || location.state?.from?.pathname;
      const dest = safeNext(rawNext) || homePathFor(role);
      navigate(dest, { replace: true });
    } catch (err) {
      if (err.code === 'TOO_MANY_ATTEMPTS' || err.statusCode === 429) {
        setBannerError(
          err.message || 'Account is temporarily locked due to too many failed sign-in attempts. Please try again in 15 minutes.'
        );
      } else if (err.code === 'ACCOUNT_INACTIVE') {
        setBannerError(err.message || 'Your Customer account is currently inactive. Please contact support for help.');
      } else if (err.code === 'ACCOUNT_SUSPENDED') {
        setBannerError(err.message || 'Your Farmer account has been suspended or rejected. Please contact support.');
      } else if (err.code === 'UNVERIFIED_EMAIL' || err.message?.toLowerCase().includes('verify your email')) {
        setIsUnverified(true);
        setBannerError('Verify your email to sign in.');
      } else if (err.code === 'INVALID_CREDENTIALS') {
        setBannerError("That email or password doesn't look right.");
        setPassword('');
        passwordRef.current?.focus();
      } else if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network')) {
        setBannerError('Cannot reach MarketLink. Check your connection.');
      } else {
        setBannerError(err.message || "That email or password doesn't look right.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resending) return;
    setResending(true);
    try {
      const res = await resendVerification(email.trim());
      setResendStatus(res?.message || "If an unverified account with that email exists, we've sent a new verification link.");
    } catch (err) {
      setResendStatus(err.message || 'Unable to resend verification email right now.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      lead="Sign in to reserve at the market."
      footer={
        <span>
          New here?{' '}
          <Link to={PATHS.REGISTER} className={authStyles.link}>
            Create an account
          </Link>
        </span>
      }
    >
      {/* Alert banner for page-level errors */}
      {bannerError && (
        <div role="alert" className={authStyles.bannerError}>
          <p>{bannerError}</p>
          {isUnverified && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className={styles.resendBtn}
            >
              {resending ? 'Sending link…' : 'Resend verification email'}
            </button>
          )}
        </div>
      )}

      {/* Resend success notice */}
      {resendStatus && (
        <div role="status" className={authStyles.bannerSuccess}>
          <p>{resendStatus}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className={authStyles.form}>
        {/* Email field */}
        <div className={authStyles.field}>
          <label htmlFor="login-email" className={authStyles.label}>
            Email
          </label>
          <input
            ref={emailRef}
            id="login-email"
            type="email"
            name="email"
            value={email}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
            className={`${authStyles.input} ${fieldErrors.email ? authStyles.inputInvalid : ''}`}
            required
          />
          {fieldErrors.email && (
            <span id="login-email-error" role="alert" className={authStyles.errorText}>
              {fieldErrors.email}
            </span>
          )}
        </div>

        {/* Password field */}
        <div className={authStyles.field}>
          <div className={authStyles.labelRow}>
            <label htmlFor="login-password" className={authStyles.label}>
              Password
            </label>
            <Link to={PATHS.FORGOT_PASSWORD} className={authStyles.link}>
              Forgot password?
            </Link>
          </div>
          <div className={authStyles.inputWrap}>
            <input
              ref={passwordRef}
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
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
            <span id="login-password-error" role="alert" className={authStyles.errorText}>
              {fieldErrors.password}
            </span>
          )}
        </div>

        {/* Submit button — the ONE beet element */}
        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthCard>
  );
}

export default Login;
