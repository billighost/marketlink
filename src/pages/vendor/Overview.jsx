import React, { useState } from 'react';
import {
  Download,
  Eye,
  Clock,
  DollarSign,
  Boxes,
  AlertCircle,
  CalendarDays,
  RefreshCw,
  Minus,
  Plus,
  ChevronRight,
} from 'lucide-react';
import styles from './Overview.module.css';

/* ─── Static demo data ────────────────────────────────────────────────────── */

const STAT_CARDS = [
  {
    id: 'total-orders',
    label: 'Total Orders',
    value: '42',
    sub: '+18% vs. previous market run',
    subPositive: true,
    icon: Clock,
  },
  {
    id: 'pending-review',
    label: 'Pending Review',
    value: '8',
    tag: 'Needs Action',
    sub: 'Accept by 6:00 PM cutoff',
    icon: AlertCircle,
    urgent: true,
  },
  {
    id: 'reserved-value',
    label: 'Reserved Value',
    value: '$1,485.50',
    sub: 'Stall Collection · Pay-at-pickup on Saturday',
    icon: DollarSign,
  },
  {
    id: 'active-inventory',
    label: 'Active Inventory',
    value: '16',
    tag: '3 Low Stock',
    sub: '4 fresh seasonal harvests',
    icon: Boxes,
    warning: true,
  },
];

const ORDERS = [
  {
    id: 'CR-8821',
    customer: 'Marta Lin',
    slot: '8:30 AM – 9:00 AM',
    items: 'Heirloom...',
    total: '$20.25',
    payment: 'Stall Cash/Card',
    status: 'Placed',
    action: 'Accept',
  },
  {
    id: 'CR-8820',
    customer: 'David Chen',
    slot: '9:00 AM – 9:30 AM',
    items: 'Wildflow...',
    total: '$18.50',
    payment: 'Prepaid Online',
    status: 'Accepted',
    action: 'Mark Ready',
  },
  {
    id: 'CR-8819',
    customer: 'Sarah Jenkins',
    slot: '10:15 AM – 10:45 AM',
    items: 'Heirloom...',
    total: '$32.25',
    payment: 'Stall Cash/Card',
    status: 'Packing',
    action: 'Complete Pack',
  },
  {
    id: 'CR-8818',
    customer: 'James Robertson',
    slot: '11:30 AM – 12:00 PM',
    items: 'Honeycri...',
    total: '$30.00',
    payment: 'Stall Cash/Card',
    status: 'Placed',
    action: 'Accept',
  },
];

const TOP_SELLING = [
  {
    id: 'ts-1',
    emoji: '🍅',
    name: 'Cherokee Purple Tomatoes',
    price: '$4.50 / lb',
    reserved: 68,
    total: 74,
    pct: 92,
    label: '92% reserved',
  },
  {
    id: 'ts-2',
    emoji: '🍎',
    name: 'Honeycrisp Mountain Apples',
    price: '$3.75 / lb',
    reserved: 45,
    total: 52,
    pct: 85,
    label: '85% reserved',
  },
  {
    id: 'ts-3',
    emoji: '🍯',
    name: 'Raw Wildflower Honey (16oz)',
    price: '$12.00 / jar',
    reserved: 18,
    total: 18,
    pct: 100,
    soldOut: true,
    label: 'Sold Out',
  },
  {
    id: 'ts-4',
    emoji: '🥬',
    name: 'Fresh Lacinato Kale',
    price: '$3.25 / bunch',
    reserved: 24,
    total: 40,
    pct: 60,
    label: '60% reserved',
  },
];

const QUICK_ADJUST = [
  { id: 'qa-peppers', name: 'Sweet Bell Peppers', sub: 'Current quota: 14 lbs', qty: 14 },
  { id: 'qa-chard', name: 'Rainbow Chard', sub: 'Low: 4 bunches', qty: 4, low: true },
];

const CUSTOMER_NOTES = [
  {
    id: 'cn-1',
    customer: 'Marta Lin',
    order: '#8821',
    slot: '8:30 AM Slot',
    note: '"Please pack firmer heirloom tomatoes if possible—using them for a dinner salad Sunday night!"',
  },
  {
    id: 'cn-2',
    customer: 'David Chen',
    order: '#8820',
    slot: '9:00 AM Slot',
    note: '"Will arrive right at 9:00 AM sharp before soccer practice. Thank you Elias!"',
  },
];

const MARKETS = [
  {
    id: 'market-1',
    badge: 'This Saturday',
    stallNo: '#14',
    name: 'Grandview Farmers Market',
    location: 'Grandview Square, Main Promenade',
    time: '8:00 AM – 1:00 PM',
    preorders: 42,
    active: true,
  },
  {
    id: 'market-2',
    badge: 'Upcoming Wednesday',
    stallNo: '#06',
    name: 'Midweek Plaza Market',
    location: 'Arts District Civic Center',
    time: '3:00 PM – 7:00 PM',
    preorders: 18,
    active: false,
  },
];

/* ─── Status pill helper ─────────────────────────────────────────────────── */

function statusClass(status) {
  switch (status) {
    case 'Accepted':  return styles.statusAccepted;
    case 'Packing':   return styles.statusPacking;
    default:          return styles.statusPlaced;
  }
}

function actionClass(action) {
  if (action === 'Accept') return styles.actionAccept;
  return styles.actionDefault;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export function Overview() {
  const [qtys, setQtys] = useState(
    Object.fromEntries(QUICK_ADJUST.map((i) => [i.id, i.qty]))
  );
  const [orderStatuses, setOrderStatuses] = useState(
    Object.fromEntries(ORDERS.map((o) => [o.id, { status: o.status, action: o.action }]))
  );
  const [soldOut, setSoldOut] = useState({ 'qa-chard': false });

  const adjust = (id, delta) => {
    setQtys((prev) => ({ ...prev, [id]: Math.max(0, prev[id] + delta) }));
  };

  const handleAction = (orderId, action) => {
    setOrderStatuses((prev) => {
      const next = { ...prev };
      if (action === 'Accept')       next[orderId] = { status: 'Accepted',  action: 'Mark Ready' };
      else if (action === 'Mark Ready') next[orderId] = { status: 'Packing', action: 'Complete Pack' };
      else                           next[orderId] = { status: 'Complete', action: '—' };
      return next;
    });
  };

  return (
    <div className={styles.page}>
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <p className={styles.pageStatus}>
            <span className={styles.statusDotGreen} />
            Active Stall #14 · Verified Grower Member
          </p>
          <h1 className={styles.greeting}>Good morning, Elias</h1>
          <p className={styles.greetingSub}>
            Cedar Ridge Farm · Next Fulfillment:{' '}
            <strong>Grandview Farmers Market</strong> (Saturday, Oct 14 · 8:00 AM – 1:00 PM)
          </p>
        </div>

        <div className={styles.pageHeaderRight}>
          <div className={styles.cutoffBox}>
            <p className={styles.cutoffLabel}>Pre-Order Cutoff</p>
            <p className={styles.cutoffTime}>Friday 6:00 PM (14h 22m left)</p>
          </div>
          <div className={styles.pageActions}>
            <button className={styles.btnExport}>
              <Download size={15} />
              Export Packing Slips
            </button>
            <button className={styles.btnReview}>
              <Eye size={15} />
              Review 8 New
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────── */}
      <div className={styles.statGrid}>
        {STAT_CARDS.map(({ id, label, value, sub, tag, icon: Icon, urgent, warning, subPositive }) => (
          <div key={id} className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>{label}</span>
              <Icon
                size={16}
                className={`${styles.statIcon} ${urgent ? styles.statIconUrgent : ''} ${warning ? styles.statIconWarning : ''}`}
              />
            </div>
            <div className={styles.statValue}>{value}</div>
            {tag && (
              <span className={`${styles.statTag} ${urgent ? styles.statTagUrgent : ''} ${warning ? styles.statTagWarning : ''}`}>
                {tag}
              </span>
            )}
            <p className={`${styles.statSub} ${subPositive ? styles.statSubPositive : ''}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Two column grid ─────────────────────────────────────── */}
      <div className={styles.twoCol}>
        {/* LEFT COLUMN */}
        <div className={styles.leftCol}>
          {/* Incoming Pre-Orders table */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>
                  <span className={styles.orangeDot} />
                  Incoming Pre-Orders
                </h2>
                <p className={styles.cardSub}>12 pending fulfillment</p>
              </div>
              <div className={styles.orderTabs}>
                <button className={styles.tabAll}>All (42)</button>
                <button className={styles.tabActive}>Unaccepted (8)</button>
                <button className={styles.tabGhost}>Packing (15)</button>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Customer &amp; Window</th>
                    <th>Harvest Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ORDERS.map((order) => {
                    const current = orderStatuses[order.id];
                    return (
                      <tr key={order.id}>
                        <td>
                          <span className={styles.customerName}>{order.customer}</span>
                          <span className={styles.customerSlot}>Slot: {order.slot}</span>
                        </td>
                        <td>
                          <span className={styles.itemName}>{order.items}</span>
                          <span className={styles.orderNum}>Order #{order.id}</span>
                        </td>
                        <td>
                          <span className={styles.orderTotal}>{order.total}</span>
                          <span className={styles.orderPayment}>{order.payment}</span>
                        </td>
                        <td>
                          <span className={`${styles.statusPill} ${statusClass(current.status)}`}>
                            {current.status}
                          </span>
                        </td>
                        <td>
                          {current.action !== '—' && (
                            <button
                              className={`${styles.actionBtn} ${actionClass(current.action)}`}
                              onClick={() => handleAction(order.id, current.action)}
                            >
                              {current.action}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <span>Showing 4 of 12 recent pre-orders</span>
              <a href="#" className={styles.viewAll}>
                View All Incoming Orders <ChevronRight size={13} />
              </a>
            </div>
          </div>

          {/* Upcoming Market Schedule */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Upcoming Market Schedule</h2>
              <button className={styles.syncBtn}>
                <RefreshCw size={13} />
                Sync with Calendar
              </button>
            </div>
            <div className={styles.marketGrid}>
              {MARKETS.map((m) => (
                <div key={m.id} className={`${styles.marketCard} ${m.active ? styles.marketCardActive : ''}`}>
                  <div className={styles.marketCardTop}>
                    <span className={`${styles.marketBadge} ${m.active ? styles.marketBadgeActive : styles.marketBadgeMuted}`}>
                      {m.badge}
                    </span>
                    <span className={styles.marketStall}>{m.stallNo}</span>
                  </div>
                  <h3 className={styles.marketName}>{m.name}</h3>
                  <p className={styles.marketLocation}>{m.location}</p>
                  <div className={styles.marketMeta}>
                    <span className={styles.marketMetaItem}>
                      <Clock size={12} />
                      {m.time}
                    </span>
                    <span className={styles.marketMetaItem}>
                      <CalendarDays size={12} />
                      {m.preorders} Pre-Orders
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightCol}>
          {/* Top Selling Harvest */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Top Selling Harvest</h2>
                <p className={styles.cardSub}>Saturday Market Quota Progress</p>
              </div>
            </div>
            <ul className={styles.harvestList} role="list">
              {TOP_SELLING.map((item) => (
                <li key={item.id} className={styles.harvestItem}>
                  <span className={styles.harvestEmoji}>{item.emoji}</span>
                  <div className={styles.harvestInfo}>
                    <div className={styles.harvestRow}>
                      <span className={styles.harvestName}>{item.name}</span>
                      <span className={styles.harvestReserved}>{item.label}</span>
                    </div>
                    <div className={styles.harvestRow}>
                      <span className={styles.harvestPrice}>{item.price}</span>
                      <span className={styles.harvestFraction}>{item.reserved} / {item.total}</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={`${styles.progressFill} ${item.soldOut ? styles.progressSoldOut : item.pct >= 85 ? styles.progressHigh : ''}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Harvest Adjust */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Quick Harvest Adjust</h2>
              <span className={styles.liveTag}>Live Stall Sync</span>
            </div>
            <ul className={styles.adjustList} role="list">
              {QUICK_ADJUST.map((item) => (
                <li key={item.id} className={styles.adjustItem}>
                  <div className={styles.adjustInfo}>
                    <span className={styles.adjustName}>{item.name}</span>
                    <span className={styles.adjustSub}>{item.sub}</span>
                  </div>
                  <div className={styles.adjustControls}>
                    <button
                      className={styles.adjustBtn}
                      onClick={() => adjust(item.id, -1)}
                      aria-label={`Decrease ${item.name}`}
                    >
                      <Minus size={13} />
                    </button>
                    <span className={styles.adjustQty}>{qtys[item.id]}</span>
                    <button
                      className={styles.adjustBtn}
                      onClick={() => adjust(item.id, 1)}
                      aria-label={`Increase ${item.name}`}
                    >
                      <Plus size={13} />
                    </button>
                    {item.low ? (
                      <button
                        className={`${styles.adjustAction} ${soldOut[item.id] ? styles.adjustActionSoldOut : styles.adjustActionHalt}`}
                        onClick={() => setSoldOut((p) => ({ ...p, [item.id]: !p[item.id] }))}
                      >
                        {soldOut[item.id] ? 'Restock' : 'Sold Out'}
                      </button>
                    ) : (
                      <button className={`${styles.adjustAction} ${styles.adjustActionHalt}`}>
                        Halt
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Harvest Notes */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Customer Harvest Notes</h2>
              <span className={styles.noteCount}>2 instructions</span>
            </div>
            <ul className={styles.notesList} role="list">
              {CUSTOMER_NOTES.map((note) => (
                <li key={note.id} className={styles.noteItem}>
                  <div className={styles.noteHeader}>
                    <span className={styles.noteCustomer}>
                      {note.customer} (Order {note.order})
                    </span>
                    <span className={styles.noteSlot}>{note.slot}</span>
                  </div>
                  <p className={styles.noteText}>{note.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;
