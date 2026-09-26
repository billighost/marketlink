/**
 * Grounded Tool Definitions and Dispatcher for MarketLink Gemini Assistant.
 * Maps Gemini function declarations 1:1 to deterministic backend services.
 * Enforces strict user privacy: caller's req.user.id is always used for order queries.
 */

import { listProducts, getProductDetail } from '../products/products.service.js';
import { listFarmers, getFarmerDetail, getFarmerPickupSlots } from '../farmers/farmers.service.js';
import { listMarkets, getMarketDetail } from '../markets/markets.service.js';
import { listCustomerOrders } from '../orders/orders.service.js';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';

function formatPrice(cents) {
  if (typeof cents !== 'number') return '$0.00';
  return `$${(cents / 100).toFixed(2)}`;
}

function formatMinutes(min) {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  const mm = m < 10 ? `0${m}` : m;
  return `${h12}:${mm} ${ampm}`;
}

const DAY_LABELS = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

// 60-second in-memory cache for market hours
const marketHoursCache = new Map();

/**
 * Gemini Tool / Function Declarations.
 */
export const ASSISTANT_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: 'search_products',
        description: 'Search for fresh produce, bakery, and goods across local farmers. Returns live prices, availability, and stall info.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Search term (e.g. tomatoes, sourdough, honey, eggs)' },
            category: { type: 'STRING', description: 'Category filter (e.g. produce, bakery, dairy, pantry)' },
            day: { type: 'STRING', description: 'Operating day code (mon, tue, wed, thu, fri, sat, sun)' },
            maxPriceCents: { type: 'NUMBER', description: 'Maximum price in cents (e.g. 500 for $5.00)' },
            limit: { type: 'NUMBER', description: 'Maximum number of items to return (up to 5)' },
          },
        },
      },
      {
        name: 'get_product',
        description: 'Get detailed information for a specific product including description, price, unit, and farmer details.',
        parameters: {
          type: 'OBJECT',
          properties: {
            productId: { type: 'STRING', description: 'The unique ID of the product' },
          },
          required: ['productId'],
        },
      },
      {
        name: 'find_farmers',
        description: 'Find local farmers and stalls by keyword, category, market, or day.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Farmer or stall name keyword' },
            category: { type: 'STRING', description: 'Product category' },
            market: { type: 'STRING', description: 'Market ID or slug' },
            day: { type: 'STRING', description: 'Day of week (mon..sun)' },
            limit: { type: 'NUMBER', description: 'Maximum results (up to 5)' },
          },
        },
      },
      {
        name: 'get_farmer',
        description: 'Get farmer stall details, bio, attending markets, operating days, and pre-order cut-off policies.',
        parameters: {
          type: 'OBJECT',
          properties: {
            farmerId: { type: 'STRING', description: 'The unique ID of the farmer' },
          },
          required: ['farmerId'],
        },
      },
      {
        name: 'get_market_hours',
        description: 'Get market opening hours, weekly schedules, and physical address.',
        parameters: {
          type: 'OBJECT',
          properties: {
            marketId: { type: 'STRING', description: 'Optional unique market ID' },
            marketName: { type: 'STRING', description: 'Optional market name or keyword (e.g. Elm Street, Riverside)' },
          },
        },
      },
      {
        name: 'whats_fresh',
        description: "List seasonal highlights and top fresh produce available for upcoming market days.",
        parameters: {
          type: 'OBJECT',
          properties: {
            day: { type: 'STRING', description: 'Market day (e.g. sat, sun)' },
            category: { type: 'STRING', description: 'Optional category' },
            limit: { type: 'NUMBER', description: 'Maximum items to return (up to 6)' },
          },
        },
      },
      {
        name: 'get_my_orders',
        description: "Get active pre-orders and pickup times for the currently signed-in Customer. Always private and scoped to caller.",
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'get_cutoff',
        description: 'Look up pre-order deadline and next available pickup slot for a farmer.',
        parameters: {
          type: 'OBJECT',
          properties: {
            farmerId: { type: 'STRING', description: 'Farmer ID' },
            farmerName: { type: 'STRING', description: 'Farmer stall name' },
          },
        },
      },
    ],
  },
];

/**
 * Executes a tool function against the real database/services.
 * Returns the data payload and any associated cards.
 *
 * @param {string} name
 * @param {object} args
 * @param {object} context
 * @param {object} [context.user] - The authenticated customer
 * @returns {Promise<{ result: any, cards: Array<{ type: string, id: string }> }>}
 */
export async function executeTool(name, args = {}, { user } = {}) {
  const cards = [];

  switch (name) {
    case 'search_products': {
      const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 5);
      const categoryArray = args.category
        ? (Array.isArray(args.category) ? args.category : [args.category])
        : undefined;

      let items = [];
      try {
        const res = await listProducts({
          q: args.query,
          category: categoryArray,
          day: args.day,
          limit,
        });
        items = res.data || res.items || [];
      } catch {
        items = [];
      }

      // Regex fallback if fulltext search returned 0 items
      if (items.length === 0 && args.query) {
        const db = getDb();
        const qClean = args.query.replace(/s$/, '').trim();
        const fallbackDocs = await db
          .collection(COLLECTIONS.PRODUCTS)
          .find({
            listed: true,
            $or: [
              { nameLower: { $regex: qClean, $options: 'i' } },
              { name: { $regex: qClean, $options: 'i' } },
            ],
          })
          .limit(limit)
          .toArray();

        items = fallbackDocs.map((p) => ({
          id: p._id.toString(),
          name: p.name,
          priceCents: p.priceCents,
          unit: p.unit,
          farmer: p.farmer,
          availability: p.availability,
        }));
      }

      if (typeof args.maxPriceCents === 'number') {
        items = items.filter((p) => p.priceCents <= args.maxPriceCents);
      }

      const products = items.slice(0, limit).map((p) => {
        cards.push({ type: 'product', id: p.id });
        return {
          id: p.id,
          name: p.name,
          price: formatPrice(p.priceCents),
          unit: p.unit,
          farmer: p.farmer?.stallName || 'Local Farm',
          inStock: p.availability === 'in',
        };
      });

      return {
        result: {
          count: products.length,
          products,
          message: products.length > 0 ? `Found ${products.length} products.` : 'No products matched the criteria.',
        },
        cards,
      };
    }

    case 'get_product': {
      if (!args.productId) {
        return { result: { error: 'productId is required' }, cards };
      }
      try {
        const p = await getProductDetail(args.productId);
        cards.push({ type: 'product', id: p.id });
        return {
          result: {
            id: p.id,
            name: p.name,
            description: p.description,
            price: formatPrice(p.priceCents),
            unit: p.unit,
            farmer: p.farmer?.stallName,
            farmerId: p.farmer?.id,
            availability: p.availability,
          },
          cards,
        };
      } catch {
        return { result: { error: 'Product not found' }, cards };
      }
    }

    case 'find_farmers': {
      const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 5);
      let farmersList = [];
      try {
        const res = await listFarmers({
          q: args.query,
          category: args.category,
          market: args.market,
          day: args.day,
          limit,
        });
        farmersList = res.data || res.items || [];
      } catch {
        farmersList = [];
      }

      if (farmersList.length === 0 && args.query) {
        const db = getDb();
        const qClean = args.query.trim();
        const rawFarmers = await db
          .collection(COLLECTIONS.FARMERS)
          .find({
            listingEnabled: true,
            $or: [
              { stallNameLower: { $regex: qClean, $options: 'i' } },
              { stallName: { $regex: qClean, $options: 'i' } },
            ],
          })
          .limit(limit)
          .toArray();

        farmersList = rawFarmers.map((f) => ({
          id: f._id.toString(),
          stallName: f.stallName,
          bio: f.bio,
          operatingDays: f.operatingDays,
          stallNumber: f.stallNumber,
        }));
      }

      const farmers = farmersList.map((f) => {
        cards.push({ type: 'farmer', id: f.id });
        return {
          id: f.id,
          stallName: f.stallName,
          bio: f.bio,
          operatingDays: (f.operatingDays || []).map((d) => DAY_LABELS[d] || d),
          stallNumber: f.stallNumber || null,
        };
      });

      return {
        result: {
          count: farmers.length,
          farmers,
        },
        cards,
      };
    }

    case 'get_farmer': {
      if (!args.farmerId) {
        return { result: { error: 'farmerId is required' }, cards };
      }
      try {
        const f = await getFarmerDetail(args.farmerId);
        cards.push({ type: 'farmer', id: f.id });
        const hours = Math.round((f.cutoffMinutesBefore || 720) / 60);
        return {
          result: {
            id: f.id,
            stallName: f.stallName,
            bio: f.bio,
            operatingDays: (f.operatingDays || []).map((d) => DAY_LABELS[d] || d),
            cutoffHoursBefore: hours,
            markets: (f.markets || []).map((m) => m.name),
          },
          cards,
        };
      } catch {
        return { result: { error: 'Farmer not found' }, cards };
      }
    }

    case 'get_market_hours': {
      const cacheKey = `${args.marketId || ''}|${args.marketName || ''}`;
      const cached = marketHoursCache.get(cacheKey);
      if (cached && Date.now() - cached.time < 60000) {
        if (cached.data.marketId) {
          cards.push({ type: 'market', id: cached.data.marketId });
        }
        return { result: cached.data, cards };
      }

      const db = getDb();
      let markets = [];
      if (args.marketId) {
        try {
          const detail = await getMarketDetail(args.marketId);
          if (detail) markets = [detail];
        } catch {
          markets = [];
        }
      }

      if (markets.length === 0) {
        const allMarkets = await db.collection(COLLECTIONS.MARKETS).find({ status: 'active' }).toArray();
        if (args.marketName) {
          const qLower = args.marketName.toLowerCase();
          markets = allMarkets.filter(
            (m) => m.name.toLowerCase().includes(qLower) || m.slug.toLowerCase().includes(qLower)
          );
        }
        if (markets.length === 0) {
          markets = allMarkets;
        }
      }

      const marketList = markets.map((m) => {
        const marketId = m._id ? m._id.toString() : m.id;
        cards.push({ type: 'market', id: marketId });
        const schedule = (m.schedule || []).map((s) => ({
          day: DAY_LABELS[s.day] || s.day,
          hours: `${formatMinutes(s.openMin)} to ${formatMinutes(s.closeMin)}`,
        }));
        return {
          marketId,
          name: m.name,
          address: m.address,
          schedule,
        };
      });

      const data = {
        markets: marketList,
        marketId: marketList[0]?.marketId,
      };

      marketHoursCache.set(cacheKey, { data, time: Date.now() });
      return { result: data, cards };
    }

    case 'whats_fresh': {
      const limit = Math.min(Math.max(Number(args.limit) || 6, 1), 6);
      const db = getDb();
      const topProducts = await db
        .collection(COLLECTIONS.PRODUCTS)
        .find({
          listed: true,
          availability: 'in',
          $or: [{ tags: 'seasonal' }, { tags: 'bestseller' }],
        })
        .sort({ salesCount: -1 })
        .limit(limit)
        .toArray();

      const products = topProducts.map((p) => {
        const id = p._id.toString();
        cards.push({ type: 'product', id });
        return {
          id,
          name: p.name,
          farmer: p.farmer?.stallName || 'Local Farm',
          price: formatPrice(p.priceCents),
          unit: p.unit,
        };
      });

      return {
        result: {
          freshItems: products,
          count: products.length,
        },
        cards,
      };
    }

    case 'get_my_orders': {
      // STRICT PRIVACY: Regardless of what the model asks for, ONLY use req.user.id
      if (!user || !user.id) {
        return {
          result: {
            authenticated: false,
            message: 'You need to be signed in to view your orders.',
            orders: [],
          },
          cards,
        };
      }

      const ordersRes = await listCustomerOrders(user.id, { tab: 'active', limit: 5 });
      const rawOrders = ordersRes.orders || ordersRes.data || ordersRes.items || [];
      const orders = rawOrders.map((o) => {
        if (o.farmer?.id || o.farmerId) {
          cards.push({ type: 'farmer', id: (o.farmer?.id || o.farmerId).toString() });
        }
        return {
          orderNumber: o.orderNumber,
          farmerName: o.farmer?.stallName || o.farmerName,
          status: o.status,
          pickupLabel: o.pickup?.label,
          total: formatPrice(o.totalCents),
          itemCount: (o.items || []).length,
        };
      });

      return {
        result: {
          authenticated: true,
          activeOrdersCount: orders.length,
          orders,
        },
        cards,
      };
    }

    case 'get_cutoff': {
      const db = getDb();
      let farmer = null;

      if (args.farmerId) {
        farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: args.farmerId });
      }

      if (!farmer && args.farmerName) {
        const qLower = args.farmerName.toLowerCase();
        farmer = await db.collection(COLLECTIONS.FARMERS).findOne({
          listingEnabled: true,
          $or: [
            { stallNameLower: { $regex: qLower, $options: 'i' } },
            { stallName: { $regex: qLower, $options: 'i' } },
          ],
        });
      }

      if (!farmer) {
        return {
          result: {
            message: 'Pre-order cut-offs typically close 12 hours before market opening. View exact times on the farmer or product page.',
          },
          cards,
        };
      }

      const farmerIdStr = farmer._id.toString();
      cards.push({ type: 'farmer', id: farmerIdStr });

      try {
        const slotsRes = await getFarmerPickupSlots(farmerIdStr, { days: 14 });
        const nextSlot = (slotsRes.slots || [])[0];
        const cutoffHours = Math.round((farmer.cutoffMinutesBefore || 720) / 60);

        return {
          result: {
            farmerName: farmer.stallName,
            cutoffHoursBefore: cutoffHours,
            nextAvailableSlot: nextSlot ? nextSlot.label : 'Upcoming weekend',
            cutoffAt: nextSlot ? nextSlot.cutoffAt : null,
          },
          cards,
        };
      } catch {
        const cutoffHours = Math.round((farmer.cutoffMinutesBefore || 720) / 60);
        return {
          result: {
            farmerName: farmer.stallName,
            cutoffHoursBefore: cutoffHours,
          },
          cards,
        };
      }
    }

    default:
      return { result: { error: `Unknown tool: ${name}` }, cards };
  }
}
