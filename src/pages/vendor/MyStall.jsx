import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getFarmerProfile,
  updateFarmerProfile,
  addSlotClosures,
  removeSlotClosure,
  uploadFarmerImage,
} from '@/api/farmer';
import { getMarkets } from '@/api/catalog';
import { useVendor } from '@/layouts/VendorLayout';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import Chip from '@/components/ui/Chip';
import Skeleton from '@/components/ui/Skeleton';
import BottomSheet from '@/components/ui/BottomSheet';
import TimeSelect from '@/components/ui/TimeSelect';
import MapView from '@/components/domain/MapView';
import Toast from '@/components/ui/Toast';
import {
  Store,
  MapPin,
  Clock,
  CalendarX,
  Camera,
  ChevronRight,
  Plus,
  Trash2,
  Navigation,
  Check,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Phone,
  ShieldCheck,
  Calendar,
  Layers,
  Edit3,
} from 'lucide-react';
import styles from './MyStall.module.css';

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export function MyStall() {
  const { refreshProfile } = useVendor();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [allMarkets, setAllMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Active sub-sheet: 'none' | 'details' | 'markets' | 'windows' | 'cutoff' | 'closed' | 'location' | 'photo'
  const [activeSheet, setActiveSheet] = useState('none');

  // Form Edit State
  const [stallName, setStallName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [story, setStory] = useState('');
  const [since, setSince] = useState(new Date().getFullYear());
  const [stallNumber, setStallNumber] = useState('');

  const [marketIds, setMarketIds] = useState([]);
  const [operatingDays, setOperatingDays] = useState([]);
  const [pickupWindows, setPickupWindows] = useState([]);
  const [cutoffHours, setCutoffHours] = useState(2);
  const [maxOrdersPerSlot, setMaxOrdersPerSlot] = useState(20);

  // Closed dates state
  const [slotOverrides, setSlotOverrides] = useState([]);
  const [newClosureDate, setNewClosureDate] = useState('');
  const [newClosureReason, setNewClosureReason] = useState('');

  // Location state
  const [address, setAddress] = useState('');
  const [locationCoords, setLocationCoords] = useState({ lat: 51.4545, lng: -2.5879 });
  const [editManualCoords, setEditManualCoords] = useState(false);

  // Photo
  const [imageUrl, setImageUrl] = useState('');

  // Errors & Toast
  const [sheetErrors, setSheetErrors] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, marketsRes] = await Promise.all([
        getFarmerProfile(),
        getMarkets(),
      ]);

      const p = profileRes?.data;
      setProfile(p || null);
      setAllMarkets(marketsRes?.data || []);

      if (p) {
        setStallName(p.stallName || '');
        setContactPerson(p.contactPerson || '');
        setPhone(p.phone || '');
        setSpecialty(p.specialty || '');
        setStory(p.story || '');
        setSince(p.since || new Date().getFullYear());
        setStallNumber(p.stallNumber || '');
        setMarketIds((p.marketIds || []).map((m) => (typeof m === 'object' ? m.id : m)));
        setOperatingDays(p.operatingDays || []);
        setPickupWindows(p.pickupWindows || []);
        setCutoffHours(p.cutoffMinutesBefore ? Math.round(p.cutoffMinutesBefore / 60) : 2);
        setMaxOrdersPerSlot(p.maxOrdersPerSlot ?? 20);
        setSlotOverrides(p.slotOverrides || []);
        setAddress(p.address || '');
        if (p.location?.coordinates && p.location.coordinates.length === 2) {
          setLocationCoords({ lat: p.location.coordinates[1], lng: p.location.coordinates[0] });
        } else if (p.location?.lat && p.location?.lng) {
          setLocationCoords({ lat: p.location.lat, lng: p.location.lng });
        }
        setImageUrl(p.imageUrl || '');
      }
    } catch (err) {
      setError(err?.message || 'Could not load stall profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveSection = async (updates) => {
    setSaving(true);
    setSheetErrors({});
    try {
      const res = await updateFarmerProfile(updates);
      setProfile(res?.data || null);
      setToastMessage('Stall settings updated.');
      setToastType('success');
      setActiveSheet('none');
      refreshProfile();
      loadProfile();
    } catch (err) {
      if (err?.details && Array.isArray(err.details)) {
        const errors = {};
        err.details.forEach((d) => {
          if (d.field) errors[d.field] = d.message;
        });
        setSheetErrors(errors);
      }
      setSheetErrors((prev) => ({
        ...prev,
        general: err?.message || 'Failed to save changes.',
      }));
    } finally {
      setSaving(false);
    }
  };

  // Details Save
  const handleSaveDetails = (e) => {
    e?.preventDefault();
    handleSaveSection({
      stallName: stallName.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      specialty: specialty.trim(),
      story: story.trim(),
      since: Number(since),
      stallNumber: stallNumber.trim() || undefined,
    });
  };

  // Markets Save
  const handleSaveMarkets = () => {
    handleSaveSection({
      marketIds,
    });
  };

  // Operating Windows Validation & Save
  const handleSaveWindows = () => {
    const dayGroups = {};
    for (const w of pickupWindows) {
      if (!operatingDays.includes(w.day)) continue;
      if (!dayGroups[w.day]) dayGroups[w.day] = [];
      dayGroups[w.day].push(w);
    }

    for (const day of Object.keys(dayGroups)) {
      const list = dayGroups[day];
      for (let a = 0; a < list.length; a++) {
        for (let b = a + 1; b < list.length; b++) {
          const w1 = list[a];
          const w2 = list[b];
          if (w1.startMin < w2.endMin && w2.startMin < w1.endMin) {
            setSheetErrors({ general: 'Pickup time windows cannot overlap.' });
            return;
          }
        }
      }
    }

    handleSaveSection({
      operatingDays,
      pickupWindows: pickupWindows.filter((w) => operatingDays.includes(w.day)),
    });
  };

  // Cut-off and Capacity Save
  const handleSaveCutoff = () => {
    handleSaveSection({
      cutoffMinutesBefore: Math.max(30, Number(cutoffHours) * 60),
      maxOrdersPerSlot: Math.min(200, Math.max(1, Number(maxOrdersPerSlot))),
    });
  };

  // Add Closure Date
  const handleAddClosure = async () => {
    if (!newClosureDate) return;
    setSaving(true);
    try {
      const res = await addSlotClosures([newClosureDate], newClosureReason);
      setSlotOverrides(res?.data?.slotOverrides || []);
      setNewClosureDate('');
      setNewClosureReason('');
      setToastMessage('Date marked closed.');
      setToastType('success');
    } catch (err) {
      setSheetErrors({ general: err?.message || 'Could not close date.' });
    } finally {
      setSaving(false);
    }
  };

  // Remove Closure Date
  const handleRemoveClosure = async (date) => {
    setSaving(true);
    try {
      const res = await removeSlotClosure(date);
      setSlotOverrides(res?.data?.slotOverrides || []);
      setToastMessage('Date reopened.');
      setToastType('success');
    } catch (err) {
      setSheetErrors({ general: err?.message || 'Could not reopen date.' });
    } finally {
      setSaving(false);
    }
  };

  // Geolocation Browser API
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSheetErrors({ general: 'Geolocation is not supported by your browser.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6)),
        };
        setLocationCoords(next);
      },
      (err) => {
        setSheetErrors({ general: `Location access denied: ${err.message}` });
      }
    );
  };

  // Save Location
  const handleSaveLocation = () => {
    handleSaveSection({
      address: address.trim(),
      location: locationCoords,
    });
  };

  // Upload Stall Photo
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1048576) {
      setSheetErrors({ general: 'Photo exceeds 1 MB limit.' });
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setSheetErrors({ general: 'Only JPEG, PNG, and WebP images are allowed.' });
      return;
    }

    setUploading(true);
    try {
      const res = await uploadFarmerImage(file, 'farmer');
      const uploadedUrl = res?.data?.imageUrl || res?.data?.url || '';
      setImageUrl(uploadedUrl);
      if (uploadedUrl) {
        await updateFarmerProfile({ imageUrl: uploadedUrl, imagePublicId: res?.data?.publicId || null });
      }
      setToastMessage('Stall photo updated.');
      setToastType('success');
      setActiveSheet('none');
      refreshProfile();
      loadProfile();
    } catch (err) {
      setSheetErrors({ general: err?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  // Selected markets resolved
  const selectedMarkets = useMemo(() => {
    return allMarkets.filter((m) => marketIds.includes(m.id));
  }, [allMarkets, marketIds]);

  // Profile readiness score
  const readiness = useMemo(() => {
    let score = 0;
    if (stallName) score += 20;
    if (imageUrl) score += 20;
    if (marketIds.length > 0) score += 20;
    if (operatingDays.length > 0 && pickupWindows.length > 0) score += 20;
    if (address || locationCoords.lat) score += 20;
    return score;
  }, [stallName, imageUrl, marketIds, operatingDays, pickupWindows, address, locationCoords]);

  const publicStorefrontUrl = `/farmers/${profile?.id || profile?._id || ''}`;

  if (loading) {
    return (
      <div className={styles.container}>
        <Skeleton height="200px" />
        <div className={styles.bentoGrid}>
          <Skeleton height="140px" />
          <Skeleton height="140px" />
          <Skeleton height="140px" />
          <Skeleton height="140px" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onDismiss={() => setToastMessage('')} />
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <div className={styles.badgeRow}>
            <span className={styles.liveBadge}>
              <span className={styles.pulseDot} /> Public Storefront Setup
            </span>
          </div>
          <h1 className={styles.title}>My Stall & Storefront</h1>
          <p className={styles.subtitle}>
            Configure public identity, pickup windows, attending market locations, and map coordinates.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link
            to={publicStorefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.previewBtn}
          >
            <ExternalLink size={15} />
            <span>View Public Stall</span>
          </Link>
        </div>
      </header>

      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Hero Stall Visual Showcase Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroImageWrap}>
          {imageUrl ? (
            <img src={imageUrl} alt={stallName} className={styles.heroImage} />
          ) : (
            <div className={styles.heroPlaceholder}>
              <Store size={48} className={styles.placeholderIcon} />
            </div>
          )}

          <div className={styles.heroOverlay} />

          {/* Quick Photo Upload Trigger */}
          <button
            type="button"
            className={styles.photoTriggerBtn}
            onClick={() => setActiveSheet('photo')}
            title="Upload or change stall photo"
          >
            <Camera size={16} />
            <span>{imageUrl ? 'Change Photo' : 'Upload Stall Photo'}</span>
          </button>
        </div>

        {/* Hero Meta Bar */}
        <div className={styles.heroMetaBar}>
          <div className={styles.heroIdentity}>
            <h2 className={styles.heroTitle}>{stallName || 'Your Farm Stall'}</h2>
            <div className={styles.heroTags}>
              {specialty && <span className={styles.specialtyBadge}>{specialty}</span>}
              {since && <span className={styles.sinceBadge}>Est. {since}</span>}
              <span className={styles.marketsBadge}>
                {marketIds.length} {marketIds.length === 1 ? 'Market' : 'Markets'}
              </span>
            </div>
          </div>

          {/* Readiness Meter */}
          <div className={styles.readinessBox}>
            <div className={styles.readinessHeader}>
              <span className={styles.readinessLabel}>Profile Readiness</span>
              <strong className={styles.readinessPct}>{readiness}%</strong>
            </div>
            <div className={styles.readinessTrack}>
              <div
                className={styles.readinessFill}
                style={{ width: `${readiness}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Configuration Hub */}
      <section className={styles.bentoGrid} aria-label="Stall configuration sections">
        {/* Card 1: Identity & Heritage */}
        <article className={styles.bentoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <span className={styles.cardIcon}>
                <Store size={18} />
              </span>
              <h3 className={styles.cardTitle}>Identity & Heritage</h3>
            </div>
            <button
              type="button"
              className={styles.cardActionBtn}
              onClick={() => setActiveSheet('details')}
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Stall Name:</span>
              <strong className={styles.infoValue}>{stallName || 'Not configured'}</strong>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Grower Contact:</span>
              <span className={styles.infoValue}>{contactPerson || 'Not set'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Direct Phone:</span>
              <span className={styles.infoValue}>{phone || 'Not set'}</span>
            </div>
            {story && (
              <p className={styles.storySnippet}>
                "{story.slice(0, 110)}{story.length > 110 ? '...' : ''}"
              </p>
            )}
          </div>
        </article>

        {/* Card 2: Markets */}
        <article className={styles.bentoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <span className={`${styles.cardIcon} ${styles.iconBeet}`}>
                <MapPin size={18} />
              </span>
              <h3 className={styles.cardTitle}>Attended Markets</h3>
            </div>
            <button
              type="button"
              className={styles.cardActionBtn}
              onClick={() => setActiveSheet('markets')}
            >
              <Edit3 size={14} />
              <span>Manage</span>
            </button>
          </div>

          <div className={styles.cardContent}>
            {selectedMarkets.length === 0 ? (
              <p className={styles.emptyCardText}>No markets linked yet. Customers cannot locate your stall.</p>
            ) : (
              <div className={styles.marketPillsList}>
                {selectedMarkets.map((m) => (
                  <div key={m.id} className={styles.marketPill}>
                    <MapPin size={12} className={styles.pillPin} />
                    <div className={styles.marketPillText}>
                      <strong>{m.name}</strong>
                      <span>{m.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Card 3: Operating Days & Windows */}
        <article className={styles.bentoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <span className={`${styles.cardIcon} ${styles.iconSuccess}`}>
                <Clock size={18} />
              </span>
              <h3 className={styles.cardTitle}>Pickup Windows</h3>
            </div>
            <button
              type="button"
              className={styles.cardActionBtn}
              onClick={() => setActiveSheet('windows')}
            >
              <Edit3 size={14} />
              <span>Configure</span>
            </button>
          </div>

          <div className={styles.cardContent}>
            {operatingDays.length === 0 ? (
              <p className={styles.emptyCardText}>No operating days selected for customer collection.</p>
            ) : (
              <div className={styles.daysScheduleList}>
                {operatingDays.map((dayId) => {
                  const dayObj = DAYS_OF_WEEK.find((d) => d.id === dayId);
                  const windowsForDay = pickupWindows.filter((w) => w.day === dayId);

                  return (
                    <div key={dayId} className={styles.scheduleRow}>
                      <span className={styles.scheduleDay}>{dayObj?.label}</span>
                      <div className={styles.scheduleWindows}>
                        {windowsForDay.length === 0 ? (
                          <span className={styles.noWindowText}>Closed</span>
                        ) : (
                          windowsForDay.map((w, idx) => {
                            const startH = Math.floor(w.startMin / 60);
                            const startM = w.startMin % 60;
                            const endH = Math.floor(w.endMin / 60);
                            const endM = w.endMin % 60;
                            const formatTime = (h, m) =>
                              `${h > 12 ? h - 12 : h || 12}:${m < 10 ? '0' : ''}${m} ${h >= 12 ? 'PM' : 'AM'}`;

                            return (
                              <span key={idx} className={styles.windowChip}>
                                {formatTime(startH, startM)} – {formatTime(endH, endM)}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </article>

        {/* Card 4: Cut-Off & Capacity */}
        <article className={styles.bentoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <span className={`${styles.cardIcon} ${styles.iconAmber}`}>
                <ShieldCheck size={18} />
              </span>
              <h3 className={styles.cardTitle}>Fulfillment Limits</h3>
            </div>
            <button
              type="button"
              className={styles.cardActionBtn}
              onClick={() => setActiveSheet('cutoff')}
            >
              <Edit3 size={14} />
              <span>Set Limits</span>
            </button>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.limitMetric}>
              <div className={styles.limitValueRow}>
                <span className={styles.limitNumber}>{cutoffHours}h</span>
                <span className={styles.limitLabel}>Order Cut-Off</span>
              </div>
              <p className={styles.limitDesc}>
                Checkout closes {cutoffHours} hours prior to pickup window.
              </p>
            </div>

            <div className={styles.limitMetric}>
              <div className={styles.limitValueRow}>
                <span className={styles.limitNumber}>{maxOrdersPerSlot}</span>
                <span className={styles.limitLabel}>Max Orders / Slot</span>
              </div>
              <p className={styles.limitDesc}>
                Prevents fulfillment bottleneck during peak market rush.
              </p>
            </div>
          </div>
        </article>

        {/* Card 5: Seasonal Closures */}
        <article className={styles.bentoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <span className={styles.cardIcon}>
                <CalendarX size={18} />
              </span>
              <h3 className={styles.cardTitle}>Closed Blackout Dates</h3>
            </div>
            <button
              type="button"
              className={styles.cardActionBtn}
              onClick={() => setActiveSheet('closed')}
            >
              <Edit3 size={14} />
              <span>Manage</span>
            </button>
          </div>

          <div className={styles.cardContent}>
            {slotOverrides.length === 0 ? (
              <div className={styles.allOpenState}>
                <CheckCircle2 size={16} className={styles.openIcon} />
                <span>Open for all regular operating market dates.</span>
              </div>
            ) : (
              <div className={styles.closuresChips}>
                {slotOverrides.map((o) => (
                  <div key={o.date} className={styles.closureChip}>
                    <strong>{o.date}</strong>
                    {o.reason && <span>{o.reason}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Card 6: Map Location & Pin */}
        <article className={styles.bentoCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <span className={`${styles.cardIcon} ${styles.iconBeet}`}>
                <Navigation size={18} />
              </span>
              <h3 className={styles.cardTitle}>Location & Map Pin</h3>
            </div>
            <button
              type="button"
              className={styles.cardActionBtn}
              onClick={() => setActiveSheet('location')}
            >
              <Edit3 size={14} />
              <span>Adjust Pin</span>
            </button>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.locationSummary}>
              <MapPin size={16} className={styles.locationIcon} />
              <span className={styles.addressText}>
                {address || 'Coordinates set. Tap Adjust Pin to set stall address.'}
              </span>
            </div>
            <div className={styles.coordsRow}>
              <span>Lat: {locationCoords.lat?.toFixed(4)}</span>
              <span>Lng: {locationCoords.lng?.toFixed(4)}</span>
            </div>
          </div>
        </article>
      </section>

      {/* ── Sub-Sheet Modals (100% Intact & Fully Functional) ── */}

      {/* 1. Stall Details Sheet */}
      {activeSheet === 'details' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setActiveSheet('none')}
          size="tall"
          title="Edit Stall Details"
        >
          <form onSubmit={handleSaveDetails} className={styles.sheetForm}>
            {sheetErrors.general && (
              <div className={styles.errorBox}>{sheetErrors.general}</div>
            )}
            <FormField label="Stall Name" required error={sheetErrors.stallName}>
              <input
                type="text"
                value={stallName}
                onChange={(e) => setStallName(e.target.value)}
                maxLength={80}
                required
                className={styles.input}
              />
            </FormField>

            <FormField label="Contact Person" required error={sheetErrors.contactPerson}>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                maxLength={80}
                required
                className={styles.input}
              />
            </FormField>

            <FormField label="Phone Number" required error={sheetErrors.phone}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
                required
                className={styles.input}
              />
            </FormField>

            <FormField label="Produce Specialty" error={sheetErrors.specialty} hint="e.g. Organic Heritage Root Vegetables & Berries">
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                maxLength={120}
                className={styles.input}
              />
            </FormField>

            <div className={styles.twoCol}>
              <FormField label="Farming Since (Year)" error={sheetErrors.since}>
                <input
                  type="number"
                  value={since}
                  onChange={(e) => setSince(parseInt(e.target.value, 10))}
                  min={1900}
                  max={new Date().getFullYear()}
                  className={styles.input}
                />
              </FormField>

              <FormField label="Stall Number / Booth (optional)">
                <input
                  type="text"
                  value={stallNumber}
                  onChange={(e) => setStallNumber(e.target.value)}
                  maxLength={30}
                  placeholder="e.g. Center Aisle Booth 12"
                  className={styles.input}
                />
              </FormField>
            </div>

            <FormField label="Your Farm Story & Philosophy" hint="Tell market patrons about your soil, heirloom crops, and harvest values.">
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                maxLength={600}
                rows={4}
                className={styles.textarea}
              />
            </FormField>

            <Button type="submit" variant="primary" size="lg" disabled={saving} loading={saving}>
              Save Stall Details
            </Button>
          </form>
        </BottomSheet>
      )}

      {/* 2. Markets Sheet */}
      {activeSheet === 'markets' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setActiveSheet('none')}
          size="tall"
          title="Attend Farmers Markets"
        >
          <div className={styles.sheetForm}>
            <p className={styles.sheetIntro}>
              Select the farmers markets where you operate. Patrons shopping at these market locations will see your produce in their discovery feeds.
            </p>
            {sheetErrors.general && (
              <div className={styles.errorBox}>{sheetErrors.general}</div>
            )}

            <div className={styles.checkboxList}>
              {allMarkets.map((m) => {
                const isChecked = marketIds.includes(m.id);
                return (
                  <label key={m.id} className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (marketIds.length >= 5) return;
                          setMarketIds([...marketIds, m.id]);
                        } else {
                          setMarketIds(marketIds.filter((id) => id !== m.id));
                        }
                      }}
                      className={styles.checkbox}
                    />
                    <div className={styles.checkboxLabel}>
                      <strong>{m.name}</strong>
                      <span>{m.address}</span>
                    </div>
                  </label>
                );
              })}
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleSaveMarkets}
              disabled={saving}
              loading={saving}
            >
              Save Markets
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* 3. Pickup Windows Sheet */}
      {activeSheet === 'windows' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setActiveSheet('none')}
          size="tall"
          title="Operating Days & Pickup Windows"
        >
          <div className={styles.sheetForm}>
            <p className={styles.sheetIntro}>
              Select the days you operate at the market and add up to 3 pickup time windows per day.
            </p>
            {sheetErrors.general && (
              <div className={styles.errorBox}>{sheetErrors.general}</div>
            )}

            {/* Operating Day Chips */}
            <div className={styles.daysChipRow}>
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = operatingDays.includes(d.id);
                return (
                  <Chip
                    key={d.id}
                    label={d.label}
                    selected={isSelected}
                    onClick={() => {
                      if (isSelected) {
                        setOperatingDays(operatingDays.filter((id) => id !== d.id));
                      } else {
                        setOperatingDays([...operatingDays, d.id]);
                        if (!pickupWindows.some((w) => w.day === d.id)) {
                          setPickupWindows([...pickupWindows, { day: d.id, startMin: 480, endMin: 720 }]);
                        }
                      }
                    }}
                  />
                );
              })}
            </div>

            {/* Windows per selected day */}
            <div className={styles.windowsList}>
              {operatingDays.map((dayId) => {
                const dayLabel = DAYS_OF_WEEK.find((d) => d.id === dayId)?.label;
                const windowsForDay = pickupWindows.filter((w) => w.day === dayId);

                return (
                  <div key={dayId} className={styles.dayWindowsBox}>
                    <div className={styles.dayHeader}>
                      <strong>{dayLabel}</strong>
                      {windowsForDay.length < 3 && (
                        <button
                          type="button"
                          className={styles.addWindowBtn}
                          onClick={() => {
                            setPickupWindows([
                              ...pickupWindows,
                              { day: dayId, startMin: 480, endMin: 600 },
                            ]);
                          }}
                        >
                          <Plus size={14} aria-hidden="true" /> Add Window
                        </button>
                      )}
                    </div>

                    {windowsForDay.map((win, idx) => (
                      <div key={idx} className={styles.timeWindowRow}>
                        <TimeSelect
                          label="From"
                          value={win.startMin}
                          onChange={(val) => {
                            const updated = [...pickupWindows];
                            const targetIdx = pickupWindows.indexOf(win);
                            if (targetIdx !== -1) {
                              updated[targetIdx] = { ...win, startMin: val };
                              setPickupWindows(updated);
                            }
                          }}
                        />
                        <TimeSelect
                          label="To"
                          value={win.endMin}
                          onChange={(val) => {
                            const updated = [...pickupWindows];
                            const targetIdx = pickupWindows.indexOf(win);
                            if (targetIdx !== -1) {
                              updated[targetIdx] = { ...win, endMin: val };
                              setPickupWindows(updated);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className={styles.removeWindowBtn}
                          onClick={() => {
                            setPickupWindows(pickupWindows.filter((w) => w !== win));
                          }}
                          aria-label={`Remove window for ${dayLabel}`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleSaveWindows}
              disabled={saving}
              loading={saving}
            >
              Save Pickup Windows
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* 4. Cut-off & Capacity Sheet */}
      {activeSheet === 'cutoff' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setActiveSheet('none')}
          size="peek"
          title="Cut-Off & Slot Capacity"
        >
          <div className={styles.sheetForm}>
            {sheetErrors.general && (
              <div className={styles.errorBox}>{sheetErrors.general}</div>
            )}
            <FormField
              label="Order Cut-Off (hours before pickup)"
              hint="Customers cannot place or modify orders after this time window."
            >
              <input
                type="number"
                value={cutoffHours}
                onChange={(e) => setCutoffHours(parseInt(e.target.value || '1', 10))}
                min={1}
                max={72}
                className={styles.input}
              />
            </FormField>

            <FormField
              label="Max Orders Per Pickup Slot"
              hint="Caps checkout traffic to guarantee fresh harvest packing capacity."
            >
              <input
                type="number"
                value={maxOrdersPerSlot}
                onChange={(e) => setMaxOrdersPerSlot(parseInt(e.target.value || '1', 10))}
                min={1}
                max={200}
                className={styles.input}
              />
            </FormField>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleSaveCutoff}
              disabled={saving}
              loading={saving}
            >
              Save Limits
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* 5. Closed Dates Sheet */}
      {activeSheet === 'closed' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setActiveSheet('none')}
          size="tall"
          title="Manage Closed / Blackout Dates"
        >
          <div className={styles.sheetForm}>
            <p className={styles.sheetIntro}>
              Block specific calendar dates (for holidays, field maintenance, or weather). Customers cannot place pre-orders for closed dates.
            </p>
            {sheetErrors.general && (
              <div className={styles.errorBox}>{sheetErrors.general}</div>
            )}

            <div className={styles.addClosureBox}>
              <FormField label="Date to Close">
                <input
                  type="date"
                  value={newClosureDate}
                  onChange={(e) => setNewClosureDate(e.target.value)}
                  className={styles.input}
                />
              </FormField>
              <FormField label="Reason (optional)">
                <input
                  type="text"
                  value={newClosureReason}
                  onChange={(e) => setNewClosureReason(e.target.value)}
                  placeholder="e.g. Seasonal harvest break"
                  className={styles.input}
                />
              </FormField>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleAddClosure}
                disabled={saving || !newClosureDate}
              >
                Mark Date Closed
              </Button>
            </div>

            <div className={styles.closuresList}>
              <h3 className={styles.subheading}>Upcoming Closed Dates</h3>
              {slotOverrides.length === 0 ? (
                <p className={styles.emptyText}>No dates currently marked closed.</p>
              ) : (
                slotOverrides.map((override) => (
                  <div key={override.date} className={styles.closureRow}>
                    <div className={styles.closureInfo}>
                      <strong>{override.date}</strong>
                      {override.reason && <span>{override.reason}</span>}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveClosure(override.date)}
                      disabled={saving}
                    >
                      Reopen
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* 6. Location & Map Pin Sheet */}
      {activeSheet === 'location' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setActiveSheet('none')}
          size="tall"
          title="Location & Stall Coordinates"
        >
          <div className={styles.sheetForm}>
            <p className={styles.sheetIntro}>
              Drag the marker or tap on the map to pin your stall's exact pickup point.
            </p>
            {sheetErrors.general && (
              <div className={styles.errorBox}>{sheetErrors.general}</div>
            )}

            <FormField label="Physical address or market stall description">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Elm Street Market, Center Aisle Stall 12"
                className={styles.input}
              />
            </FormField>

            <div className={styles.locationActionRow}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleUseCurrentLocation}
              >
                <Navigation size={14} aria-hidden="true" />
                <span>Use Current Geolocation</span>
              </Button>
              <button
                type="button"
                className={styles.toggleCoordsBtn}
                onClick={() => setEditManualCoords(!editManualCoords)}
              >
                {editManualCoords ? 'Hide Coordinates' : 'Edit Coordinates'}
              </button>
            </div>

            {editManualCoords && (
              <div className={styles.twoCol}>
                <FormField label="Latitude">
                  <input
                    type="number"
                    step="any"
                    value={locationCoords.lat}
                    onChange={(e) =>
                      setLocationCoords({ ...locationCoords, lat: parseFloat(e.target.value) || 0 })
                    }
                    className={styles.input}
                  />
                </FormField>
                <FormField label="Longitude">
                  <input
                    type="number"
                    step="any"
                    value={locationCoords.lng}
                    onChange={(e) =>
                      setLocationCoords({ ...locationCoords, lng: parseFloat(e.target.value) || 0 })
                    }
                    className={styles.input}
                  />
                </FormField>
              </div>
            )}

            {/* Draggable MapView */}
            <div className={styles.mapContainer}>
              <MapView
                markers={[
                  {
                    id: 'stall-pin',
                    lat: locationCoords.lat,
                    lng: locationCoords.lng,
                    label: stallName || 'My Stall',
                    draggable: true,
                  },
                ]}
                draggable={true}
                onMove={(pos) => setLocationCoords({ lat: pos.lat, lng: pos.lng })}
                height="280px"
              />
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleSaveLocation}
              disabled={saving}
              loading={saving}
            >
              Save Location & Map Pin
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* 7. Stall Photo Sheet */}
      {activeSheet === 'photo' && (
        <BottomSheet
          isOpen={true}
          onClose={() => setActiveSheet('none')}
          size="peek"
          title="Stall Hero Photo"
        >
          <div className={styles.sheetForm}>
            {sheetErrors.general && (
              <div className={styles.errorBox}>{sheetErrors.general}</div>
            )}

            {imageUrl ? (
              <div className={styles.photoPreviewWrapper}>
                <img src={imageUrl} alt="Stall banner" className={styles.photoPreview} />
              </div>
            ) : (
              <p className={styles.fieldHint}>No stall photo uploaded yet.</p>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              loading={uploading}
            >
              <Camera size={18} aria-hidden="true" />
              <span>{imageUrl ? 'Replace Photo' : 'Upload Stall Photo'} (≤ 1 MB)</span>
            </Button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

export default MyStall;
