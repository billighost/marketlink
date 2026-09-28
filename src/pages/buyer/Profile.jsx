import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ShoppingBag,
  MapPin,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Navigation,
  Sprout,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import { getSavedMarkets } from '@/api/me';
import { getOrders } from '@/api/orders';
import Page from '@/components/layout/Page';
import Toggle from '@/components/ui/Toggle';
import BottomSheet from '@/components/ui/BottomSheet';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './Profile.module.css';

export function Profile() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { openRestartModal } = useOnboarding();
  const { unreadCount } = useNotificationCount();
  const navigate = useNavigate();

  useDocumentTitle('Your Profile · MarketLink');

  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [savedMarketsCount, setSavedMarketsCount] = useState(null);
  const [ordersCount, setOrdersCount] = useState(null);
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

    // Fetch saved markets count
    getSavedMarkets()
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : res?.items || res?.data || [];
        setSavedMarketsCount(list.length);
      })
      .catch(() => {});

    // Fetch orders count
    getOrders()
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : res?.items || res?.data || [];
        setOrdersCount(list.length);
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

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      setIsSignOutOpen(false);
      try {
        sessionStorage.setItem('marketlink_signed_out_notice', 'You have been signed out of MarketLink.');
      } catch {
        // ignore storage errors
      }
      await logout();
      showToast({ message: 'Signed out of MarketLink.' });
      navigate('/login', {
        state: { signedOut: true, message: 'You have been signed out of MarketLink.' },
      });
    } catch {
      navigate('/login', {
        state: { signedOut: true, message: 'You have been signed out of MarketLink.' },
      });
    } finally {
      setSigningOut(false);
    }
  };

  const homeMarketName =
    user?.homeMarket?.name ||
    (user?.homeMarketId ? 'Home market set' : 'Hilltop Farmers Market');

  return (
    <Page width="wide" className={styles.pageRoot}>
      <div className={styles.profileContainer}>
        {/* Profile Hero Header Card */}
        <header className={styles.heroCard}>
          <div className={styles.heroBanner} />

          <div className={styles.heroMain}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatar} aria-hidden="true">
                <span className={styles.avatarText}>{getInitials()}</span>
              </div>
              <span className={styles.onlineDot} title="Account active" />
            </div>

            <div className={styles.heroInfo}>
              <div className={styles.badgeRow}>
                <span className={styles.memberBadge}>
                  <Sparkles size={12} className={styles.badgeSparkle} />
                  <span>MarketLink Member</span>
                </span>
                <span className={styles.verifiedBadge}>
                  <ShieldCheck size={12} />
                  <span>Verified Customer</span>
                </span>
              </div>

              <h1 className={styles.userName}>{user?.name || 'Customer'}</h1>

              <div className={styles.metaRow}>
                <span className={styles.userEmail}>
                  <Mail size={13} className={styles.metaIcon} />
                  <span>{user?.email || 'customer@marketlink.org'}</span>
                </span>

                <div className={styles.homeMarketPill}>
                  <Store size={13} className={styles.metaIcon} />
                  <span>{homeMarketName}</span>
                </div>
              </div>
            </div>

            <Link
              to="/buyer/profile/details"
              className={styles.editProfileBtn}
              aria-label="Edit personal details"
            >
              <User size={14} />
              <span>Edit profile</span>
            </Link>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className={styles.statsRibbon}>
            <Link to="/buyer/orders" className={styles.statTile}>
              <div className={`${styles.statIconBox} ${styles.iconOrders}`}>
                <ShoppingBag size={18} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>
                  {ordersCount !== null ? ordersCount : '—'}
                </span>
                <span className={styles.statLabel}>Orders Placed</span>
              </div>
              <ArrowRight size={14} className={styles.statArrow} />
            </Link>

            <Link to="/buyer/profile/markets" className={styles.statTile}>
              <div className={`${styles.statIconBox} ${styles.iconMarkets}`}>
                <Store size={18} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>
                  {savedMarketsCount !== null ? savedMarketsCount : '—'}
                </span>
                <span className={styles.statLabel}>Saved Markets</span>
              </div>
              <ArrowRight size={14} className={styles.statArrow} />
            </Link>

            <Link to="/buyer/notifications" className={styles.statTile}>
              <div className={`${styles.statIconBox} ${styles.iconAlerts}`}>
                <Bell size={18} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>
                  {unreadCount > 0 ? `${unreadCount} new` : '0'}
                </span>
                <span className={styles.statLabel}>Market Alerts</span>
              </div>
              <ArrowRight size={14} className={styles.statArrow} />
            </Link>

            <Link to="/buyer/profile/reviews" className={styles.statTile}>
              <div className={`${styles.statIconBox} ${styles.iconReviews}`}>
                <MessageSquare size={18} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>Reviews</span>
                <span className={styles.statLabel}>Feedback Given</span>
              </div>
              <ArrowRight size={14} className={styles.statArrow} />
            </Link>
          </div>
        </header>

        {/* 2-Column Responsive Dashboard Body */}
        <div className={styles.layoutGrid}>
          {/* Left Column: Sidebars & Market Hub */}
          <aside className={styles.sidebar}>
            {/* Primary Market Card */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <span className={styles.sideCardIcon}>
                  <Store size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3 className={styles.sideCardTitle}>Primary Market Hub</h3>
                  <p className={styles.sideCardSub}>Your active pickup location</p>
                </div>
              </div>
              <div className={styles.marketHubBox}>
                <p className={styles.marketHubName}>{homeMarketName}</p>
                <div className={styles.marketHubBadge}>
                  <span className={styles.greenPulse} />
                  <span>Market Open • Saturday pickup</span>
                </div>
                <p className={styles.marketHubDesc}>
                  Your feed, stall discovery, and checkout pickups are calibrated to this market.
                </p>
                <Link to="/buyer/markets" className={styles.switchMarketBtn}>
                  <Store size={14} />
                  <span>Switch market</span>
                </Link>
              </div>
            </div>

            {/* Market Route Quick Planner */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <span className={styles.sideCardIcon}>
                  <Navigation size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3 className={styles.sideCardTitle}>Route Planner</h3>
                  <p className={styles.sideCardSub}>Efficient market day circuit</p>
                </div>
              </div>
              <p className={styles.routeDesc}>
                Plan your walking circuit between booked stalls to collect all fresh harvest orders smoothly.
              </p>
              <Link to="/buyer/route" className={styles.openRouteBtn}>
                <MapPin size={14} />
                <span>Open route planner</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Farm Mission Box */}
            <div className={styles.missionCard}>
              <span className={styles.missionIcon}>
                <Sprout size={18} aria-hidden="true" />
              </span>
              <h4 className={styles.missionTitle}>Regenerative & Local</h4>
              <p className={styles.missionText}>
                100% of order value goes directly to verified family farms and local food artisans.
              </p>
              <Link to="/about" className={styles.missionLink}>
                <span>Learn about our growers</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Sign Out Card Button */}
            <button
              type="button"
              className={styles.signOutTrigger}
              onClick={() => setIsSignOutOpen(true)}
            >
              <LogOut size={16} />
              <span>Sign out of MarketLink</span>
            </button>
          </aside>

          {/* Right Column: Settings Panels */}
          <main className={styles.mainContent}>
            {/* Account Group */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Account & Details</h2>
                <span className={styles.sectionBadge}>Personal</span>
              </div>

              <div className={styles.cardGroup}>
                <Link to="/buyer/profile/details" className={styles.settingRow}>
                  <div className={`${styles.rowIconBox} ${styles.tintBeet}`}>
                    <User size={18} />
                  </div>
                  <div className={styles.rowContent}>
                    <span className={styles.rowTitle}>Personal details</span>
                    <span className={styles.rowSub}>
                      Name, contact phone, and delivery notes
                    </span>
                  </div>
                  {user?.name && (
                    <span className={styles.rowValue}>{user.name}</span>
                  )}
                  <ChevronRight size={16} className={styles.rowChevron} />
                </Link>

                <Link to="/buyer/profile/markets" className={styles.settingRow}>
                  <div className={`${styles.rowIconBox} ${styles.tintAmber}`}>
                    <Store size={18} />
                  </div>
                  <div className={styles.rowContent}>
                    <span className={styles.rowTitle}>Saved markets</span>
                    <span className={styles.rowSub}>
                      Farmers markets you follow for harvest updates
                    </span>
                  </div>
                  {savedMarketsCount != null && (
                    <span className={styles.rowValue}>{savedMarketsCount} saved</span>
                  )}
                  <ChevronRight size={16} className={styles.rowChevron} />
                </Link>

                <Link to="/buyer/profile/reviews" className={styles.settingRow}>
                  <div className={`${styles.rowIconBox} ${styles.tintBlue}`}>
                    <MessageSquare size={18} />
                  </div>
                  <div className={styles.rowContent}>
                    <span className={styles.rowTitle}>Your reviews</span>
                    <span className={styles.rowSub}>
                      Ratings and producer comments you've submitted
                    </span>
                  </div>
                  <ChevronRight size={16} className={styles.rowChevron} />
                </Link>

                <Link to="/buyer/notifications" className={styles.settingRow}>
                  <div className={`${styles.rowIconBox} ${styles.tintHerb}`}>
                    <Bell size={18} />
                  </div>
                  <div className={styles.rowContent}>
                    <span className={styles.rowTitle}>Notifications</span>
                    <span className={styles.rowSub}>
                      Order updates, ready alerts and market bulletins
                    </span>
                  </div>
                  {unreadCount > 0 ? (
                    <span className={styles.newAlertBadge}>{unreadCount} new</span>
                  ) : null}
                  <ChevronRight size={16} className={styles.rowChevron} />
                </Link>
              </div>
            </section>

            {/* Preferences Group */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Preferences & Experience</h2>
                <span className={styles.sectionBadge}>Interface</span>
              </div>

              <div className={styles.cardGroup}>
                <Link to="/buyer/profile/notifications" className={styles.settingRow}>
                  <div className={`${styles.rowIconBox} ${styles.tintPurple}`}>
                    <Bell size={18} />
                  </div>
                  <div className={styles.rowContent}>
                    <span className={styles.rowTitle}>Notification preferences</span>
                    <span className={styles.rowSub}>
                      Configure email, SMS and push alert channels
                    </span>
                  </div>
                  <ChevronRight size={16} className={styles.rowChevron} />
                </Link>

                <div className={`${styles.settingRow} ${styles.settingRowInteractive}`}>
                  <div className={`${styles.rowIconBox} ${styles.tintTeal}`}>
                    <Sparkles size={18} />
                  </div>
                  <div className={styles.rowContent}>
                    <div className={styles.toggleTitleRow}>
                      <span className={styles.rowTitle}>Reduced motion</span>
                      {motionIndicator && (
                        <span className={styles.savedFeedback}>{motionIndicator}</span>
                      )}
                    </div>
                    <span className={styles.rowSub}>
                      Minimize animations and transition effects
                    </span>
                  </div>
                  <Toggle
                    checked={motionReduced}
                    onChange={handleMotionToggle}
                    label="Reduced motion"
                  />
                </div>
              </div>
            </section>

            {/* Help & Community Group */}
            <section className={styles.settingsSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Help & Community</h2>
                <span className={styles.sectionBadge}>Guides</span>
              </div>

              <div className={styles.cardGroup}>
                <button
                  type="button"
                  onClick={() => openRestartModal('buyer')}
                  className={styles.settingRow}
                  style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                >
                  <div className={`${styles.rowIconBox} ${styles.tintBeet}`}>
                    <Sparkles size={18} />
                  </div>
                  <div className={styles.rowContent}>
                    <span className={styles.rowTitle}>Take a tour again</span>
                    <span className={styles.rowSub}>
                      Replay the interactive guided walkthrough of MarketLink
                    </span>
                  </div>
                  <ChevronRight size={16} className={styles.rowChevron} />
                </button>

                <Link to="/buyer/help" className={styles.settingRow}>
                  <div className={`${styles.rowIconBox} ${styles.tintOlive}`}>
                    <HelpCircle size={18} />
                  </div>
                  <div className={styles.rowContent}>
                    <span className={styles.rowTitle}>How MarketLink works</span>
                    <span className={styles.rowSub}>
                      Pickup window guide, stall etiquette & reserve policies
                    </span>
                  </div>
                  <ChevronRight size={16} className={styles.rowChevron} />
                </Link>

                <Link to="/about" className={styles.settingRow}>
                  <div className={`${styles.rowIconBox} ${styles.tintSand}`}>
                    <FileText size={18} />
                  </div>
                  <div className={styles.rowContent}>
                    <span className={styles.rowTitle}>About MarketLink</span>
                    <span className={styles.rowSub}>
                      Our mission supporting growers & food transparency
                    </span>
                  </div>
                  <ChevronRight size={16} className={styles.rowChevron} />
                </Link>

                <Link to="/contact" className={styles.settingRow}>
                  <div className={`${styles.rowIconBox} ${styles.tintBeetSoft}`}>
                    <Mail size={18} />
                  </div>
                  <div className={styles.rowContent}>
                    <span className={styles.rowTitle}>Contact support</span>
                    <span className={styles.rowSub}>
                      Talk to our customer happiness & market manager team
                    </span>
                  </div>
                  <ChevronRight size={16} className={styles.rowChevron} />
                </Link>
              </div>
            </section>
          </main>
        </div>

        {/* Sign Out Confirmation Sheet */}
        <BottomSheet
          open={isSignOutOpen}
          onClose={() => !signingOut && setIsSignOutOpen(false)}
          title="Sign out"
          size="peek"
        >
          <div className={styles.signOutModal}>
            <div className={styles.signOutIcon} aria-hidden="true">
              <LogOut size={22} strokeWidth={2} />
            </div>
            <h3 className={styles.signOutHead}>Sign out of your account?</h3>
            <p className={styles.signOutText}>
              You will need to sign in again to browse saved markets, view pickup codes, and place orders.
            </p>
            <div className={styles.signOutActions}>
              <button
                type="button"
                className={styles.signOutButton}
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setIsSignOutOpen(false)}
                disabled={signingOut}
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