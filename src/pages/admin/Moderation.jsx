import React, { useState } from 'react';
import { ShieldCheck, Check, X, Eye, MessageSquare } from 'lucide-react';
import styles from './Moderation.module.css';

const QUEUE = [
  {
    id: 'MOD-301',
    type: 'Product Listing',
    subject: 'Organic Honey — Raw Wildflower 500ml',
    submittedBy: 'Hollow Creek Apiary',
    date: '2026-09-24',
    reason: 'New listing review',
  },
  {
    id: 'MOD-300',
    type: 'Vendor Application',
    subject: 'Sunrise Orchards — New vendor registration',
    submittedBy: 'Sunrise Orchards',
    date: '2026-09-24',
    reason: 'Identity verification',
  },
  {
    id: 'MOD-299',
    type: 'Report',
    subject: 'Customer reported misleading product photo',
    submittedBy: 'Marta Lin',
    date: '2026-09-23',
    reason: 'Content dispute',
  },
  {
    id: 'MOD-298',
    type: 'Product Listing',
    subject: 'Artisan Sourdough Bread — Walnut & Raisin',
    submittedBy: 'Oak & Mill Bakery',
    date: '2026-09-23',
    reason: 'New listing review',
  },
  {
    id: 'MOD-297',
    type: 'Report',
    subject: 'Vendor not fulfilling pre-orders consistently',
    submittedBy: 'David Chen',
    date: '2026-09-22',
    reason: 'Vendor complaint',
  },
];

function getTypeBadge(type, s) {
  switch (type) {
    case 'Product Listing': return s.typeListing;
    case 'Vendor Application': return s.typeVendor;
    case 'Report': return s.typeReport;
    default: return '';
  }
}

export default function Moderation() {
  const [queue, setQueue] = useState(QUEUE);

  const handleAction = (id, action) => {
    setQueue(prev => prev.filter(item => item.id !== id));
    console.log(`${action} item ${id}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Moderation</h1>
          <p className={styles.subtitle}>Review pending listings, applications, and reports.</p>
        </div>
        <div className={styles.queueCount}>
          <ShieldCheck size={18} />
          <span>{queue.length} items in queue</span>
        </div>
      </div>

      <div className={styles.card}>
        {queue.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className={styles.emptyIllustration}>
              <circle cx="60" cy="60" r="48" fill="var(--color-canvas, #F5EFE3)" />
              <path d="M48 62L56 70L76 48" stroke="var(--color-herb, #5C7048)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M38 38L28 28M82 38L92 28M38 82L28 92M82 82L92 92" stroke="var(--color-wood-line, #E3D3B8)" strokeWidth="3" strokeLinecap="round" />
              <circle cx="95" cy="60" r="4" fill="var(--color-wood-line, #E3D3B8)" />
              <circle cx="25" cy="60" r="4" fill="var(--color-wood-line, #E3D3B8)" />
            </svg>
            <h3>All clear!</h3>
            <p>No items pending moderation right now.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {queue.map((item) => (
              <div key={item.id} className={styles.listItem}>
                <div className={styles.itemMain}>
                  <div className={styles.itemTop}>
                    <span className={`${styles.typeBadge} ${getTypeBadge(item.type, styles)}`}>
                      {item.type}
                    </span>
                    <span className={styles.itemDate}>{item.date}</span>
                  </div>
                  <h4 className={styles.itemSubject}>{item.subject}</h4>
                  <div className={styles.itemMeta}>
                    <span>by {item.submittedBy}</span>
                    <span className={styles.metaSep}>·</span>
                    <span>{item.reason}</span>
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <button
                    className={styles.btnApprove}
                    onClick={() => handleAction(item.id, 'Approved')}
                    title="Approve"
                  >
                    <Check size={16} /> Approve
                  </button>
                  <button
                    className={styles.btnReject}
                    onClick={() => handleAction(item.id, 'Rejected')}
                    title="Reject"
                  >
                    <X size={16} /> Reject
                  </button>
                  <button className={styles.btnView} title="View details">
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
