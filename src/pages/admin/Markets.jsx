import { useState, useEffect, useCallback } from 'react';
import {
  getAdminMarkets,
  createMarket,
  updateMarket,
  deleteMarket,
} from '../../api/admin';
import BottomSheet from '../../components/ui/BottomSheet';
import TimeSelect from '../../components/ui/TimeSelect';
import ConfirmStep from '../../components/ui/ConfirmStep';
import MapView from '../../components/domain/MapView';
import { useToast } from '../../components/ui/Toast';
import { OPERATING_DAYS, MARKET_FACILITIES } from '../../constants';
import styles from './Markets.module.css';

const DEFAULT_SCHEDULE = [
  { day: 'sat', openMin: 480, closeMin: 780, enabled: true },
  { day: 'sun', openMin: 480, closeMin: 780, enabled: false },
  { day: 'mon', openMin: 480, closeMin: 780, enabled: false },
  { day: 'tue', openMin: 480, closeMin: 780, enabled: false },
  { day: 'wed', openMin: 480, closeMin: 780, enabled: false },
  { day: 'thu', openMin: 480, closeMin: 780, enabled: false },
  { day: 'fri', openMin: 480, closeMin: 780, enabled: false },
];

export default function Markets() {
  const toast = useToast();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState({ lat: -33.8688, lng: 151.2093 });
  const [mapUrl, setMapUrl] = useState('');
  const [scheduleState, setScheduleState] = useState(DEFAULT_SCHEDULE);
  const [facilities, setFacilities] = useState([]);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Deletion confirm state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [forceDetachCount, setForceDetachCount] = useState(null);

  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminMarkets({ search });
      setMarkets(res.data || []);
    } catch (err) {
      toast.show(err.message || 'Failed to load markets', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const handleOpenCreate = () => {
    setEditingMarket(null);
    setName('');
    setAddress('');
    setCoords({ lat: -33.8688, lng: 151.2093 });
    setMapUrl('');
    setScheduleState(DEFAULT_SCHEDULE);
    setFacilities([]);
    setNote('');
    setErrors({});
    setConfirmDelete(false);
    setForceDetachCount(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMarket(m);
    setName(m.name || '');
    setAddress(m.address || '');
    if (m.location?.coordinates) {
      setCoords({ lat: m.location.coordinates[1], lng: m.location.coordinates[0] });
    } else {
      setCoords({ lat: -33.8688, lng: 151.2093 });
    }
    setMapUrl(m.mapUrl || '');

    // Map existing schedule to 7 days
    const existingDays = new Map((m.schedule || []).map((s) => [s.day, s]));
    const nextSched = OPERATING_DAYS.map((d) => {
      const match = existingDays.get(d);
      if (match) {
        return { day: d, openMin: match.openMin, closeMin: match.closeMin, enabled: true };
      }
      return { day: d, openMin: 480, closeMin: 780, enabled: false };
    });
    setScheduleState(nextSched);
    setFacilities(m.facilities || []);
    setNote(m.note || '');
    setErrors({});
    setConfirmDelete(false);
    setForceDetachCount(null);
    setIsSheetOpen(true);
  };

  const handleScheduleToggle = (index) => {
    setScheduleState((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], enabled: !copy[index].enabled };
      return copy;
    });
  };

  const handleScheduleChange = (index, field, val) => {
    setScheduleState((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleFacilityToggle = (f) => {
    setFacilities((prev) =>
      prev.includes(f) ? prev.filter((item) => item !== f) : [...prev, f]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim() || name.trim().length < 2 || name.trim().length > 80) {
      newErrors.name = 'Market name must be between 2 and 80 characters';
    }
    if (!address.trim() || address.trim().length < 5 || address.trim().length > 200) {
      newErrors.address = 'Market address must be between 5 and 200 characters';
    }

    const activeSchedule = scheduleState
      .filter((s) => s.enabled)
      .map((s) => ({
        day: s.day,
        openMin: s.openMin,
        closeMin: s.closeMin,
      }));

    if (activeSchedule.length === 0) {
      newErrors.schedule = 'Please enable at least one operating day.';
    }

    for (const s of activeSchedule) {
      if (s.closeMin <= s.openMin) {
        newErrors.schedule = 'Closing time must be after opening time.';
        break;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      name: name.trim(),
      address: address.trim(),
      location: { lat: coords.lat, lng: coords.lng },
      schedule: activeSchedule,
      facilities,
      note: note.trim() || undefined,
    };
    if (mapUrl.trim()) {
      payload.mapUrl = mapUrl.trim();
    }

    try {
      setSubmitting(true);
      if (editingMarket) {
        await updateMarket(editingMarket.id || editingMarket._id, payload);
        toast.show(`${payload.name} updated successfully`, 'success');
      } else {
        await createMarket(payload);
        toast.show(`${payload.name} created successfully`, 'success');
      }
      setIsSheetOpen(false);
      fetchMarkets();
    } catch (err) {
      toast.show(err.message || 'Failed to save market', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (force = false) => {
    if (!editingMarket) return;
    try {
      setSubmitting(true);
      const marketId = editingMarket.id || editingMarket._id;
      await deleteMarket(marketId, force);
      toast.show('Market removed successfully', 'success');
      setIsSheetOpen(false);
      fetchMarkets();
    } catch (err) {
      if (err.code === 'FORCE_REQUIRED' || err.status === 409) {
        const count = err.details?.attendingFarmersCount || 'attending';
        setForceDetachCount(count);
        setConfirmDelete(true);
      } else {
        toast.show(err.message || 'Failed to delete market', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMarkets = markets.filter(
    (m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Markets</h1>
        <div className={styles.headerActions}>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search markets or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleOpenCreate}
          >
            + Add Market
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading markets...</p>
      ) : filteredMarkets.length === 0 ? (
        <p>No markets found.</p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Market</th>
                  <th className={styles.th}>Operating Days</th>
                  <th className={styles.th}>Farmers</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarkets.map((m) => (
                  <tr key={m.id || m._id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.marketName}>{m.name}</div>
                      <div className={styles.marketAddress}>{m.address}</div>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.daysBadges}>
                        {(m.schedule || []).map((s) => (
                          <span key={s.day} className={styles.dayChip}>
                            {s.day}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.td}>
                      {m.attendingFarmersCount ?? m.farmerCount ?? 0}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.dayChip}>{m.status || 'active'}</span>
                    </td>
                    <td className={styles.td}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleOpenEdit(m)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.cardsWrap}>
            {filteredMarkets.map((m) => (
              <div key={m.id || m._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.marketName}>{m.name}</div>
                    <div className={styles.marketAddress}>{m.address}</div>
                  </div>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleOpenEdit(m)}
                  >
                    Edit
                  </button>
                </div>
                <div className={styles.daysBadges}>
                  {(m.schedule || []).map((s) => (
                    <span key={s.day} className={styles.dayChip}>
                      {s.day}
                    </span>
                  ))}
                </div>
                <div className={styles.marketAddress}>
                  {m.attendingFarmersCount ?? m.farmerCount ?? 0} farmers attending
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Market Add/Edit Sheet */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={editingMarket ? 'Edit Market' : 'Add Market'}
        size="tall"
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Section: Basics */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Basics</h2>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Market Name *</label>
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Elm Street Farmers Market"
                required
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Physical Address *</label>
              <input
                type="text"
                className={styles.input}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 Elm Street, Melbourne"
                required
              />
              {errors.address && (
                <span className={styles.errorText}>{errors.address}</span>
              )}
            </div>
          </div>

          {/* Section: Location */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Location</h2>
            <p className={styles.helperText}>
              Drag the marker to position the market pin on the map.
            </p>
            <MapView
              latitude={coords.lat}
              longitude={coords.lng}
              zoom={13}
              draggable={true}
              onMove={(c) => setCoords(c)}
              height="200px"
            />
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Coordinates</label>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>
                Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Map Link (Optional fallback)</label>
              <input
                type="url"
                className={styles.input}
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=-33.86,151.20"
              />
            </div>
          </div>

          {/* Section: Schedule */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Schedule</h2>
            <p className={styles.helperText}>
              Enable operating days and set standard open/close times.
            </p>
            {errors.schedule && (
              <span className={styles.errorText}>{errors.schedule}</span>
            )}
            <div className={styles.scheduleGrid}>
              {scheduleState.map((s, idx) => (
                <div key={s.day} className={styles.scheduleRow}>
                  <label className={styles.dayLabel}>
                    <input
                      type="checkbox"
                      checked={s.enabled}
                      onChange={() => handleScheduleToggle(idx)}
                      style={{ marginRight: '6px' }}
                    />
                    {s.day}
                  </label>
                  {s.enabled ? (
                    <div className={styles.timeWrap}>
                      <TimeSelect
                        value={s.openMin}
                        onChange={(m) => handleScheduleChange(idx, 'openMin', m)}
                      />
                      <span className={styles.toText}>to</span>
                      <TimeSelect
                        value={s.closeMin}
                        onChange={(m) => handleScheduleChange(idx, 'closeMin', m)}
                      />
                    </div>
                  ) : (
                    <span className={styles.helperText}>Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Facilities */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Facilities</h2>
            <div className={styles.chipsGrid}>
              {(MARKET_FACILITIES || ['parking', 'restrooms', 'atm', 'wheelchair', 'dog_friendly', 'indoor']).map(
                (f) => {
                  const active = facilities.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      className={`${styles.facilityChip} ${active ? styles.facilityChipActive : ''}`}
                      onClick={() => handleFacilityToggle(f)}
                    >
                      {f.replace('_', ' ')}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Section: Note */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Notice or Notes</h2>
            <textarea
              className={styles.textarea}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="e.g. Parking available behind the town hall."
            />
          </div>

          {/* Actions */}
          <div className={styles.sheetActions}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={submitting}
            >
              {submitting
                ? 'Saving...'
                : editingMarket
                ? 'Save Changes'
                : 'Add Market'}
            </button>

            {editingMarket && (
              <>
                {confirmDelete ? (
                  <ConfirmStep
                    title="Delete Market"
                    message={
                      forceDetachCount
                        ? `This market has ${forceDetachCount} attending Farmers. Deleting it will detach all Farmers from this market.`
                        : `Are you sure you want to remove ${editingMarket.name}?`
                    }
                    confirmLabel={forceDetachCount ? 'Force Delete & Detach' : 'Confirm Delete'}
                    onConfirm={() => handleDelete(Boolean(forceDetachCount))}
                    onCancel={() => {
                      setConfirmDelete(false);
                      setForceDetachCount(null);
                    }}
                    danger
                  />
                ) : (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete Market
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
