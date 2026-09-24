/**
 * Admin Settings service layer.
 * Manages platform configuration parameters and audit logs modifications.
 */

import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { AppError } from '../../../utils/errors.js';
import { writeAudit } from '../../../utils/audit.js';

export async function getPlatformSettings() {
  const db = getDb();
  const docs = await db.collection(COLLECTIONS.SETTINGS).find({}).toArray();

  const settings = {
    maxItemsPerOrder: 15,
    defaultCutoffMinutes: 720,
    lowStockDefault: 5,
  };

  for (const doc of docs) {
    const key = doc._id || doc.key;
    if (key in settings) {
      settings[key] = doc.value;
    }
  }

  return settings;
}

export async function updatePlatformSettings(adminActor, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw AppError.validation('Request body must be an object');
  }

  const allowedKeys = new Set(['maxItemsPerOrder', 'defaultCutoffMinutes', 'lowStockDefault']);
  for (const k of Object.keys(body)) {
    if (!allowedKeys.has(k)) {
      throw AppError.validation(`Unexpected setting key: ${k}`, { field: k });
    }
  }

  if (Object.keys(body).length === 0) {
    throw AppError.validation('At least one setting must be provided to update');
  }

  const updates = {};

  if ('maxItemsPerOrder' in body) {
    const val = body.maxItemsPerOrder;
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 30) {
      throw AppError.validation('maxItemsPerOrder must be an integer between 1 and 30', { field: 'maxItemsPerOrder' });
    }
    updates.maxItemsPerOrder = val;
  }

  if ('defaultCutoffMinutes' in body) {
    const val = body.defaultCutoffMinutes;
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 30 || val > 4320) {
      throw AppError.validation('defaultCutoffMinutes must be an integer between 30 and 4320', { field: 'defaultCutoffMinutes' });
    }
    updates.defaultCutoffMinutes = val;
  }

  if ('lowStockDefault' in body) {
    const val = body.lowStockDefault;
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 0 || val > 100) {
      throw AppError.validation('lowStockDefault must be an integer between 0 and 100', { field: 'lowStockDefault' });
    }
    updates.lowStockDefault = val;
  }

  const db = getDb();
  const now = new Date();
  const ops = Object.entries(updates).map(([key, value]) => ({
    updateOne: {
      filter: { _id: key },
      update: { $set: { _id: key, value, updatedAt: now } },
      upsert: true,
    },
  }));

  await db.collection(COLLECTIONS.SETTINGS).bulkWrite(ops);

  await writeAudit(
    adminActor,
    'settings.update',
    { type: 'settings', id: 'platform_settings' },
    { updates }
  );

  return getPlatformSettings();
}
