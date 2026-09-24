import React, { useState } from 'react';
import { Search, Filter, Eye, MoreVertical, ChevronRight, Ban, Trash2, CheckCircle } from 'lucide-react';
import styles from './People.module.css';

const USERS = [
  { id: 'U-2001', name: 'Marta Lin',        email: 'marta@email.com',       role: 'Customer', joined: '2026-08-15', status: 'Active' },
  { id: 'U-2002', name: 'David Chen',        email: 'david.c@email.com',     role: 'Customer', joined: '2026-07-22', status: 'Active' },
  { id: 'U-2003', name: 'Sarah Jenkins',     email: 'sarah.j@email.com',     role: 'Customer', joined: '2026-09-01', status: 'Active' },
  { id: 'U-2004', name: 'Farmer Ayomide',    email: 'ayomide@farm.com',      role: 'Farmer',   joined: '2026-06-10', status: 'Active' },
  { id: 'U-2005', name: 'Green Valley Farms',email: 'info@greenvalley.com',  role: 'Farmer',   joined: '2026-05-20', status: 'Active' },
  { id: 'U-2006', name: 'Oak & Mill Bakery', email: 'contact@oakmill.com',   role: 'Farmer',   joined: '2026-08-28', status: 'Pending' },
  { id: 'U-2007', name: 'James Okafor',      email: 'james.o@email.com',     role: 'Customer', joined: '2026-09-10', status: 'Suspended' },
  { id: 'U-2008', name: 'Hollow Creek Apiary',email: 'hello@hollowcreek.com',role: 'Farmer',   joined: '2026-04-18', status: 'Active' },
];

const TABS = ['All', 'Customers', 'Farmers', 'Suspended'];

function getStatusClass(status, s) {
  switch (status) {
    case 'Active': return s.statusSuccess;
    case 'Pending': return s.statusWarning;
    case 'Suspended': return s.statusDanger;
    default: return s.statusNeutral;
  }
}

function getRoleBadge(role, s) {
  return role === 'Farmer' ? s.roleFarmer : s.roleCustomer;
}

export default function People() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = USERS.filter((u) => {
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Customers' && u.role === 'Customer') ||
      (activeTab === 'Farmers' && u.role === 'Farmer') ||
      (activeTab === 'Suspended' && u.status === 'Suspended');
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>Manage customers and farmers on the platform.</p>
        </div>
      </div>

      <div className={styles.card}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button className={styles.filterBtn}>
              <Filter size={16} /> Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td className={styles.tdMono}>{user.id}</td>
                  <td className={styles.tdBold}>{user.name}</td>
                  <td className={styles.tdMuted}>{user.email}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${getRoleBadge(user.role, styles)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className={styles.tdMuted}>{user.joined}</td>
                  <td>
                    <span className={`${styles.statusPill} ${getStatusClass(user.status, styles)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.itemActions}>
                      <button className={styles.iconBtn} title="View Details">
                        <Eye size={16} />
                      </button>
                      {user.status === 'Suspended' ? (
                        <button className={`${styles.iconBtn} ${styles.iconBtnSuccess}`} title="Activate">
                          <CheckCircle size={16} />
                        </button>
                      ) : (
                        <button className={`${styles.iconBtn} ${styles.iconBtnWarning}`} title="Suspend">
                          <Ban size={16} />
                        </button>
                      )}
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyRow}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
