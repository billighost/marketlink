/**
 * Admin Messages service layer.
 * Lists and manages customer and farmer contact messages.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import { writeAudit } from '../../../utils/audit.js';

export function toMessageDto(m) {
  return {
    id: m._id.toString(),
    topic: m.topic,
    name: m.name,
    email: m.email,
    message: m.message,
    status: m.status || 'new',
    orderNumber: m.orderNumber || null,
    handledBy: m.handledBy ? m.handledBy.toString() : null,
    handledAt: m.handledAt instanceof Date ? m.handledAt.toISOString() : (m.handledAt || null),
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
  };
}

export async function listContactMessages(query = {}) {
  const db = getDb();
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.topic) {
    filter.topic = query.topic;
  }

  const limit = Math.min(100, Math.max(1, parseInt(query.limit || 20, 10)));

  const messages = await db
    .collection(COLLECTIONS.CONTACT_MESSAGES)
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return {
    data: messages.map(toMessageDto),
    meta: {
      nextCursor: null,
      count: messages.length,
    },
  };
}

export async function handleContactMessage(adminActor, messageId, replyText) {
  if (!messageId || !ObjectId.isValid(messageId)) {
    throw AppError.notFound('Message not found');
  }

  const db = getDb();
  const mid = toObjectId(messageId);

  const msg = await db.collection(COLLECTIONS.CONTACT_MESSAGES).findOne({ _id: mid });
  if (!msg) {
    throw AppError.notFound('Message not found');
  }

  const now = new Date();
  await db.collection(COLLECTIONS.CONTACT_MESSAGES).updateOne(
    { _id: mid },
    {
      $set: {
        status: 'handled',
        handledBy: toObjectId(adminActor.id),
        handledAt: now,
      },
    }
  );

  await writeAudit(
    adminActor,
    'message.handle',
    { type: 'contactMessage', id: mid },
    { topic: msg.topic, reply: replyText || null }
  );

  const updated = await db.collection(COLLECTIONS.CONTACT_MESSAGES).findOne({ _id: mid });
  return toMessageDto(updated);
}
