import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import { forgotPassword } from '@/api/auth';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import AuthCard from '@/components/guest/AuthCard';
import authStyles from '@/components/guest/AuthCard.module.css';
import styles from './ForgotPassword.module.css';

export function ForgotPassword() {
  useDocumentTitle('Forgot Password — MarketLink');

  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bannerError, setBannerError] = useState(null);

  // 60-second cooldown timer for resend
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  const validateEmail = (val) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address.';
    return '';
  };

  const handleBlur = () => {
    setTouched(true);
    setFieldError(validateEmail(email));
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (bannerError) setBannerError(null);
    if (fieldError) setFieldError('');
  };

  const doSendReset = async () => {
    const err = validateEmail(email);
    if (err) {
      setFieldError(err);
      setTouched(true);
      document.getElementById('forgot-email')?.focus();
      return;
    }

    setLoading(true);
    setBannerError(null);
    try {
      await forgotPassword(email.trim());
      // Regardless of server response, always show identical confirmation to prevent account enumeration
      setSubmitted(true);
      setCooldown(60);
    } catch (apiErr) {
      if (apiErr.code === 'RATE_LIMITED' || apiErr.statusCode === 429) {
        setBannerError(
          apiErr.message || 'Too many password reset requests. Please check your inbox or try again in an hour.'
        );
      } else if (apiErr.name === 'TypeError' || apiErr.message?.includes('fetch') || apiErr.message?.includes('network')) {
        setBannerError('Cannot reach MarketLink. Check your connection.');
      } else {
        // Fallback neutral submission even if error wasn't rate limit or network
        setSubmitted(true);
        setCooldown(60);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSendReset();
  };

  return (
    <AuthCard
      title="Forgot password"
      lead="Enter your email to receive password reset instructions."
      footer={
        <Link to={PATHS.LOGIN} className={authStyles.link}>
          Back to sign in
        </Link>
      }
    >
      {/* Banner error for rate limits or network issues */}
      {bannerError && (
        <div role="alert" className={authStyles.bannerError}>
          <p>{bannerError}</p>
        </div>
      )}

      {submitted ? (
        <div className={styles.confirmationWrap}>
          {/* Neutral confirmation — never leaks whether email is registered */}
          <div role="status" className={authStyles.bannerSuccess}>
            <p>If that email is registered, we have sent a reset link.</p>
          </div>

          <p className={styles.confirmSubtext}>
            Please check your inbox and spam folder. The link will expire in 1 hour.
          </p>

          <div className={styles.resendRow}>
            <button
              type="button"
              onClick={doSendReset}
              disabled={loading || cooldown > 0}
              className={styles.resendBtn}
            >
              {cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend reset link'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className={authStyles.form}>
          <div className={authStyles.field}>
            <label htmlFor="forgot-email" className={authStyles.label}>
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? 'forgot-email-error' : undefined}
              className={`${authStyles.input} ${fieldError ? authStyles.inputInvalid : ''}`}
              required
            />
            {fieldError && (
              <span id="forgot-email-error" role="alert" className={authStyles.errorText}>
                {fieldError}
              </span>
            )}
          </div>

          {/* Submit button — the ONE beet element on the page */}
          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? 'Sending link…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}

export default ForgotPassword;
