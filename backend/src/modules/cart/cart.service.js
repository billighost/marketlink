/**
 * Cart quoting service layer.
 * Recomputes live prices, stock levels, pickup slot availability, and checkout eligibility.
 * Enforces a strict 3-query database budget (products, farmers, markets) to avoid N+1 scans.
 */

import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { getUpcomingSlots } from '../../utils/slots.js';
import { AppError } from '../../utils/errors.js';

const BLOCKING_ISSUE_CODES = new Set([
  'OUT_OF_STOCK',
  'NOT_ENOUGH_STOCK',
  'UNAVAILABLE',
  'FARMER_NOT_LISTED',
  'SLOT_CLOSED',
  'NO_SLOT_SELECTED',
  'SLOT_FULL',
]);

/**
 * Computes a live quote for a multi-group cart payload.
 *
 * @param {Array<{ farmerId: string, slotStart?: string, items: Array<{ productId: string, quantity: number, expectedPriceCents?: number }> }>} groups
 * @param {object} [options]
 * @param {Date} [options.now]
 * @returns {Promise<{ groups: Array<object>, totalCents: number, canCheckout: boolean }>}
 */
export async function getCartQuote(groups, { now = new Date() } = {}) {
  const db = getDb();

  // 1. Collect all product IDs, farmer IDs
  const allProductIds = [];
  const allFarmerIds = [];

  for (const group of groups) {
    allFarmerIds.push(toObjectId(group.farmerId));
    for (const item of group.items) {
      allProductIds.push(toObjectId(item.productId));
    }
  }

  // 2. Query 1: Fetch all products in one find({ _id: { $in } })
  const products = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find({ _id: { $in: allProductIds } })
    .toArray();

  const productMap = new Map();
  const allMarketIds = [];
  for (const p of products) {
    productMap.set(p._id.toString(), p);
    if (Array.isArray(p.marketIds)) {
      for (const mId of p.marketIds) {
        allMarketIds.push(toObjectId(mId));
      }
    }
  }

  // Validate that all products in each group belong to that group's farmer
  for (const group of groups) {
    for (const item of group.items) {
      const p = productMap.get(item.productId.toString());
      if (p && p.farmerId.toString() !== group.farmerId.toString()) {
        throw AppError.validation([
          {
            field: 'items',
            message: `Product ${item.productId} does not belong to farmer ${group.farmerId}.`,
          },
        ]);
      }
    }
  }

  // 3. Query 2: Fetch all farmers in one find({ _id: { $in } })
  const farmers = await db
    .collection(COLLECTIONS.FARMERS)
    .find({ _id: { $in: allFarmerIds } })
    .toArray();

  const farmerMap = new Map();
  for (const f of farmers) {
    farmerMap.set(f._id.toString(), f);
    if (Array.isArray(f.marketIds)) {
      for (const mId of f.marketIds) {
        allMarketIds.push(toObjectId(mId));
      }
    }
  }

  // 4. Query 3: Fetch all associated markets in one find({ _id: { $in } })
  const markets = await db
    .collection(COLLECTIONS.MARKETS)
    .find({ _id: { $in: allMarketIds } })
    .toArray();

  // 5. In-memory processing
  let overallTotalCents = 0;
  let hasAnyBlockingIssue = false;

  const resultGroups = [];

  for (const group of groups) {
    const farmer = farmerMap.get(group.farmerId.toString());
    const groupIssues = [];

    if (!farmer || !farmer.listingEnabled) {
      groupIssues.push({
        code: 'FARMER_NOT_LISTED',
        message: 'Farmer is no longer accepting orders.',
      });
    }

    // Slots from getUpcomingSlots (in-memory slot calculator + cache)
    const farmerMarkets = farmer
      ? markets.filter((m) =>
          (farmer.marketIds || []).some((fMid) => fMid.toString() === m._id.toString())
        )
      : [];

    const upcomingSlots = farmer
      ? getUpcomingSlots(farmer, farmerMarkets, { days: 14, now })
      : [];

    let selectedSlot = null;
    let cutoffAt = null;

    if (group.slotStart) {
      const match = upcomingSlots.find((s) => s.start === group.slotStart);
      if (!match || !match.isOpen) {
        groupIssues.push({
          code: 'SLOT_CLOSED',
          message: 'That pickup time has closed.',
        });
      } else {
        selectedSlot = { start: match.start, isOpen: match.isOpen };
        cutoffAt = match.cutoffAt;
      }
    } else {
      groupIssues.push({
        code: 'NO_SLOT_SELECTED',
        message: 'Please select a pickup time.',
      });
      // Pick cutoff of first open slot if available
      const firstOpen = upcomingSlots.find((s) => s.isOpen);
      if (firstOpen) {
        cutoffAt = firstOpen.cutoffAt;
      }
    }

    let groupSubtotalCents = 0;
    const lines = [];

    for (const item of group.items) {
      const p = productMap.get(item.productId.toString());
      const lineIssues = [];

      if (!p || !p.listed || p.availability === 'hidden') {
        lineIssues.push({
          code: 'UNAVAILABLE',
          message: 'No longer available.',
        });
      } else {
        // Check stock
        if (p.availability === 'out' || p.quantityAvailable <= 0) {
          lineIssues.push({
            code: 'OUT_OF_STOCK',
            message: 'Out of stock.',
            maxQuantity: 0,
          });
        } else if (p.quantityAvailable < item.quantity) {
          lineIssues.push({
            code: 'NOT_ENOUGH_STOCK',
            message: `Only ${p.quantityAvailable} left.`,
            maxQuantity: p.quantityAvailable,
          });
        }

        // Price comparison
        if (
          item.expectedPriceCents !== undefined &&
          item.expectedPriceCents !== p.priceCents
        ) {
          const oldFormatted = (item.expectedPriceCents / 100).toFixed(2);
          const newFormatted = (p.priceCents / 100).toFixed(2);
          lineIssues.push({
            code: 'PRICE_CHANGED',
            message: `The price changed from $${oldFormatted} to $${newFormatted}.`,
          });
        }
      }

      const unitPriceCents = p ? p.priceCents : (item.expectedPriceCents || 0);
      const lineTotalCents = unitPriceCents * item.quantity;
      groupSubtotalCents += lineTotalCents;

      // Check if any line issue is blocking
      for (const issue of lineIssues) {
        if (BLOCKING_ISSUE_CODES.has(issue.code)) {
          hasAnyBlockingIssue = true;
        }
      }

      lines.push({
        productId: item.productId.toString(),
        name: p ? p.name : 'Unknown Product',
        unit: p ? p.unit : 'each',
        art: p ? p.art : 'carrot',
        quantity: item.quantity,
        unitPriceCents,
        lineTotalCents,
        availability: p ? p.availability : 'out',
        quantityAvailable: p ? p.quantityAvailable : 0,
        issues: lineIssues,
      });
    }

    // Check if any group issue is blocking
    for (const issue of groupIssues) {
      if (BLOCKING_ISSUE_CODES.has(issue.code)) {
        hasAnyBlockingIssue = true;
      }
    }

    overallTotalCents += groupSubtotalCents;

    resultGroups.push({
      farmerId: group.farmerId.toString(),
      farmer: {
        stallName: farmer ? farmer.stallName : 'Unknown Farm',
        stallNumber: farmer ? farmer.stallNumber || '' : '',
      },
      slots: upcomingSlots,
      selectedSlot,
      cutoffAt,
      lines,
      issues: groupIssues,
      subtotalCents: groupSubtotalCents,
    });
  }

  return {
    groups: resultGroups,
    totalCents: overallTotalCents,
    canCheckout: !hasAnyBlockingIssue,
  };
}
