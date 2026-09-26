import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Store,
  Bell,
  MessageSquare,
  Sparkles,
  HelpCircle,
  FileText,
  Mail,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import { getSavedMarkets } from '@/api/me';
import Page from '@/components/layout/Page';
import SectionRows from '@/components/ui/SectionRows';
import ListRow from '@/components/ui/ListRow';
import BottomSheet from '@/components/ui/BottomSheet';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Profile.module.css';

export function Profile() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotificationCount();
  const navigate = useNavigate();

  useDocumentTitle('You · MarketLink');

  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [savedMarketsCount, setSavedMarketsCount] = useState(null);
  const [motionReduced, setMotionReduced] = useState(() => {
    try {
      return localStorage.getItem('marketlink_reduced_motion') === 'true';
    } catch {
      return false;
    }
  });
  const [motionIndicator, setMotionIndicator] = useState(null);

  useEffect(() => {
    let active = true;
    getSavedMarkets()
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : res?.items || res?.data || [];
        setSavedMarketsCount(list.length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleMotionToggle = (val) => {
    setMotionReduced(val);
    try {
      localStorage.setItem('marketlink_reduced_motion', val ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('marketlink_reduced_motion_change', { detail: val }));
    } catch {
      // ignore
    }
    setMotionIndicator('Saved');
    setTimeout(() => {
      setMotionIndicator(null);
    }, 1500);
  };

  const getInitials = () => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    return 'C';
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const homeMarketName = user?.homeMarket?.name || (user?.homeMarketId ? 'Home market set' : null);

  return (
    <Page width="read">
      <div className={styles.page}>
        {/* Profile Header */}
        <header className={styles.header}>
          <div className={styles.avatar} aria-hidden="true">
            <span className={styles.avatarText}>{getInitials()}</span>
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.userName}>{user?.name || 'Customer'}</h1>
            <span className={styles.userEmail}>{user?.email || 'customer@marketlink.org'}</span>
            {homeMarketName && (
              <span className={styles.homeMarket}>{homeMarketName} · home market</span>
            )}
          </div>
        </header>

        {/* Account Group */}
        <SectionRows title="Account">
          <ListRow
            icon={User}
            label="Personal details"
            value={user?.name || user?.firstName}
            to="/buyer/profile/details"
          />
          <ListRow
            icon={Store}
            label="Saved markets"
            value={savedMarketsCount != null ? `${savedMarketsCount} saved` : undefined}
            to="/buyer/profile/markets"
          />
          <ListRow
            icon={MessageSquare}
            label="Your reviews"
            to="/buyer/profile/reviews"
          />
          <ListRow
            icon={Bell}
            label="Notifications"
            value={unreadCount > 0 ? `${unreadCount} new` : undefined}
            to="/buyer/notifications"
          />
        </SectionRows>

        {/* Preferences Group */}
        <SectionRows title="Preferences">
          <ListRow
            icon={Bell}
            label="Notification preferences"
            to="/buyer/profile/notifications"
          />
          <ListRow
            icon={Sparkles}
            label="Reduced motion"
            indicator={motionIndicator}
            toggle={motionReduced}
            onToggle={handleMotionToggle}
          />
        </SectionRows>

        {/* Help Group */}
        <SectionRows title="Help">
          <ListRow
            icon={HelpCircle}
            label="How MarketLink works"
            to="/buyer/help"
          />
          <ListRow
            icon={FileText}
            label="About MarketLink"
            to="/about"
          />
          <ListRow
            icon={Mail}
            label="Contact us"
            to="/contact"
          />
        </SectionRows>

        {/* Session / Sign out Group */}
        <SectionRows>
          <ListRow
            icon={LogOut}
            label="Sign out"
            danger
            onClick={() => setIsSignOutOpen(true)}
          />
        </SectionRows>

        {/* Sign Out Confirmation Sheet */}
        <BottomSheet
          open={isSignOutOpen}
          onClose={() => setIsSignOutOpen(false)}
          title="Sign out"
          size="peek"
        >
          <div className={styles.signOutModal}>
            <p className={styles.signOutText}>
              Are you sure you want to sign out of MarketLink?
            </p>
            <div className={styles.signOutActions}>
              <button
                type="button"
                className={styles.signOutButton}
                onClick={handleSignOut}
              >
                Sign out
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setIsSignOutOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </BottomSheet>
      </div>
    </Page>
  );
}

export default Profile;
