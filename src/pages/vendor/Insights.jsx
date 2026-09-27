import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getFarmerInsights } from '@/api/farmer';
import { formatPrice } from '@/utils/format';
import SegmentedControl from '@/components/ui/SegmentedControl';
import BarChart from '@/components/domain/BarChart';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import {
  TrendingUp,
  Award,
  ShoppingBag,
  DollarSign,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Flame,
  PieChart,
} from 'lucide-react';
import styles from './Insights.module.css';

const RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
];

export function Insights() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getFarmerInsights(range);
      setData(res?.data || null);
    } catch (err) {
      setError(err?.message || 'Could not load sales insights.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Format daily orders for the BarChart component & calculate peak day
  const { chartData, peakDay, totalItemsSold } = useMemo(() => {
    let peak = null;
    let itemsSold = 0;

    const list = (data?.ordersByDay || []).map((d) => {
      const parts = d.date.split('-');
      const shortLabel = parts.length === 3 ? `${parts[1]}/${parts[2]}` : d.date;

      if (!peak || d.orders > peak.orders) {
        peak = {
          date: shortLabel,
          orders: d.orders,
          revenueCents: d.revenueCents || 0,
        };
      }

      return {
        label: shortLabel,
        value: d.orders,
        valueLabel: `${d.orders} ${d.orders === 1 ? 'order' : 'orders'} (${formatPrice(d.revenueCents)})`,
      };
    });

    (data?.bestSellers || []).forEach((b) => {
      itemsSold += b.quantity || 0;
    });

    return { chartData: list, peakDay: peak, totalItemsSold: itemsSold };
  }, [data]);

  // Derived metrics
  const completionRate = useMemo(() => {
    const total = data?.totalOrders || 0;
    const completed = data?.completedOrders || total;
    if (total === 0) return 100;
    return Math.round((completed / total) * 100);
  }, [data]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeRow}>
            <span className={styles.liveBadge}>
              <span className={styles.pulseDot} /> Telemetry & Analytics
            </span>
          </div>
          <h1 className={styles.title}>Sales & Demand Insights</h1>
          <p className={styles.subtitle}>
            Analyze harvest sales volume, market day performance, and top customer favorites.
          </p>
        </div>

        <div className={styles.rangeSelectorWrap}>
          <SegmentedControl
            options={RANGES}
            value={range}
            onChange={setRange}
            aria-label="Insights date range"
          />
        </div>
      </header>

      {loading ? (
        <div className={styles.skeletonBox}>
          <div className={styles.skeletonGrid}>
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
            <Skeleton height="110px" />
          </div>
          <Skeleton height="260px" />
          <Skeleton height="200px" />
        </div>
      ) : error ? (
        <ErrorState title="Couldn't load sales telemetry" text={error} onRetry={loadInsights} />
      ) : (data?.totalOrders ?? 0) === 0 && (data?.revenueCents ?? 0) === 0 ? (
        <div className={styles.emptyWrap}>
          <EmptyState
            illustration="basket"
            title={`No sales activity in ${range.replace('d', ' days')}`}
            text="Try extending your time window to 90 days or promote your market stall to collect customer pre-orders."
            actionLabel={range !== '90d' ? 'View 90 Days' : undefined}
            onAction={range !== '90d' ? () => setRange('90d') : undefined}
          />
        </div>
      ) : (
        <>
          {/* Key Numbers Bento Grid */}
          <section className={styles.kpiGrid} aria-label="Key performance metrics">
            {/* Revenue */}
            <div className={styles.kpiCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Gross Revenue</span>
                <span className={`${styles.iconWrap} ${styles.iconBeet}`}>
                  <DollarSign size={16} />
                </span>
              </div>
              <div className={styles.cardValueRow}>
                <span className={styles.cardValue}>
                  {formatPrice(data?.revenueCents ?? 0)}
                </span>
              </div>
              <div className={styles.cardMeta}>
                <span>Collected across completed market orders</span>
              </div>
            </div>

            {/* Total Orders */}
            <div className={styles.kpiCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Order Volume</span>
                <span className={styles.iconWrap}>
                  <ShoppingBag size={16} />
                </span>
              </div>
              <div className={styles.cardValueRow}>
                <span className={styles.cardValue}>{data?.totalOrders ?? 0}</span>
                <span className={styles.cardUnit}>orders</span>
              </div>
              <div className={styles.cardMeta}>
                <span className={styles.rateTag}>{completionRate}% fulfilled</span>
                <span>{data?.pendingOrders ?? 0} pending action</span>
              </div>
            </div>

            {/* Average Order Value */}
            <div className={styles.kpiCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Avg. Basket Size</span>
                <span className={`${styles.iconWrap} ${styles.iconSuccess}`}>
                  <TrendingUp size={16} />
                </span>
              </div>
              <div className={styles.cardValueRow}>
                <span className={styles.cardValue}>
                  {formatPrice(data?.averageOrderCents ?? 0)}
                </span>
                <span className={styles.cardUnit}>/ order</span>
              </div>
              <div className={styles.cardMeta}>
                <span>Typical customer spend per market pickup</span>
              </div>
            </div>

            {/* Repeat Customers */}
            <div className={styles.kpiCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardLabel}>Loyal Patrons</span>
                <span className={`${styles.iconWrap} ${styles.iconAmber}`}>
                  <Users size={16} />
                </span>
              </div>
              <div className={styles.cardValueRow}>
                <span className={styles.cardValue}>{data?.repeatCustomers ?? 0}</span>
                <span className={styles.cardUnit}>repeat buyers</span>
              </div>
              <div className={styles.cardMeta}>
                <span>Customers ordering multiple times from your stall</span>
              </div>
            </div>
          </section>

          {/* Daily Trend Chart Section */}
          <section className={styles.chartSection}>
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBlock}>
                <div className={styles.sectionIconWrap}>
                  <TrendingUp size={18} />
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Daily Pre-Order Velocity</h2>
                  <p className={styles.sectionSubtitle}>
                    Order distribution over the last {range.replace('d', ' days')}
                  </p>
                </div>
              </div>

              {peakDay && peakDay.orders > 0 && (
                <div className={styles.peakBadge}>
                  <Flame size={14} className={styles.flameIcon} />
                  <span>
                    Busiest Day: <strong>{peakDay.date}</strong> ({peakDay.orders} orders)
                  </span>
                </div>
              )}
            </div>

            <div className={styles.chartBox}>
              <BarChart
                data={chartData}
                height={180}
                ariaLabel={`Orders per day over the last ${range.replace('d', ' days')}`}
                valueFormatter={(v) => `${v} orders`}
              />
            </div>
          </section>

          {/* 4. 🏆 Best-Selling Products Section */}
          <section className={styles.bestSellersSection} aria-label="Best-selling products">
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitleBlock}>
                <div className={`${styles.sectionIconWrap} ${styles.iconBeet}`}>
                  <Award size={18} />
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>🏆 Best-Selling Products</h2>
                  <p className={styles.sectionSubtitle}>
                    Real performance metrics computed directly from verified customer orders
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.topProductsCard}>
              <div className={styles.topProductsHeaderRow}>
                <h3 className={styles.topProductsHeading}>
                  <span>Your Top Products</span>
                </h3>
                <span className={styles.topProductsContext}>Ranked by order volume & demand</span>
              </div>

              {!data?.bestSellers || data.bestSellers.length === 0 ? (
                <div className={styles.emptyBox}>
                  <ShoppingBag size={24} className={styles.emptyIcon} aria-hidden="true" />
                  <p>No fulfilled orders recorded in this date range.</p>
                </div>
              ) : (
                <>
                  <div className={styles.bestList}>
                    {data.bestSellers.slice(0, 5).map((item, index) => {
                      const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                      const orderPct = item.orderPercentage ?? (
                        data.totalOrders > 0
                          ? Math.round(((item.ordersCount || item.quantity || 1) / data.totalOrders) * 100)
                          : 0
                      );

                      return (
                        <div key={item.productId || index} className={styles.bestCard}>
                          <div className={styles.rankPill}>
                            <span
                              className={`${styles.rankBadge} ${
                                index === 0 ? styles.rankGold : index === 1 ? styles.rankSilver : index === 2 ? styles.rankBronze : ''
                              }`}
                              title={`Rank ${index + 1}`}
                            >
                              <span className={styles.medalEmoji}>{medalEmoji}</span>
                            </span>
                          </div>

                          <div className={styles.itemCol}>
                            <div className={styles.itemNameRow}>
                              <span className={styles.itemName}>{item.name}</span>
                              <div className={styles.itemBadgeGroup}>
                                {orderPct > 0 && (
                                  <span className={styles.orderPctBadge}>
                                    {orderPct}% of orders
                                  </span>
                                )}
                                <span className={styles.itemUnits}>{item.quantity} units sold</span>
                              </div>
                            </div>

                            {/* Order Percentage Progress Track */}
                            <div className={styles.shareTrack}>
                              <div
                                className={`${styles.shareFill} ${
                                  index === 0
                                    ? styles.fillGold
                                    : index === 1
                                    ? styles.fillSilver
                                    : index === 2
                                    ? styles.fillBronze
                                    : ''
                                }`}
                                style={{ width: `${Math.max(10, Math.min(100, orderPct || 10))}%` }}
                              />
                            </div>
                          </div>

                          <div className={styles.revenueCol}>
                            <span className={styles.itemRev}>{formatPrice(item.revenueCents)}</span>
                            <span className={styles.revLabel}>total yield</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Headline Callout calculated from real data */}
                  {(data?.topProductSummary || (data?.bestSellers?.[0] && data?.totalOrders > 0)) && (
                    <div className={styles.bestSellerHeadlineBox}>
                      <div className={styles.headlineIconBox} aria-hidden="true">
                        🏆
                      </div>
                      <div className={styles.headlineTextBox}>
                        <p className={styles.headlineText}>
                          {data?.topProductSummary ||
                            `${data.bestSellers[0].name} generated ${
                              data.bestSellers[0].orderPercentage ||
                              Math.round(((data.bestSellers[0].ordersCount || data.bestSellers[0].quantity) / data.totalOrders) * 100)
                            }% of your orders this month.`}
                        </p>
                        <span className={styles.headlineMeta}>
                          Calculated from real order volume in your database
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Insights;
