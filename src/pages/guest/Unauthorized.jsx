import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Illustration from '@/components/domain/Illustration';
import styles from './Unauthorized.module.css';

/**
 * Friendly 403 Unauthorized page
 */
export function Unauthorized() {
  useDocumentTitle('Unauthorized · MarketLink');

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Card className={styles.card}>
          <div className={styles.iconCircle} aria-hidden="true">
            <Illustration name="stall" size="lg" />
          </div>
          <h1 className={styles.title}>This area is for someone else</h1>
          <p className={styles.text}>
            You're signed in, but this part of MarketLink is for a different kind of account.
          </p>
          <div className={styles.actions}>
            <Button
              as={Link}
              to={PATHS.LOGIN}
              variant="primary"
              size="md"
            >
              Go to sign in
            </Button>
            <Link to={PATHS.HOME} className={styles.homeLink}>
              Back to home
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Unauthorized;
