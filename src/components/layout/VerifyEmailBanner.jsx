import React, { useState, useEffect } from 'react';
import { Mail, X, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { resendVerification } from '@/api/auth';
import styles from './VerifyEmailBanner.module.css';

/**
 * Quiet reminder banner shown to authenticated users whose email has not been verified yet.
 * Dismissible per browser session via sessionStorage.
 */
export function VerifyEmailBanner() {
  const { user, isAuthenticated } = useAuth();
  const [dismissed, setDismissed] = useState(true);
  const [resending, setResending] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Check if user is logged in and unverified
    if (!isAuthenticated || !user || user.emailVerified !== false) {
      setDismissed(true);
      return;
    }

    try {
      const isDismissed = sessionStorage.getItem('marketlink_verify_banner_dismissed');
      setDismissed(isDismissed === 'true');
    } catch {
      setDismissed(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (dismissed || !isAuthenticated || !user || user.emailVerified !== false) {
    return null;
  }

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('marketlink_verify_banner_dismissed', 'true');
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  const handleResend = async () => {
    if (resending || cooldown > 0 || !user.email) return;

    setResending(true);
    setSentMessage('');
    setErrorMessage('');

    try {
      await resendVerification(user.email);
      setSentMessage(`Verification email sent to ${user.email}`);
      setCooldown(60);
      setTimeout(() => setSentMessage(''), 5000);
    } catch (err) {
      if (err.status === 429) {
        setErrorMessage('Too many requests. Please wait a few minutes.');
      } else {
        setErrorMessage(err.message || 'Unable to send email right now.');
      }
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setResending(false);
    }
  };

  return (
    <aside className={styles.banner} aria-label="Email verification notice">
      <div className={styles.inner}>
        <div className={styles.messageGroup}>
          <Mail size={16} className={styles.icon} aria-hidden="true" />
          <span className={styles.text}>
            Please verify your email address (<strong>{user.email}</strong>) to secure your account.
          </span>
        </div>

        <div className={styles.actionsGroup}>
          {sentMessage ? (
            <span className={styles.successFeedback}>
              <Check size={14} />
              {sentMessage}
            </span>
          ) : errorMessage ? (
            <span className={styles.errorFeedback}>{errorMessage}</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className={styles.resendBtn}
            >
              {resending ? (
                <>
                  <RefreshCw size={13} className={styles.spin} />
                  <span>Sending...</span>
                </>
              ) : cooldown > 0 ? (
                <span>Resend in {cooldown}s</span>
              ) : (
                <span>Resend confirmation email</span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className={styles.closeBtn}
            aria-label="Dismiss email verification notice for this session"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default VerifyEmailBanner;
