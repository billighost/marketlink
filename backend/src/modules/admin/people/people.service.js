<<<<<<< HEAD
import { ObjectId } from 'mongodb';import { getDb } from '../../../db/client.js';import { COLLECTIONS } from '../../../db/collections.js';import { toObjectId } from '../../../utils/ids.js';import { AppError } from '../../../utils/errors.js';import { syncFarmerListed } from '../../../utils/sync.js';import { writeAudit } from '../../../utils/audit.js';import { revokeAllUserSessions } from '../../auth/auth.service.js';import { createNotification } from '../../notifications/notify.js';export function toPersonSummary(user, farmer) {  return {    id: user._id.toString(),    farmerId: farmer?._id ? farmer._id.toString() : undefined,    role: user.role,    name: user.name,    email: user.email,    phone: user.phone || null,    status: user.status,    stallName: farmer?.stallName,    stallNumber: farmer?.stallNumber,    listingEnabled: farmer?.listingEnabled,    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,  };}export async function listFarmers(query = {}) {  const db = getDb();  const filter = { role: 'farmer' };  if (query.status) {    filter.status = query.status;  }  if (query.search && typeof query.search === 'string' && query.search.trim()) {    const s = query.search.trim();    filter.$or = [      { name: { $regex: s, $options: 'i' } },      { email: { $regex: s, $options: 'i' } },    ];  }  const limit = Math.min(100, Math.max(1, parseInt(query.limit || 20, 10)));  const users = await db    .collection(COLLECTIONS.USERS)    .find(filter)    .sort({ createdAt: -1, _id: -1 })    .limit(limit)    .toArray();  const userIds = users.map((u) => u._id);  const farmers = await db    .collection(COLLECTIONS.FARMERS)    .find({ userId: { $in: userIds } })    .toArray();  const farmerMap = new Map(farmers.map((f) => [f.userId.toString(), f]));  return {    data: users.map((u) => toPersonSummary(u, farmerMap.get(u._id.toString()))),    meta: {      nextCursor: null,      count: users.length,    },  };}export async function listCustomers(query = {}) {  const db = getDb();  const filter = { role: 'customer' };  if (query.status) {    filter.status = query.status;  }  if (query.search && typeof query.search === 'string' && query.search.trim()) {    const s = query.search.trim();    filter.$or = [      { name: { $regex: s, $options: 'i' } },      { email: { $regex: s, $options: 'i' } },    ];  }  const limit = Math.min(100, Math.max(1, parseInt(query.limit || 20, 10)));  const users = await db    .collection(COLLECTIONS.USERS)    .find(filter)    .sort({ createdAt: -1, _id: -1 })    .limit(limit)    .toArray();  return {    data: users.map((u) => toPersonSummary(u)),    meta: {      nextCursor: null,      count: users.length,    },  };}export async function approveFarmer(adminActor, farmerIdOrUserId) {  const db = getDb();  const targetId = toObjectId(farmerIdOrUserId);  let farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: targetId });  if (!farmer) {    farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: targetId });  }  if (!farmer) {    throw AppError.notFound('Farmer profile not found');  }  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: farmer.userId });  if (!user) {    throw AppError.notFound('User account not found');  }  if (!['pending', 'rejected'].includes(user.status)) {    throw new AppError(409, 'INVALID_STATE', `Farmer cannot be approved from status '${user.status}'.`);  }  const prevUserStatus = user.status;  const prevListingEnabled = farmer.listingEnabled;  const now = new Date();  try {    await db.collection(COLLECTIONS.USERS).updateOne(      { _id: user._id, status: prevUserStatus },      { $set: { status: 'active', updatedAt: now } }    );    await db.collection(COLLECTIONS.FARMERS).updateOne(      { _id: farmer._id },      { $set: { listingEnabled: true, isNew: true, updatedAt: now } }    );    await syncFarmerListed(farmer._id, true, { wasListingEnabled: prevListingEnabled, db });    await createNotification(      {        userId: user._id,        type: 'account',        title: 'Account approved',        body: 'Your stall is approved. You can add products now.',      },      db    );    await writeAudit(      adminActor,      'farmer.approve',      { type: 'farmer', id: farmer._id },      { previousStatus: prevUserStatus, stallName: farmer.stallName }    );    const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: user._id });    const updatedFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmer._id });    return toPersonSummary(updatedUser, updatedFarmer);  } catch (err) {    await db.collection(COLLECTIONS.USERS).updateOne({ _id: user._id }, { $set: { status: prevUserStatus } });    await db.collection(COLLECTIONS.FARMERS).updateOne({ _id: farmer._id }, { $set: { listingEnabled: prevListingEnabled } });    await syncFarmerListed(farmer._id, prevListingEnabled, { wasListingEnabled: true, db });    throw err;  }}export async function rejectFarmer(adminActor, farmerIdOrUserId, reason) {  if (!reason || typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 200) {    throw AppError.validation('Reason must be between 3 and 200 characters', { field: 'reason' });  }  const db = getDb();  const targetId = toObjectId(farmerIdOrUserId);  let farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: targetId });  if (!farmer) {    farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: targetId });  }  if (!farmer) {    throw AppError.notFound('Farmer profile not found');  }  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: farmer.userId });  if (!user) {    throw AppError.notFound('User account not found');  }  if (user.status !== 'pending') {    throw new AppError(409, 'INVALID_STATE', `Only pending farmers can be rejected (current: '${user.status}').`);  }  const prevUserStatus = user.status;  const now = new Date();  await db.collection(COLLECTIONS.USERS).updateOne(    { _id: user._id },    { $set: { status: 'rejected', updatedAt: now } }  );  await db.collection(COLLECTIONS.FARMERS).updateOne(    { _id: farmer._id },    { $set: { listingEnabled: false, updatedAt: now } }  );  await revokeAllUserSessions(user._id);  await syncFarmerListed(farmer._id, false, { wasListingEnabled: prevListingEnabled, db });  await createNotification(    {      userId: user._id,      type: 'account',      title: 'Stall application rejected',      body: `Your stall application was not approved. Reason: ${reason.trim()}`,    },    db  );  await writeAudit(    adminActor,    'farmer.reject',    { type: 'farmer', id: farmer._id },    { reason: reason.trim(), previousStatus: prevUserStatus, stallName: farmer.stallName }  );  const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: user._id });  const updatedFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmer._id });  return toPersonSummary(updatedUser, updatedFarmer);}export async function suspendFarmer(adminActor, farmerIdOrUserId, reason) {  if (!reason || typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 200) {    throw AppError.validation('Reason must be between 3 and 200 characters', { field: 'reason' });  }  const db = getDb();  const targetId = toObjectId(farmerIdOrUserId);  let farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: targetId });  if (!farmer) {    farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: targetId });  }  if (!farmer) {    throw AppError.notFound('Farmer profile not found');  }  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: farmer.userId });  if (!user) {    throw AppError.notFound('User account not found');  }  if (user.role === 'admin') {    throw new AppError(403, 'CANNOT_MODERATE_ADMIN', 'Cannot suspend an administrator.');  }  if (user.status !== 'active') {    throw new AppError(409, 'INVALID_STATE', `Only active farmers can be suspended (current: '${user.status}').`);  }  const prevUserStatus = user.status;  const prevListingEnabled = farmer.listingEnabled;  const now = new Date();  await db.collection(COLLECTIONS.USERS).updateOne(    { _id: user._id },    { $set: { status: 'suspended', updatedAt: now } }  );  await db.collection(COLLECTIONS.FARMERS).updateOne(    { _id: farmer._id },    { $set: { listingEnabled: false, updatedAt: now } }  );  await revokeAllUserSessions(user._id);  await syncFarmerListed(farmer._id, false, { wasListingEnabled: prevListingEnabled, db });  await createNotification(    {      userId: user._id,      type: 'account',      title: 'Stall suspended',      body: `Your stall has been suspended. Reason: ${reason.trim()}`,    },    db  );  await writeAudit(    adminActor,    'farmer.suspend',    { type: 'farmer', id: farmer._id },    { reason: reason.trim(), previousStatus: prevUserStatus, stallName: farmer.stallName }  );  const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: user._id });  const updatedFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmer._id });  return toPersonSummary(updatedUser, updatedFarmer);}export async function reinstateFarmer(adminActor, farmerIdOrUserId) {  const db = getDb();  const targetId = toObjectId(farmerIdOrUserId);  let farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: targetId });  if (!farmer) {    farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: targetId });  }  if (!farmer) {    throw AppError.notFound('Farmer profile not found');  }  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: farmer.userId });  if (!user) {    throw AppError.notFound('User account not found');  }  if (user.status !== 'suspended') {    throw new AppError(409, 'INVALID_STATE', `Only suspended farmers can be reinstated (current: '${user.status}').`);  }  const prevUserStatus = user.status;  const prevListingEnabled = farmer.listingEnabled;  const now = new Date();  await db.collection(COLLECTIONS.USERS).updateOne(    { _id: user._id },    { $set: { status: 'active', updatedAt: now } }  );  await db.collection(COLLECTIONS.FARMERS).updateOne(    { _id: farmer._id },    { $set: { listingEnabled: true, updatedAt: now } }  );  await syncFarmerListed(farmer._id, true, { wasListingEnabled: prevListingEnabled, db });  await createNotification(    {      userId: user._id,      type: 'account',      title: 'Stall reinstated',      body: 'Your stall has been reinstated. Your listings are active again.',    },    db  );  await writeAudit(    adminActor,    'farmer.reinstate',    { type: 'farmer', id: farmer._id },    { previousStatus: prevUserStatus, stallName: farmer.stallName }  );  const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: user._id });  const updatedFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmer._id });  return toPersonSummary(updatedUser, updatedFarmer);}export async function deactivateCustomer(adminActor, customerId) {  const db = getDb();  const cid = toObjectId(customerId);  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: cid });  if (!user) {    throw AppError.notFound('Customer not found');  }  if (user.role === 'admin') {    throw new AppError(403, 'CANNOT_MODERATE_ADMIN', 'Cannot moderate an administrator.');  }  const now = new Date();  await db.collection(COLLECTIONS.USERS).updateOne(    { _id: cid },    { $set: { status: 'inactive', updatedAt: now } }  );  await revokeAllUserSessions(cid);  await writeAudit(    adminActor,    'customer.deactivate',    { type: 'customer', id: cid },    { customerName: user.name }  );  const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: cid });  return toPersonSummary(updatedUser);}export async function activateCustomer(adminActor, customerId) {  const db = getDb();  const cid = toObjectId(customerId);  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: cid });  if (!user) {    throw AppError.notFound('Customer not found');  }  if (user.role === 'admin') {    throw new AppError(403, 'CANNOT_MODERATE_ADMIN', 'Cannot moderate an administrator.');  }  const now = new Date();  await db.collection(COLLECTIONS.USERS).updateOne(    { _id: cid },    { $set: { status: 'active', updatedAt: now } }  );  await writeAudit(    adminActor,    'customer.activate',    { type: 'customer', id: cid },    { customerName: user.name }  );  const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: cid });  return toPersonSummary(updatedUser);}
=======
/**
 * Admin People management service layer.
 * Implements farmer approval, suspension, reinstatement, and rejection with state machine gating,
 * D3 sync propagation, session revocation, notifications, and compensation on failure.
 */

import { ObjectId } from 'mongodb';
import { getDb } from '../../../db/client.js';
import { COLLECTIONS } from '../../../db/collections.js';
import { toObjectId } from '../../../utils/ids.js';
import { AppError } from '../../../utils/errors.js';
import { syncFarmerListed } from '../../../utils/sync.js';
import { writeAudit } from '../../../utils/audit.js';
import { revokeAllUserSessions } from '../../auth/auth.service.js';
import { createNotification } from '../../notifications/notify.js';

/**
 * Transforms user and farmer records into an admin person summary DTO.
 *
 * @param {object} user
 * @param {object} [farmer]
 * @returns {object}
 */
export function toPersonSummary(user, farmer) {
  return {
    id: user._id.toString(),
    farmerId: farmer?._id ? farmer._id.toString() : undefined,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    status: user.status,
    stallName: farmer?.stallName,
    stallNumber: farmer?.stallNumber,
    listingEnabled: farmer?.listingEnabled,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
  };
}

/**
 * Lists farmers with status, search, and pagination.
 *
 * @param {object} [query={}]
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listFarmers(query = {}) {
  const db = getDb();
  const filter = { role: 'farmer' };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search && typeof query.search === 'string' && query.search.trim()) {
    const s = query.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
    ];
  }

  const limit = Math.min(100, Math.max(1, parseInt(query.limit || 20, 10)));

  const users = await db
    .collection(COLLECTIONS.USERS)
    .find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .toArray();

  const userIds = users.map((u) => u._id);
  const farmers = await db
    .collection(COLLECTIONS.FARMERS)
    .find({ userId: { $in: userIds } })
    .toArray();

  const farmerMap = new Map(farmers.map((f) => [f.userId.toString(), f]));

  return {
    data: users.map((u) => toPersonSummary(u, farmerMap.get(u._id.toString()))),
    meta: {
      nextCursor: null,
      count: users.length,
    },
  };
}

/**
 * Lists customers with status, search, and pagination.
 *
 * @param {object} [query={}]
 * @returns {Promise<{ data: Array<object>, meta: object }>}
 */
export async function listCustomers(query = {}) {
  const db = getDb();
  const filter = { role: 'customer' };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search && typeof query.search === 'string' && query.search.trim()) {
    const s = query.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
    ];
  }

  const limit = Math.min(100, Math.max(1, parseInt(query.limit || 20, 10)));

  const users = await db
    .collection(COLLECTIONS.USERS)
    .find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .toArray();

  return {
    data: users.map((u) => toPersonSummary(u)),
    meta: {
      nextCursor: null,
      count: users.length,
    },
  };
}

/**
 * Approves a pending or rejected farmer stall.
 *
 * @param {object} adminActor
 * @param {string|ObjectId} farmerIdOrUserId
 * @returns {Promise<object>}
 */
export async function approveFarmer(adminActor, farmerIdOrUserId) {
  const db = getDb();
  const targetId = toObjectId(farmerIdOrUserId);

  // Find farmer document by _id or userId
  let farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: targetId });
  if (!farmer) {
    farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: targetId });
  }

  if (!farmer) {
    throw AppError.notFound('Farmer profile not found');
  }

  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: farmer.userId });
  if (!user) {
    throw AppError.notFound('User account not found');
  }

  if (user.emailVerified === false) {
    throw new AppError(409, 'EMAIL_NOT_VERIFIED', 'Farmer email must be verified before approval.');
  }

  if (!['pending', 'rejected'].includes(user.status)) {
    throw new AppError(409, 'INVALID_STATE', `Farmer cannot be approved from status '${user.status}'.`);
  }

  const prevUserStatus = user.status;
  const prevListingEnabled = farmer.listingEnabled;
  const now = new Date();

  // Execution with compensation
  try {
    // 2. Update user status
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: user._id, status: prevUserStatus },
      { $set: { status: 'active', updatedAt: now } }
    );

    // 3. Update farmer profile
    await db.collection(COLLECTIONS.FARMERS).updateOne(
      { _id: farmer._id },
      { $set: { listingEnabled: true, isNew: true, updatedAt: now } }
    );

    // 4. Denormalisation sync
    await syncFarmerListed(farmer._id, true, { wasListingEnabled: prevListingEnabled, db });

    // 5. In-app notification & audit log
    await createNotification(
      {
        userId: user._id,
        type: 'account',
        title: 'Account approved',
        body: 'Your stall is approved. You can add products now.',
      },
      db
    );

    await writeAudit(
      adminActor,
      'farmer.approve',
      { type: 'farmer', id: farmer._id },
      { previousStatus: prevUserStatus, stallName: farmer.stallName }
    );

    const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: user._id });
    const updatedFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmer._id });
    return toPersonSummary(updatedUser, updatedFarmer);
  } catch (err) {
    // Compensation
    await db.collection(COLLECTIONS.USERS).updateOne({ _id: user._id }, { $set: { status: prevUserStatus } });
    await db.collection(COLLECTIONS.FARMERS).updateOne({ _id: farmer._id }, { $set: { listingEnabled: prevListingEnabled } });
    await syncFarmerListed(farmer._id, prevListingEnabled, { wasListingEnabled: true, db });
    throw err;
  }
}

/**
 * Rejects a pending farmer application.
 *
 * @param {object} adminActor
 * @param {string|ObjectId} farmerIdOrUserId
 * @param {string} reason
 * @returns {Promise<object>}
 */
export async function rejectFarmer(adminActor, farmerIdOrUserId, reason) {
  if (!reason || typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 200) {
    throw AppError.validation('Reason must be between 3 and 200 characters', { field: 'reason' });
  }

  const db = getDb();
  const targetId = toObjectId(farmerIdOrUserId);

  let farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: targetId });
  if (!farmer) {
    farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: targetId });
  }

  if (!farmer) {
    throw AppError.notFound('Farmer profile not found');
  }

  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: farmer.userId });
  if (!user) {
    throw AppError.notFound('User account not found');
  }

  if (user.status !== 'pending') {
    throw new AppError(409, 'INVALID_STATE', `Only pending farmers can be rejected (current: '${user.status}').`);
  }

  const prevUserStatus = user.status;
  const now = new Date();

  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: user._id },
    { $set: { status: 'rejected', updatedAt: now } }
  );

  await db.collection(COLLECTIONS.FARMERS).updateOne(
    { _id: farmer._id },
    { $set: { listingEnabled: false, updatedAt: now } }
  );

  await revokeAllUserSessions(user._id);
  await syncFarmerListed(farmer._id, false, { wasListingEnabled: prevListingEnabled, db });

  await createNotification(
    {
      userId: user._id,
      type: 'account',
      title: 'Stall application rejected',
      body: `Your stall application was not approved. Reason: ${reason.trim()}`,
    },
    db
  );

  await writeAudit(
    adminActor,
    'farmer.reject',
    { type: 'farmer', id: farmer._id },
    { reason: reason.trim(), previousStatus: prevUserStatus, stallName: farmer.stallName }
  );

  const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: user._id });
  const updatedFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmer._id });
  return toPersonSummary(updatedUser, updatedFarmer);
}

/**
 * Suspends an active farmer stall.
 *
 * @param {object} adminActor
 * @param {string|ObjectId} farmerIdOrUserId
 * @param {string} reason
 * @returns {Promise<object>}
 */
export async function suspendFarmer(adminActor, farmerIdOrUserId, reason) {
  if (!reason || typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 200) {
    throw AppError.validation('Reason must be between 3 and 200 characters', { field: 'reason' });
  }

  const db = getDb();
  const targetId = toObjectId(farmerIdOrUserId);

  let farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: targetId });
  if (!farmer) {
    farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: targetId });
  }

  if (!farmer) {
    throw AppError.notFound('Farmer profile not found');
  }

  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: farmer.userId });
  if (!user) {
    throw AppError.notFound('User account not found');
  }

  if (user.role === 'admin') {
    throw new AppError(403, 'CANNOT_MODERATE_ADMIN', 'Cannot suspend an administrator.');
  }

  if (user.status !== 'active') {
    throw new AppError(409, 'INVALID_STATE', `Only active farmers can be suspended (current: '${user.status}').`);
  }

  const prevUserStatus = user.status;
  const prevListingEnabled = farmer.listingEnabled;
  const now = new Date();

  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: user._id },
    { $set: { status: 'suspended', updatedAt: now } }
  );

  await db.collection(COLLECTIONS.FARMERS).updateOne(
    { _id: farmer._id },
    { $set: { listingEnabled: false, updatedAt: now } }
  );

  await revokeAllUserSessions(user._id);
  await syncFarmerListed(farmer._id, false, { wasListingEnabled: prevListingEnabled, db });

  await createNotification(
    {
      userId: user._id,
      type: 'account',
      title: 'Stall suspended',
      body: `Your stall has been suspended. Reason: ${reason.trim()}`,
    },
    db
  );

  await writeAudit(
    adminActor,
    'farmer.suspend',
    { type: 'farmer', id: farmer._id },
    { reason: reason.trim(), previousStatus: prevUserStatus, stallName: farmer.stallName }
  );

  const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: user._id });
  const updatedFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmer._id });
  return toPersonSummary(updatedUser, updatedFarmer);
}

/**
 * Reinstates a suspended farmer stall back to active.
 *
 * @param {object} adminActor
 * @param {string|ObjectId} farmerIdOrUserId
 * @returns {Promise<object>}
 */
export async function reinstateFarmer(adminActor, farmerIdOrUserId) {
  const db = getDb();
  const targetId = toObjectId(farmerIdOrUserId);

  let farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: targetId });
  if (!farmer) {
    farmer = await db.collection(COLLECTIONS.FARMERS).findOne({ userId: targetId });
  }

  if (!farmer) {
    throw AppError.notFound('Farmer profile not found');
  }

  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: farmer.userId });
  if (!user) {
    throw AppError.notFound('User account not found');
  }

  if (user.status !== 'suspended') {
    throw new AppError(409, 'INVALID_STATE', `Only suspended farmers can be reinstated (current: '${user.status}').`);
  }

  const prevUserStatus = user.status;
  const prevListingEnabled = farmer.listingEnabled;
  const now = new Date();

  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: user._id },
    { $set: { status: 'active', updatedAt: now } }
  );

  await db.collection(COLLECTIONS.FARMERS).updateOne(
    { _id: farmer._id },
    { $set: { listingEnabled: true, updatedAt: now } }
  );

  await syncFarmerListed(farmer._id, true, { wasListingEnabled: prevListingEnabled, db });

  await createNotification(
    {
      userId: user._id,
      type: 'account',
      title: 'Stall reinstated',
      body: 'Your stall has been reinstated. Your listings are active again.',
    },
    db
  );

  await writeAudit(
    adminActor,
    'farmer.reinstate',
    { type: 'farmer', id: farmer._id },
    { previousStatus: prevUserStatus, stallName: farmer.stallName }
  );

  const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: user._id });
  const updatedFarmer = await db.collection(COLLECTIONS.FARMERS).findOne({ _id: farmer._id });
  return toPersonSummary(updatedUser, updatedFarmer);
}

/**
 * Deactivates a customer account.
 *
 * @param {object} adminActor
 * @param {string|ObjectId} customerId
 * @returns {Promise<object>}
 */
export async function deactivateCustomer(adminActor, customerId) {
  const db = getDb();
  const cid = toObjectId(customerId);

  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: cid });
  if (!user) {
    throw AppError.notFound('Customer not found');
  }

  if (user.role === 'admin') {
    throw new AppError(403, 'CANNOT_MODERATE_ADMIN', 'Cannot moderate an administrator.');
  }

  const now = new Date();
  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: cid },
    { $set: { status: 'inactive', updatedAt: now } }
  );

  await revokeAllUserSessions(cid);

  await writeAudit(
    adminActor,
    'customer.deactivate',
    { type: 'customer', id: cid },
    { customerName: user.name }
  );

  const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: cid });
  return toPersonSummary(updatedUser);
}

/**
 * Activates an inactive customer account.
 *
 * @param {object} adminActor
 * @param {string|ObjectId} customerId
 * @returns {Promise<object>}
 */
export async function activateCustomer(adminActor, customerId) {
  const db = getDb();
  const cid = toObjectId(customerId);

  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: cid });
  if (!user) {
    throw AppError.notFound('Customer not found');
  }

  if (user.role === 'admin') {
    throw new AppError(403, 'CANNOT_MODERATE_ADMIN', 'Cannot moderate an administrator.');
  }

  const now = new Date();
  await db.collection(COLLECTIONS.USERS).updateOne(
    { _id: cid },
    { $set: { status: 'active', updatedAt: now } }
  );

  await writeAudit(
    adminActor,
    'customer.activate',
    { type: 'customer', id: cid },
    { customerName: user.name }
  );

  const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: cid });
  return toPersonSummary(updatedUser);
}
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
