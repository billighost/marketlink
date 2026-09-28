import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Clock, Mail, Lock, ArrowRight, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import { useAuth, homePathFor } from '@/context/AuthContext';
import { resendVerification } from '@/api/auth';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import AuthCard from '@/components/guest/AuthCard';
import authStyles from '@/components/guest/AuthCard.module.css';
import styles from './Login.module.css';

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
  const { login, isAuthenticated, user, role: userRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [bannerError, setBannerError] = useState(null);
  const [isUnverified, setIsUnverified] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [signedOutMessage, setSignedOutMessage] = useState(() => {
    if (location.state?.message) return location.state.message;
    if (location.state?.signedOut) return 'You have been signed out successfully.';
    if (searchParams.get('reason') === 'signed_out' || searchParams.get('signed_out') === 'true') {
      return 'You have been signed out successfully.';
    }
    try {
      const sessionNotice = sessionStorage.getItem('marketlink_signed_out_notice');
      if (sessionNotice) {
        sessionStorage.removeItem('marketlink_signed_out_notice');
        return sessionNotice;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isSessionExpired, setIsSessionExpired] = useState(() => {
    if (location.state?.signedOut || location.state?.message || searchParams.get('reason') === 'signed_out') {
      try {
        sessionStorage.removeItem('marketlink_session_expired');
      } catch {
        // ignore
      }
      return false;
    }
    try {
      const isExpired =
        searchParams.get('reason') === 'expired' ||
        sessionStorage.getItem('marketlink_session_expired') === 'true';
      if (isExpired) {
        sessionStorage.removeItem('marketlink_session_expired');
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  });

  useEffect(() => {
    if (isAuthenticated) {
      const rawNext = searchParams.get('next') || searchParams.get('redirect') || location.state?.from?.pathname;
      const dest = safeNext(rawNext) || homePathFor(user?.role || userRole);
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, userRole, searchParams, location, navigate]);

  useEffect(() => {
    const qEmail = searchParams.get('email');
    if (qEmail) {
      setEmail(qEmail);
    }
  }, [searchParams]);

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
    setSignedOutMessage(null);
    setIsSessionExpired(false);

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
      const rawNext = searchParams.get('next') || searchParams.get('redirect') || location.state?.from?.pathname;
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
      split={true}
      activeTab="login"
      badge="Welcome Back"
      title="Sign in to MarketLink"
      lead="Access your pre-orders, favourite market stalls, and weekly basket."
      heroTitle="Fresh Saturday morning produce, reserved before stalls open."
      heroLead="Pre-order directly from certified local growers and collect easily at the market without rush or missing out."
      footer={
        <div className={styles.cardFooterContent}>
          <span>
            Don't have an account yet?{' '}
            <Link to={PATHS.REGISTER} className={authStyles.link}>
              Create one for free
            </Link>
          </span>
          <div className={styles.securityRow}>
            <ShieldCheck size={14} className={styles.securityIcon} aria-hidden="true" />
            <span>256-bit encrypted • Pay when collecting in person</span>
          </div>
        </div>
      }
    >
      {signedOutMessage && (
        <div role="status" className={authStyles.bannerSuccess}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} aria-hidden="true" />
            <p style={{ margin: 0 }}>{signedOutMessage}</p>
          </div>
        </div>
      )}

      {!signedOutMessage && isSessionExpired && (
        <div role="status" className={authStyles.bannerSuccess}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} aria-hidden="true" />
            <p style={{ margin: 0 }}>Your session has expired. Please sign in to resume where you left off.</p>
          </div>
        </div>
      )}

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

      {resendStatus && (
        <div role="status" className={authStyles.bannerSuccess}>
          <p>{resendStatus}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className={authStyles.form}>
        
        <div className={authStyles.field}>
          <label htmlFor="login-email" className={authStyles.label}>
            Email address
          </label>
          <div className={authStyles.inputWrap}>
            <Mail size={18} className={authStyles.inputIcon} aria-hidden="true" />
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              className={`${authStyles.input} ${authStyles.inputWithIcon} ${fieldErrors.email ? authStyles.inputInvalid : ''}`}
              required
            />
          </div>
          {fieldErrors.email && (
            <span id="login-email-error" role="alert" className={authStyles.errorText}>
              {fieldErrors.email}
            </span>
          )}
        </div>

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
            <Lock size={18} className={authStyles.inputIcon} aria-hidden="true" />
            <input
              ref={passwordRef}
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
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
            <span id="login-password-error" role="alert" className={authStyles.errorText}>
              {fieldErrors.password}
            </span>
          )}
        </div>

        <div className={styles.optionsRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className={styles.checkboxInput}
            />
            <span>Remember me on this browser</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
        >
          {loading ? (
            <>
              <Loader2 size={18} className={styles.spinner} aria-hidden="true" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign in to MarketLink</span>
              <ArrowRight size={18} className={styles.btnArrow} aria-hidden="true" />
            </>
          )}
        </button>

        <div className={styles.perksRow}>
          <div className={styles.perkChip}>
            <CheckCircle2 size={14} className={styles.perkIcon} aria-hidden="true" />
            <span>Fast Stall Pickup</span>
          </div>
          <div className={styles.perkChip}>
            <CheckCircle2 size={14} className={styles.perkIcon} aria-hidden="true" />
            <span>Direct Farmer Chat</span>
          </div>
          <div className={styles.perkChip}>
            <CheckCircle2 size={14} className={styles.perkIcon} aria-hidden="true" />
            <span>No Hidden Fees</span>
          </div>
        </div>
      </form>
    </AuthCard>
  );
}

export default Login;
