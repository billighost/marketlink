import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Store,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import { demoUsers } from '@/data/placeholders';
import MarketLinkLogo from '@/components/ui/MarketLinkLogo';
import styles from './Login.module.css';

export function Login() {
  useDocumentTitle('Sign In — MarketLink');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (loginError) {
      setLoginError(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      newErrors.password = 'Please enter your password.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    return newErrors;
  };

  const redirectByRole = (role) => {
    if (role === 'buyer') navigate(PATHS.BUYER);
    else if (role === 'vendor') navigate(PATHS.VENDOR);
    else if (role === 'admin') navigate(PATHS.ADMIN);
    else navigate(PATHS.BUYER);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.email) emailRef.current?.focus();
      else if (validationErrors.password) passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const allUsers = Object.values(demoUsers);
      const matchedUser = allUsers.find(
        (u) =>
          u.email.toLowerCase() === formData.email.trim().toLowerCase() &&
          u.password === formData.password
      );

      if (matchedUser) {
        login(matchedUser);
        redirectByRole(matchedUser.role);
      } else {
        setLoginError(true);
        emailRef.current?.focus();
      }
    }, 400);
  };

  const handleQuickDemo = (demoUser) => {
    setFormData({
      email: demoUser.email,
      password: demoUser.password,
      rememberMe: true,
    });
    login(demoUser);
    redirectByRole(demoUser.role);
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
            {loginError && (
              <div role="alert" className={styles.alertBanner}>
                <AlertCircle size={18} className={styles.alertIcon} />
                <div>
                  <strong>Invalid credentials</strong>
                  <p>The email or password didn't match our records. Please try again or use a demo account below.</p>
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
                <div className={`${styles.inputWrapper} ${errors.email ? styles.inputError : ''}`}>
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
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
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
                <div className={`${styles.inputWrapper} ${errors.password ? styles.inputError : ''}`}>
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
                {errors.password && <span className={styles.errorText}>{errors.password}</span>}
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
                  <span>Remember me for 30 days</span>
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

            {/* Quick Demo Personas (Helpful for test/review) */}
            <div className={styles.quickDemoSection}>
              <div className={styles.demoDivider}>
                <span>or quick sign-in with demo account</span>
              </div>

              <div className={styles.demoButtonsRow}>
                <button
                  type="button"
                  onClick={() => handleQuickDemo(demoUsers.customer)}
                  className={styles.demoPillBtn}
                  title="Sign in as customer George Adams"
                >
                  <User size={13} />
                  <span>Buyer: George</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo(demoUsers.farmer)}
                  className={styles.demoPillBtn}
                  title="Sign in as producer Anna Kowalski"
                >
                  <Store size={13} />
                  <span>Farmer: Anna</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo(demoUsers.admin)}
                  className={styles.demoPillBtn}
                  title="Sign in as admin Sam Torres"
                >
                  <ShieldCheck size={13} />
                  <span>Admin: Sam</span>
                </button>
              </div>
            </div>

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
