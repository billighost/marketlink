import React, { useState, useEffect, useCallback } from 'react';
import { getFarmerInsights } from '@/api/farmer';
import { formatPrice } from '@/utils/format';
import SegmentedControl from '@/components/ui/SegmentedControl';
import BarChart from '@/components/domain/BarChart';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { TrendingUp, Award, ShoppingBag } from 'lucide-react';
import styles from './Insights.module.css';

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
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

  // Format daily orders for the BarChart component
  const chartData = (data?.ordersByDay || []).map((d) => {
    const parts = d.date.split('-');
    const shortLabel = parts.length === 3 ? `${parts[1]}/${parts[2]}` : d.date;
    return {
      label: shortLabel,
      value: d.orders,
      valueLabel: `${d.orders} ${d.orders === 1 ? 'order' : 'orders'} (${formatPrice(d.revenueCents)})`,
    };
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Insights</h1>
        <SegmentedControl
          options={RANGES}
          value={range}
          onChange={setRange}
          aria-label="Insights date range"
        />
      </div>

      {loading ? (
        <div className={styles.skeletonBox}>
          <Skeleton height="80px" />
          <Skeleton height="180px" />
          <Skeleton height="120px" />
        </div>
      ) : error ? (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={loadInsights}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          {/* Key Numbers Row (Three only) */}
          <section className={styles.quickNumbersRow} aria-label="Key performance metrics">
            <div className={styles.numCol}>
              <span className={styles.numLabel}>Total orders</span>
              <span className={styles.numValue}>{data?.totalOrders ?? 0}</span>
            </div>
            <div className={styles.numCol}>
              <span className={styles.numLabel}>Pending orders</span>
              <span className={styles.numValue}>{data?.pendingOrders ?? 0}</span>
            </div>
            <div className={styles.numCol}>
              <span className={styles.numLabel}>Revenue</span>
              <span className={styles.numValue}>{formatPrice(data?.revenueCents ?? 0)}</span>
            </div>
          </section>

          {/* Secondary Stats Line */}
          <div className={styles.secondaryStatsLine}>
            <span>
              Average order value: <strong>{formatPrice(data?.averageOrderCents ?? 0)}</strong>
            </span>
            <span className={styles.bullet}>•</span>
            <span>
              Repeat customers: <strong>{data?.repeatCustomers ?? 0}</strong>
            </span>
          </div>

          {/* Orders Per Day Chart */}
          <section className={styles.chartSection}>
            <div className={styles.sectionHeader}>
              <TrendingUp size={18} aria-hidden="true" className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Orders per day</h2>
            </div>

            <div className={styles.chartBox}>
              <BarChart
                data={chartData}
                height={160}
                ariaLabel={`Orders per day over the last ${range.replace('d', ' days')}`}
                valueFormatter={(v) => `${v} orders`}
              />
            </div>
          </section>

          {/* Best Sellers Section */}
          <section className={styles.bestSellersSection}>
            <div className={styles.sectionHeader}>
              <Award size={18} aria-hidden="true" className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Best sellers</h2>
            </div>

            {!data?.bestSellers || data.bestSellers.length === 0 ? (
              <div className={styles.emptyBox}>
                <ShoppingBag size={20} className={styles.emptyIcon} aria-hidden="true" />
                <p>No fulfilled orders in this period.</p>
              </div>
            ) : (
              <div className={styles.bestList}>
                {data.bestSellers.slice(0, 5).map((item, index) => (
                  <div key={item.productId || index} className={styles.bestRow}>
                    <div className={styles.rankCol}>#{index + 1}</div>
                    <div className={styles.itemCol}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemUnits}>{item.quantity} sold</span>
                    </div>
                    <div className={styles.revenueCol}>
                      {formatPrice(item.revenueCents)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default Insights;
