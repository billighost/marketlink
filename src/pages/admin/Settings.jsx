import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminPage from '@/components/admin/AdminPage';
import Tabs from '@/components/ui/Tabs';
import { useAdmin } from '@/layouts/AdminLayout';
import CategoriesTab from './settings/CategoriesTab';
import AnnouncementsTab from './settings/AnnouncementsTab';
import MessagesTab from './settings/MessagesTab';
import PlatformTab from './settings/PlatformTab';
import styles from './Settings.module.css';

const VALID_TABS = ['categories', 'announcements', 'messages', 'platform'];

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { unhandledMessages } = useAdmin();

  const tabParam = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(tabParam) ? tabParam : 'categories';

  const handleTabChange = (newTab) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', newTab);
        if (newTab !== 'messages') {
          next.delete('status');
        }
        return next;
      },
      { replace: true }
    );
  };

  const tabsConfig = [
    { id: 'categories', label: 'Categories' },
    { id: 'announcements', label: 'Announcements' },
    {
      id: 'messages',
      label: 'Support Messages',
      count: unhandledMessages > 0 ? unhandledMessages : undefined,
    },
    { id: 'platform', label: 'Platform' },
  ];

  return (
    <AdminPage
      title="Settings"
      context="Platform configuration, master categories, broadcasts, and support inbox."
    >
      <div className={styles.container}>
        <div className={styles.tabBar}>
          <Tabs
            tabs={tabsConfig}
            active={activeTab}
            onChange={handleTabChange}
          />
        </div>

        <div className={styles.tabContent} role="tabpanel" id={`panel-${activeTab}`}>
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'announcements' && <AnnouncementsTab />}
          {activeTab === 'messages' && <MessagesTab />}
          {activeTab === 'platform' && <PlatformTab />}
        </div>
      </div>
    </AdminPage>
  );
}
