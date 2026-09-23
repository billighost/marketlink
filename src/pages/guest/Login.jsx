import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Illustration from '@/components/domain/Illustration';
import styles from './Login.module.css';

/**
 * Login page with real client-side validation, password visibility toggle,
 * and temporary persona switcher for team review.
 */
export function Login() {
  useDocumentTitle('Sign In · MarketLink');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      newErrors.email = 'Please enter your email.';
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      newErrors.password = 'Please enter your password.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (validationErrors.email) {
        emailRef.current?.focus();
      } else if (validationErrors.password) {
        passwordRef.current?.focus();
      }
      return;
    }

    // Front-end only: log credentials and show demo notice or switch to Customer
    console.log('Login attempt:', formData);
    // For demonstration, default to buyer role on valid form submission
    login('buyer');
    navigate(PATHS.BUYER);
  };

  // TEMP: replace when backend is ready
  const handleRolePreview = (role, path) => {
    login(role);
    navigate(path);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <PageHeader
          title="Welcome back"
          subtitle="Sign in to see this week's market."
          backTo={PATHS.HOME}
          backLabel="Home"
          className={styles.header}
        />

        <Card className={styles.card}>
          {/* Header Illustration */}
          <div className={styles.iconCircle} aria-hidden="true">
            <Illustration name="leaves" size="md" />
          </div>

          {/* Error alert banner */}
          {loginError && (
            <div role="alert" className={styles.alertBanner}>
              <AlertCircle size={18} strokeWidth={1.5} className={styles.alertIcon} aria-hidden="true" />
              <span>That email or password doesn't look right. Please try again.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className={styles.form}>
            <FormField
              ref={emailRef}
              label="Email"
              id="login-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
              required
            />

            <div className={styles.passwordFieldWrapper}>
              <FormField
                ref={passwordRef}
                label="Password"
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                autoComplete="current-password"
                required
                rightAccessory={
                  <button
                    type="button"
                    className={styles.togglePasswordButton}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                }
              />
              <div className={styles.forgotPasswordRow}>
                <Link to={PATHS.FORGOT_PASSWORD} className={styles.forgotLink}>
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div className={styles.submitRow}>
              <Button type="submit" variant="primary" size="md" className={styles.signInButton}>
                Sign in
              </Button>
            </div>

            <p className={styles.registerPrompt}>
              New to MarketLink?{' '}
              <Link to={PATHS.REGISTER} className={styles.registerLink}>
                Create an account
              </Link>
            </p>
          </form>

          {/* ---------------- TEMP PREVIEW PANEL ---------------- */}
          {/* TEMP: replace when backend is ready */}
          <div className={styles.tempDivider} />

          <div className={styles.tempSection}>
            <h2 className={styles.tempTitle}>Preview the app</h2>
            <p className={styles.tempHelper}>
              Temporary, for the team to see each area.
            </p>
            <div className={styles.tempButtons}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleRolePreview('buyer', PATHS.BUYER)}
                className={styles.tempBtn}
              >
                Continue as Customer
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleRolePreview('vendor', PATHS.VENDOR)}
                className={styles.tempBtn}
              >
                Continue as Farmer
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleRolePreview('admin', PATHS.ADMIN)}
                className={styles.tempBtn}
              >
                Continue as Admin
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Login;
