<<<<<<< HEAD
import { fromGeoPoint, directionsUrls } from './geo.js';export function formatCustomerName(fullName = '') {  if (!fullName || typeof fullName !== 'string') return 'Customer';  const parts = fullName.trim().split(/\s+/);  if (parts.length === 1) return parts[0];  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;}export function toProductCard(p, { cutoffAt } = {}) {  const card = {    id: p._id ? p._id.toString() : p.id,    name: p.name,    priceCents: p.priceCents,    unit: p.unit,    availability: p.availability,    art: p.art,    imageUrl: p.imageUrl ?? null,    tags: Array.isArray(p.tags) ? p.tags : [],    ratingAvg: p.ratingAvg ?? 0,    ratingCount: p.ratingCount ?? 0,    category: {      slug: p.categorySlug,      name: p.category?.name || p.categoryName || (p.categorySlug ? p.categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : ''),    },    farmer: {      id: p.farmerId ? p.farmerId.toString() : (p.farmer?.id || ''),      stallName: p.farmer?.stallName || '',      stallNumber: p.farmer?.stallNumber || '',      art: p.farmer?.art || '',    },    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,  };  if (p.availability === 'low') {    card.quantityLeft = p.quantityAvailable ?? p.quantityLeft ?? 0;  }  const effectiveCutoff = cutoffAt || p.cutoffAt;  if (effectiveCutoff) {    card.cutoffAt = effectiveCutoff instanceof Date ? effectiveCutoff.toISOString() : effectiveCutoff;  }  return card;}export function toProductDetail(p, { markets = [], farmerCutoff, nextPickupSlots = [] } = {}) {  const card = toProductCard(p);  return {    ...card,    description: p.description || '',    quantityLeft: p.quantityAvailable ?? p.quantityLeft ?? 0,     marketIds: markets.map((m) => ({      id: m._id ? m._id.toString() : m.id,      name: m.name,    })),    farmerCutoff: farmerCutoff || {      nextPickupStart: null,      cutoffAt: null,      isCutoffPassed: false,    },    nextPickupSlots: nextPickupSlots.slice(0, 3),    unitPriceLabel: p.priceCents !== undefined && p.unit ? `$${(p.priceCents / 100).toFixed(2)} / ${p.unit}` : undefined,  };}export function toFarmerCard(f, { markets = [] } = {}) {  return {    id: f._id ? f._id.toString() : f.id,    stallName: f.stallName,    stallNumber: f.stallNumber || '',    specialty: f.specialty || '',    art: f.art,    imageUrl: f.imageUrl ?? null,    ratingAvg: f.ratingAvg ?? 0,    ratingCount: f.ratingCount ?? 0,    operatingDays: Array.isArray(f.operatingDays) ? f.operatingDays : [],    markets: markets.map((m) => ({      id: m._id ? m._id.toString() : m.id,      name: m.name,    })),    isTopSeller: Boolean(f.isTopSeller),    isNew: Boolean(f.isNew),  };}export function toFarmerDetail(f, { markets = [], ratingBreakdown = {}, productCount = 0 } = {}) {  const card = toFarmerCard(f, { markets });  const loc = fromGeoPoint(f.location) || { lat: 0, lng: 0 };  return {    ...card,    story: f.story || '',    since: f.since || 0,    contactPerson: f.contactPerson || '',    address: f.address || '',    location: loc,    pickupWindows: Array.isArray(f.pickupWindows) ? f.pickupWindows : [],    cutoffMinutesBefore: f.cutoffMinutesBefore ?? 720,    ratingBreakdown: {      5: ratingBreakdown[5] || 0,      4: ratingBreakdown[4] || 0,      3: ratingBreakdown[3] || 0,      2: ratingBreakdown[2] || 0,      1: ratingBreakdown[1] || 0,    },    productCount,  };}export function toMarketCard(m, { distanceMeters, nextOpening } = {}) {  const loc = fromGeoPoint(m.location) || { lat: 0, lng: 0 };  const card = {    id: m._id ? m._id.toString() : m.id,    name: m.name,    slug: m.slug,    address: m.address,    location: loc,    schedule: Array.isArray(m.schedule) ? m.schedule : [],    farmerCount: m.farmerCount || 0,    directionsUrls: directionsUrls(loc.lat, loc.lng),  };  const dist = distanceMeters !== undefined ? distanceMeters : m.distanceMeters;  if (dist !== undefined) {    card.distanceMeters = Math.round(dist);  }  const opening = nextOpening || m.nextOpening;  if (opening) {    card.nextOpening = opening;  }  return card;}export function toMarketDetail(m, opts = {}) {  const card = toMarketCard(m, opts);  return {    ...card,    note: m.note || '',    facilities: Array.isArray(m.facilities) ? m.facilities : [],    timezone: m.timezone || 'America/New_York',  };}export function toReviewItem(r, targetName) {  const item = {    id: r._id ? r._id.toString() : r.id,    rating: r.rating,    comment: r.comment || null,    customerName: formatCustomerName(r.customerName),    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,    target: {      type: r.targetType,      id: (r.productId || r.farmerId) ? (r.productId || r.farmerId).toString() : '',      name: targetName || r.targetName || '',    },  };  if (r.reply && r.reply.text) {    item.reply = {      text: r.reply.text,      at: r.reply.at instanceof Date ? r.reply.at.toISOString() : r.reply.at,    };  }  return item;}
=======
/**
 * Public API response shape projectors.
 * Enforces strict, freeze-safe data contracts for cards, details, and reviews without leaking internal fields.
 */

import { fromGeoPoint, directionsUrls } from './geo.js';
import { computeMarketClock, toOperatingDayNumbers, computeOpenToday } from './slots.js';

/**
 * Formats full customer name as first name + last initial (e.g. "George Adams" -> "George A.").
 *
 * @param {string} [fullName='']
 * @returns {string}
 */
export function formatCustomerName(fullName = '') {
  if (!fullName || typeof fullName !== 'string') return 'Customer';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/**
 * Transforms a product document into a public productCard.
 *
 * @param {object} p
 * @param {object} [opts]
 * @param {Date|string} [opts.cutoffAt]
 * @returns {object}
 */
export function toProductCard(p, { cutoffAt } = {}) {
  const card = {
    id: p._id ? p._id.toString() : p.id,
    name: p.name,
    priceCents: p.priceCents,
    unit: p.unit,
    availability: p.availability,
    art: p.art,
    imageUrl: p.imageUrl ?? null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    ratingAvg: p.ratingAvg ?? 0,
    ratingCount: p.ratingCount ?? 0,
    category: {
      slug: p.categorySlug,
      name: p.category?.name || p.categoryName || (p.categorySlug ? p.categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : ''),
    },
    farmer: {
      id: p.farmerId ? p.farmerId.toString() : (p.farmer?.id || ''),
      stallName: p.farmer?.stallName || '',
      stallNumber: p.farmer?.stallNumber || '',
      art: p.farmer?.art || '',
    },
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  };

  // quantityLeft is ONLY included when availability is 'low' on productCard
  if (p.availability === 'low') {
    card.quantityLeft = p.quantityAvailable ?? p.quantityLeft ?? 0;
  }

  const effectiveCutoff = cutoffAt || p.cutoffAt;
  if (effectiveCutoff) {
    card.cutoffAt = effectiveCutoff instanceof Date ? effectiveCutoff.toISOString() : effectiveCutoff;
  }

  return card;
}

/**
 * Transforms a product document into a public productDetail.
 * Includes all productCard fields plus description, markets, farmerCutoff, and pickup slots.
 *
 * @param {object} p
 * @param {object} [opts]
 * @param {Array<object>} [opts.markets=[]]
 * @param {object} [opts.farmerCutoff]
 * @param {Array<object>} [opts.nextPickupSlots=[]]
 * @returns {object}
 */
export function toProductDetail(p, { markets = [], farmerCutoff, nextPickupSlots = [] } = {}) {
  const card = toProductCard(p);

  return {
    ...card,
    description: p.description || '',
    quantityLeft: p.quantityAvailable ?? p.quantityLeft ?? 0, // always present on detail
    marketIds: markets.map((m) => ({
      id: m._id ? m._id.toString() : m.id,
      name: m.name,
    })),
    farmerCutoff: farmerCutoff || {
      nextPickupStart: null,
      cutoffAt: null,
      isCutoffPassed: false,
    },
    nextPickupSlots: nextPickupSlots.slice(0, 3),
    unitPriceLabel: p.priceCents !== undefined && p.unit ? `$${(p.priceCents / 100).toFixed(2)} / ${p.unit}` : undefined,
  };
}

/**
 * Transforms a farmer profile into a public farmerCard.
 *
 * @param {object} f
 * @param {object} [opts]
 * @param {Array<object>} [opts.markets=[]]
 * @param {number} [opts.lowStockCount]
 * @param {number} [opts.soldOutCount]
 * @param {Date} [opts.now=new Date()]
 * @returns {object}
 */
export function toFarmerCard(f, { markets = [], lowStockCount, soldOutCount, now = new Date() } = {}) {
  const bannerUrl = f.bannerUrl ?? f.imageUrl ?? null;
  const logoUrl = f.logoUrl ?? null;
  const operatingDayNumbers = toOperatingDayNumbers(f.operatingDays);
  const defaultTz = markets[0]?.timezone || 'America/New_York';
  const openToday = f.listingEnabled !== false && computeOpenToday(operatingDayNumbers, defaultTz, now);

  return {
    id: f._id ? f._id.toString() : f.id,
    stallName: f.stallName,
    stallNumber: f.stallNumber || '',
    specialty: f.specialty || '',
    art: f.art,
    imageUrl: bannerUrl,
    logoUrl,
    bannerUrl,
    ratingAvg: f.ratingAvg ?? 0,
    ratingCount: f.ratingCount ?? 0,
    operatingDays: Array.isArray(f.operatingDays) ? f.operatingDays : [],
    operatingDayNumbers,
    openToday,
    lowStockCount: typeof lowStockCount === 'number' ? lowStockCount : (f.lowStockCount ?? 0),
    soldOutCount: typeof soldOutCount === 'number' ? soldOutCount : (f.soldOutCount ?? 0),
    markets: markets.map((m) => ({
      id: m._id ? m._id.toString() : m.id,
      name: m.name,
    })),
    isTopSeller: Boolean(f.isTopSeller),
    isNew: Boolean(f.isNew),
  };
}

/**
 * Transforms a farmer profile into a public farmerDetail.
 *
 * @param {object} f
 * @param {object} [opts]
 * @param {Array<object>} [opts.markets=[]]
 * @param {object} [opts.ratingBreakdown={}]
 * @param {number} [opts.productCount=0]
 * @param {number} [opts.lowStockCount]
 * @param {number} [opts.soldOutCount]
 * @param {Date} [opts.now]
 * @returns {object}
 */
export function toFarmerDetail(f, { markets = [], ratingBreakdown = {}, productCount = 0, lowStockCount, soldOutCount, now } = {}) {
  const card = toFarmerCard(f, { markets, lowStockCount, soldOutCount, now });
  const loc = fromGeoPoint(f.location) || { lat: 0, lng: 0 };

  return {
    ...card,
    story: f.story || '',
    since: f.since || 0,
    contactPerson: f.contactPerson || '',
    address: f.address || '',
    location: loc,
    pickupWindows: Array.isArray(f.pickupWindows) ? f.pickupWindows : [],
    cutoffMinutesBefore: f.cutoffMinutesBefore ?? 720,
    ratingBreakdown: {
      5: ratingBreakdown[5] || 0,
      4: ratingBreakdown[4] || 0,
      3: ratingBreakdown[3] || 0,
      2: ratingBreakdown[2] || 0,
      1: ratingBreakdown[1] || 0,
    },
    productCount,
  };
}

/**
 * Transforms a market document into a public marketCard.
 *
 * @param {object} m
 * @param {object} [opts]
 * @param {number} [opts.distanceMeters]
 * @param {object} [opts.nextOpening]
 * @param {object} [opts.clock]
 * @param {Date} [opts.now]
 * @returns {object}
 */
export function toMarketCard(m, { distanceMeters, nextOpening, clock, now } = {}) {
  const loc = fromGeoPoint(m.location) || { lat: 0, lng: 0 };
  const card = {
    id: m._id ? m._id.toString() : m.id,
    name: m.name,
    slug: m.slug,
    address: m.address,
    location: loc,
    bannerUrl: m.bannerUrl ?? null,
    schedule: Array.isArray(m.schedule) ? m.schedule : [],
    farmerCount: m.farmerCount || 0,
    directionsUrls: directionsUrls(loc.lat, loc.lng),
  };

  const dist = distanceMeters !== undefined ? distanceMeters : m.distanceMeters;
  if (dist !== undefined) {
    card.distanceMeters = Math.round(dist);
  }

  const opening = nextOpening || m.nextOpening;
  if (opening) {
    card.nextOpening = opening;
  }

  card.clock = clock || m.clock || computeMarketClock(m, now || new Date());

  return card;
}

/**
 * Transforms a market document into a public marketDetail.
 *
 * @param {object} m
 * @param {object} [opts]
 * @returns {object}
 */
export function toMarketDetail(m, opts = {}) {
  const card = toMarketCard(m, opts);

  return {
    ...card,
    note: m.note || '',
    facilities: Array.isArray(m.facilities) ? m.facilities : [],
    timezone: m.timezone || 'America/New_York',
  };
}

/**
 * Transforms a review document into a public reviewItem.
 *
 * @param {object} r
 * @param {string} [targetName]
 * @returns {object}
 */
export function toReviewItem(r, targetName) {
  const item = {
    id: r._id ? r._id.toString() : r.id,
    rating: r.rating,
    comment: r.comment || null,
    customerName: formatCustomerName(r.customerName),
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    target: {
      type: r.targetType,
      id: (r.productId || r.farmerId) ? (r.productId || r.farmerId).toString() : '',
      name: targetName || r.targetName || '',
    },
  };

  if (r.reply && r.reply.text) {
    item.reply = {
      text: r.reply.text,
      at: r.reply.at instanceof Date ? r.reply.at.toISOString() : r.reply.at,
    };
  }

  return item;
}
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
