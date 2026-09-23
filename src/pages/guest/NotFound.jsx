import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Illustration from '@/components/domain/Illustration';
import styles from './NotFound.module.css';

/**
 * Friendly 404 Not Found page
 */
export function NotFound() {
  useDocumentTitle('Page Not Found · MarketLink');

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Card className={styles.card}>
          <div className={styles.iconCircle} aria-hidden="true">
            <Illustration name="crate" size="lg" />
          </div>
          <h1 className={styles.title}>We couldn't find that page</h1>
          <p className={styles.text}>
            It may have moved, or the link may be wrong.
          </p>
          <div className={styles.action}>
            <Button
              as={Link}
              to={PATHS.HOME}
              variant="primary"
              size="md"
            >
              Go to home
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default NotFound;
