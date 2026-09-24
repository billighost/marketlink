/**
 * MongoDB connection layer (pooled, singleton).
 * Manages MongoClient lifecycle, connection pooling, and graceful disconnection.
 */

import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';

let client = null;
let db = null;

/**
 * Connects to MongoDB with connection pooling.
 *
 * @param {string} [customUri]
 * @param {string} [customDbName]
 * @returns {Promise<import('mongodb').Db>}
 */
export async function connectDb(customUri, customDbName) {
  if (db) {
    return db;
  }

  const uri = customUri || env.MONGODB_URI;
  const dbName = customDbName || env.DB_NAME;

  client = new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    retryWrites: true,
  });

  await client.connect();
  db = client.db(dbName);
  return db;
}

/**
 * Returns the active MongoDB database instance.
 * Throws if connectDb has not yet been called.
 *
 * @returns {import('mongodb').Db}
 */
export function getDb() {
  if (!db) {
    throw new Error('Database is not connected. Call connectDb() before calling getDb().');
  }
  return db;
}

/**
 * Returns the underlying MongoClient instance.
 *
 * @returns {import('mongodb').MongoClient|null}
 */
export function getClient() {
  return client;
}

/**
 * Gracefully closes the MongoDB client connection.
 *
 * @param {boolean} [force=false]
 * @returns {Promise<void>}
 */
export async function closeDb(force = false) {
  if (client) {
    await client.close(force);
    client = null;
    db = null;
  }
}
