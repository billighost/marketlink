import React from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Illustration from '@/components/domain/Illustration';
import styles from './NotFound.module.css';

/**
 * Friendly market-style 404 page
 */
export function NotFound() {
  useDocumentTitle('Stall Not Found · MarketLink');

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Card className={styles.card}>
          <div className={styles.illustrationMoment} aria-hidden="true">
            <Illustration name="empty-crate-soldout" size="xl" />
          </div>
          <h1 className={styles.title}>This stall isn't here today.</h1>
          <p className={styles.text}>
            The page you're looking for has moved, packed up early, or never existed on Elm Street.
          </p>
          <div className={styles.action}>
            <Button
              as={Link}
              to={PATHS.HOME}
              variant="primary"
              size="md"
            >
              Back to Elm Street
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default NotFound;
