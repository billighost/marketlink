import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPrice,
  formatCurrency,
  parseDollarsToCents,
  formatCentsToDollarsInput,
  formatDate,
  formatDateShort,
  formatTime,
  formatPickup,
  formatCountdown,
  formatRelativeTime,
  formatMarketSchedule,
  formatMinutesToTime,
} from '../src/utils/format.js';

test('D5: formatPrice money correctness - boundary values', () => {
  assert.equal(formatPrice(1), '$0.01');
  assert.equal(formatPrice(99), '$0.99');
  assert.equal(formatPrice(100), '$1.00');
  assert.equal(formatPrice(101), '$1.01');
  assert.equal(formatPrice(999999), '$9,999.99');
  assert.equal(formatPrice(100000000), '$1,000,000.00');
});

test('D5: formatPrice money correctness - no float accumulation errors', () => {
  // 10c + 20c in integer cents
  const item1Cents = 10;
  const item2Cents = 20;
  const totalCents = item1Cents + item2Cents;
  assert.equal(totalCents, 30);
  assert.equal(formatPrice(totalCents), '$0.30');

  // Demonstrate that standard float 0.1 + 0.2 produces 0.30000000000000004
  const floatSum = 0.1 + 0.2;
  assert.notEqual(floatSum, 0.3); // proves JS float precision flaw

  // Prove integer cents math avoids float flaw entirely
  const integerSumCents = Math.round(0.1 * 100) + Math.round(0.2 * 100);
  assert.equal(integerSumCents, 30);
  assert.equal(formatPrice(integerSumCents), '$0.30');

  // Multi-item order simulation (20 items @ $14.99)
  const qty = 20;
  const unitCents = 1499;
  const orderTotalCents = qty * unitCents;
  assert.equal(orderTotalCents, 29980);
  assert.equal(formatPrice(orderTotalCents), '$299.80');
});

test('D5: formatCountdown correctness across all boundary intervals', () => {
  const baseTime = 1760000000000; // Fixed epoch timestamp for deterministic tests

  // 0ms / passed
  assert.equal(formatCountdown(baseTime, baseTime), 'Cutoff passed');
  assert.equal(formatCountdown(baseTime - 1000, baseTime), 'Cutoff passed');

  // 59 seconds
  assert.equal(formatCountdown(baseTime + 59 * 1000, baseTime), '59s left to order');

  // 61 seconds (1m 1s -> minute level)
  assert.equal(formatCountdown(baseTime + 61 * 1000, baseTime), '1m left to order');

  // 59 minutes
  assert.equal(formatCountdown(baseTime + 59 * 60 * 1000, baseTime), '59m left to order');

  // 60 minutes (1 hour)
  assert.equal(formatCountdown(baseTime + 60 * 60 * 1000, baseTime), '1h 0m left to order');

  // 47 hours (1 day 23 hours)
  assert.equal(formatCountdown(baseTime + 47 * 60 * 60 * 1000, baseTime), '1d 23h left to order');

  // 49 hours (2 days 1 hour)
  assert.equal(formatCountdown(baseTime + 49 * 60 * 60 * 1000, baseTime), '2d 1h left to order');
});

test('D5: formatPickup correctness spanning noon across timezones', () => {
  // Slot: 11:30 am to 1:30 pm UTC on 2026-09-26
  // In UTC: 11:30 am – 1:30 pm
  const slotUtcNoon = {
    startTime: '2026-09-26T11:30:00.000Z',
    endTime: '2026-09-26T13:30:00.000Z',
  };

  // Test America/New_York (EDT, UTC-4): 07:30 am – 09:30 am
  const nyMorning = formatPickup(slotUtcNoon, 'America/New_York');
  assert.ok(nyMorning.includes('7:30 am – 9:30 am'));

  // Test a slot spanning local noon in America/New_York (15:30 UTC = 11:30 am EDT, 17:30 UTC = 1:30 pm EDT)
  const slotNyNoon = {
    startTime: '2026-09-26T15:30:00.000Z',
    endTime: '2026-09-26T17:30:00.000Z',
  };
  const nyNoon = formatPickup(slotNyNoon, 'America/New_York');
  assert.ok(nyNoon.includes('11:30 am – 1:30 pm'), `Expected noon span, got: ${nyNoon}`);

  // Test Pacific/Auckland (NZST, UTC+12 in late September):
  // 11:30 pm to 1:30 am next day, or spanning local noon (23:30 UTC previous day = 11:30 am NZST)
  const slotAucklandNoon = {
    startTime: '2026-09-25T23:30:00.000Z',
    endTime: '2026-09-26T01:30:00.000Z',
  };
  const aucklandNoon = formatPickup(slotAucklandNoon, 'Pacific/Auckland');
  assert.ok(aucklandNoon.includes('11:30 am – 1:30 pm'), `Expected Auckland noon span, got: ${aucklandNoon}`);

  // Test Asia/Kolkata (IST, UTC+05:30):
  // Local noon 11:30 am IST = 06:00 UTC, 1:30 pm IST = 08:00 UTC
  const slotKolkataNoon = {
    startTime: '2026-09-26T06:00:00.000Z',
    endTime: '2026-09-26T08:00:00.000Z',
  };
  const kolkataNoon = formatPickup(slotKolkataNoon, 'Asia/Kolkata');
  assert.ok(kolkataNoon.includes('11:30 am – 1:30 pm'), `Expected Kolkata noon span, got: ${kolkataNoon}`);
});

test('D5: formatPickup correctness across DST transition dates', () => {
  // America/New_York Autumn DST transition: November 1, 2026 (clocks fall back at 2:00 am)
  // Afternoon pickup on DST change day: 2:00 pm – 4:00 pm EST (UTC-5)
  // 2:00 pm EST = 19:00 UTC
  const dstFallBackSlot = {
    startTime: '2026-11-01T19:00:00.000Z',
    endTime: '2026-11-01T21:00:00.000Z',
  };
  const nyDstFall = formatPickup(dstFallBackSlot, 'America/New_York');
  assert.ok(nyDstFall.includes('Nov 1'));
  assert.ok(nyDstFall.includes('2:00 pm – 4:00 pm'), `Expected 2:00 pm - 4:00 pm, got ${nyDstFall}`);

  // America/New_York Spring DST transition: March 8, 2026 (clocks spring forward at 2:00 am)
  // Afternoon pickup on DST change day: 2:00 pm – 4:00 pm EDT (UTC-4)
  // 2:00 pm EDT = 18:00 UTC
  const dstSpringForwardSlot = {
    startTime: '2026-03-08T18:00:00.000Z',
    endTime: '2026-03-08T20:00:00.000Z',
  };
  const nyDstSpring = formatPickup(dstSpringForwardSlot, 'America/New_York');
  assert.ok(nyDstSpring.includes('Mar 8'));
  assert.ok(nyDstSpring.includes('2:00 pm – 4:00 pm'), `Expected 2:00 pm - 4:00 pm, got ${nyDstSpring}`);
});
