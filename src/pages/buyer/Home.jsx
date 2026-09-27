import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFeed } from '@/hooks/useFeed';
import { useQuery } from '@/hooks/useQuery';
import { getFeedMeta } from '@/api/catalog';
import { getHomeSummary } from '@/api/me';
import { getGreeting } from '@/utils/greeting';
import Page from '@/components/layout/Page';
import MarketClock from '@/components/layout/MarketClock';
import HorizontalRow from '@/components/layout/HorizontalRow';
import ProductCard from '@/components/domain/ProductCard';
import FarmerCard from '@/components/domain/FarmerCard';
import StallStrip from '@/components/domain/StallStrip';
import PickupBanner from '@/components/domain/PickupBanner';
import HomeSkeleton from '@/components/layout/HomeSkeleton';
import { SkeletonCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import styles from './Home.module.css';

/**
 * Customer landing page ("Today at the market" /buyer).
 *
 * Density budget at 390x844:
 *  1. Top bar (56px)
 *  2. Greeting h1 (Idiqlat --text-h1)
 *  3. MarketClock (one line + progress rule)
 *  4. Search field (44px)
 *  5. First row header + the first card and a half peeking
 * (PickupBanner is a conditional 6th element)
 */
export function Home() {
  const { user, selectedMarketId } = useAuth();
  const { sections, loadMore, loading, hasMore } = useFeed();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const sentinelRef = useRef(null);

  const fetchFeedMeta = useCallback(
    ({ signal }) => getFeedMeta(signal),
    []
  );
  const fetchHomeSummary = useCallback(
    ({ signal }) => getHomeSummary(signal),
    []
  );

  const { data: feedMeta, loading: metaLoading } = useQuery(
    ['feed-meta', selectedMarketId],
    fetchFeedMeta
  );
  const { data: homeSummary } = useQuery(
    ['home-summary', selectedMarketId],
    fetchHomeSummary
  );

  const greetingName =
    feedMeta?.greetingName ||
    user?.firstName ||
    user?.name?.split(' ')[0] ||
    'there';

  const activePickup = homeSummary?.readyForPickup || homeSummary?.nextPickup;

  // IntersectionObserver to load endless feed sections as user scrolls down
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, loading, hasMore]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/buyer/products?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/buyer/products');
    }
  };

  // Initial full-page loading state
  if (loading && sections.length === 0) {
    return (
      <Page width="wide">
        <HomeSkeleton />
      </Page>
    );
  }

  return (
    <Page width="wide" className={styles.pageRoot}>
      {/* Single wrapper — keeps Page's section-gap from blowing apart the header/feed */}
      <div className={styles.pageBody}>
        {/* Bespoke Header Area: Greeting + MarketClock + AI Action + Search Field */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headGroup}>
              <h1 className={styles.greeting}>{getGreeting(greetingName)}</h1>
              {metaLoading && !feedMeta ? (
                <div className={styles.clockSkeleton} aria-hidden="true" />
              ) : (
                <MarketClock
                  marketName={feedMeta?.homeMarket?.name || 'Your market'}
                  openNow={feedMeta?.clock?.openNow}
                  windowLabel={feedMeta?.clock?.windowLabel}
                  nextOpenLabel={feedMeta?.clock?.nextOpenLabel}
                  closesAtLabel={feedMeta?.clock?.closesAtLabel}
                  progress={feedMeta?.clock?.todayProgress ?? 0}
                />
              )}
            </div>

            <Link
              to="/buyer/assistant"
              className={styles.aiButton}
              aria-label="Talk to MarketLink AI assistant"
            >
              <div className={styles.aiIconBadge} aria-hidden="true">
                <Sparkles size={16} className={styles.aiSparkleIcon} />
              </div>
              <div className={styles.aiContent}>
                <span className={styles.aiTitle}>Talk to MarketLink AI</span>
                <span className={styles.aiSubtitle}>Ask about stalls, seasonal produce & recipes</span>
              </div>
              <ArrowRight size={15} className={styles.aiArrow} aria-hidden="true" />
            </Link>
          </div>

          {/* Full-width Search Field */}
          <form className={styles.searchForm} onSubmit={handleSearchSubmit} role="search">
            <Search size={18} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search produce, stalls, markets"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search produce, stalls and markets"
            />
          </form>
        </header>

        {/* Conditional Active Pickup Banner */}
        <PickupBanner order={activePickup} />

        {/* Curated and Endless Feed */}
        <div className={styles.feed}>
          {/* First row: At the market today (StallStrip) */}
          <StallStrip marketId={selectedMarketId} />

          {/* Server curated sections */}
          {sections.map((section, idx) => {
            const isFarmerSection =
              section.type === 'farmerRow' ||
              section.type === 'farmers' ||
              section.type === 'farmer' ||
              (Array.isArray(section.items) && section.items.some((it) => it && Boolean(it.stallName)));

            // If section has no items or if it's a farmer section with 0 farmers, do not display at all
            if (!section.items || section.items.length === 0) {
              return null;
            }

            return (
              <React.Fragment key={section.id}>
                <div className={styles.sectionWrap}>
                  <HorizontalRow
                    title={section.title}
                    subtitle={section.subtitle}
                    seeAllLabel="See all"
                    onSeeAll={() =>
                      navigate(
                        section.seeAllPath ||
                          (isFarmerSection ? '/buyer/stalls' : '/buyer/products')
                      )
                    }
                  >
                    {section.items.map((item) => {
                      if (isFarmerSection || item.stallName) {
                        return (
                          <FarmerCard
                            key={item.id}
                            farmer={item}
                            variant="stall"
                          />
                        );
                      }
                      return (
                        <ProductCard
                          key={item.id}
                          product={item}
                          variant={section.cardVariant || 'compact'}
                        />
                      );
                    })}
                  </HorizontalRow>
                </div>

                {/* Quiet assistant line after the 3rd server section */}
                {idx === 2 && (
                  <div className={styles.assistantCallout}>
                    <p className={styles.assistantText}>
                      Not sure what to cook?{' '}
                      <Link to="/buyer/assistant" className={styles.assistantLink}>
                        Ask MarketLink AI
                      </Link>
                      .
                    </p>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Skeletons while loading more feed batches */}
          {loading && sections.length > 0 && (
            <div className={styles.skeletonRow} aria-label="Loading more market items">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Empty feed state */}
          {!loading && sections.length === 0 && (
            <EmptyState
              scene="market-closed"
              title="Nothing on the stalls yet"
              text="Farmers are still setting up for the next market day."
              actionLabel="Browse markets"
              actionTo="/buyer/markets"
            />
          )}

          {/* End of feed notification */}
          {!hasMore && sections.length > 0 && (
            <div className={styles.endOfFeed} role="status">
              <div className={styles.endOfFeedDivider} aria-hidden="true" />
              <div className={styles.endOfFeedBadge}>
                <span className={styles.endOfFeedDot} aria-hidden="true" />
                <span className={styles.endOfFeedText}>You've reached the end of today's market</span>
              </div>
              <p className={styles.endOfFeedSub}>
                Check back before market day for new harvest drops and updated stalls.
              </p>
            </div>
          )}

          {/* Endless scroll sentinel: only rendered when there is more content to load */}
          {hasMore && !loading && (
            <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
          )}
        </div>
      </div>
    </Page>
  );
}

export default Home;
