/**
 * Pseudo-random sampler for catalog items based on deterministic mulberry32 PRNG.
 * Uses index-backed range queries on { listed: 1, rnd: 1 } or { listingEnabled: 1, rnd: 1 }.
 * No $sample, no collection scan.
 */

import { ObjectId } from 'mongodb';

/**
 * Creates a deterministic Mulberry32 32-bit PRNG generator.
 *
 * @param {number} seed - 32-bit unsigned integer seed
 * @returns {() => number} Returns float in [0, 1)
 */
export function createMulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Walks a collection pseudo-randomly using the indexed `rnd` field.
 * Starts at `start = mulberry32(seed + batch * 7919)()` and wraps around if needed.
 *
 * @param {import('mongodb').Db} db
 * @param {string} collectionName
 * @param {object} baseFilter
 * @param {object} options
 * @param {number} options.seed
 * @param {number} options.batch
 * @param {number} options.count
 * @param {object} [options.projection]
 * @param {Array<string|ObjectId>} [options.exclude=[]]
 * @returns {Promise<Array<object>>}
 */
export async function walkRandom(
  db,
  collectionName,
  baseFilter,
  { seed, batch, count, projection, exclude = [] }
) {
  const prng = createMulberry32(seed + batch * 7919);
  const start = prng();

  const excludeObjIds = exclude
    .map((id) => {
      try {
        return typeof id === 'string' ? new ObjectId(id) : id;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const filter = { ...baseFilter };
  if (excludeObjIds.length > 0) {
    filter._id = { $nin: excludeObjIds };
  }

  // 1. First segment: rnd >= start
  const first = await db
    .collection(collectionName)
    .find(
      { ...filter, rnd: { $gte: start } },
      projection ? { projection } : {}
    )
    .sort({ rnd: 1 })
    .limit(count)
    .toArray();

  if (first.length >= count) {
    return first;
  }

  // 2. Second segment: wrap around with rnd < start
  const firstIds = first.map((d) => d._id);
  const allExcluded = excludeObjIds.concat(firstIds);
  const remainingNeeded = count - first.length;

  const second = await db
    .collection(collectionName)
    .find(
      { ...baseFilter, _id: { $nin: allExcluded }, rnd: { $lt: start } },
      projection ? { projection } : {}
    )
    .sort({ rnd: 1 })
    .limit(remainingNeeded)
    .toArray();

  return [...first, ...second];
}
