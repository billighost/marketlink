import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FormField from '@/components/ui/FormField';
import { useAuth } from '@/context/AuthContext';
import { verifyEmail, resendVerification } from '@/api/auth';
import styles from './VerifyEmail.module.css';

export function VerifyEmail() {
  useDocumentTitle('Verify Email · MarketLink');

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { user, isAuthenticated, role, refreshUser, homePathFor } = useAuth();

  const [loading, setLoading] = useState(Boolean(token));
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    token ? '' : 'No verification token was found in this link. Please check your email or request a new link below.'
  );

  // Resend form states
  const [resendEmail, setResendEmail] = useState(user?.email || '');
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    async function executeVerification() {
      try {
        setLoading(true);
        setErrorMessage('');
        await verifyEmail(token);
        if (mounted) {
          setSuccess(true);
          // Refresh user context if authenticated
          if (isAuthenticated && typeof refreshUser === 'function') {
            try {
              await refreshUser();
            } catch {
              // Ignore background refresh failure
            }
          }
        }
      } catch (err) {
        if (mounted) {
          setSuccess(false);
          if (err.code === 'INVALID_VERIFICATION_TOKEN') {
            setErrorMessage('This verification link is invalid, expired, or has already been used.');
          } else {
            setErrorMessage(err.message || 'Unable to verify email address. Please try requesting a new link.');
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    executeVerification();
    return () => {
      mounted = false;
    };
  }, [token, isAuthenticated, refreshUser]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail || !resendEmail.trim()) {
      setResendError('Please enter your email address.');
      return;
    }

    setResending(true);
    setResendError('');
    setResendSent(false);

    try {
      await resendVerification(resendEmail.trim().toLowerCase());
      setResendSent(true);
    } catch (err) {
      if (err.status === 429) {
        setResendError('Too many verification requests. Please wait a few minutes before trying again.');
      } else {
        setResendError(err.message || 'Unable to send verification email. Please try again later.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleContinue = () => {
    if (isAuthenticated) {
      navigate(homePathFor(role));
    } else {
      navigate(PATHS.LOGIN);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <PageHeader
          title="Email Verification"
          subtitle={loading ? 'Confirming your MarketLink account...' : undefined}
          backTo={PATHS.HOME}
          backLabel="Home"
        />

        <Card className={styles.card}>
          {loading && (
            <div className={styles.centerState}>
              <div className={styles.spinner} aria-label="Verifying token" />
              <h2 className={styles.stateTitle}>Verifying your email...</h2>
              <p className={styles.stateSubtitle}>This will only take a moment.</p>
            </div>
          )}

          {!loading && success && (
            <div className={styles.centerState}>
              <div className={styles.successIconBubble}>
                <CheckCircle2 size={44} className={styles.successIcon} />
              </div>
              <h2 className={styles.stateTitle}>Your email is confirmed!</h2>
              <p className={styles.stateSubtitle}>
                Thank you for verifying your email address. Your MarketLink account is now fully active.
              </p>
              <div className={styles.actionRow}>
                <Button variant="primary" onClick={handleContinue} className={styles.actionBtn}>
                  <span>Continue to MarketLink</span>
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {!loading && !success && (
            <div className={styles.errorContainer}>
              <div className={styles.centerState}>
                <div className={styles.errorIconBubble}>
                  <AlertCircle size={44} className={styles.errorIcon} />
                </div>
                <h2 className={styles.stateTitle}>Verification Link Expired or Invalid</h2>
                <p className={styles.errorMessage}>{errorMessage}</p>
              </div>

              <div className={styles.resendCard}>
                <h3 className={styles.resendHeading}>Request a new verification link</h3>
                <p className={styles.resendPrompt}>
                  Enter the email address associated with your account, and we’ll send a fresh confirmation link right away.
                </p>

                {resendSent ? (
                  <div className={styles.sentNotification} role="status">
                    <CheckCircle2 size={18} className={styles.inlineCheck} />
                    <span>A new verification link has been sent to <strong>{resendEmail}</strong>. Please check your inbox.</span>
                  </div>
                ) : (
                  <form onSubmit={handleResend} className={styles.resendForm}>
                    <FormField
                      label="Email address"
                      name="email"
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      error={resendError}
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={resending}
                      className={styles.resendBtn}
                    >
                      {resending ? (
                        <>
                          <RefreshCw size={15} className={styles.spinningIcon} />
                          <span>Sending link...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={15} />
                          <span>Send verification link</span>
                        </>
                      )}
                    </Button>
                  </form>
                )}

                <div className={styles.footerLinkRow}>
                  <Link to={PATHS.LOGIN} className={styles.subtleLink}>
                    Return to Sign in
                  </Link>
                  <span className={styles.dotSeparator}>·</span>
                  <Link to={PATHS.HOME} className={styles.subtleLink}>
                    Return to Home
                  </Link>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default VerifyEmail;
