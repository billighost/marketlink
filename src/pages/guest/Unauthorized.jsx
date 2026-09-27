import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import { useAuth, homePathFor } from '@/context/AuthContext';
import useDocumentTitle from '@/hooks/useDocumentTitle';
import AuthCard from '@/components/guest/AuthCard';
import authStyles from '@/components/guest/AuthCard.module.css';
import styles from './Unauthorized.module.css';

export function Unauthorized() {
  useDocumentTitle('Access Denied — MarketLink');
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      navigate(PATHS.LOGIN, { replace: true });
    }
  };

  const roleName = role === 'customer'
    ? 'Customer'
    : role === 'farmer'
    ? 'Farmer'
    : role === 'admin'
    ? 'Administrator'
    : 'Guest';

  const dashboardPath = homePathFor(role);
  const dashboardLabel = `Go to ${roleName} dashboard`;

  return (
    <AuthCard
      title="That area is not for your account."
      lead={`You are signed in as a ${roleName}. You can only access features designed for your role.`}
      footer={
        <Link to={PATHS.HOME} className={authStyles.link}>
          Back to Elm Street
        </Link>
      }
    >
      <div className={styles.contentWrap}>
        <p className={styles.explanation}>
          If you need access to this page, please sign in with an account that has the required role.
        </p>

        <div className={styles.actions}>
          {/* The ONE beet element on the page */}
          <Link to={dashboardPath} className={styles.submitBtn}>
            {dashboardLabel}
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className={styles.signOutBtn}
          >
            Sign out of {user?.email || 'this account'}
          </button>
        </div>
      </div>
    </AuthCard>
  );
}

export default Unauthorized;
