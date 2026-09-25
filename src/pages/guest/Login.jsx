import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { useAuth, homePathFor } from '@/context/AuthContext';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import styles from './Login.module.css';

export function Login() {
  useDocumentTitle('Sign In — MarketLink');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      errs.password = 'Please enter your password.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    const clientValidationErrors = validate();
    if (Object.keys(clientValidationErrors).length > 0) {
      setFieldErrors(clientValidationErrors);
      if (clientValidationErrors.email) emailRef.current?.focus();
      else if (clientValidationErrors.password) passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const data = await login(formData.email.trim(), formData.password);
      const role = data?.user?.role;
      const targetFrom = location.state?.from?.pathname;
      const destination = targetFrom && targetFrom !== PATHS.LOGIN && targetFrom !== PATHS.UNAUTHORIZED
        ? targetFrom
        : homePathFor(role);

      navigate(destination, { replace: true });
    } catch (err) {
      if (err.code === 'TOO_MANY_ATTEMPTS') {
        setErrorMessage('Too many failed sign-in attempts. Your account is temporarily locked for 15 minutes.');
      } else if (err.code === 'ACCOUNT_INACTIVE') {
        setErrorMessage('Your Customer account is currently inactive. Please reach out via our contact page to reactivate.');
      } else if (err.code === 'ACCOUNT_SUSPENDED') {
        setErrorMessage('Your Farmer account is currently suspended. Please contact market administration.');
      } else if (err.code === 'INVALID_CREDENTIALS') {
        setErrorMessage("That email or password doesn't look right. Please check your credentials and try again.");
        passwordRef.current?.focus();
      } else if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        const mapped = {};
        for (const d of err.details) {
          if (d.field) mapped[d.field] = d.message;
        }
        setFieldErrors(mapped);
        if (mapped.email) emailRef.current?.focus();
        else if (mapped.password) passwordRef.current?.focus();
      } else {
        setErrorMessage(err.message || 'Unable to sign in. Please verify your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        {/* ── LEFT SHOWCASE PANEL ── */}
        <div className={styles.showcasePanel}>
          <img
            src="/images/market-morning.jpg"
            alt="Morning at the farmers market"
            className={styles.showcaseBgImg}
          />
          <div className={styles.showcaseOverlay}>
            <div className={styles.showcaseTop}>
              <div className={styles.showcaseLogoWrap}>
                <MarketLinkLogo size="md" />
              </div>
              <span className={styles.showcaseBadge}>
                <Sparkles size={13} />
                Producer-Only Network
              </span>
            </div>

            <div className={styles.showcaseQuoteBlock}>
              <blockquote className={styles.showcaseQuote}>
                “The closest connection to your food is looking the grower in the eye across a crate
                of fresh harvest.”
              </blockquote>
              <span className={styles.showcaseAuthor}>— Elena Vance, Riverbend Farm</span>

              <div className={styles.showcasePoints}>
                <div className={styles.showcasePoint}>
                  <CheckCircle2 size={16} className={styles.pointCheck} />
                  <span>Reserve Saturday harvest by Friday 6 PM</span>
                </div>
                <div className={styles.showcasePoint}>
                  <CheckCircle2 size={16} className={styles.pointCheck} />
                  <span>Support 40+ certified regional family growers</span>
                </div>
                <div className={styles.showcasePoint}>
                  <CheckCircle2 size={16} className={styles.pointCheck} />
                  <span>0% middleman fees · Pay directly at pickup</span>
                </div>
              </div>
            </div>

            <div className={styles.showcaseFooter}>
              <div className={styles.trustMetric}>
                <strong>14,000+</strong>
                <span>Saturday baskets fulfilled</span>
              </div>
              <div className={styles.trustMetric}>
                <strong>100%</strong>
                <span>Direct farm takings</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIGN-IN FORM PANEL ── */}
        <div className={styles.formPanel}>
          <div className={styles.formInner}>
            {/* Back to Home Link */}
            <Link to={PATHS.HOME} className={styles.backHomeLink}>
              <ArrowLeft size={14} />
              <span>Back to home</span>
            </Link>

            {/* Header */}
            <div className={styles.formHeader}>
              <span className={styles.formKicker}>Sign In to MarketLink</span>
              <h1 className={styles.formTitle}>Welcome back to the market</h1>
              <p className={styles.formSubtitle}>
                Access your Saturday pre-orders, saved regional stalls, and weekly harvest manifests.
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div role="alert" className={styles.alertBanner}>
                <AlertCircle size={18} className={styles.alertIcon} />
                <div>
                  <strong>Sign in error</strong>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className={styles.loginForm}>
              {/* Email Input */}
              <div className={styles.fieldGroup}>
                <label htmlFor="login-email" className={styles.fieldLabel}>
                  Email address
                </label>
                <div className={`${styles.inputWrapper} ${fieldErrors.email ? styles.inputError : ''}`}>
                  <Mail size={16} className={styles.fieldIcon} />
                  <input
                    ref={emailRef}
                    id="login-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className={styles.textInput}
                    required
                  />
                </div>
                {fieldErrors.email && <span className={styles.errorText}>{fieldErrors.email}</span>}
              </div>

              {/* Password Input */}
              <div className={styles.fieldGroup}>
                <div className={styles.passwordLabelRow}>
                  <label htmlFor="login-password" className={styles.fieldLabel}>
                    Password
                  </label>
                  <Link to={PATHS.FORGOT_PASSWORD} className={styles.forgotLink}>
                    Forgot password?
                  </Link>
                </div>
                <div className={`${styles.inputWrapper} ${fieldErrors.password ? styles.inputError : ''}`}>
                  <Lock size={16} className={styles.fieldIcon} />
                  <input
                    ref={passwordRef}
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={styles.textInput}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.togglePasswordBtn}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErrors.password && <span className={styles.errorText}>{fieldErrors.password}</span>}
              </div>

              {/* Remember Me Checkbox */}
              <div className={styles.rememberRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className={styles.checkboxInput}
                  />
                  <span>Remember me on this browser</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to MarketLink</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className={styles.registerFooter}>
              <p>
                Don't have a MarketLink account yet?{' '}
                <Link to={PATHS.REGISTER} className={styles.registerLink}>
                  Create your free account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
