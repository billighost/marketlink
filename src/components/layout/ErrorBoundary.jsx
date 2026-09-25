import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import styles from './ErrorBoundary.module.css';

/**
 * Root ErrorBoundary with friendly full-screen fallback.
 * "Something broke on our side. Reload"
 * Never leaks stack traces or technical details to users.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // In dev, log error safely
    if (import.meta.env.DEV) {
      // keep dev info accessible without leaking in production
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container} role="alert">
          <div className={styles.card}>
            <div className={styles.iconWrap} aria-hidden="true">
              <AlertCircle size={32} />
            </div>
            <h1 className={styles.title}>Something broke on our side</h1>
            <p className={styles.text}>
              We ran into an unexpected issue while loading this page. Please reload to continue.
            </p>
            <div className={styles.button}>
              <Button variant="primary" size="md" onClick={this.handleReload}>
                Reload
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
