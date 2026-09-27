import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, ChevronDown } from 'lucide-react';
import {
  getAdminReportsSummary,
  getReportsHistory,
  exportAdminReport,
  exportAdminSalesCsv,
} from '@/api/admin';
import { AdminPage } from '@/components/admin/AdminPage';
import { StatTile } from '@/components/admin/StatTile';
import { BarChart } from '@/components/domain/BarChart';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import { formatPrice } from '@/utils/format';
import ReportsBreakdownTables from './ReportsBreakdownTables';
import styles from './Reports.module.css';

const RANGES = [
  { value: '7d', label: '7 days', descriptive: '7 days' },
  { value: '30d', label: '30 days', descriptive: '30 days' },
  { value: '90d', label: '90 days', descriptive: '90 days' },
  { value: '12m', label: '12 months', descriptive: '12 months' },
];

const VALID_RANGE_VALUES = new Set(['7d', '30d', '90d', '12m']);

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const urlRange = searchParams.get('range');
  const initialRange = VALID_RANGE_VALUES.has(urlRange) ? urlRange : '30d';
  const [range, setRange] = useState(initialRange);

  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Export dropdown state
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportingType, setExportingType] = useState(null);
  const exportBtnRef = useRef(null);
  const exportMenuRef = useRef(null);



  // Sync URL when range state changes
  const handleRangeChange = (newRange) => {
    setRange(newRange);
    setSearchParams({ range: newRange }, { replace: true });
  };

  // Sync state if URL changes externally
  useEffect(() => {
    if (urlRange && VALID_RANGE_VALUES.has(urlRange) && urlRange !== range) {
      setRange(urlRange);
    }
  }, [urlRange, range]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, histRes] = await Promise.all([
        getAdminReportsSummary(range),
        getReportsHistory().catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes?.data || null);
      setHistory(histRes?.data || []);
    } catch (err) {
      setError(err?.message || 'Could not load reports summary.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Export execution
  const handleExport = async (type) => {
    setExportMenuOpen(false);
    setExportingType(type);
    try {
      let blob;
      if (type === 'sales') {
        blob = await exportAdminSalesCsv(range);
      } else {
        blob = await exportAdminReport(type, range);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketlink-${type}-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showToast('Export downloaded.');

      // Refresh export history table
      const updatedHistory = await getReportsHistory().catch(() => null);
      if (updatedHistory?.data) {
        setHistory(updatedHistory.data);
      }
    } catch (err) {
      showToast('Export failed. Try a shorter range.');
      console.error('[Reports] export failed', err);
    } finally {
      setExportingType(null);
    }
  };

  // Keyboard navigation for Export Menu
  useEffect(() => {
    if (!exportMenuOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setExportMenuOpen(false);
        exportBtnRef.current?.focus();
        return;
      }

      const items = exportMenuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])');
      if (!items || items.length === 0) return;
      const index = Array.from(items).indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (index + 1) % items.length;
        items[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (index - 1 + items.length) % items.length;
        items[prev]?.focus();
      }
    };

    const handleClickOutside = (e) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(e.target) &&
        !exportBtnRef.current?.contains(e.target)
      ) {
        setExportMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    // Focus first item when opened
    const firstItem = exportMenuRef.current?.querySelector('[role="menuitem"]');
    firstItem?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportMenuOpen]);

  const nf = useMemo(() => new Intl.NumberFormat('en-US'), []);

  // Compute metrics
  const totalOrders = summary?.totalOrders ?? 0;
  const revenueCents = summary?.revenueCents ?? 0;

  const completedOrdersCount = useMemo(() => {
    const list = summary?.revenueByMarket || [];
    return list.reduce((acc, m) => acc + (m.orders || 0), 0);
  }, [summary?.revenueByMarket]);

  // Chart data from ordersByDay
  const chartData = useMemo(() => {
    const days = summary?.ordersByDay || [];
    return days.map((d) => {
      const parts = d.date ? d.date.split('-') : [];
      let label = d.date || '';
      if (parts.length === 3) {
        // e.g. 09-24 -> Sep 24
        const monthNum = parseInt(parts[1], 10);
        const dayNum = parseInt(parts[2], 10);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        label = `${monthNames[monthNum - 1] || parts[1]} ${dayNum}`;
      }
      return {
        label,
        value: d.orders || 0,
        valueLabel: `${nf.format(d.orders || 0)} orders`,
      };
    });
  }, [summary?.ordersByDay, nf]);



  const selectedRangeObj = RANGES.find((r) => r.value === range) || RANGES[1];
  const contextLine = `Platform activity for the last ${selectedRangeObj.descriptive}`;

  // Export Action button with menu
  const exportAction = (
    <div className={styles.exportContainer}>
      <button
        ref={exportBtnRef}
        type="button"
        className={styles.exportButton}
        onClick={() => setExportMenuOpen((open) => !open)}
        disabled={Boolean(exportingType)}
        aria-haspopup="menu"
        aria-expanded={exportMenuOpen}
        aria-label="Export reports menu"
      >
        <Download size={15} aria-hidden="true" />
        <span>{exportingType ? 'Preparing…' : 'Export'}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {exportMenuOpen && (
        <div ref={exportMenuRef} className={styles.exportMenu} role="menu" aria-label="Export options">
          <button
            type="button"
            role="menuitem"
            className={styles.exportMenuItem}
            onClick={() => handleExport('orders')}
          >
            Orders CSV
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.exportMenuItem}
            onClick={() => handleExport('revenue')}
          >
            Revenue CSV
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.exportMenuItem}
            onClick={() => handleExport('farmers')}
          >
            Farmers CSV
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.exportMenuItem}
            onClick={() => handleExport('sales')}
          >
            Sales CSV
          </button>
        </div>
      )}
    </div>
  );

  return (
    <AdminPage title="Reports" context={contextLine} action={exportAction}>
      <div className={styles.stack}>
        {/* Error panel */}
        {error && !summary && (
          <div className={styles.errorPanel} role="alert">
            <p className={styles.errorMessage}>{error}</p>
            <button type="button" className={styles.retryButton} onClick={loadData}>
              Retry
            </button>
          </div>
        )}

        {/* Range control + summary tiles: one visually grouped overview block */}
        <div className={styles.overview}>
          <div className={styles.rangeRow}>
            <SegmentedControl
              options={RANGES}
              value={range}
              onChange={handleRangeChange}
              name="reports-range"
            />
          </div>

          <section className={styles.metricsRow} aria-label="Report summary statistics">
            <StatTile
              value={loading && !summary ? '—' : nf.format(totalOrders)}
              label="Orders"
            />
            <StatTile
              value={loading && !summary ? '—' : formatPrice(revenueCents)}
              label="Collected"
            />
            <StatTile
              value={loading && !summary ? '—' : nf.format(completedOrdersCount)}
              label="Completed"
            />
          </section>
        </div>

        {/* Orders over time chart */}
        <section className={styles.section} aria-labelledby="heading-orders-chart">
          <h2 id="heading-orders-chart" className={styles.sectionHeading}>
            Orders over time
          </h2>
          <div className={styles.chartCard}>
            {loading && !summary ? (
              <div className={styles.chartSkeleton} />
            ) : chartData.length > 0 ? (
              <div className={styles.chartWrapper}>
                <BarChart
                  data={chartData}
                  height={180}
                  valueFormatter={(v) => `${nf.format(v)} orders`}
                  ariaLabel={`Orders over time chart for ${selectedRangeObj.descriptive}`}
                />
              </div>
            ) : (
              <p className={styles.emptyNote}>No order activity in this range.</p>
            )}
          </div>
        </section>

        <ReportsBreakdownTables
          summary={summary}
          history={history}
          loading={loading}
          range={range}
        />
      </div>
    </AdminPage>
  );
}