import { useState, useEffect, useCallback } from 'react';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  reorderAdminCategories,
  getAdminAnnouncements,
  createAdminAnnouncement,
  updateAdminAnnouncement,
  publishAdminAnnouncement,
  deleteAdminAnnouncement,
  getAdminMessages,
  handleAdminMessage,
  getPlatformSettings,
  updatePlatformSettings,
} from '../../api/admin';
import BottomSheet from '../../components/ui/BottomSheet';
import ConfirmStep from '../../components/ui/ConfirmStep';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/format';
import { ALLOWED_ART_KEYS, ANNOUNCEMENT_AUDIENCES } from '../../constants';
import styles from './Settings.module.css';

export default function Settings() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'announcements' | 'messages' | 'platform'

  // Categories state
  const [categories, setCategories] = useState([]);
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catArt, setCatArt] = useState('veg');
  const [catActive, setCatActive] = useState(true);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [annSheetOpen, setAnnSheetOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annAudience, setAnnAudience] = useState('all');
  const [annExpires, setAnnExpires] = useState('');

  // Messages state
  const [messages, setMessages] = useState([]);
  const [handlingMsgId, setHandlingMsgId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Platform state
  const [platform, setPlatform] = useState({
    maxItemsPerOrder: 15,
    defaultCutoffMinutes: 720,
    lowStockDefault: 5,
  });
  const [savingPlatform, setSavingPlatform] = useState(false);

  // Global loading
  const [loading, setLoading] = useState(false);

  // Fetch functions
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminCategories();
      setCategories(res.data || res || []);
    } catch (err) {
      toast.show(err.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminAnnouncements();
      setAnnouncements(res.data || res || []);
    } catch (err) {
      toast.show(err.message || 'Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminMessages();
      setMessages(res.data || []);
    } catch (err) {
      toast.show(err.message || 'Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchPlatform = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPlatformSettings();
      setPlatform(res.data || res);
    } catch (err) {
      toast.show(err.message || 'Failed to load platform settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'categories') fetchCategories();
    else if (activeTab === 'announcements') fetchAnnouncements();
    else if (activeTab === 'messages') fetchMessages();
    else if (activeTab === 'platform') fetchPlatform();
  }, [activeTab, fetchCategories, fetchAnnouncements, fetchMessages, fetchPlatform]);

  // Categories handlers
  const handleMoveCategory = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setCategories(reordered);

    try {
      const orderIds = reordered.map((c) => c.id || c._id);
      await reorderAdminCategories(orderIds);
      toast.show('Categories reordered', 'success');
    } catch (err) {
      toast.show(err.message || 'Reorder failed', 'error');
      fetchCategories();
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: catName.trim(),
        art: catArt,
        active: catActive,
        sortOrder: editingCategory ? editingCategory.sortOrder : categories.length,
      };
      if (editingCategory) {
        await updateAdminCategory(editingCategory.id || editingCategory._id, payload);
        toast.show('Category updated', 'success');
      } else {
        await createAdminCategory(payload);
        toast.show('Category created', 'success');
      }
      setCatSheetOpen(false);
      fetchCategories();
    } catch (err) {
      toast.show(err.message || 'Failed to save category', 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteAdminCategory(id);
      toast.show('Category deleted', 'success');
      fetchCategories();
    } catch (err) {
      toast.show(err.message || 'Cannot delete category (may have linked products)', 'error');
    }
  };

  // Announcements handlers
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: annTitle.trim(),
        body: annBody.trim(),
        audience: annAudience,
        expiresAt: annExpires ? new Date(annExpires).toISOString() : null,
      };
      if (editingAnn) {
        await updateAdminAnnouncement(editingAnn.id || editingAnn._id, payload);
        toast.show('Announcement updated', 'success');
      } else {
        await createAdminAnnouncement(payload);
        toast.show('Announcement created', 'success');
      }
      setAnnSheetOpen(false);
      fetchAnnouncements();
    } catch (err) {
      toast.show(err.message || 'Failed to save announcement', 'error');
    }
  };

  const handlePublishAnnouncement = async (id) => {
    try {
      await publishAdminAnnouncement(id);
      toast.show('Announcement published', 'success');
      fetchAnnouncements();
    } catch (err) {
      toast.show(err.message || 'Publish failed', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await deleteAdminAnnouncement(id);
      toast.show('Announcement removed', 'success');
      fetchAnnouncements();
    } catch (err) {
      toast.show(err.message || 'Delete failed', 'error');
    }
  };

  // Messages handlers
  const handleResolveMessage = async (id) => {
    try {
      await handleAdminMessage(id, replyText.trim());
      toast.show('Message marked as handled', 'success');
      setHandlingMsgId(null);
      setReplyText('');
      fetchMessages();
    } catch (err) {
      toast.show(err.message || 'Action failed', 'error');
    }
  };

  // Platform settings handlers
  const handleSavePlatform = async (e) => {
    e.preventDefault();
    try {
      setSavingPlatform(true);
      await updatePlatformSettings({
        maxItemsPerOrder: parseInt(platform.maxItemsPerOrder, 10),
        defaultCutoffMinutes: parseInt(platform.defaultCutoffMinutes, 10),
        lowStockDefault: parseInt(platform.lowStockDefault, 10),
      });
      toast.show('Platform settings saved successfully', 'success');
    } catch (err) {
      toast.show(err.message || 'Failed to update platform settings', 'error');
    } finally {
      setSavingPlatform(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        {activeTab === 'categories' && (
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              setEditingCategory(null);
              setCatName('');
              setCatArt('veg');
              setCatActive(true);
              setCatSheetOpen(true);
            }}
          >
            + Add Category
          </button>
        )}
        {activeTab === 'announcements' && (
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              setEditingAnn(null);
              setAnnTitle('');
              setAnnBody('');
              setAnnAudience('all');
              setAnnExpires('');
              setAnnSheetOpen(true);
            }}
          >
            + New Announcement
          </button>
        )}
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'categories' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'announcements' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          Announcements
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'messages' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'platform' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('platform')}
        >
          Platform Limits
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          {loading ? (
            <p>Loading categories...</p>
          ) : (
            <div className={styles.listWrap}>
              {categories.map((c, idx) => (
                <div key={c.id || c._id} className={styles.categoryRow}>
                  <div className={styles.categoryLeft}>
                    <div className={styles.categoryArt}>{c.art || '🏷️'}</div>
                    <div>
                      <div className={styles.categoryName}>
                        {c.name} {!c.active && <span style={{ opacity: 0.6 }}>(Hidden)</span>}
                      </div>
                      <div className={styles.categorySlug}>slug: {c.slug}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div className={styles.reorderBtns}>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label={`Move ${c.name} up`}
                        disabled={idx === 0}
                        onClick={() => handleMoveCategory(idx, -1)}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label={`Move ${c.name} down`}
                        disabled={idx === categories.length - 1}
                        onClick={() => handleMoveCategory(idx, 1)}
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => {
                        setEditingCategory(c);
                        setCatName(c.name);
                        setCatArt(c.art || 'veg');
                        setCatActive(Boolean(c.active));
                        setCatSheetOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      style={{ color: 'var(--color-danger)' }}
                      onClick={() => handleDeleteCategory(c.id || c._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div>
          {loading ? (
            <p>Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <p>No broadcast announcements yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {announcements.map((a) => {
                const now = new Date();
                const exp = a.expiresAt ? new Date(a.expiresAt) : null;
                const pub = a.publishedAt ? new Date(a.publishedAt) : null;
                let status = 'Live';
                let badgeClass = styles.badgeLive;

                if (exp && exp < now) {
                  status = 'Expired';
                  badgeClass = styles.badgeExpired;
                } else if (!pub || pub > now) {
                  status = 'Scheduled';
                  badgeClass = styles.badgeScheduled;
                }

                return (
                  <div key={a.id || a._id} className={styles.announcementCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span className={badgeClass}>{status}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', textTransform: 'capitalize' }}>
                          Audience: {a.audience}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                        {formatDate(a.createdAt)}
                      </span>
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 var(--space-1) 0', fontSize: '1.1rem', fontWeight: 600 }}>
                        {a.title}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-ink-soft)' }}>
                        {a.body}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                      {status === 'Scheduled' && (
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handlePublishAnnouncement(a.id || a._id)}
                        >
                          Publish Now
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.actionBtn}
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => handleDeleteAnnouncement(a.id || a._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div>
          {loading ? (
            <p>Loading messages...</p>
          ) : messages.length === 0 ? (
            <p>No incoming contact messages.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {messages.map((m) => {
                const isNew = m.status === 'new';
                const isHandling = handlingMsgId === (m.id || m._id);
                return (
                  <div key={m.id || m._id} className={styles.messageCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {isNew && <span className={styles.unreadDot} title="Unread message" />}
                        <strong style={{ fontSize: '0.9rem' }}>{m.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', marginLeft: 'var(--space-2)' }}>
                          &lt;{m.email}&gt;
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                        {formatDate(m.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
                      Topic: <strong style={{ textTransform: 'capitalize' }}>{m.topic}</strong>
                      {m.orderNumber && ` · Order: #${m.orderNumber}`}
                    </div>
                    <p style={{ margin: 'var(--space-1) 0', fontSize: '0.875rem', color: 'var(--color-ink)' }}>
                      {m.message}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)' }}>
                      {isNew ? (
                        <>
                          {isHandling ? (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                              <textarea
                                className={styles.textarea}
                                placeholder="Admin resolution note or reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                              />
                              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  className={styles.actionBtn}
                                  onClick={() => setHandlingMsgId(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className={styles.primaryBtn}
                                  onClick={() => handleResolveMessage(m.id || m._id)}
                                >
                                  Mark Handled
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => setHandlingMsgId(m.id || m._id)}
                            >
                              Handle Message
                            </button>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                          Handled on {formatDate(m.handledAt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Platform Limits Tab */}
      {activeTab === 'platform' && (
        <form onSubmit={handleSavePlatform} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Max Items Per Order (1 - 30)</label>
            <input
              type="number"
              className={styles.input}
              value={platform.maxItemsPerOrder}
              min={1}
              max={30}
              onChange={(e) => setPlatform({ ...platform, maxItemsPerOrder: e.target.value })}
              required
            />
            <span className={styles.helperText}>
              Protects stall packing limits by restricting items in single checkout.
            </span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Default Cut-off Window (minutes, 30 - 4320)</label>
            <input
              type="number"
              className={styles.input}
              value={platform.defaultCutoffMinutes}
              min={30}
              max={4320}
              onChange={(e) => setPlatform({ ...platform, defaultCutoffMinutes: e.target.value })}
              required
            />
            <span className={styles.helperText}>
              Standard minutes before market opening that orders close (e.g. 720 = 12 hours).
            </span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Default Low-stock Warning Threshold (0 - 100)</label>
            <input
              type="number"
              className={styles.input}
              value={platform.lowStockDefault}
              min={0}
              max={100}
              onChange={(e) => setPlatform({ ...platform, lowStockDefault: e.target.value })}
              required
            />
            <span className={styles.helperText}>
              Default remaining inventory level that flags products as low stock.
            </span>
          </div>

          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={savingPlatform}
          >
            {savingPlatform ? 'Saving...' : 'Save Platform Settings'}
          </button>
        </form>
      )}

      {/* Category Add/Edit Sheet */}
      <BottomSheet
        isOpen={catSheetOpen}
        onClose={() => setCatSheetOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        size="tall"
      >
        <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Category Name *</label>
            <input
              type="text"
              className={styles.input}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              minLength={2}
              maxLength={40}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Art Icon</label>
            <select
              className={styles.select}
              value={catArt}
              onChange={(e) => setCatArt(e.target.value)}
            >
              {(ALLOWED_ART_KEYS || ['veg', 'fruit', 'bakery', 'dairy', 'meat', 'preserves', 'flowers', 'drinks']).map(
                (k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                )
              )}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id="catActive"
              checked={catActive}
              onChange={(e) => setCatActive(e.target.checked)}
            />
            <label htmlFor="catActive" className={styles.label} style={{ cursor: 'pointer' }}>
              Active (Visible in catalog)
            </label>
          </div>

          <button type="submit" className={styles.primaryBtn} style={{ marginTop: 'var(--space-2)' }}>
            {editingCategory ? 'Save Changes' : 'Create Category'}
          </button>
        </form>
      </BottomSheet>

      {/* Announcement Add/Edit Sheet */}
      <BottomSheet
        isOpen={annSheetOpen}
        onClose={() => setAnnSheetOpen(false)}
        title={editingAnn ? 'Edit Announcement' : 'New Announcement'}
        size="tall"
      >
        <form onSubmit={handleSaveAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Headline Title *</label>
            <input
              type="text"
              className={styles.input}
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              minLength={3}
              maxLength={80}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Message Body *</label>
            <textarea
              className={styles.textarea}
              value={annBody}
              onChange={(e) => setAnnBody(e.target.value)}
              minLength={3}
              maxLength={600}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Target Audience</label>
            <select
              className={styles.select}
              value={annAudience}
              onChange={(e) => setAnnAudience(e.target.value)}
            >
              {(ANNOUNCEMENT_AUDIENCES || ['all', 'customers', 'farmers']).map((aud) => (
                <option key={aud} value={aud}>
                  {aud.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Expiry Date (Optional)</label>
            <input
              type="date"
              className={styles.input}
              value={annExpires}
              onChange={(e) => setAnnExpires(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.primaryBtn} style={{ marginTop: 'var(--space-2)' }}>
            {editingAnn ? 'Save Changes' : 'Create Announcement'}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
