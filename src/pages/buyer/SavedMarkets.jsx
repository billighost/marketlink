import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Plus, Store } from 'lucide-react';
import { getSavedMarkets, saveMarket, unsaveMarket, setHomeMarket } from '@/api/me';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Page from '@/components/layout/Page';
import PageTitle from '@/components/layout/PageTitle';
import MarketClock from '@/components/layout/MarketClock';
import DayDots from '@/components/domain/DayDots';
import EmptyState from '@/components/ui/EmptyState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import styles from './SavedMarkets.module.css';

export function SavedMarkets() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  useDocumentTitle('Saved markets · MarketLink');

  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  const homeMarketId = user?.homeMarketId || user?.homeMarket?._id || user?.homeMarket?.id;

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const data = await getSavedMarkets();
      setMarkets(Array.isArray(data) ? data : data?.items || data?.data || []);
    } catch {
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const handleSetHome = async (marketId, marketName) => {
    try {
      await setHomeMarket(marketId);
      await refreshUser();
      showToast({ message: `${marketName} set as primary home market.` });
    } catch (err) {
      showToast(err?.message || 'Could not update primary home market.');
    }
  };

  const handleRemove = async (marketId, marketName) => {
    const prev = markets;
    setMarkets((list) => list.filter((m) => (m.id || m._id) !== marketId));

    try {
      await unsaveMarket(marketId);
      showToast({
        message: 'Removed from saved markets',
        action: 'Undo',
        onAction: async () => {
          try {
            await saveMarket(marketId);
            setMarkets(prev);
          } catch {
            showToast('Could not restore market.');
          }
        },
      });
    } catch {
      setMarkets(prev);
      showToast('Could not remove market.');
    }
  };

  return (
    <Page width="read">
      <PageTitle
        title="Saved markets"
        context="Your preferred market locations for route-friendly pickup."
        backTo="/buyer/profile"
        backLabel="Back to you"
      />

      <div className={styles.container}>
        <p className={styles.intro}>
          Save the markets you visit regularly. One is your primary home market, used for default schedules and local recommendations.
        </p>

        {loading ? (
          <div className={styles.list}>
            <div style={{ height: 110, background: 'var(--color-canvas-soft)', borderRadius: 'var(--radius-lg)' }} />
          </div>
        ) : markets.length > 0 ? (
          <div className={styles.list}>
            {markets.map((market) => {
              const mId = market.id || market._id;
              const isHome = mId === homeMarketId;
              const directionsUrl =
                market.directionsUrls?.google ||
                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(market.address || market.name)}`;

              return (
                <article key={mId} className={styles.marketRow} aria-label={market.name}>
                  <div className={styles.marketMain}>
                    <div className={styles.headerRow}>
                      <div className={styles.nameGroup}>
                        <Link to={`/buyer/markets/${mId}`} className={styles.marketName}>
                          {market.name}
                        </Link>
                        {isHome && <span className={styles.homeBadge}>Home market</span>}
                      </div>

                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.directionsLink}
                        aria-label={`Get directions to ${market.name}`}
                      >
                        <Navigation size={12} aria-hidden="true" />
                        <span>Get directions</span>
                      </a>
                    </div>

                    <MarketClock
                      marketName={market.name}
                      openNow={market.openNow}
                      windowLabel={market.windowLabel || market.hours || 'Saturday 8:00–13:00'}
                      nextOpenLabel={market.nextOpenLabel}
                      closesAtLabel={market.closesAtLabel || '13:00'}
                      progress={market.progress || 0}
                    />

                    <div className={styles.addressRow}>
                      {market.address && (
                        <span>
                          <MapPin size={12} className={styles.metaIcon} aria-hidden="true" /> {market.address}
                        </span>
                      )}
                      <DayDots days={market.operatingDays || [6]} size="sm" />
                    </div>
                  </div>

                  <div className={styles.actionsRow}>
                    {!isHome && (
                      <button
                        type="button"
                        className={styles.setHomeBtn}
                        onClick={() => handleSetHome(mId, market.name)}
                      >
                        Set as home market
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => handleRemove(mId, market.name)}
                      aria-label={`Remove ${market.name} from saved`}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            scene="nothing-saved"
            title="No saved markets yet"
            text="Save markets to receive schedule reminders and route-friendly directions."
            actionLabel="Browse all markets"
            actionTo="/buyer/markets"
          />
        )}

        <Link to="/buyer/markets" className={styles.addMarketLink}>
          <Plus size={16} aria-hidden="true" />
          <span>Add a market</span>
        </Link>
      </div>
    </Page>
  );
}

export default SavedMarkets;
