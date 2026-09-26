import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Store,
  Bell,
  HelpCircle,
  FileText,
  LogOut,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOpenSheet } from '@/hooks/useOpenSheet';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import ListRow from '@/components/ui/ListRow';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import styles from './Profile.module.css';

/**
 * Customer Profile ("You") page.
 * Grouped settings rows and access to profile sub-sheets.
 */
export function Profile() {
  const { user, logout } = useAuth();
  const { openSheet } = useOpenSheet();
  const { unreadCount } = useNotificationCount();
  const navigate = useNavigate();

  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [motionReduced, setMotionReduced] = useState(false);
  const [motionSaved, setMotionSaved] = useState(false);

  const handleMotionToggle = (val) => {
    setMotionReduced(val);
    setMotionSaved(true);
    setTimeout(() => setMotionSaved(false), 1800);
  };

  const getInitials = () => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      return parts.map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    }
    return 'GA';
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      {/* Profile Header */}
      <header className={styles.header}>
        <div className={styles.avatar}>
          <span className={styles.avatarText}>{getInitials()}</span>
        </div>
        <div className={styles.userInfo}>
          <h1 className={styles.userName}>{user?.name || 'Customer'}</h1>
          <span className={styles.userEmail}>{user?.email || 'george@example.com'}</span>
        </div>
      </header>

      {/* Account Settings Group */}
      <section className={styles.group} aria-label="Account settings">
        <h2 className={styles.groupHeading}>Account</h2>
        <div className={styles.panel}>
          <ListRow
            icon={User}
            label="Personal details"
            value={user?.firstName || 'George'}
            onClick={() => openSheet('/buyer/profile/details')}
          />
          <ListRow
            icon={Store}
            label="Saved markets"
            onClick={() => openSheet('/buyer/profile/markets')}
          />
          <ListRow
            icon={Bell}
            label="Notifications"
            value={unreadCount > 0 ? `${unreadCount} new` : undefined}
            onClick={() => openSheet('/buyer/profile/notifications')}
          />
        </div>
      </section>

      {/* Preferences Group */}
      <section className={styles.group} aria-label="Preferences">
        <h2 className={styles.groupHeading}>Preferences</h2>
        <div className={styles.panel}>
          <ListRow
            icon={Moon}
            label="Dark mode"
            value="Light only"
          />
          <ListRow
            icon={Sparkles}
            label="Reduced motion"
            indicator={motionSaved ? 'Saved' : undefined}
            toggle={motionReduced}
            onToggle={handleMotionToggle}
          />
        </div>
      </section>

      {/* Support & Legal Group */}
      <section className={styles.group} aria-label="Support and legal">
        <h2 className={styles.groupHeading}>Help & Information</h2>
        <div className={styles.panel}>
          <ListRow
            icon={HelpCircle}
            label="How MarketLink works & FAQ"
            onClick={() => openSheet('/buyer/help')}
          />
          <ListRow
            icon={FileText}
            label="About MarketLink"
            onClick={() => navigate('/about')}
          />
        </div>
      </section>

      {/* Sign Out Action */}
      <section className={styles.group} aria-label="Session">
        <div className={styles.panel}>
          <ListRow
            icon={LogOut}
            label="Sign out"
            danger
            onClick={() => setIsSignOutOpen(true)}
          />
        </div>
      </section>

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
            <Button
              variant="danger"
              size="lg"
              className={styles.fullWidth}
              onClick={handleSignOut}
            >
              Sign out
            </Button>
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
  );
}

export default Profile;
