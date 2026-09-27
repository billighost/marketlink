import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/admin/DataTable';
import { formatPrice, formatDate, formatTime } from '@/utils/format';
import styles from './Reports.module.css';

export function ReportsBreakdownTables({ summary, history, loading, range }) {
  const nf = useMemo(() => new Intl.NumberFormat('en-GB'), []);

  const [marketSort, setMarketSort] = useState({ key: 'revenueCents', direction: 'desc' });
  const [farmerSort, setFarmerSort] = useState({ key: 'orders', direction: 'desc' });
  const [historySort, setHistorySort] = useState({ key: 'generatedAt', direction: 'desc' });

  // Market table data with sorting
  const marketRows = useMemo(() => {
    const list = (summary?.revenueByMarket || []).map((m) => ({
      id: m.marketId || m.name,
      name: m.name || 'Unknown Market',
      orders: m.orders || 0,
      revenueCents: m.revenueCents || 0,
      avgOrderCents: m.orders > 0 ? Math.round(m.revenueCents / m.orders) : 0,
    }));

    if (!marketSort) return list;
    return [...list].sort((a, b) => {
      const mult = marketSort.direction === 'asc' ? 1 : -1;
      if (marketSort.key === 'name') {
        return mult * a.name.localeCompare(b.name);
      }
      return mult * ((a[marketSort.key] || 0) - (b[marketSort.key] || 0));
    });
  }, [summary?.revenueByMarket, marketSort]);

  // Market table totals (Sum row)
  const marketFooter = useMemo(() => {
    const list = summary?.revenueByMarket || [];
    const totalOrdersSum = list.reduce((s, m) => s + (m.orders || 0), 0);
    const totalRevSum = list.reduce((s, m) => s + (m.revenueCents || 0), 0);
    const avgSum = totalOrdersSum > 0 ? Math.round(totalRevSum / totalOrdersSum) : 0;

    return {
      name: 'Total',
      orders: nf.format(totalOrdersSum),
      revenueCents: formatPrice(totalRevSum),
      avgOrderCents: formatPrice(avgSum),
    };
  }, [summary?.revenueByMarket, nf]);

  const marketColumns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Market',
        sortable: true,
        render: (val) => (
          <Link to="/admin/markets" className={styles.tableLink}>
            {val}
          </Link>
        ),
      },
      {
        key: 'orders',
        header: 'Orders',
        align: 'right',
        sortable: true,
        render: (val) => nf.format(val),
      },
      {
        key: 'revenueCents',
        header: 'Collected',
        align: 'right',
        sortable: true,
        render: (val) => formatPrice(val),
      },
      {
        key: 'avgOrderCents',
        header: 'Avg order',
        align: 'right',
        sortable: true,
        render: (val) => formatPrice(val),
      },
    ],
    [nf]
  );

  // Farmers table data with sorting
  const farmerRows = useMemo(() => {
    const list = (summary?.mostActiveFarmers || []).map((f) => ({
      id: f.farmerId || f.stallName,
      farmerId: f.farmerId,
      stallName: f.stallName || 'Unknown Farmer',
      orders: f.orders || 0,
    }));

    if (!farmerSort) return list;
    return [...list].sort((a, b) => {
      const mult = farmerSort.direction === 'asc' ? 1 : -1;
      if (farmerSort.key === 'stallName') {
        return mult * a.stallName.localeCompare(b.stallName);
      }
      return mult * ((a[farmerSort.key] || 0) - (b[farmerSort.key] || 0));
    });
  }, [summary?.mostActiveFarmers, farmerSort]);

  const farmerColumns = useMemo(
    () => [
      {
        key: 'stallName',
        header: 'Stall',
        sortable: true,
        render: (val, row) => (
          <Link
            to={row.farmerId ? `/admin/people?tab=farmers&farmerId=${row.farmerId}` : '/admin/people?tab=farmers'}
            className={styles.tableLink}
          >
            {val}
          </Link>
        ),
      },
      {
        key: 'orders',
        header: 'Orders',
        align: 'right',
        sortable: true,
        render: (val) => nf.format(val),
      },
    ],
    [nf]
  );

  // History table data with sorting
  const historyRows = useMemo(() => {
    const list = history.map((h) => ({
      id: h.id,
      reportType: h.reportType ? h.reportType.charAt(0).toUpperCase() + h.reportType.slice(1) : 'Orders',
      range: h.params?.range || range,
      generatedAt: h.generatedAt,
      formattedDate: h.generatedAt ? `${formatDate(h.generatedAt)} · ${formatTime(h.generatedAt)}` : '—',
    }));

    if (!historySort) return list;
    return [...list].sort((a, b) => {
      const mult = historySort.direction === 'asc' ? 1 : -1;
      if (historySort.key === 'generatedAt') {
        return mult * (new Date(a.generatedAt || 0) - new Date(b.generatedAt || 0));
      }
      return mult * String(a[historySort.key] || '').localeCompare(String(b[historySort.key] || ''));
    });
  }, [history, historySort, range]);

  const historyColumns = useMemo(
    () => [
      { key: 'reportType', header: 'Type', sortable: true },
      { key: 'range', header: 'Range', sortable: true },
      { key: 'formattedDate', header: 'Generated at', sortable: true },
    ],
    []
  );

  return (
    <>
      {/* Revenue by market */}
      <section className={styles.section} aria-labelledby="heading-revenue-market">
        <div className={styles.headingGroup}>
          <h2 id="heading-revenue-market" className={styles.sectionHeading}>
            Revenue by market
          </h2>
          <p className={styles.cashNote}>
            Collected at the stall, in cash, when the order was completed.
          </p>
        </div>

        <DataTable
          columns={marketColumns}
          rows={marketRows}
          loading={loading && !summary}
          sort={marketSort}
          onSort={(key) =>
            setMarketSort((prev) => ({
              key,
              direction: prev?.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
            }))
          }
          footer={marketRows.length > 0 ? marketFooter : null}
          empty="No market revenue recorded in this period."
        />
      </section>

      {/* Most active farmers */}
      <section className={styles.section} aria-labelledby="heading-active-farmers">
        <h2 id="heading-active-farmers" className={styles.sectionHeading}>
          Most active farmers
        </h2>

        <DataTable
          columns={farmerColumns}
          rows={farmerRows}
          loading={loading && !summary}
          sort={farmerSort}
          onSort={(key) =>
            setFarmerSort((prev) => ({
              key,
              direction: prev?.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
            }))
          }
          empty="No farmer order activity recorded in this period."
        />
      </section>

      {/* Previous exports */}
      <section className={styles.section} aria-labelledby="heading-previous-exports">
        <h2 id="heading-previous-exports" className={styles.sectionHeading}>
          Previous exports
        </h2>

        <DataTable
          columns={historyColumns}
          rows={historyRows}
          loading={loading && !summary}
          sort={historySort}
          onSort={(key) =>
            setHistorySort((prev) => ({
              key,
              direction: prev?.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
            }))
          }
          empty="No exports yet."
        />
      </section>
    </>
  );
}

export default ReportsBreakdownTables;
