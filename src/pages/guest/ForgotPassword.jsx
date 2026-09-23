import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import PageHeader from '@/components/layout/PageHeader';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import styles from './ForgotPassword.module.css';

/**
 * ForgotPassword page with email validation and sent confirmation state.
 */
export function ForgotPassword() {
  useDocumentTitle('Reset Password · MarketLink');

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const emailRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      emailRef.current?.focus();
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      emailRef.current?.focus();
      return;
    }

    setError('');
    setSent(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <PageHeader
          title="Reset your password"
          subtitle={!sent ? "Enter your email and we'll send you a reset link." : undefined}
          backTo={PATHS.LOGIN}
          backLabel="Sign in"
          className={styles.header}
        />

        <Card className={styles.card}>
          {sent ? (
            /* Sent confirmation state */
            <div className={styles.sentState}>
              <div className={styles.iconCircle} aria-hidden="true">
                <Mail size={32} strokeWidth={1.5} className={styles.mailIcon} />
              </div>
              <h2 className={styles.sentTitle}>Check your inbox</h2>
              <p className={styles.sentText}>
                If that email is registered, a link is on its way.
              </p>
              <Link to={PATHS.LOGIN} className={styles.backLink}>
                Back to sign in
              </Link>
            </div>
          ) : (
            /* Email submission form */
            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              <FormField
                ref={emailRef}
                label="Email address"
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                error={error}
                autoComplete="email"
                required
              />

              <div className={styles.submitRow}>
                <Button type="submit" variant="primary" size="md" className={styles.submitButton}>
                  Send reset link
                </Button>
              </div>

              <div className={styles.backRow}>
                <Link to={PATHS.LOGIN} className={styles.backLink}>
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default ForgotPassword;
