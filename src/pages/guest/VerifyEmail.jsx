import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import { verifyEmail, resendVerification } from '@/api/auth';
import { useAuth, homePathFor } from '@/context/AuthContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import AuthCard from '@/components/guest/AuthCard';
import authStyles from '@/components/guest/AuthCard.module.css';
import styles from './VerifyEmail.module.css';

export function VerifyEmail() {
  useDocumentTitle('Verify Email — MarketLink');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, user } = useAuth();

  // States: 'idle' | 'verifying' | 'success' | 'expired' | 'no-token'
  const [state, setState] = useState(token ? 'verifying' : 'no-token');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState(null);
  const [resendError, setResendError] = useState('');

  // Latch for React StrictMode so verification token is only consumed once
  const fired = useRef(false);

  useEffect(() => {
    if (!token) {
      setState('no-token');
      return;
    }

    if (fired.current) return;
    fired.current = true;

    async function executeVerification() {
      setState('verifying');
      try {
        const res = await verifyEmail(token);
        // Both fresh verification and alreadyVerified are treated as success
        setState('success');
      } catch (err) {
        if (
          err.code === 'ALREADY_VERIFIED' ||
          err.message?.toLowerCase().includes('already verified')
        ) {
          setState('success');
        } else if (
          err.code === 'INVALID_VERIFICATION_TOKEN' ||
          err.statusCode === 422 ||
          err.statusCode === 400 ||
          err.message?.toLowerCase().includes('expired') ||
          err.message?.toLowerCase().includes('invalid')
        ) {
          setState('expired');
        } else {
          setState('expired');
        }
      }
    }

    executeVerification();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    const trimmed = resendEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setResendError('Please enter a valid email address.');
      return;
    }

    setResending(true);
    setResendNotice(null);
    setResendError('');
    try {
      const res = await resendVerification(trimmed);
      setResendNotice(res?.message || "If an unverified account with that email exists, we've sent a new verification link.");
    } catch (err) {
      setResendError(err.message || 'Unable to send verification email right now.');
    } finally {
      setResending(false);
    }
  };

  const nextDestination = isAuthenticated ? homePathFor(user?.role) : PATHS.LOGIN;
  const nextLabel = isAuthenticated ? 'Continue to your dashboard' : 'Sign in to your account';

  // 1. Verifying State
  if (state === 'verifying') {
    return (
      <AuthCard title="Verifying email" lead="Checking your confirmation link…">
        <div className={styles.centerState}>
          <Loader2 size={32} className={styles.spinner} aria-hidden="true" />
          <p className={styles.stateText}>Verifying your email…</p>
        </div>
      </AuthCard>
    );
  }

  // 2. Success State (and Already Verified)
  if (state === 'success') {
    return (
      <AuthCard
        title="Email verified"
        lead="Your email address has been verified."
        footer={
          <Link to={PATHS.HOME} className={authStyles.link}>
            Back to home
          </Link>
        }
      >
        <div className={styles.centerState}>
          <CheckCircle2 size={40} className={styles.successIcon} aria-hidden="true" />
          <p className={styles.stateHeading}>Your email is verified.</p>
          <p className={styles.stateText}>You can now place pre-orders and receive market updates.</p>

          <Link to={nextDestination} className={styles.submitBtn}>
            {nextLabel}
          </Link>
        </div>
      </AuthCard>
    );
  }

  // 3. Expired or Invalid Token State
  if (state === 'expired') {
    return (
      <AuthCard
        title="Link expired"
        lead="That verification link has expired or has already been used."
        footer={
          <Link to={PATHS.LOGIN} className={authStyles.link}>
            Back to sign in
          </Link>
        }
      >
        <div role="alert" className={authStyles.bannerError}>
          <p>That link has expired. Request a new verification email below.</p>
        </div>

        {resendNotice && (
          <div role="status" className={authStyles.bannerSuccess}>
            <p>{resendNotice}</p>
          </div>
        )}

        <form onSubmit={handleResend} noValidate className={authStyles.form}>
          <div className={authStyles.field}>
            <label htmlFor="verify-email-input" className={authStyles.label}>
              Email address
            </label>
            <input
              id="verify-email-input"
              type="email"
              value={resendEmail}
              onChange={(e) => {
                setResendEmail(e.target.value);
                if (resendError) setResendError('');
              }}
              placeholder="name@example.com"
              autoComplete="email"
              aria-invalid={Boolean(resendError)}
              aria-describedby={resendError ? 'verify-resend-err' : undefined}
              className={`${authStyles.input} ${resendError ? authStyles.inputInvalid : ''}`}
              required
            />
            {resendError && (
              <span id="verify-resend-err" role="alert" className={authStyles.errorText}>
                {resendError}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={resending}
            className={styles.submitBtn}
          >
            {resending ? 'Sending link…' : 'Resend verification email'}
          </button>
        </form>
      </AuthCard>
    );
  }

  // 4. No Token Provided State
  return (
    <AuthCard
      title="Verification link needed"
      lead="Please check the link in the confirmation email we sent you."
      footer={
        <Link to={PATHS.LOGIN} className={authStyles.link}>
          Back to sign in
        </Link>
      }
    >
      <div role="alert" className={authStyles.bannerError}>
        <p>No verification token was provided in the URL. Please click the full link in your verification email.</p>
      </div>
    </AuthCard>
  );
}

export default VerifyEmail;
