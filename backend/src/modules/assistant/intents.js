<<<<<<< HEAD
import { ObjectId } from 'mongodb';import { getDb } from '../../db/client.js';import { COLLECTIONS } from '../../db/collections.js';import { toObjectId } from '../../utils/ids.js';import { DAY_NAMES } from './entities.js';function formatPrice(cents) {  return `$${(cents / 100).toFixed(2)}`;}function formatMinutes(min) {  const h24 = Math.floor(min / 60);  const m = min % 60;  const ampm = h24 >= 12 ? 'PM' : 'AM';  const h12 = h24 % 12 || 12;  const mm = m < 10 ? `0${m}` : m;  return `${h12}:${mm} ${ampm}`;}export async function matchAndResolveIntent(entities, user) {  const { cleanText, day, words } = entities;  const db = getDb();  if (    cleanText.includes('my order') ||    cleanText.includes('order status') ||    cleanText.includes('where is my order') ||    cleanText.includes('track my order') ||    cleanText.includes('my pre-order') ||    cleanText.includes('my preorder')  ) {    if (user && user.id) {      const activeOrder = await db        .collection(COLLECTIONS.ORDERS)        .find({          customerId: toObjectId(user.id),          status: { $in: ['placed', 'accepted', 'ready'] },        })        .sort({ 'pickup.start': 1 })        .limit(1)        .next();      if (activeOrder) {        const statusMap = {          placed: 'placed and awaiting farmer confirmation',          accepted: 'confirmed and being packed',          ready: 'ready for pickup!',        };        const statusDesc = statusMap[activeOrder.status] || activeOrder.status;        return {          reply: `Your pre-order #${activeOrder.orderNumber} with ${activeOrder.farmerName} is currently ${statusDesc}. Pickup is scheduled for ${activeOrder.pickup.label}.`,          cards: [{ type: 'farmer', id: activeOrder.farmerId.toString() }],          suggestions: ['View order details', 'Check market hours', 'Who sells eggs?'],        };      }    }    return {      reply: "You don't have any active pre-orders right now. Would you like to explore fresh produce available this week?",      cards: [],      suggestions: ["What's fresh on Saturday?", 'Who sells eggs?', 'Market hours'],    };  }  if (    /\b(hi|hello|hey|help|greetings)\b/i.test(cleanText) ||    cleanText.startsWith('how do i') ||    cleanText.includes('what can you do') ||    cleanText.includes('how does marketlink work')  ) {    return {      reply: 'Welcome to MarketLink! I can help you find fresh local produce, check market opening hours, locate farmer stalls, look up item prices, or answer questions about your pickup windows. What would you like to know?',      cards: [],      suggestions: ['When is Elm Street Market open?', 'Who sells eggs?', "What's fresh on Saturday?"],    };  }  if (    cleanText.includes('cut-off') ||    cleanText.includes('cutoff') ||    cleanText.includes('deadline') ||    cleanText.includes('pre-orders close') ||    cleanText.includes('orders close') ||    cleanText.includes('preorders close') ||    cleanText.includes('order close')  ) {    const farmers = await db.collection(COLLECTIONS.FARMERS).find({ listingEnabled: true }).toArray();    const matchedFarmer = farmers.find((f) => cleanText.includes(f.stallNameLower || f.stallName.toLowerCase()));    if (matchedFarmer) {      const hours = Math.round((matchedFarmer.cutoffMinutesBefore || 720) / 60);      return {        reply: `Pre-orders for ${matchedFarmer.stallName} close ${hours} hours before market opening. Please make sure to place your pre-order before the cut-off!`,        cards: [{ type: 'farmer', id: matchedFarmer._id.toString() }],        suggestions: [`What does ${matchedFarmer.stallName} sell?`, 'Market hours', "What's fresh on Saturday?"],      };    }    return {      reply: 'Pre-order cut-offs typically close 12 hours before each market opening. You can view exact cut-off times on each product and farmer page.',      cards: [],      suggestions: ['When is Elm Street open?', 'Who sells eggs?', "What's fresh on Saturday?"],    };  }  if (    cleanText.includes('how much') ||    cleanText.includes('price of') ||    cleanText.includes('price') ||    cleanText.includes('cost of') ||    cleanText.includes('cost')  ) {    const rawSearch = cleanText      .replace(/what is the price of/gi, '')      .replace(/what's the price of/gi, '')      .replace(/price of/gi, '')      .replace(/how much (is|are|for)/gi, '')      .replace(/how much/gi, '')      .replace(/cost of/gi, '')      .replace(/cost/gi, '')      .replace(/the/gi, '')      .replace(/[?!.]/g, '')      .trim();    const searchWords = rawSearch.split(/\s+/).filter((w) => w.length >= 3);    const regexClauses = searchWords.map((w) => ({      nameLower: { $regex: w.replace(/s$/, ''), $options: 'i' },    }));    if (regexClauses.length > 0) {      const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({        listed: true,        $or: regexClauses,      });      if (product) {        return {          reply: `${product.name} from ${product.farmer?.stallName || 'our local farmers'} is ${formatPrice(product.priceCents)} per ${product.unit}.`,          cards: [{ type: 'product', id: product._id.toString() }],          suggestions: [`Who sells ${product.name}?`, 'When is pickup?', 'What else does this farmer sell?'],        };      }    }  }  if (    cleanText.includes('when does') ||    cleanText.includes('what time') ||    cleanText.includes('market hours') ||    cleanText.includes('when is') ||    cleanText.includes('open') ||    cleanText.includes('close') ||    cleanText.includes('schedule')  ) {    const markets = await db.collection(COLLECTIONS.MARKETS).find({ status: 'active' }).toArray();    const sortedMarkets = [...markets].sort((a, b) => b.name.length - a.name.length);    const matchedMarket = sortedMarkets.find((m) => {      const nameL = m.name.toLowerCase();      const slugL = m.slug.toLowerCase().replace(/-/g, ' ');      if (cleanText.includes(nameL) || cleanText.includes(slugL)) return true;      const stopWords = new Set(['market', 'farmers', 'the', 'street', 'road', 'avenue', 'park', 'lane']);      const distinctWords = nameL.split(' ').filter((w) => w.length >= 3 && !stopWords.has(w));      return distinctWords.some((w) => cleanText.includes(w));    });    if (matchedMarket) {      const scheduleLines = (matchedMarket.schedule || []).map((s) => {        const dayName = DAY_NAMES[s.day] || s.day;        return `${dayName}s from ${formatMinutes(s.openMin)} to ${formatMinutes(s.closeMin)}`;      });      const schedText = scheduleLines.length > 0 ? scheduleLines.join(', ') : 'weekly on weekends';      return {        reply: `${matchedMarket.name} is open ${schedText} at ${matchedMarket.address}.`,        cards: [{ type: 'market', id: matchedMarket._id.toString() }],        suggestions: [`Who sells at ${matchedMarket.name}?`, "What's fresh on Saturday?", 'Market directions'],      };    }  }  const allFarmers = await db.collection(COLLECTIONS.FARMERS).find({ listingEnabled: true }).toArray();  const matchedFarmer = allFarmers.find(    (f) =>      cleanText.includes(f.stallNameLower || f.stallName.toLowerCase()) ||      f.stallName.toLowerCase().split(' ').some((w) => w.length > 4 && cleanText.includes(w))  );  if (matchedFarmer) {    const market = await db      .collection(COLLECTIONS.MARKETS)      .findOne({ _id: { $in: matchedFarmer.marketIds || [] }, status: 'active' });    const days = (matchedFarmer.operatingDays || []).map((d) => DAY_NAMES[d] || d).join(', ');    const marketName = market ? market.name : 'local markets';    const stallInfo = matchedFarmer.stallNumber ? ` at stall ${matchedFarmer.stallNumber}` : '';    return {      reply: `${matchedFarmer.stallName} attends ${marketName} on ${days || 'weekends'}${stallInfo}.`,      cards: [{ type: 'farmer', id: matchedFarmer._id.toString() }],      suggestions: [`What does ${matchedFarmer.stallName} sell?`, 'When is the cut-off?', 'View all farmers'],    };  }  if (    cleanText.includes('who sells') ||    cleanText.includes('who has') ||    cleanText.includes('where can i buy') ||    cleanText.includes('looking for') ||    cleanText.includes('do you have') ||    cleanText.includes('sells')  ) {    const rawProduce = cleanText      .replace(/who sells/gi, '')      .replace(/who has/gi, '')      .replace(/where can i buy/gi, '')      .replace(/looking for/gi, '')      .replace(/do you have/gi, '')      .replace(/sells/gi, '')      .replace(/[?!.]/g, '')      .trim();    const searchWords = rawProduce.split(/\s+/).filter((w) => w.length >= 3);    const regexClauses = searchWords.map((w) => ({      nameLower: { $regex: w.replace(/s$/, ''), $options: 'i' },    }));    if (regexClauses.length > 0) {      const products = await db        .collection(COLLECTIONS.PRODUCTS)        .find({          listed: true,          $or: regexClauses,        })        .limit(3)        .toArray();      if (products.length > 0) {        const sellers = products          .map((p) => `${p.name} from ${p.farmer?.stallName || 'local farm'} (${formatPrice(p.priceCents)})`)          .join(', ');        return {          reply: `We have ${sellers}. Pre-orders are open for pickup!`,          cards: products.map((p) => ({ type: 'product', id: p._id.toString() })),          suggestions: [`How much are ${products[0].name}?`, 'When can I pick up?', "What's fresh on Saturday?"],        };      }    }  }  if (cleanText.includes('fresh') || cleanText.includes('available on') || day) {    const topProducts = await db      .collection(COLLECTIONS.PRODUCTS)      .find({        listed: true,        availability: 'in',        $or: [{ tags: 'seasonal' }, { tags: 'bestseller' }],      })      .sort({ salesCount: -1 })      .limit(3)      .toArray();    if (topProducts.length > 0) {      const dayLabel = day ? DAY_NAMES[day] : 'upcoming market days';      const names = topProducts.map((p) => p.name).join(', ');      return {        reply: `Here are some popular fresh items ready for ${dayLabel}: ${names}.`,        cards: topProducts.map((p) => ({ type: 'product', id: p._id.toString() })),        suggestions: ['Who sells eggs?', 'Market hours', 'How to pre-order'],      };    }  }  return {    reply: "I'm not quite sure about that one, but I'm here to help with market timings, farmer availability, fresh produce prices, and order tracking. Here are a few things you can ask:",    cards: [],    suggestions: ['When is Elm Street Market open?', 'Who sells eggs?', "What's fresh on Saturday?"],  };}
=======
/**
 * Assistant intent matcher and DB query resolvers.
 * Answers customer questions using deterministic keyword matching and real DB records.
 *
 * NOTE FOR FUTURE EXPANSION:
 * If an external AI provider (such as an LLM, tawk.to live chat, or Zapier webhook)
 * is integrated in later stages, it can be plugged in inside `dispatchAssistantIntent`
 * by checking `if (env.EXTERNAL_AI_ENABLED) { return callExternalAi(...) }`.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../db/client.js';
import { COLLECTIONS } from '../../db/collections.js';
import { toObjectId } from '../../utils/ids.js';
import { DAY_NAMES } from './entities.js';

function formatPrice(cents) {
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
          reply: `Your pre-order #${activeOrder.orderNumber} with ${activeOrder.farmerName} is currently ${statusDesc}. Pickup is scheduled for ${activeOrder.pickup.label}.`,
          cards: [{ type: 'farmer', id: activeOrder.farmerId.toString() }],
          suggestions: ['View order details', 'Check market hours', 'Who sells eggs?'],
        };
      }
    }
    return {
      reply: "You don't have any active pre-orders right now. Would you like to explore fresh produce available this week?",
      cards: [],
      suggestions: ["What's fresh on Saturday?", 'Who sells eggs?', 'Market hours'],
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
      reply: 'Welcome to MarketLink! I can help you find fresh local produce, check market opening hours, locate farmer stalls, look up item prices, or answer questions about your pickup windows. What would you like to know?',
      cards: [],
      suggestions: ['When is Elm Street Market open?', 'Who sells eggs?', "What's fresh on Saturday?"],
    };
  }

  // 3. Cut-off and pickup windows intent ("when is the cut-off for...", "order deadline", "when do orders close")
  if (
    cleanText.includes('cut-off') ||
    cleanText.includes('cutoff') ||
    cleanText.includes('deadline') ||
    cleanText.includes('pre-orders close') ||
    cleanText.includes('orders close') ||
    cleanText.includes('preorders close') ||
    cleanText.includes('order close')
  ) {
    // Try matching farmer
    const farmers = await db.collection(COLLECTIONS.FARMERS).find({ listingEnabled: true }).toArray();
    const matchedFarmer = farmers.find((f) => cleanText.includes(f.stallNameLower || f.stallName.toLowerCase()));

    if (matchedFarmer) {
      const hours = Math.round((matchedFarmer.cutoffMinutesBefore || 720) / 60);
      return {
        reply: `Pre-orders for ${matchedFarmer.stallName} close ${hours} hours before market opening. Please make sure to place your pre-order before the cut-off!`,
        cards: [{ type: 'farmer', id: matchedFarmer._id.toString() }],
        suggestions: [`What does ${matchedFarmer.stallName} sell?`, 'Market hours', "What's fresh on Saturday?"],
      };
    }

    return {
      reply: 'Pre-order cut-offs typically close 12 hours before each market opening. You can view exact cut-off times on each product and farmer page.',
      cards: [],
      suggestions: ['When is Elm Street open?', 'Who sells eggs?', "What's fresh on Saturday?"],
    };
  }

  // 4. Product price details intent ("how much are tomatoes?", "what is the price of tomatoes?", "cost of honey")
  if (
    cleanText.includes('how much') ||
    cleanText.includes('price of') ||
    cleanText.includes('price') ||
    cleanText.includes('cost of') ||
    cleanText.includes('cost')
  ) {
    const rawSearch = cleanText
      .replace(/what is the price of/gi, '')
      .replace(/what's the price of/gi, '')
      .replace(/price of/gi, '')
      .replace(/how much (is|are|for)/gi, '')
      .replace(/how much/gi, '')
      .replace(/cost of/gi, '')
      .replace(/cost/gi, '')
      .replace(/the/gi, '')
      .replace(/[?!.]/g, '')
      .trim();

    const searchWords = rawSearch.split(/\s+/).filter((w) => w.length >= 3);
    const regexClauses = searchWords.map((w) => ({
      nameLower: { $regex: w.replace(/s$/, ''), $options: 'i' },
    }));

    if (regexClauses.length > 0) {
      const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({
        listed: true,
        $or: regexClauses,
      });

      if (product) {
        return {
          reply: `${product.name} from ${product.farmer?.stallName || 'our local farmers'} is ${formatPrice(product.priceCents)} per ${product.unit}.`,
          cards: [{ type: 'product', id: product._id.toString() }],
          suggestions: [`Who sells ${product.name}?`, 'When is pickup?', 'What else does this farmer sell?'],
        };
      }
    }
  }

  // 5. Market timings intent ("when does Elm Street close?", "when is Riverside Sunday Market open?", "market hours")
  if (
    cleanText.includes('when does') ||
    cleanText.includes('what time') ||
    cleanText.includes('market hours') ||
    cleanText.includes('when is') ||
    cleanText.includes('open') ||
    cleanText.includes('close') ||
    cleanText.includes('schedule')
  ) {
    const markets = await db.collection(COLLECTIONS.MARKETS).find({ status: 'active' }).toArray();
    // Sort markets by name length descending so specific names ("Riverside Sunday Market") match before generic words
    const sortedMarkets = [...markets].sort((a, b) => b.name.length - a.name.length);

    const matchedMarket = sortedMarkets.find((m) => {
      const nameL = m.name.toLowerCase();
      const slugL = m.slug.toLowerCase().replace(/-/g, ' ');
      if (cleanText.includes(nameL) || cleanText.includes(slugL)) return true;

      // Match distinctive words (exclude 'market', 'farmers', 'the', 'street')
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
        suggestions: [`Who sells at ${matchedMarket.name}?`, "What's fresh on Saturday?", 'Market directions'],
      };
    }
  }

  // 6. Farmer availability intent ("is Riverbend at Elm Street?", "where can I find Riverbend?")
  const allFarmers = await db.collection(COLLECTIONS.FARMERS).find({ listingEnabled: true }).toArray();
  const matchedFarmer = allFarmers.find(
    (f) =>
      cleanText.includes(f.stallNameLower || f.stallName.toLowerCase()) ||
      f.stallName.toLowerCase().split(' ').some((w) => w.length > 4 && cleanText.includes(w))
  );

  if (matchedFarmer) {
    const market = await db
      .collection(COLLECTIONS.MARKETS)
      .findOne({ _id: { $in: matchedFarmer.marketIds || [] }, status: 'active' });

    const days = (matchedFarmer.operatingDays || []).map((d) => DAY_NAMES[d] || d).join(', ');
    const marketName = market ? market.name : 'local markets';
    const stallInfo = matchedFarmer.stallNumber ? ` at stall ${matchedFarmer.stallNumber}` : '';

    return {
      reply: `${matchedFarmer.stallName} attends ${marketName} on ${days || 'weekends'}${stallInfo}.`,
      cards: [{ type: 'farmer', id: matchedFarmer._id.toString() }],
      suggestions: [`What does ${matchedFarmer.stallName} sell?`, 'When is the cut-off?', 'View all farmers'],
    };
  }

  // 7. Who sells X intent ("who sells carrots?", "who has sourdough?", "looking for sourdough bread")
  if (
    cleanText.includes('who sells') ||
    cleanText.includes('who has') ||
    cleanText.includes('where can i buy') ||
    cleanText.includes('looking for') ||
    cleanText.includes('do you have') ||
    cleanText.includes('sells')
  ) {
    const rawProduce = cleanText
      .replace(/who sells/gi, '')
      .replace(/who has/gi, '')
      .replace(/where can i buy/gi, '')
      .replace(/looking for/gi, '')
      .replace(/do you have/gi, '')
      .replace(/sells/gi, '')
      .replace(/[?!.]/g, '')
      .trim();

    const searchWords = rawProduce.split(/\s+/).filter((w) => w.length >= 3);
    const regexClauses = searchWords.map((w) => ({
      nameLower: { $regex: w.replace(/s$/, ''), $options: 'i' },
    }));

    if (regexClauses.length > 0) {
      const products = await db
        .collection(COLLECTIONS.PRODUCTS)
        .find({
          listed: true,
          $or: regexClauses,
        })
        .limit(3)
        .toArray();

      if (products.length > 0) {
        const sellers = products
          .map((p) => `${p.name} from ${p.farmer?.stallName || 'local farm'} (${formatPrice(p.priceCents)})`)
          .join(', ');

        return {
          reply: `We have ${sellers}. Pre-orders are open for pickup!`,
          cards: products.map((p) => ({ type: 'product', id: p._id.toString() })),
          suggestions: [`How much are ${products[0].name}?`, 'When can I pick up?', "What's fresh on Saturday?"],
        };
      }
    }
  }

  // 8. What's fresh on <day> intent
  if (cleanText.includes('fresh') || cleanText.includes('available on') || day) {
    const topProducts = await db
      .collection(COLLECTIONS.PRODUCTS)
      .find({
        listed: true,
        availability: 'in',
        $or: [{ tags: 'seasonal' }, { tags: 'bestseller' }],
      })
      .sort({ salesCount: -1 })
      .limit(3)
      .toArray();

    if (topProducts.length > 0) {
      const dayLabel = day ? DAY_NAMES[day] : 'upcoming market days';
      const names = topProducts.map((p) => p.name).join(', ');

      return {
        reply: `Here are some popular fresh items ready for ${dayLabel}: ${names}.`,
        cards: topProducts.map((p) => ({ type: 'product', id: p._id.toString() })),
        suggestions: ['Who sells eggs?', 'Market hours', 'How to pre-order'],
      };
    }
  }

  // 9. Smart Basket / budget intent
  //    Triggers: "I have ₦X", "I need X for Saturday", "budget", "build basket", "smart basket"
  const budgetMatch =
    cleanText.includes('budget') ||
    cleanText.includes('smart basket') ||
    cleanText.includes('build basket') ||
    cleanText.includes('build a basket') ||
    /[₦#]?\s*\d[\d,]*/.test(cleanText) ||
    (cleanText.includes('i have') && /\d/.test(cleanText)) ||
    (cleanText.includes('i need') && (cleanText.includes('vegetable') || cleanText.includes('fruit') || cleanText.includes('egg') || cleanText.includes('produce')));

  if (budgetMatch) {
    // Extract budget amount if present
    const budgetAmountMatch = cleanText.match(/[₦#]?\s*([\d,]+)/);
    const budgetAmount = budgetAmountMatch
      ? parseInt(budgetAmountMatch[1].replace(/,/g, ''), 10)
      : null;

    // Extract category keywords
    const categoryKeywords = [];
    if (cleanText.includes('vegetable') || cleanText.includes('veggie') || cleanText.includes('produce')) categoryKeywords.push('vegetables');
    if (cleanText.includes('fruit')) categoryKeywords.push('fruits');
    if (cleanText.includes('egg')) categoryKeywords.push('eggs');
    if (cleanText.includes('dairy') || cleanText.includes('milk')) categoryKeywords.push('dairy');
    if (cleanText.includes('bread') || cleanText.includes('bakery') || cleanText.includes('loaf')) categoryKeywords.push('bakery');

    // Count available products matching categories
    let productCount = 0;
    try {
      const slugsToCheck = categoryKeywords.length > 0 ? categoryKeywords : ['vegetables', 'fruits', 'eggs'];
      productCount = await db.collection(COLLECTIONS.PRODUCTS).countDocuments({
        categorySlug: { $in: slugsToCheck },
        availability: { $in: ['in', 'low'] },
        quantityAvailable: { $gt: 0 },
        listed: { $ne: false },
        archived: { $ne: true },
      });
    } catch (_e) {
      // Silently ignore — still surface the basket CTA
    }

    const catLabel = categoryKeywords.length > 0 ? categoryKeywords.join(', ') : 'fresh produce';
    const budgetLabel = budgetAmount && !isNaN(budgetAmount) ? `₦${budgetAmount.toLocaleString()}` : 'your budget';

    return {
      reply: productCount > 0
        ? `I found ${productCount} ${catLabel} products available right now. I can build a personalised basket within ${budgetLabel} — just tap below to get started!`
        : `I can help you build a Smart Basket within ${budgetLabel}. Tap below to tell me what you need and I'll find the best options from our local farmers.`,
      cards: [{
        type: 'action',
        action: 'open-smart-basket',
        label: 'Build Smart Basket',
        params: {
          budget: budgetAmount || null,
          categories: categoryKeywords.length > 0 ? categoryKeywords : ['vegetables', 'fruits', 'eggs'],
        },
      }],
      suggestions: ['Show me available vegetables', 'Who sells eggs?', "What's fresh on Saturday?"],
    };
  }

  // 10. Graceful fallback
  return {
    reply: "I'm not quite sure about that one, but I'm here to help with market timings, farmer availability, fresh produce prices, and order tracking. Here are a few things you can ask:",
    cards: [],
    suggestions: ['Build a Smart Basket', 'When is Elm Street Market open?', 'Who sells eggs?'],
  };
}
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
