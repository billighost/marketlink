/**
 * Admin Announcements service layer.
 * CRUD and batched audience-targeted broadcast notifications.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import { ANNOUNCEMENT_AUDIENCES } from '../../../constants.js';
import { writeAudit } from '../../../utils/audit.js';
import { createNotifications } from '../../notifications/notify.js';

export function toAnnouncementDto(a) {
  return {
    id: a._id.toString(),
    title: a.title,
    body: a.body,
    audience: a.audience,
    publishedAt: a.publishedAt instanceof Date ? a.publishedAt.toISOString() : (a.publishedAt || null),
    expiresAt: a.expiresAt instanceof Date ? a.expiresAt.toISOString() : (a.expiresAt || null),
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : a.updatedAt,
  };
}

export async function listAnnouncementsAdmin() {
  const db = getDb();
  const docs = await db
    .collection(COLLECTIONS.ANNOUNCEMENTS)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toAnnouncementDto);
}

export async function createAnnouncement(adminActor, body) {
  if (!body || typeof body !== 'object') {
    throw AppError.validation('Request body must be an object');
  }

  const { title, body: bodyText, audience, publishedAt, expiresAt } = body;

  if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 80) {
    throw AppError.validation('Title must be between 3 and 80 characters', { field: 'title' });
  }

  if (typeof bodyText !== 'string' || bodyText.trim().length < 3 || bodyText.trim().length > 600) {
    throw AppError.validation('Body must be between 3 and 600 characters', { field: 'body' });
  }

  if (!audience || !ANNOUNCEMENT_AUDIENCES.includes(audience)) {
    throw AppError.validation(`Audience must be one of: ${ANNOUNCEMENT_AUDIENCES.join(', ')}`, { field: 'audience' });
  }

  const now = new Date();
  const pubDate = publishedAt ? new Date(publishedAt) : now;
  let expDate = null;
  if (expiresAt) {
    expDate = new Date(expiresAt);
    if (expDate <= pubDate) {
      throw AppError.validation('expiresAt must be after publishedAt', { field: 'expiresAt' });
    }
  }

  const db = getDb();
  const doc = {
    _id: new ObjectId(),
    title: title.trim(),
    body: bodyText.trim(),
    audience,
    publishedAt: pubDate,
    expiresAt: expDate,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection(COLLECTIONS.ANNOUNCEMENTS).insertOne(doc);

  await writeAudit(
    adminActor,
    'announcement.create',
    { type: 'announcement', id: doc._id },
    { title: doc.title, audience: doc.audience }
  );

  return toAnnouncementDto(doc);
}

export async function updateAnnouncement(adminActor, id, body) {
  if (!id || !ObjectId.isValid(id)) {
    throw AppError.notFound('Announcement not found');
  }

  const db = getDb();
  const aid = toObjectId(id);

  const existing = await db.collection(COLLECTIONS.ANNOUNCEMENTS).findOne({ _id: aid });
  if (!existing) {
    throw AppError.notFound('Announcement not found');
  }

  const updateFields = {};

  if ('title' in body) {
    if (typeof body.title !== 'string' || body.title.trim().length < 3 || body.title.trim().length > 80) {
      throw AppError.validation('Title must be between 3 and 80 characters', { field: 'title' });
    }
    updateFields.title = body.title.trim();
  }

  if ('body' in body) {
    if (typeof body.body !== 'string' || body.body.trim().length < 3 || body.body.trim().length > 600) {
      throw AppError.validation('Body must be between 3 and 600 characters', { field: 'body' });
    }
    updateFields.body = body.body.trim();
  }

  if ('audience' in body) {
    if (!ANNOUNCEMENT_AUDIENCES.includes(body.audience)) {
      throw AppError.validation(`Audience must be one of: ${ANNOUNCEMENT_AUDIENCES.join(', ')}`, { field: 'audience' });
    }
    updateFields.audience = body.audience;
  }

  if ('expiresAt' in body) {
    if (body.expiresAt === null) {
      updateFields.expiresAt = null;
    } else {
      const expDate = new Date(body.expiresAt);
      const pubDate = existing.publishedAt || new Date();
      if (expDate <= pubDate) {
        throw AppError.validation('expiresAt must be after publishedAt', { field: 'expiresAt' });
      }
      updateFields.expiresAt = expDate;
    }
  }

  updateFields.updatedAt = new Date();

  await db.collection(COLLECTIONS.ANNOUNCEMENTS).updateOne({ _id: aid }, { $set: updateFields });

  await writeAudit(
    adminActor,
    'announcement.update',
    { type: 'announcement', id: aid },
    { before: existing, after: updateFields }
  );

  const updated = await db.collection(COLLECTIONS.ANNOUNCEMENTS).findOne({ _id: aid });
  return toAnnouncementDto(updated);
}

export async function deleteAnnouncement(adminActor, id) {
  if (!id || !ObjectId.isValid(id)) {
    throw AppError.notFound('Announcement not found');
  }

  const db = getDb();
  const aid = toObjectId(id);

  const existing = await db.collection(COLLECTIONS.ANNOUNCEMENTS).findOne({ _id: aid });
  if (!existing) {
    throw AppError.notFound('Announcement not found');
  }

  await db.collection(COLLECTIONS.ANNOUNCEMENTS).deleteOne({ _id: aid });

  await writeAudit(
    adminActor,
    'announcement.delete',
    { type: 'announcement', id: aid },
    { title: existing.title }
  );

  return { deleted: true };
}

export async function publishAnnouncement(adminActor, id) {
  if (!id || !ObjectId.isValid(id)) {
    throw AppError.notFound('Announcement not found');
  }

  const db = getDb();
  const aid = toObjectId(id);

  const existing = await db.collection(COLLECTIONS.ANNOUNCEMENTS).findOne({ _id: aid });
  if (!existing) {
    throw AppError.notFound('Announcement not found');
  }

  const now = new Date();
  await db.collection(COLLECTIONS.ANNOUNCEMENTS).updateOne(
    { _id: aid },
    { $set: { publishedAt: now, updatedAt: now } }
  );

  // Broadcast in-app notifications to audience
  const userFilter = { status: 'active' };
  if (existing.audience === 'customer') {
    userFilter.role = 'customer';
  } else if (existing.audience === 'farmer') {
    userFilter.role = 'farmer';
  }

  const targetUsers = await db
    .collection(COLLECTIONS.USERS)
    .find(userFilter, { projection: { _id: 1 } })
    .toArray();

  if (targetUsers.length > 0) {
    const notifItems = targetUsers.map((u) => ({
      userId: u._id,
      type: 'announcement',
      title: existing.title,
      body: existing.body.slice(0, 100),
      data: { announcementId: aid.toString() },
    }));
    await createNotifications(notifItems, db);
  }

  await writeAudit(
    adminActor,
    'announcement.publish',
    { type: 'announcement', id: aid },
    { audience: existing.audience, recipientsCount: targetUsers.length }
  );

  const updated = await db.collection(COLLECTIONS.ANNOUNCEMENTS).findOne({ _id: aid });
  return toAnnouncementDto(updated);
}
