import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Check } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import { resetPassword } from '@/api/auth';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import AuthCard from '@/components/guest/AuthCard';
import authStyles from '@/components/guest/AuthCard.module.css';
import styles from './ResetPassword.module.css';

export function ResetPassword() {
  useDocumentTitle('Reset Password — MarketLink');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpiredToken, setIsExpiredToken] = useState(false);
  const [bannerError, setBannerError] = useState(null);

  // Live password checklist rules
  const ruleMinLength = password.length >= 8;
  const ruleHasLetter = /[a-zA-Z]/.test(password);
  const ruleHasNumber = /[0-9]/.test(password);

  // 1. If NO token is provided in the query string
  if (!token) {
    return (
      <AuthCard
        title="Invalid reset link"
        lead="No password reset token was provided."
        footer={
          <Link to={PATHS.FORGOT_PASSWORD} className={authStyles.link}>
            Request a new reset link
          </Link>
        }
      >
        <div role="alert" className={authStyles.bannerError}>
          <p>This password reset link is invalid or incomplete. Please request a new link to reset your password.</p>
        </div>
      </AuthCard>
    );
  }

  // 2. If password reset succeeded
  if (isSuccess) {
    return (
      <AuthCard
        title="Password updated"
        lead="Your password has been successfully reset."
        footer={
          <Link to={PATHS.LOGIN} className={authStyles.link}>
            Sign in with your new password
          </Link>
        }
      >
        <div role="status" className={authStyles.bannerSuccess}>
          <p>Please sign in with your new password to access your account.</p>
        </div>
      </AuthCard>
    );
  }

  const validateField = (name, val) => {
    if (name === 'password') {
      if (!val) return 'Password is required.';
      if (val.length < 8) return 'Password must be at least 8 characters long.';
      if (!/[a-zA-Z]/.test(val) || !/[0-9]/.test(val)) {
        return 'Password must contain at least one letter and one number.';
      }
    }
    if (name === 'confirmPassword') {
      if (!val) return 'Please confirm your password.';
      if (val !== password) return 'Passwords do not match.';
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
    if (name === 'password') {
      setPassword(value);
      if (touched.confirmPassword && confirmPassword) {
        if (value !== confirmPassword) {
          setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
        } else {
          setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
        }
      }
    }
    if (name === 'confirmPassword') setConfirmPassword(value);
    if (bannerError) setBannerError(null);
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBannerError(null);
    setIsExpiredToken(false);

    const passErr = validateField('password', password);
    const confirmErr = validateField('confirmPassword', confirmPassword);
    if (passErr || confirmErr) {
      setFieldErrors({ password: passErr, confirmPassword: confirmErr });
      setTouched({ password: true, confirmPassword: true });
      if (passErr) document.getElementById('reset-password')?.focus();
      else if (confirmErr) document.getElementById('reset-confirmPassword')?.focus();
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, newPassword: password });
      setIsSuccess(true);
    } catch (err) {
      if (
        err.code === 'INVALID_RESET_TOKEN' ||
        err.statusCode === 400 ||
        err.message?.toLowerCase().includes('expired') ||
        err.message?.toLowerCase().includes('already used')
      ) {
        setIsExpiredToken(true);
        setBannerError('That reset link has expired. Request a new one.');
      } else if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('network')) {
        setBannerError('Cannot reach MarketLink. Check your connection.');
      } else {
        setBannerError(err.message || 'Unable to reset password. Please request a new link.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create new password"
      lead="Your new password must be at least 8 characters long."
      footer={
        <Link to={PATHS.LOGIN} className={authStyles.link}>
          Back to sign in
        </Link>
      }
    >
      {/* Banner error */}
      {bannerError && (
        <div role="alert" className={authStyles.bannerError}>
          <p>{bannerError}</p>
          {isExpiredToken && (
            <Link to={PATHS.FORGOT_PASSWORD} className={styles.expiredLink}>
              Request a new reset link
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className={authStyles.form}>
        {/* New Password */}
        <div className={authStyles.field}>
          <label htmlFor="reset-password" className={authStyles.label}>
            New password
          </label>
          <div className={authStyles.inputWrap}>
            <input
              id="reset-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'reset-password-err' : 'reset-password-rules'}
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
            <span id="reset-password-err" role="alert" className={authStyles.errorText}>
              {fieldErrors.password}
            </span>
          )}

          {/* Live checklist */}
          <ul id="reset-password-rules" className={authStyles.checklist} aria-label="Password requirements">
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

        {/* Confirm New Password */}
        <div className={authStyles.field}>
          <label htmlFor="reset-confirmPassword" className={authStyles.label}>
            Confirm new password
          </label>
          <div className={authStyles.inputWrap}>
            <input
              id="reset-confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? 'reset-confirmPassword-err' : undefined}
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
            <span id="reset-confirmPassword-err" role="alert" className={authStyles.errorText}>
              {fieldErrors.confirmPassword}
            </span>
          )}
        </div>

        {/* Submit button — the ONE beet element on the page */}
        <button
          type="submit"
          disabled={loading}
          className={styles.submitBtn}
        >
          {loading ? 'Resetting password…' : 'Reset password'}
        </button>
      </form>
    </AuthCard>
  );
}

export default ResetPassword;
