/**
 * Farmer Products service layer.
 * Full CRUD, inventory toggles, weekly templates, stock alerts, and denormalisation hooks.
 */

import fs from 'node:fs';
import path from 'node:path';
import { ObjectId } from 'mongodb';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import { env } from '../../../config/env.js';
import {
  PRODUCT_UNITS,
  ALLOWED_ART_KEYS,
} from '../../../constants.js';
import { syncFarmerCategorySlugs } from '../../../utils/sync.js';
import { notifyRestock } from '../../favorites/restock.js';
import { escapeForPrefix } from '../../../utils/query.js';
import { validateAndAttachImage, detachAndDeleteImage } from '../../uploads/attachHelper.js';

const ALLOWED_FARMER_TAGS = ['seasonal', 'organic'];

/**
 * Transforms an internal product document to the farmer API DTO.
 *
 * @param {object} p
 * @returns {object}
 */
export function toFarmerProductDto(p) {
  return {
    id: p._id ? p._id.toString() : p.id,
    name: p.name,
    categoryId: p.categoryId ? p.categoryId.toString() : p.categoryId,
    categorySlug: p.categorySlug,
    priceCents: p.priceCents,
    unit: p.unit,
    quantityAvailable: p.quantityAvailable,
    lowStockThreshold: p.lowStockThreshold,
    availability: p.availability,
    weekly: p.weekly || { enabled: false, defaultQty: 0 },
    imageUrl: p.imageUrl ?? null,
    imagePublicId: p.imagePublicId ?? null,
    art: p.art,
    tags: Array.isArray(p.tags) ? p.tags : [],
    description: p.description || '',
    listed: Boolean(p.listed),
    archived: Boolean(p.archived),
    ratingAvg: p.ratingAvg ?? 0,
    ratingCount: p.ratingCount ?? 0,
    salesCount: p.salesCount ?? 0,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  };
}

/**
 * Best-effort cleanup of an orphaned uploaded image.
 *
 * @param {string} [imageUrl]
 * @param {import('mongodb').Db} [dbInstance]
 */
export async function cleanOrphanImage(imageUrl, dbInstance) {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) {
    return;
  }
  const db = dbInstance || getDb();
  try {
    const filename = path.basename(imageUrl);
    const prodCount = await db.collection(COLLECTIONS.PRODUCTS).countDocuments({ imageUrl });
    const farmerCount = await db.collection(COLLECTIONS.FARMERS).countDocuments({ imageUrl });

    if (prodCount === 0 && farmerCount === 0) {
      const fullPath = path.join(env.UPLOAD_DIR, filename);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    }
  } catch (err) {
    console.error(`[IMAGE CLEANUP ERROR] Failed to clean image ${imageUrl}:`, err.message);
  }
}

/**
 * Validates product mutation input fields according to D2 rules.
 *
 * @param {object} body
 * @param {boolean} [isPatch=false]
 * @param {import('mongodb').Db} [dbInstance]
 * @returns {Promise<object>}
 */
async function validateProductInput(body, isPatch = false, dbInstance) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw AppError.validation('Request body must be a JSON object');
  }

  const allowedFields = new Set([
    'name',
    'categoryId',
    'priceCents',
    'unit',
    'quantityAvailable',
    'lowStockThreshold',
    'description',
    'tags',
    'art',
    'imageUrl',
    'imagePublicId',
    'weekly',
  ]);

  if ('availability' in body) {
    throw AppError.validation('Cannot set availability directly; use sold-out/available or hide/unhide endpoints', {
      field: 'availability',
    });
  }

  const keys = Object.keys(body);
  if (keys.length === 0 && isPatch) {
    throw AppError.validation('At least one field must be provided to update');
  }

  for (const k of keys) {
    if (!allowedFields.has(k)) {
      throw AppError.validation(`Unexpected field: ${k}`, { field: k });
    }
  }

  const db = dbInstance || getDb();
  const cleaned = {};

  // 1. name
  if ('name' in body || !isPatch) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 80) {
      throw AppError.validation('Product name must be between 2 and 80 characters', { field: 'name' });
    }
    cleaned.name = body.name.trim();
  }

  // 2. categoryId
  if ('categoryId' in body || !isPatch) {
    if (!body.categoryId || !ObjectId.isValid(body.categoryId)) {
      throw AppError.validation('Valid categoryId is required', { field: 'categoryId' });
    }
    const cat = await db.collection(COLLECTIONS.CATEGORIES).findOne({
      _id: toObjectId(body.categoryId),
      active: true,
    });
    if (!cat) {
      throw AppError.validation('Category not found or inactive', { field: 'categoryId' });
    }
    cleaned.categoryId = cat._id;
    cleaned.categorySlug = cat.slug;
  }

  // 3. priceCents
  if ('priceCents' in body || !isPatch) {
    if (
      typeof body.priceCents !== 'number' ||
      !Number.isInteger(body.priceCents) ||
      body.priceCents < 1 ||
      body.priceCents > 1000000
    ) {
      throw AppError.validation('Price must be an integer between 1 and 1,000,000 cents', { field: 'priceCents' });
    }
    cleaned.priceCents = body.priceCents;
  }

  // 4. unit
  if ('unit' in body || !isPatch) {
    if (typeof body.unit !== 'string' || !PRODUCT_UNITS.includes(body.unit)) {
      throw AppError.validation(`Unit must be one of: ${PRODUCT_UNITS.join(', ')}`, { field: 'unit' });
    }
    cleaned.unit = body.unit;
  }

  // 5. quantityAvailable
  if ('quantityAvailable' in body) {
    if (
      typeof body.quantityAvailable !== 'number' ||
      !Number.isInteger(body.quantityAvailable) ||
      body.quantityAvailable < 0 ||
      body.quantityAvailable > 10000
    ) {
      throw AppError.validation('Quantity available must be an integer between 0 and 10,000', { field: 'quantityAvailable' });
    }
    cleaned.quantityAvailable = body.quantityAvailable;
  } else if (!isPatch) {
    cleaned.quantityAvailable = 0;
  }

  // 6. lowStockThreshold
  if ('lowStockThreshold' in body) {
    if (
      typeof body.lowStockThreshold !== 'number' ||
      !Number.isInteger(body.lowStockThreshold) ||
      body.lowStockThreshold < 0 ||
      body.lowStockThreshold > 1000
    ) {
      throw AppError.validation('Low stock threshold must be an integer between 0 and 1,000', { field: 'lowStockThreshold' });
    }
    cleaned.lowStockThreshold = body.lowStockThreshold;
  } else if (!isPatch) {
    // Default from settings or fallback to 5
    const settingDoc = await db.collection(COLLECTIONS.SETTINGS).findOne({ key: 'lowStockDefault' });
    cleaned.lowStockThreshold = (settingDoc && typeof settingDoc.value === 'number') ? settingDoc.value : 5;
  }

  // 7. description
  if ('description' in body) {
    if (typeof body.description !== 'string' || body.description.length > 500) {
      throw AppError.validation('Description must be a string up to 500 characters', { field: 'description' });
    }
    cleaned.description = body.description.trim();
  } else if (!isPatch) {
    cleaned.description = '';
  }

  // 8. tags
  if ('tags' in body) {
    if (!Array.isArray(body.tags)) {
      throw AppError.validation('Tags must be an array of strings', { field: 'tags' });
    }
    for (const tag of body.tags) {
      if (!ALLOWED_FARMER_TAGS.includes(tag)) {
        throw AppError.validation(`Farmers may only use tags: ${ALLOWED_FARMER_TAGS.join(', ')}`, { field: 'tags' });
      }
    }
    cleaned.tags = [...new Set(body.tags)];
  } else if (!isPatch) {
    cleaned.tags = [];
  }

  // 9. art
  if ('art' in body || !isPatch) {
    if (typeof body.art !== 'string' || !ALLOWED_ART_KEYS.includes(body.art)) {
      throw AppError.validation('Invalid art key', { field: 'art' });
    }
    cleaned.art = body.art;
  }

  // 10. imageUrl & imagePublicId
  if ('imageUrl' in body) {
    if (body.imageUrl === null || body.imageUrl === '') {
      cleaned.imageUrl = null;
    } else {
      if (typeof body.imageUrl !== 'string') {
        throw AppError.validation('imageUrl must be a string or null', { field: 'imageUrl' });
      }
      cleaned.imageUrl = body.imageUrl;
    }
  }
  if ('imagePublicId' in body) {
    cleaned.imagePublicId = body.imagePublicId ? String(body.imagePublicId) : null;
  }

  // 11. weekly
  if ('weekly' in body) {
    if (typeof body.weekly !== 'object' || body.weekly === null) {
      throw AppError.validation('Weekly configuration must be an object', { field: 'weekly' });
    }
    const { enabled, defaultQty } = body.weekly;
    if (typeof enabled !== 'boolean') {
      throw AppError.validation('weekly.enabled must be a boolean', { field: 'weekly.enabled' });
    }
    if (
      typeof defaultQty !== 'number' ||
      !Number.isInteger(defaultQty) ||
      defaultQty < 0 ||
      defaultQty > 10000
    ) {
      throw AppError.validation('weekly.defaultQty must be an integer between 0 and 10,000', { field: 'weekly.defaultQty' });
    }
    cleaned.weekly = { enabled, defaultQty };
  } else if (!isPatch) {
    cleaned.weekly = { enabled: false, defaultQty: 0 };
  }

  return cleaned;
}

/**
 * Lists products owned by the authenticated farmer with counts and filtering.
 *
 * @param {string|ObjectId} farmerId
 * @param {object} [query={}]
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listFarmerProducts(farmerId, query = {}) {
  const db = getDb();
  const fId = toObjectId(farmerId);

  const filter = {
    farmerId: fId,
    archived: { $ne: true },
  };

  if (query.status || query.availability) {
    filter.availability = query.status || query.availability;
  }

  if (query.categoryId) {
    if (ObjectId.isValid(query.categoryId)) {
      filter.categoryId = toObjectId(query.categoryId);
    }
  }

  if (query.search && typeof query.search === 'string' && query.search.trim()) {
    filter.nameLower = { $regex: escapeForPrefix(query.search.trim().toLowerCase()), $options: 'i' };
  }

  let sort = { createdAt: -1, _id: -1 };
  if (query.sort === 'name_asc') sort = { nameLower: 1, _id: 1 };
  else if (query.sort === 'name_desc') sort = { nameLower: -1, _id: -1 };
  else if (query.sort === 'price_asc') sort = { priceCents: 1, _id: 1 };
  else if (query.sort === 'price_desc') sort = { priceCents: -1, _id: -1 };
  else if (query.sort === 'stock_asc') sort = { quantityAvailable: 1, _id: 1 };
  else if (query.sort === 'stock_desc') sort = { quantityAvailable: -1, _id: -1 };
  else if (query.sort === 'newest') sort = { createdAt: -1, _id: -1 };

  const limit = Math.min(100, Math.max(1, parseInt(query.limit || 20, 10)));

  const [products, countAgg] = await Promise.all([
    db.collection(COLLECTIONS.PRODUCTS).find(filter).sort(sort).limit(limit).toArray(),
    db
      .collection(COLLECTIONS.PRODUCTS)
      .aggregate([
        { $match: { farmerId: fId, archived: { $ne: true } } },
        { $group: { _id: '$availability', count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  const counts = { all: 0, in: 0, low: 0, out: 0, hidden: 0 };
  for (const item of countAgg) {
    counts[item._id] = item.count;
    counts.all += item.count;
  }

  return {
    data: products.map(toFarmerProductDto),
    meta: {
      nextCursor: null,
      counts,
    },
  };
}

/**
 * Gets a single farmer product by ID. Enforces strict tenant isolation.
 *
 * @param {string|ObjectId} farmerId
 * @param {string|ObjectId} productId
 * @returns {Promise<object>}
 */
export async function getFarmerProductById(farmerId, productId) {
  if (!productId || !ObjectId.isValid(productId)) {
    throw AppError.notFound('Product not found');
  }

  const db = getDb();
  const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({
    _id: toObjectId(productId),
    farmerId: toObjectId(farmerId),
    archived: { $ne: true },
  });

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  return toFarmerProductDto(product);
}

/**
 * Creates a new product for the authenticated farmer.
 *
 * @param {string|ObjectId} farmerId
 * @param {object} body
 * @returns {Promise<object>}
 */
export async function createFarmerProduct(farmerId, body) {
  const db = getDb();
  const fId = toObjectId(farmerId);

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fId });
  if (!farmer) {
    throw AppError.notFound('Farmer profile not found');
  }

  const cleaned = await validateProductInput(body, false, db);

  // Determine availability
  let availability = 'in';
  if (cleaned.quantityAvailable === 0) {
    availability = 'out';
  } else if (cleaned.quantityAvailable <= cleaned.lowStockThreshold) {
    availability = 'low';
  }

  const listed = Boolean(farmer.listingEnabled && availability !== 'hidden');
  const now = new Date();
  const newProductId = new ObjectId();

  let finalImageUrl = null;
  let finalImagePublicId = null;
  if (cleaned.imageUrl) {
    const attachRes = await validateAndAttachImage({
      db,
      imageUrl: cleaned.imageUrl,
      imagePublicId: cleaned.imagePublicId,
      ownerUserId: farmer.userId,
      attachTo: { type: 'product', id: newProductId },
    });
    finalImageUrl = attachRes.imageUrl;
    finalImagePublicId = attachRes.imagePublicId;
  }

  const productDoc = {
    _id: newProductId,
    farmerId: fId,
    farmerUserId: farmer.userId,
    farmer: {
      stallName: farmer.stallName,
      stallNumber: farmer.stallNumber || '',
      art: farmer.art || '',
    },
    marketIds: Array.isArray(farmer.marketIds) ? farmer.marketIds : [],
    categoryId: cleaned.categoryId,
    categorySlug: cleaned.categorySlug,
    name: cleaned.name,
    nameLower: cleaned.name.toLowerCase(),
    description: cleaned.description,
    priceCents: cleaned.priceCents,
    unit: cleaned.unit,
    quantityAvailable: cleaned.quantityAvailable,
    lowStockThreshold: cleaned.lowStockThreshold,
    availability,
    tags: cleaned.tags,
    art: cleaned.art,
    imageUrl: finalImageUrl,
    imagePublicId: finalImagePublicId,
    weekly: cleaned.weekly,
    ratingAvg: 0,
    ratingCount: 0,
    ratingSum: 0,
    salesCount: 0,
    featuredScore: 0,
    listed,
    rnd: Math.random(),
    moderation: {
      removed: false,
    },
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(COLLECTIONS.PRODUCTS).insertOne(productDoc);
  await syncFarmerCategorySlugs(fId, db);

  return toFarmerProductDto(productDoc);
}

/**
 * Updates a farmer's product.
 *
 * @param {string|ObjectId} farmerId
 * @param {string|ObjectId} productId
 * @param {object} body
 * @returns {Promise<object>}
 */
export async function updateFarmerProduct(farmerId, productId, body) {
  if (!productId || !ObjectId.isValid(productId)) {
    throw AppError.notFound('Product not found');
  }

  const db = getDb();
  const fId = toObjectId(farmerId);
  const pId = toObjectId(productId);

  const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({
    _id: pId,
    farmerId: fId,
    archived: { $ne: true },
  });

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fId });
  const cleaned = await validateProductInput(body, true, db);
  const now = new Date();

  const updateFields = { ...cleaned, updatedAt: now };

  if (cleaned.name) {
    updateFields.nameLower = cleaned.name.toLowerCase();
  }

  // Handle stock / availability recalculation
  const effectiveQty = cleaned.quantityAvailable !== undefined ? cleaned.quantityAvailable : product.quantityAvailable;
  const effectiveLowStock = cleaned.lowStockThreshold !== undefined ? cleaned.lowStockThreshold : product.lowStockThreshold;

  let newAvailability = product.availability;
  if (product.availability !== 'hidden') {
    if (effectiveQty === 0) {
      newAvailability = 'out';
    } else if (effectiveQty <= effectiveLowStock) {
      newAvailability = 'low';
    } else {
      newAvailability = 'in';
    }
    updateFields.availability = newAvailability;
  }

  // Listed recalculation
  const isListed = Boolean(
    farmer.listingEnabled &&
    !product.moderation?.removed &&
    !product.archived &&
    newAvailability !== 'hidden'
  );
  updateFields.listed = isListed;

  // Image replacement / attachment
  if (cleaned.imageUrl !== undefined) {
    const attachRes = await validateAndAttachImage({
      db,
      imageUrl: cleaned.imageUrl,
      imagePublicId: cleaned.imagePublicId,
      ownerUserId: farmer.userId,
      attachTo: { type: 'product', id: pId },
      oldPublicId: product.imagePublicId,
    });
    updateFields.imageUrl = attachRes.imageUrl;
    updateFields.imagePublicId = attachRes.imagePublicId;
  }

  await db.collection(COLLECTIONS.PRODUCTS).updateOne({ _id: pId }, { $set: updateFields });

  // Restock alert if went from 0 to positive
  const wasOut = product.quantityAvailable === 0 || product.availability === 'out';
  if (wasOut && effectiveQty > 0 && isListed) {
    await notifyRestock(pId, db);
  }

  // Sync category slugs if category or listed status changed
  if (cleaned.categoryId || product.listed !== isListed) {
    await syncFarmerCategorySlugs(fId, db);
  }

  const updatedDoc = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: pId });
  return toFarmerProductDto(updatedDoc);
}

/**
 * Toggles product to sold-out (availability: 'out', quantityAvailable: 0).
 *
 * @param {string|ObjectId} farmerId
 * @param {string|ObjectId} productId
 * @returns {Promise<object>}
 */
export async function setProductSoldOut(farmerId, productId) {
  if (!productId || !ObjectId.isValid(productId)) {
    throw AppError.notFound('Product not found');
  }

  const db = getDb();
  const pId = toObjectId(productId);
  const fId = toObjectId(farmerId);

  const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({
    _id: pId,
    farmerId: fId,
    archived: { $ne: true },
  });

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  const now = new Date();
  await db.collection(COLLECTIONS.PRODUCTS).updateOne(
    { _id: pId },
    {
      $set: {
        availability: 'out',
        quantityAvailable: 0,
        updatedAt: now,
      },
    }
  );

  const updated = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: pId });
  return toFarmerProductDto(updated);
}

/**
 * Toggles product to available with specified or default quantity.
 *
 * @param {string|ObjectId} farmerId
 * @param {string|ObjectId} productId
 * @param {object} [opts={}]
 * @returns {Promise<object>}
 */
export async function setProductAvailable(farmerId, productId, { quantity } = {}) {
  if (!productId || !ObjectId.isValid(productId)) {
    throw AppError.notFound('Product not found');
  }

  const db = getDb();
  const pId = toObjectId(productId);
  const fId = toObjectId(farmerId);

  const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({
    _id: pId,
    farmerId: fId,
    archived: { $ne: true },
  });

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fId });

  let targetQty = 10;
  if (typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0 && quantity <= 10000) {
    targetQty = quantity;
  } else if (product.weekly?.defaultQty && product.weekly.defaultQty > 0) {
    targetQty = product.weekly.defaultQty;
  }

  const lowStock = product.lowStockThreshold ?? 5;
  const availability = targetQty <= lowStock ? 'low' : 'in';
  const listed = Boolean(farmer.listingEnabled && !product.moderation?.removed && !product.archived);
  const now = new Date();

  await db.collection(COLLECTIONS.PRODUCTS).updateOne(
    { _id: pId },
    {
      $set: {
        quantityAvailable: targetQty,
        availability,
        listed,
        updatedAt: now,
      },
    }
  );

  const wasOut = product.quantityAvailable === 0 || product.availability === 'out';
  if (wasOut && targetQty > 0 && listed) {
    await notifyRestock(pId, db);
  }

  await syncFarmerCategorySlugs(fId, db);

  const updated = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: pId });
  return toFarmerProductDto(updated);
}

/**
 * Hides or unhides a product from the catalog.
 *
 * @param {string|ObjectId} farmerId
 * @param {string|ObjectId} productId
 * @param {boolean} hidden
 * @returns {Promise<object>}
 */
export async function setProductHidden(farmerId, productId, hidden) {
  if (!productId || !ObjectId.isValid(productId)) {
    throw AppError.notFound('Product not found');
  }

  const db = getDb();
  const pId = toObjectId(productId);
  const fId = toObjectId(farmerId);

  const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({
    _id: pId,
    farmerId: fId,
    archived: { $ne: true },
  });

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  const farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: fId });
  const now = new Date();

  let availability = 'hidden';
  let listed = false;

  if (!hidden) {
    const qty = product.quantityAvailable ?? 0;
    const lowStock = product.lowStockThreshold ?? 5;
    if (qty === 0) availability = 'out';
    else if (qty <= lowStock) availability = 'low';
    else availability = 'in';

    listed = Boolean(farmer.listingEnabled && !product.moderation?.removed && !product.archived);
  }

  await db.collection(COLLECTIONS.PRODUCTS).updateOne(
    { _id: pId },
    {
      $set: {
        availability,
        listed,
        updatedAt: now,
      },
    }
  );

  await syncFarmerCategorySlugs(fId, db);

  const updated = await db.collection(COLLECTIONS.PRODUCTS).findOne({ _id: pId });
  return toFarmerProductDto(updated);
}

/**
 * Deletes a farmer's product.
 * If orders reference it: archives (soft delete).
 * Otherwise: hard deletes.
 * Always purges product from favorites and syncs categorySlugs.
 *
 * @param {string|ObjectId} farmerId
 * @param {string|ObjectId} productId
 * @returns {Promise<{ archived?: boolean, deleted?: boolean }>}
 */
export async function deleteFarmerProduct(farmerId, productId) {
  if (!productId || !ObjectId.isValid(productId)) {
    throw AppError.notFound('Product not found');
  }

  const db = getDb();
  const pId = toObjectId(productId);
  const fId = toObjectId(farmerId);

  const product = await db.collection(COLLECTIONS.PRODUCTS).findOne({
    _id: pId,
    farmerId: fId,
    archived: { $ne: true },
  });

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  // Check if product is in any orders
  const ordersCount = await db.collection(COLLECTIONS.ORDERS).countDocuments({
    'items.productId': pId,
  });

  // Purge from favorites
  await db.collection(COLLECTIONS.FAVORITES).deleteMany({
    targetType: 'product',
    targetId: pId,
  });

  const now = new Date();

  if (ordersCount > 0) {
    // Soft delete / archive
    await db.collection(COLLECTIONS.PRODUCTS).updateOne(
      { _id: pId },
      {
        $set: {
          archived: true,
          listed: false,
          availability: 'hidden',
          updatedAt: now,
        },
      }
    );
    await syncFarmerCategorySlugs(fId, db);
    return { archived: true };
  } else {
    // Hard delete
    await db.collection(COLLECTIONS.PRODUCTS).deleteOne({ _id: pId });
    await syncFarmerCategorySlugs(fId, db);
    if (product.imagePublicId) {
      await detachAndDeleteImage(db, product.imagePublicId);
    } else if (product.imageUrl) {
      cleanOrphanImage(product.imageUrl, db);
    }
    return { deleted: true };
  }
}

/**
 * Bulk action on products.
 * Safely ignores IDs that do not belong to the authenticated farmer and reports them in skipped.
 *
 * @param {string|ObjectId} farmerId
 * @param {object} param1
 * @param {string} param1.action
 * @param {Array<string>} param1.productIds
 * @returns {Promise<{ modifiedCount: number, skipped: Array<string> }>}
 */
export async function bulkFarmerProducts(farmerId, { action, productIds }) {
  const allowedActions = ['mark_available', 'mark_sold_out', 'hide', 'unhide', 'delete'];
  if (!action || !allowedActions.includes(action)) {
    throw AppError.validation(`Invalid action. Allowed: ${allowedActions.join(', ')}`, { field: 'action' });
  }

  if (!Array.isArray(productIds) || productIds.length === 0 || productIds.length > 100) {
    throw AppError.validation('productIds must be an array between 1 and 100 items', { field: 'productIds' });
  }

  const db = getDb();
  const fId = toObjectId(farmerId);

  const validObjectIds = [];
  const skipped = [];

  for (const id of productIds) {
    if (ObjectId.isValid(id)) {
      validObjectIds.push(toObjectId(id));
    } else {
      skipped.push(id);
    }
  }

  // Find products belonging to this farmer
  const ownedProducts = await db
    .collection(COLLECTIONS.PRODUCTS)
    .find({
      _id: { $in: validObjectIds },
      farmerId: fId,
      archived: { $ne: true },
    })
    .toArray();

  const ownedIdSet = new Set(ownedProducts.map((p) => p._id.toString()));
  for (const id of validObjectIds) {
    if (!ownedIdSet.has(id.toString())) {
      skipped.push(id.toString());
    }
  }

  if (ownedProducts.length === 0) {
    return { modifiedCount: 0, skipped };
  }

  let modifiedCount = 0;
  for (const p of ownedProducts) {
    if (action === 'mark_sold_out') {
      await setProductSoldOut(fId, p._id);
      modifiedCount++;
    } else if (action === 'mark_available') {
      await setProductAvailable(fId, p._id);
      modifiedCount++;
    } else if (action === 'hide') {
      await setProductHidden(fId, p._id, true);
      modifiedCount++;
    } else if (action === 'unhide') {
      await setProductHidden(fId, p._id, false);
      modifiedCount++;
    } else if (action === 'delete') {
      await deleteFarmerProduct(fId, p._id);
      modifiedCount++;
    }
  }

  return { modifiedCount, skipped };
}
