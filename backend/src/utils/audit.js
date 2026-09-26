/**
 * Audit log recording and activity formatting utilities.
 * Every administrative mutation records an append-only audit trail.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../db/client.js';
import { COLLECTIONS } from '../db/collections.js';
import { toObjectId, isValidObjectId } from './ids.js';
import { AUDIT_ACTIONS } from '../constants.js';

/**
 * Writes an entry into the auditLog collection.
 *
 * @param {object} actor - { id/userId, role, name? }
 * @param {string} action - Valid action from AUDIT_ACTIONS
 * @param {object|string} target - { type, id } or target object
 * @param {object} [meta={}] - { before?, after?, reason?, name?, stallName? }
 * @param {object} [options]
 * @param {import('mongodb').Db} [options.db]
 * @returns {Promise<object>}
 */
export async function writeAudit(actor, action, target, meta = {}, { db: dbInstance } = {}) {
  const db = dbInstance || getDb();

  const actorId = toObjectId(actor.id || actor._id || actor.userId);
  const actorRole = actor.role || 'admin';

  let targetType = 'unknown';
  let targetId = '';

  if (typeof target === 'string') {
    targetId = target;
  } else if (target && typeof target === 'object') {
    targetType = target.type || target.targetType || 'unknown';
    targetId = (target.id || target._id || '').toString();
  }

  const entry = {
    _id: new ObjectId(),
    actorId,
    actorRole,
    action,
    targetType,
    targetId: isValidObjectId(targetId) ? new ObjectId(targetId) : targetId,
    meta: meta || {},
    at: new Date(),
  };

  await db.collection(COLLECTIONS.AUDIT_LOG).insertOne(entry);
  return entry;
}

/**
 * Renders an audit log entry into a concise, human-readable sentence for overview activity feeds.
 * E.g., "Admin approved Riverbend Farm"
 *
 * @param {object} log
 * @returns {string}
 */
export function formatAuditActivity(log) {
  if (!log || !log.action) return 'System activity recorded';

  const role = log.actorRole === 'admin' ? 'Admin' : log.actorRole || 'User';
  const meta = log.meta || {};
  const targetLabel = meta.name || meta.stallName || meta.title || log.targetType || 'entity';

  switch (log.action) {
    case 'farmer.approve':
      return `${role} approved ${targetLabel}`;
    case 'farmer.reject':
      return `${role} rejected ${targetLabel}${meta.reason ? `: ${meta.reason}` : ''}`;
    case 'farmer.suspend':
      return `${role} suspended ${targetLabel}${meta.reason ? `: ${meta.reason}` : ''}`;
    case 'farmer.reinstate':
      return `${role} reinstated ${targetLabel}`;
    case 'customer.deactivate':
      return `${role} deactivated customer ${targetLabel}`;
    case 'customer.activate':
      return `${role} activated customer ${targetLabel}`;
    case 'market.create':
      return `${role} created market ${targetLabel}`;
    case 'market.update':
      return `${role} updated market ${targetLabel}`;
    case 'market.remove':
      return `${role} removed market ${targetLabel}`;
    case 'product.remove':
      return `${role} removed product ${targetLabel}`;
    case 'review.remove':
      return `${role} removed review for ${targetLabel}`;
    case 'moderation.resolve':
      return `${role} resolved moderation flag on ${targetLabel}`;
    case 'category.create':
      return `${role} created category ${targetLabel}`;
    case 'category.update':
      return `${role} updated category ${targetLabel}`;
    case 'category.delete':
      return `${role} deleted category ${targetLabel}`;
    case 'category.reorder':
      return `${role} reordered categories`;
    case 'announcement.create':
      return `${role} created announcement "${targetLabel}"`;
    case 'announcement.update':
      return `${role} updated announcement "${targetLabel}"`;
    case 'announcement.delete':
      return `${role} deleted announcement "${targetLabel}"`;
    case 'announcement.publish':
      return `${role} published announcement "${targetLabel}"`;
    case 'settings.update':
      return `${role} updated platform settings`;
    case 'message.handle':
      return `${role} marked contact message from ${targetLabel} as handled`;
    case 'report.export':
      return `${role} exported ${meta.type || 'data'} report`;
    default:
      return `${role} performed ${log.action}`;
  }
}
