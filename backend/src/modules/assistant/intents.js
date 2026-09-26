/**
 * Assistant intent matcher and DB query resolvers.
 * Answers customer questions using deterministic keyword matching and real DB records.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { DAY_NAMES } from './entities.js';

function formatPrice(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) return '₦1,000';
  const naira = Math.max(500, Math.round((cents * 4.4444) / 500) * 500);
  return `₦${naira.toLocaleString()}`;
}

function formatMinutes(min) {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  const mm = m < 10 ? `0${m}` : m;
  return `${h12}:${mm} ${ampm}`;
}

export async function matchAndResolveIntent(entities, user) {
  const { cleanText, day, words } = entities;
  const db = getDb();

  // 1. Order status intent
  if (
    cleanText.includes('my order') ||
    cleanText.includes('order status') ||
    cleanText.includes('where is my order') ||
    cleanText.includes('track my order') ||
    cleanText.includes('my pre-order') ||
    cleanText.includes('my preorder')
  ) {
    if (user && user.id) {
      const activeOrder = await db
        .collection(COLLECTIONS.ORDERS)
        .find({
          customerId: toObjectId(user.id),
          status: { $in: ['placed', 'accepted', 'ready'] },
        })
        .sort({ 'pickup.start': 1 })
        .limit(1)
        .next();

      if (activeOrder) {
        const statusMap = {
          placed: 'placed and awaiting farmer confirmation',
          accepted: 'confirmed and being packed',
          ready: 'ready for pickup!',
        };
        const statusDesc = statusMap[activeOrder.status] || activeOrder.status;
        return {
          reply: `Your pre-order #${activeOrder.orderNumber} with ${activeOrder.farmerName} is currently ${statusDesc}. Pickup is scheduled for ${activeOrder.pickup?.label || 'Saturday'}.`,
          cards: [{ type: 'farmer', id: activeOrder.farmerId.toString() }],
          suggestions: ['View order details', 'Check market hours', 'Who sells eggs?'],
        };
      }
    }
    return {
      reply: "You don't have any active pre-orders right now. Would you like to explore fresh produce available this week?",
      cards: [],
      suggestions: ["What's fresh on Saturday?", 'Who sells eggs?', 'Build a Smart Basket'],
    };
  }

  // 2. Greeting / Help intent
  if (
    /\b(hi|hello|hey|help|greetings)\b/i.test(cleanText) ||
    cleanText.startsWith('how do i') ||
    cleanText.includes('what can you do') ||
    cleanText.includes('how does marketlink work')
  ) {
    return {
      reply: 'Welcome to MarketLink! I can help you find fresh local produce, check market opening hours, locate farmer stalls, look up item prices, or build a Smart Basket within your budget. What would you like to find?',
      cards: [],
      suggestions: ['I need tomatoes near me', 'I have ₦5,000 and need vegetables', 'When is Riverbend Farm available?'],
    };
  }

  // 3. Smart Basket / budget intent (Check early for "I have ₦...", "budget", "need ... for ...")
  const budgetPattern = /[₦#]?\s*(\d{1,3}(?:,\d{3})+|\d{3,7})/;
  const hasBudget =
    cleanText.includes('budget') ||
    cleanText.includes('smart basket') ||
    cleanText.includes('build basket') ||
    (cleanText.includes('i have') && /\d/.test(cleanText)) ||
    (cleanText.includes('have') && /[₦#]/.test(cleanText));

  if (hasBudget) {
    const budgetAmountMatch = cleanText.match(budgetPattern);
    const budgetAmount = budgetAmountMatch
      ? parseInt(budgetAmountMatch[1].replace(/,/g, ''), 10)
      : 5000;

    const categoryKeywords = [];
    if (/vegetable|veggie|greens|produce|spinach|tomato|carrot|kale/.test(cleanText)) categoryKeywords.push('vegetables');
    if (/fruit|banana|apple|berries|strawberry|pineapple/.test(cleanText)) categoryKeywords.push('fruit');
    if (/egg|eggs|poultry|dairy|milk|cheese/.test(cleanText)) categoryKeywords.push('dairy-and-eggs');
    if (/bread|bakery|loaf|pastry/.test(cleanText)) categoryKeywords.push('bakery');
    if (/meat|fish|chicken|beef|sausage/.test(cleanText)) categoryKeywords.push('meat-and-fish');

    const catList = categoryKeywords.length > 0 ? categoryKeywords : ['vegetables', 'fruit', 'dairy-and-eggs'];

    return {
      reply: `I found several options within your budget. I can build a personalised Smart Basket with fresh produce from local farmers for pickup this weekend.`,
      cards: [
        {
          type: 'action',
          action: 'open-smart-basket',
          label: `Build Smart Basket (₦${budgetAmount.toLocaleString()})`,
          params: {
            budget: budgetAmount,
            categories: catList,
          },
        },
      ],
      suggestions: ['I need tomatoes near me', 'When is Riverbend Farm available?', "What's fresh on Saturday?"],
    };
  }

  // 4. Farmer availability intent ("When is [Farmer] available?", "Where is [Farmer]?", "Is [Farmer] at [Market]?")
  const allFarmers = await db.collection(COLLECTIONS.FARMERS).find({ listingEnabled: true }).toArray();
  const matchedFarmer = allFarmers.find((f) => {
    const nameL = f.stallName.toLowerCase();
    const contactL = (f.contactPerson || '').toLowerCase();
    return cleanText.includes(nameL) || (nameL.split(' ')[0].length > 3 && cleanText.includes(nameL.split(' ')[0])) || (contactL && cleanText.includes(contactL));
  });

  if (matchedFarmer && (cleanText.includes('when') || cleanText.includes('available') || cleanText.includes('where') || cleanText.includes('hours') || cleanText.includes('time') || cleanText.includes('stall') || cleanText.includes('at'))) {
    const market = await db
      .collection(COLLECTIONS.MARKETS)
      .findOne({ _id: { $in: matchedFarmer.marketIds || [] }, status: 'active' });

    const days = (matchedFarmer.operatingDays || []).map((d) => DAY_NAMES[d] || d).join(', ');
    const marketName = market ? market.name : 'the farmers market';
    const stallInfo = matchedFarmer.stallNumber ? ` at ${matchedFarmer.stallNumber}` : '';

    let hoursText = '8:00 AM to 1:00 PM';
    if (market && Array.isArray(market.schedule) && market.schedule.length > 0) {
      const s = market.schedule[0];
      hoursText = `${formatMinutes(s.openMin)} to ${formatMinutes(s.closeMin)}`;
    }

    return {
      reply: `${matchedFarmer.stallName} is available at ${marketName} on ${days || 'Saturday'} from ${hoursText}${stallInfo}.`,
      cards: [{ type: 'farmer', id: matchedFarmer._id.toString() }],
      suggestions: [`What does ${matchedFarmer.stallName} sell?`, 'Build a Smart Basket', 'Market directions'],
    };
  }

  // 5. Product search / need intent ("I need tomatoes near me", "who sells eggs?", "where can I buy spinach?")
  const isProductInquiry =
    cleanText.includes('i need') ||
    cleanText.includes('near me') ||
    cleanText.includes('who sells') ||
    cleanText.includes('who has') ||
    cleanText.includes('where can i buy') ||
    cleanText.includes('looking for') ||
    cleanText.includes('do you have') ||
    cleanText.includes('want to buy') ||
    cleanText.includes('how much') ||
    cleanText.includes('price of') ||
    cleanText.includes('cost of');

  if (isProductInquiry) {
    const cleanSearch = cleanText
      .replace(/i need/gi, '')
      .replace(/near me/gi, '')
      .replace(/who sells/gi, '')
      .replace(/who has/gi, '')
      .replace(/where can i buy/gi, '')
      .replace(/looking for/gi, '')
      .replace(/do you have/gi, '')
      .replace(/want to buy/gi, '')
      .replace(/how much (is|are|for)?/gi, '')
      .replace(/price of/gi, '')
      .replace(/cost of/gi, '')
      .replace(/fresh/gi, '')
      .replace(/the/gi, '')
      .replace(/[?!.]/g, '')
      .trim();

    const searchWords = cleanSearch.split(/\s+/).filter((w) => w.length >= 3);
    const regexClauses = searchWords.map((w) => ({
      nameLower: { $regex: w.replace(/s$/, ''), $options: 'i' },
    }));

    if (regexClauses.length > 0) {
      const products = await db
        .collection(COLLECTIONS.PRODUCTS)
        .find({
          listed: { $ne: false },
          availability: { $in: ['in', 'low'] },
          $or: regexClauses,
        })
        .limit(6)
        .toArray();

      if (products.length > 0) {
        const uniqueFarmerIds = new Set(products.map((p) => p.farmerId.toString()));
        const farmerCount = uniqueFarmerIds.size;
        const targetWord = searchWords[0] || 'produce';

        return {
          reply: `I found ${farmerCount} farmer${farmerCount !== 1 ? 's' : ''} with ${targetWord} available right now.`,
          cards: products.map((p) => ({ type: 'product', id: p._id.toString() })),
          suggestions: ['Build a Smart Basket', 'When can I pick up?', "What's fresh on Saturday?"],
        };
      }
    }
  }

  // 6. Market timings intent ("when does Elm Street close?", "when is Riverside Sunday Market open?", "market hours")
  if (
    cleanText.includes('when does') ||
    cleanText.includes('what time') ||
    cleanText.includes('market hours') ||
    cleanText.includes('when is') ||
    cleanText.includes('schedule')
  ) {
    const markets = await db.collection(COLLECTIONS.MARKETS).find({ status: 'active' }).toArray();
    const sortedMarkets = [...markets].sort((a, b) => b.name.length - a.name.length);

    const matchedMarket = sortedMarkets.find((m) => {
      const nameL = m.name.toLowerCase();
      const slugL = m.slug.toLowerCase().replace(/-/g, ' ');
      if (cleanText.includes(nameL) || cleanText.includes(slugL)) return true;
      const stopWords = new Set(['market', 'farmers', 'the', 'street', 'road', 'avenue', 'park', 'lane']);
      const distinctWords = nameL.split(' ').filter((w) => w.length >= 3 && !stopWords.has(w));
      return distinctWords.some((w) => cleanText.includes(w));
    });

    if (matchedMarket) {
      const scheduleLines = (matchedMarket.schedule || []).map((s) => {
        const dayName = DAY_NAMES[s.day] || s.day;
        return `${dayName}s from ${formatMinutes(s.openMin)} to ${formatMinutes(s.closeMin)}`;
      });
      const schedText = scheduleLines.length > 0 ? scheduleLines.join(', ') : 'weekly on weekends';

      return {
        reply: `${matchedMarket.name} is open ${schedText} at ${matchedMarket.address}.`,
        cards: [{ type: 'market', id: matchedMarket._id.toString() }],
        suggestions: [`Who sells at ${matchedMarket.name}?`, 'Build a Smart Basket', 'Market directions'],
      };
    }
  }

  // 7. What's fresh on <day> intent
  if (cleanText.includes('fresh') || cleanText.includes('available on') || day) {
    const topProducts = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find({
        listed: { $ne: false },
        availability: 'in',
        quantityAvailable: { $gt: 0 },
      })
      .sort({ featuredScore: -1, salesCount: -1 })
      .limit(4)
      .toArray();

    if (topProducts.length > 0) {
      const dayLabel = day ? DAY_NAMES[day] : 'Saturday';
      const names = topProducts.map((p) => p.name).join(', ');

      return {
        reply: `Here are popular fresh items ready for pickup this ${dayLabel}: ${names}.`,
        cards: topProducts.map((p) => ({ type: 'product', id: p._id.toString() })),
        suggestions: ['Build a Smart Basket', 'Who sells eggs?', 'Market hours'],
      };
    }
  }

  // 8. Default polite fallback with smart recommendations
  return {
    reply: "I'm here to help with market schedules, produce prices, and Smart Basket recommendations. What can I find for you today?",
    cards: [],
    suggestions: ['I need tomatoes near me', 'I have ₦5,000 and need vegetables', 'When is Riverbend Farm available?'],
  };
}
