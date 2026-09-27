import React, { useState, useEffect, useMemo } from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import FormField from '@/components/ui/FormField';
import Toggle from '@/components/ui/Toggle';
import Button from '@/components/ui/Button';
import MapView from '@/components/domain/MapView';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { createMarket, updateMarket } from '@/api/admin';
import { OPERATING_DAYS } from '@/constants';
import styles from './Markets.module.css';

const DEFAULT_COORDS = { lat: 51.4545, lng: -2.5879 };

const DAY_LABELS = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

const round6 = (val) => {
  const n = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(n) ? 0 : parseFloat(n.toFixed(6));
};

const minToTimeStr = (minutes) => {
  if (typeof minutes !== 'number' || isNaN(minutes)) return '08:00';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const timeStrToMin = (str) => {
  if (!str || typeof str !== 'string' || !str.includes(':')) return 480;
  const [h, m] = str.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const buildDefaultSchedule = () =>
  OPERATING_DAYS.map((day) => ({
    day,
    enabled: day === 'sat',
    opensAt: '08:00',
    closesAt: '13:00',
  }));

export function MarketEditorSheet({ open, market, onClose, onSaved, showToast }) {
  const [isDirty, setIsDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNote, setFormNote] = useState('');
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [scheduleState, setScheduleState] = useState(buildDefaultSchedule);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formBannerError, setFormBannerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (market) {
      setFormName(market.name || '');
      setFormAddress(market.address || '');
      setFormNote(market.note || '');
      const lat = market.location?.lat ?? market.location?.coordinates?.[1] ?? DEFAULT_COORDS.lat;
      const lng = market.location?.lng ?? market.location?.coordinates?.[0] ?? DEFAULT_COORDS.lng;
      setCoords({ lat: round6(lat), lng: round6(lng) });
      const existingMap = new Map((market.schedule || []).map((s) => [s.day, s]));
      setScheduleState(
        OPERATING_DAYS.map((day) => {
          const match = existingMap.get(day);
          return match
            ? { day, enabled: true, opensAt: minToTimeStr(match.openMin), closesAt: minToTimeStr(match.closeMin) }
            : { day, enabled: false, opensAt: '08:00', closesAt: '13:00' };
        })
      );
    } else {
      setFormName('');
      setFormAddress('');
      setFormNote('');
      setCoords(DEFAULT_COORDS);
      setScheduleState(buildDefaultSchedule());
    }
    setFieldErrors({});
    setFormBannerError(null);
    setIsDirty(false);
  }, [open, market]);

  const handleCloseSheet = () => {
    if (isDirty) setDiscardConfirmOpen(true);
    else onClose();
  };

  const handleToggleDay = (idx) => {
    setIsDirty(true);
    setScheduleState((prev) => prev.map((row, i) => (i === idx ? { ...row, enabled: !row.enabled } : row)));
  };

  const handleScheduleTimeChange = (idx, field, value) => {
    setIsDirty(true);
    setScheduleState((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };

  const hasTradingDays = scheduleState.some((r) => r.enabled);
  const scheduleTimeErrors = useMemo(() => {
    const errs = {};
    scheduleState.forEach((row) => {
      if (row.enabled && timeStrToMin(row.closesAt) <= timeStrToMin(row.opensAt)) {
        errs[row.day] = 'Closes must be after opens';
      }
    });
    return errs;
  }, [scheduleState]);

  const isFormValid = useMemo(() => {
    if (!formName.trim() || formName.trim().length < 2 || formName.trim().length > 80) return false;
    if (!formAddress.trim() || formAddress.trim().length < 5 || formAddress.trim().length > 200) return false;
    if (typeof coords.lat !== 'number' || isNaN(coords.lat) || coords.lat < -90 || coords.lat > 90) return false;
    if (typeof coords.lng !== 'number' || isNaN(coords.lng) || coords.lng < -180 || coords.lng > 180) return false;
    return Object.keys(scheduleTimeErrors).length === 0;
  }, [formName, formAddress, coords, scheduleTimeErrors]);

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;
    setSubmitting(true);
    setFieldErrors({});
    setFormBannerError(null);

    const builtSchedule = scheduleState
      .filter((r) => r.enabled)
      .map((r) => ({ day: r.day, openMin: timeStrToMin(r.opensAt), closeMin: timeStrToMin(r.closesAt) }));

    try {
      if (market) {
        const patch = {};
        if (formName.trim() !== (market.name || '')) patch.name = formName.trim();
        if (formAddress.trim() !== (market.address || '')) patch.address = formAddress.trim();
        if (formNote.trim() !== (market.note || '')) patch.note = formNote.trim();
        const origLat = round6(market.location?.lat ?? market.location?.coordinates?.[1] ?? 0);
        const origLng = round6(market.location?.lng ?? market.location?.coordinates?.[0] ?? 0);
        if (coords.lat !== origLat || coords.lng !== origLng) {
          patch.location = { lat: coords.lat, lng: coords.lng };
        }
        const origScheduleJson = JSON.stringify((market.schedule || []).map((s) => ({ day: s.day, openMin: s.openMin, closeMin: s.closeMin })));
        if (origScheduleJson !== JSON.stringify(builtSchedule)) patch.schedule = builtSchedule;
        if (Object.keys(patch).length > 0) {
          await updateMarket(market.id || market._id, patch);
        }
        showToast('Market saved.', 'success');
      } else {
        await createMarket({
          name: formName.trim(),
          address: formAddress.trim(),
          location: { lat: coords.lat, lng: coords.lng },
          schedule: builtSchedule.length > 0 ? builtSchedule : [{ day: 'sat', openMin: 480, closeMin: 780 }],
          note: formNote.trim() || undefined,
        });
        showToast('Market saved.', 'success');
      }
      setIsDirty(false);
      onSaved();
    } catch (err) {
      if (err?.field) setFieldErrors({ [err.field]: err.message });
      else if (err?.details && typeof err.details === 'object') setFieldErrors(err.details);
      else setFormBannerError(err?.message || 'Failed to save market.');
      showToast(err?.message || 'Failed to save market.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <BottomSheet open={open} onClose={handleCloseSheet} title={market ? `Edit: ${market.name}` : 'Add a new market'}>
        <form className={styles.sheetForm} onSubmit={handleSubmitForm} noValidate>
          {formBannerError && (
            <div className={styles.formErrorBanner} role="alert">{formBannerError}</div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>1 · Identity</h2>
            <FormField
              id="market-name"
              label="Market Name"
              required
              value={formName}
              onChange={(e) => { setFormName(e.target.value); setIsDirty(true); }}
              error={fieldErrors.name}
              placeholder="e.g. Riverbend Farmers Market"
            />
            <FormField
              id="market-note"
              label="Description / Note"
              as="textarea"
              rows={2}
              value={formNote}
              onChange={(e) => { setFormNote(e.target.value); setIsDirty(true); }}
              error={fieldErrors.note}
              placeholder="e.g. Free parking available behind the community centre."
            />
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>2 · Location</h2>
            <FormField
              id="market-address"
              label="Street Address & Town"
              required
              value={formAddress}
              onChange={(e) => { setFormAddress(e.target.value); setIsDirty(true); }}
              error={fieldErrors.address}
              placeholder="e.g. 200 Elm Street, Maplewood, NJ"
            />
            <div className={styles.coordsRow}>
              <FormField
                id="market-lat"
                label="Latitude"
                type="number"
                step="0.000001"
                required
                value={coords.lat}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCoords((prev) => ({ ...prev, lat: isNaN(val) ? 0 : round6(val) }));
                  setIsDirty(true);
                }}
                error={fieldErrors.location}
              />
              <FormField
                id="market-lng"
                label="Longitude"
                type="number"
                step="0.000001"
                required
                value={coords.lng}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCoords((prev) => ({ ...prev, lng: isNaN(val) ? 0 : round6(val) }));
                  setIsDirty(true);
                }}
              />
            </div>
            <p className={styles.hint}>
              Drag the pin on the map, or use the latitude and longitude inputs above for full keyboard accessibility.
            </p>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>3 · Map Coordinates</h2>
            <div className={styles.mapWrapper}>
              <MapView
                markers={coords ? [{ id: 'market-pin', lat: coords.lat, lng: coords.lng, label: formName || 'Market Location' }] : []}
                height="260px"
                zoom={14}
                draggable
                onMove={({ lat, lng }) => {
                  setCoords({ lat: round6(lat), lng: round6(lng) });
                  setIsDirty(true);
                }}
                ariaLabel="Market location. Drag the pin to set coordinates."
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>4 · Operating Days and Timings</h2>
            {!hasTradingDays && (
              <div className={styles.closedNotice} role="status">This market will show as closed to customers.</div>
            )}
            <div className={styles.scheduleList}>
              {scheduleState.map((row, idx) => (
                <div key={row.day} className={styles.scheduleRow}>
                  <div className={styles.scheduleDayInfo}>
                    <Toggle
                      id={`day-toggle-${row.day}`}
                      checked={row.enabled}
                      onChange={() => handleToggleDay(idx)}
                      label={`Trade on ${DAY_LABELS[row.day]}`}
                    />
                    <span className={styles.scheduleDayName}>{DAY_LABELS[row.day]}</span>
                  </div>

                  <div className={styles.scheduleTimes}>
                    <label htmlFor={`open-${row.day}`} className="visuallyHidden">{DAY_LABELS[row.day]} opening time</label>
                    <input
                      id={`open-${row.day}`}
                      type="time"
                      className={styles.timeInput}
                      value={row.opensAt}
                      disabled={!row.enabled}
                      onChange={(e) => handleScheduleTimeChange(idx, 'opensAt', e.target.value)}
                    />
                    <span className={styles.timeDivider}>to</span>
                    <label htmlFor={`close-${row.day}`} className="visuallyHidden">{DAY_LABELS[row.day]} closing time</label>
                    <input
                      id={`close-${row.day}`}
                      type="time"
                      className={styles.timeInput}
                      value={row.closesAt}
                      disabled={!row.enabled}
                      onChange={(e) => handleScheduleTimeChange(idx, 'closesAt', e.target.value)}
                    />
                  </div>

                  {scheduleTimeErrors[row.day] && (
                    <div className={styles.rowError} role="alert">{scheduleTimeErrors[row.day]}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.footerActions}>
            <Button type="button" variant="secondary" onClick={handleCloseSheet}>Cancel</Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={!isDirty || !isFormValid || submitting}
            >
              Save market
            </Button>
          </div>
        </form>
      </BottomSheet>

      <ConfirmDialog
        open={discardConfirmOpen}
        title="Discard unsaved changes?"
        body="You have unsaved changes in this market form. If you close now, those changes will be lost."
        confirmLabel="Discard changes"
        variant="danger"
        onConfirm={async () => {
          setDiscardConfirmOpen(false);
          setIsDirty(false);
          onClose();
        }}
        onClose={() => setDiscardConfirmOpen(false)}
      />
    </>
  );
}

export default MarketEditorSheet;
