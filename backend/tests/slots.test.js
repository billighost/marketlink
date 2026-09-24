/**
 * T2.011 - T2.030: Pickup slots and timezone DST calculation test suite.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { zonedTimeToUtc, formatSlotLabel, getUpcomingSlots } from '../src/utils/slots.js';

describe('Pickup Slots Suite (T2.011 - T2.030)', () => {
  const sampleMarket = {
    _id: 'mkt-1',
    name: 'Elm Street Market',
    timezone: 'America/New_York',
    schedule: [{ day: 'sat', openMin: 480, closeMin: 780 }],
  };

  const sampleFarmer = {
    _id: 'fmr-1',
    stallNumber: 'Stall 4',
    operatingDays: ['sat'],
    marketIds: ['mkt-1'],
    pickupWindows: [{ day: 'sat', startMin: 480, endMin: 600 }], // 8:00 AM - 10:00 AM
    cutoffMinutesBefore: 720, // 12 hours
  };

  it('T2.011: Monday 09:00 local -> next Saturday slot correctly computed', () => {
    // 2026-09-21 was a Monday. 09:00 EDT is 13:00 UTC
    const mondayNow = new Date('2026-09-21T13:00:00.000Z');
    const slots = getUpcomingSlots(sampleFarmer, [sampleMarket], { days: 7, now: mondayNow });

    assert.ok(slots.length >= 1);
    const first = slots[0];
    assert.equal(first.marketName, 'Elm Street Market');
    assert.equal(first.stallNumber, 'Stall 4');
    assert.equal(first.isOpen, true);
    // Saturday 2026-09-26 8:00 AM EDT is 12:00 UTC
    assert.equal(first.start, '2026-09-26T12:00:00.000Z');
    assert.equal(first.end, '2026-09-26T14:00:00.000Z');
    // Cutoff: 12h before start = 2026-09-26 00:00 UTC
    assert.equal(first.cutoffAt, '2026-09-26T00:00:00.000Z');
  });

  it('T2.012: week wrap correctly finds slots in the subsequent week', () => {
    const mondayNow = new Date('2026-09-21T13:00:00.000Z');
    const slots = getUpcomingSlots(sampleFarmer, [sampleMarket], { days: 14, now: mondayNow });

    assert.equal(slots.length, 2);
    assert.equal(slots[0].start, '2026-09-26T12:00:00.000Z');
    assert.equal(slots[1].start, '2026-10-03T12:00:00.000Z');
  });

  it('T2.013: handles farmer with two pickup windows on the same day', () => {
    const doubleWindowFarmer = {
      ...sampleFarmer,
      _id: 'fmr-double',
      pickupWindows: [
        { day: 'sat', startMin: 480, endMin: 600 }, // 8:00 AM - 10:00 AM
        { day: 'sat', startMin: 660, endMin: 780 }, // 11:00 AM - 1:00 PM
      ],
    };
    const mondayNow = new Date('2026-09-21T13:00:00.000Z');
    const slots = getUpcomingSlots(doubleWindowFarmer, [sampleMarket], { days: 7, now: mondayNow });

    assert.equal(slots.length, 2);
    assert.equal(slots[0].start, '2026-09-26T12:00:00.000Z');
    assert.equal(slots[1].start, '2026-09-26T15:00:00.000Z'); // 11:00 AM EDT
  });

  it('T2.014: cutoffAt arithmetic: 720 minutes before start', () => {
    const mondayNow = new Date('2026-09-21T13:00:00.000Z');
    const slots = getUpcomingSlots(sampleFarmer, [sampleMarket], { days: 7, now: mondayNow });
    const slot = slots[0];

    const startMs = new Date(slot.start).getTime();
    const cutoffMs = new Date(slot.cutoffAt).getTime();
    assert.equal(startMs - cutoffMs, 720 * 60000);
  });

  it('T2.015: slot already ended is skipped', () => {
    // Saturday 2026-09-26 15:00 UTC (11:00 AM EDT, after the 10:00 AM window ended)
    const saturdayPastNow = new Date('2026-09-26T15:00:00.000Z');
    const slots = getUpcomingSlots(sampleFarmer, [sampleMarket], { days: 7, now: saturdayPastNow });

    // The Saturday 26 Sep slot ended, so next slot is Saturday 03 Oct
    assert.equal(slots.length, 1);
    assert.equal(slots[0].start, '2026-10-03T12:00:00.000Z');
  });

  it('T2.016: slot started or past cutoff but end > now is included with isOpen = false', () => {
    // Saturday 2026-09-26 06:00 UTC (2:00 AM EDT) is past cutoff (00:00 UTC) but before slot start (12:00 UTC)
    const saturdayCutoffPassed = new Date('2026-09-26T06:00:00.000Z');
    const slots = getUpcomingSlots(sampleFarmer, [sampleMarket], { days: 7, now: saturdayCutoffPassed });

    assert.ok(slots.length >= 1);
    assert.equal(slots[0].start, '2026-09-26T12:00:00.000Z');
    assert.equal(slots[0].isOpen, false);
  });

  it('T2.017: days limit strictly limits horizon', () => {
    const mondayNow = new Date('2026-09-21T13:00:00.000Z');
    // Only 3 days from Monday (until Thursday): no Saturday in range
    const slots = getUpcomingSlots(sampleFarmer, [sampleMarket], { days: 3, now: mondayNow });
    assert.equal(slots.length, 0);
  });

  it('T2.018: America/New_York across DST start (2026-03-08) produces correct UTC instants', () => {
    // On 2026-03-08, US clocks jump forward from EST (-5) to EDT (-4)
    // 08:00 AM EST (before jump on 2026-03-07) = 13:00 UTC
    // 08:00 AM EDT (after jump on 2026-03-08) = 12:00 UTC
    const beforeDst = zonedTimeToUtc({ year: 2026, month: 3, day: 7, minutes: 480 }, 'America/New_York');
    assert.equal(beforeDst.toISOString(), '2026-03-07T13:00:00.000Z');

    const afterDst = zonedTimeToUtc({ year: 2026, month: 3, day: 8, minutes: 480 }, 'America/New_York');
    assert.equal(afterDst.toISOString(), '2026-03-08T12:00:00.000Z');
  });

  it('T2.019: America/New_York across DST end (2026-11-01) produces correct UTC instants', () => {
    // On 2026-11-01, US clocks jump back from EDT (-4) to EST (-5)
    // 08:00 AM EDT (2026-10-31) = 12:00 UTC
    // 08:00 AM EST (2026-11-01) = 13:00 UTC
    const beforeFallBack = zonedTimeToUtc({ year: 2026, month: 10, day: 31, minutes: 480 }, 'America/New_York');
    assert.equal(beforeFallBack.toISOString(), '2026-10-31T12:00:00.000Z');

    const afterFallBack = zonedTimeToUtc({ year: 2026, month: 11, day: 1, minutes: 480 }, 'America/New_York');
    assert.equal(afterFallBack.toISOString(), '2026-11-01T13:00:00.000Z');
  });

  it('T2.020: Southern hemisphere timezone Australia/Sydney calculates correctly', () => {
    // Sydney is UTC+10 (AEST) or UTC+11 (AEDT)
    const sydneyUtc = zonedTimeToUtc({ year: 2026, month: 7, day: 15, minutes: 480 }, 'Australia/Sydney');
    // July in Sydney is winter (UTC+10). 08:00 AEST = 22:00 UTC on 2026-07-14
    assert.equal(sydneyUtc.toISOString(), '2026-07-14T22:00:00.000Z');
  });

  it('T2.021: Farmer with no windows returns an empty array', () => {
    const noWindowsFarmer = { ...sampleFarmer, pickupWindows: [] };
    const slots = getUpcomingSlots(noWindowsFarmer, [sampleMarket]);
    assert.deepEqual(slots, []);
  });

  it('T2.022: Label is formatted in market timezone', () => {
    const start = new Date('2026-09-26T12:00:00.000Z'); // 8:00 AM EDT
    const end = new Date('2026-09-26T14:00:00.000Z');   // 10:00 AM EDT
    const label = formatSlotLabel(start, end, 'America/New_York');
    assert.equal(label, 'Sat 26 Sep, 8:00 to 10:00am');
  });
});
