import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import styles from './Reports.module.css';

const PERIOD_OPTIONS = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'This year'];

const SUMMARY = [
  { label: 'Total Revenue', value: '₦12,875,000', change: '+6.1%', trend: 'up', icon: DollarSign },
  { label: 'Total Orders', value: '3,842', change: '+12.3%', trend: 'up', icon: ShoppingCart },
  { label: 'New Users', value: '412', change: '+8.7%', trend: 'up', icon: Users },
  { label: 'Products Listed', value: '1,024', change: '-2.1%', trend: 'down', icon: Package },
];

const TOP_VENDORS = [
  { rank: 1, name: 'Green Valley Farms', revenue: '₦1,245,000', orders: 312 },
  { rank: 2, name: 'Hollow Creek Apiary', revenue: '₦980,500', orders: 254 },
  { rank: 3, name: 'Riverbend Farm', revenue: '₦875,200', orders: 198 },
  { rank: 4, name: 'Oak & Mill Bakery', revenue: '₦720,000', orders: 187 },
  { rank: 5, name: 'Farmer Ayomide', revenue: '₦685,300', orders: 165 },
];

const TOP_PRODUCTS = [
  { rank: 1, name: 'Heirloom Tomatoes', vendor: 'Green Valley Farms', sold: 840 },
  { rank: 2, name: 'Raw Wildflower Honey', vendor: 'Hollow Creek Apiary', sold: 625 },
  { rank: 3, name: 'Sourdough Bread', vendor: 'Oak & Mill Bakery', sold: 510 },
  { rank: 4, name: 'Free-Range Eggs', vendor: 'Riverbend Farm', sold: 480 },
  { rank: 5, name: 'Organic Spinach', vendor: 'Farmer Ayomide', sold: 390 },
];

export default function Reports() {
  const [period, setPeriod] = useState('Last 30 days');

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>Platform performance and insights.</p>
        </div>
        <select
          className={styles.periodSelect}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {PERIOD_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      <div className={styles.statGrid}>
        {SUMMARY.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statLabel}>{stat.label}</span>
                <Icon size={18} className={styles.statIcon} />
              </div>
              <div className={styles.statValue}>{stat.value}</div>
              <span className={`${styles.statChange} ${stat.trend === 'up' ? styles.changeUp : styles.changeDown}`}>
                {stat.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stat.change}
              </span>
            </div>
          );
        })}
      </div>

      {/* Two-column: Top Vendors & Top Products */}
      <div className={styles.twoCol}>
        {/* Top Vendors */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Top Vendors</h2>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Vendor</th>
                <th>Revenue</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {TOP_VENDORS.map((v) => (
                <tr key={v.rank}>
                  <td className={styles.tdMuted}>{v.rank}</td>
                  <td className={styles.tdBold}>{v.name}</td>
                  <td>{v.revenue}</td>
                  <td className={styles.tdMuted}>{v.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Products */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Top Products</h2>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Vendor</th>
                <th>Sold</th>
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((p) => (
                <tr key={p.rank}>
                  <td className={styles.tdMuted}>{p.rank}</td>
                  <td className={styles.tdBold}>{p.name}</td>
                  <td className={styles.tdMuted}>{p.vendor}</td>
                  <td>{p.sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
