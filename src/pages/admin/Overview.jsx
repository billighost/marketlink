import React from 'react';
import {
  Users,
  Store,
  DollarSign,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  MoreVertical,
  ChevronRight,
} from 'lucide-react';
import styles from './Overview.module.css';

/* ─── Static demo data ─────────────────────────────────────────────────── */

const STATS = [
  {
    id: 'users',
    label: 'Total Users',
    value: '8,431',
    change: '+2.5%',
    trend: 'up',
    sub: 'vs. last month',
    icon: Users,
  },
  {
    id: 'vendors',
    label: 'Active Vendors',
    value: '1,156',
    change: '+1.8%',
    trend: 'up',
    sub: 'vs. last month',
    icon: Store,
  },
  {
    id: 'gmv',
    label: 'Total GMV',
    value: '₦12,875,000',
    change: '+6.1%',
    trend: 'up',
    sub: 'current month',
    icon: DollarSign,
  },
  {
    id: 'tickets',
    label: 'Open Tickets',
    value: '43',
    change: '-12%',
    trend: 'down',
    sub: 'vs. last week',
    icon: AlertCircle,
  },
];

const ACTIVITY = [
  {
    id: '#1004',
    type: 'Vendor Registration',
    vendor: 'Green Valley Farms',
    date: '2026-09-24 10:15',
    amount: '—',
    status: 'Approved',
  },
  {
    id: '#1003',
    type: 'New Order',
    vendor: 'Emily R.',
    date: '2026-09-24 09:30',
    amount: '₦45,075',
    status: 'Completed',
  },
  {
    id: '#1002',
    type: 'Support Ticket',
    vendor: 'Harvest Tech',
    date: '2026-09-24 08:45',
    amount: '—',
    status: 'Open',
  },
  {
    id: '#1001',
    type: 'Vendor Payout',
    vendor: 'AgroCorp',
    date: '2026-09-23 16:12',
    amount: '₦823,050',
    status: 'Processed',
  },
  {
    id: '#1000',
    type: 'New Product Listing',
    vendor: 'Sunny Fields',
    date: '2026-09-23 14:20',
    amount: '—',
    status: 'Pending',
  },
  {
    id: '#0999',
    type: 'Vendor Registration',
    vendor: 'Riverbend Farm',
    date: '2026-09-23 11:05',
    amount: '—',
    status: 'Approved',
  },
];

function getStatusClass(status) {
  switch (status) {
    case 'Approved':
    case 'Completed':
      return styles.statusSuccess;
    case 'Open':
    case 'Pending':
      return styles.statusWarning;
    case 'Processed':
      return styles.statusNeutral;
    default:
      return styles.statusNeutral;
  }
}

export default function Overview() {
  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.greeting}>Dashboard Overview</h1>
          <p className={styles.greetingSub}>
            Welcome back. Here's what's happening on the platform today.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statGrid}>
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{stat.label}</span>
                <Icon size={18} className={styles.statIcon} />
              </div>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statBottom}>
                <span className={`${styles.statChange} ${stat.trend === 'up' ? styles.changeUp : styles.changeDown}`}>
                  {stat.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {stat.change}
                </span>
                <span className={styles.statSub}>{stat.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Recent Platform Activity</h2>
            <p className={styles.cardSub}>Latest actions across the marketplace</p>
          </div>
          <button className={styles.viewAllBtn}>
            View all <ChevronRight size={14} />
          </button>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>User / Vendor</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ACTIVITY.map((item) => (
                <tr key={item.id}>
                  <td className={styles.tdMono}>{item.id}</td>
                  <td>{item.type}</td>
                  <td className={styles.tdBold}>{item.vendor}</td>
                  <td className={styles.tdMuted}>{item.date}</td>
                  <td className={styles.tdBold}>{item.amount}</td>
                  <td>
                    <span className={`${styles.statusPill} ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button className={styles.iconBtn}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFooter}>
          <span>Showing 6 of 215 entries</span>
          <div className={styles.pagination}>
            <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
            <button className={styles.pageBtn}>2</button>
            <button className={styles.pageBtn}>3</button>
            <span className={styles.pageEllipsis}>…</span>
            <button className={styles.pageBtn}>22</button>
          </div>
        </div>
      </div>
    </div>
  );
}
