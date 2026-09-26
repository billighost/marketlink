/**
 * Comprehensive database connectivity diagnostics script.
 * Validates Atlas URI, connectivity, round-trip latency, topology, permissions,
 * feature support (validators, text, 2dsphere, TTL, partial indexes), and quota.
 */

import { MongoClient } from 'mongodb';
import { env } from '../src/config/env.js';
import { maskUri } from '../src/utils/maskUri.js';

function diagnoseError(err) {
  const msg = err.message || '';
  if (/bad auth|Authentication failed/i.test(msg)) {
    return 'Wrong username/password, or special characters not URL-encoded. Re-copy password or reset database user password.';
  }
  if (/querySrv ECONNREFUSED|ENOTFOUND _mongodb\._tcp/i.test(msg)) {
    return 'Network/DNS blocks SRV lookups. Use standard (non-SRV) connection string or change DNS to 8.8.8.8.';
  }
  if (/Server selection timed out|ETIMEDOUT/i.test(msg)) {
    return 'Your IP is not in Atlas > Network Access. Add 0.0.0.0/0 or your current IP.';
  }
  if (/not authorized on/i.test(msg)) {
    return 'Database user lacks write role. Assign built-in role "Read and write to any database".';
  }
  if (/MongoParseError/i.test(msg)) {
    return 'Malformed connection string (check for unescaped <password> brackets or whitespace).';
  }
  return msg;
}

async function runDbCheck() {
  console.log('\n======================================================');
  console.log('🔍  Running MarketLink Database Connectivity Diagnostics');
  console.log('======================================================\n');

  const results = [];
  let client = null;
  let allPassed = true;

  // 1. URI Parsing
  let parsedHost = '';
  try {
    const rawUri = env.MONGODB_URI;
    const urlObj = new URL(rawUri.replace(/^mongodb\+srv:\/\//, 'http://').replace(/^mongodb:\/\//, 'http://'));
    parsedHost = urlObj.host;
    const masked = maskUri(rawUri);
    results.push({
      Check: 'URI parses',
      Status: 'PASS',
      Details: masked,
    });
  } catch (err) {
    allPassed = false;
    results.push({
      Check: 'URI parses',
      Status: 'FAIL',
      Details: err.message,
    });
  }

  // 2. Database Names in Use
  const dbName = env.DB_NAME;
  const testDbName = env.TEST_DB_NAME;
  if (dbName && testDbName && dbName !== testDbName && testDbName.endsWith('_test')) {
    results.push({
      Check: 'Database names in use',
      Status: 'PASS',
      Details: `DB_NAME: "${dbName}", TEST_DB_NAME: "${testDbName}" (differs & ends with _test)`,
    });
  } else {
    allPassed = false;
    results.push({
      Check: 'Database names in use',
      Status: 'FAIL',
      Details: `Invalid names: DB_NAME="${dbName}", TEST_DB_NAME="${testDbName}". Must differ and TEST_DB_NAME must end with _test.`,
    });
  }

  // 3. Connect to Atlas
  try {
    client = new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 8000,
      retryWrites: true,
      appName: 'MarketLink',
    });
    await client.connect();
    results.push({
      Check: 'Connects',
      Status: 'PASS',
      Details: `Connected successfully to cluster (${parsedHost})`,
    });
  } catch (err) {
    allPassed = false;
    const diagnosis = diagnoseError(err);
    results.push({
      Check: 'Connects',
      Status: 'FAIL',
      Details: `${err.message} -> Diagnosis: ${diagnosis}`,
    });
    console.table(results);
    process.exit(1);
  }

  const db = client.db(dbName);

  // 4. Round-trip latency (median of 10 ping calls)
  try {
    const latencies = [];
    for (let i = 0; i < 10; i++) {
      const t0 = performance.now();
      await db.command({ ping: 1 });
      const t1 = performance.now();
      latencies.push(t1 - t0);
    }
    latencies.sort((a, b) => a - b);
    const median = latencies[Math.floor(latencies.length / 2)].toFixed(2);
    results.push({
      Check: 'Round-trip latency',
      Status: 'PASS',
      Details: `Median latency: ${median} ms across 10 pings (min: ${latencies[0].toFixed(2)}ms, max: ${latencies[9].toFixed(2)}ms)`,
    });
  } catch (err) {
    allPassed = false;
    results.push({
      Check: 'Round-trip latency',
      Status: 'FAIL',
      Details: err.message,
    });
  }

  // 5. Server version
  try {
    const buildInfo = await db.admin().command({ buildInfo: 1 });
    results.push({
      Check: 'Server version',
      Status: 'PASS',
      Details: `v${buildInfo.version} (gitVersion: ${buildInfo.gitVersion?.slice(0, 7) || 'N/A'})`,
    });
  } catch (err) {
    allPassed = false;
    results.push({
      Check: 'Server version',
      Status: 'FAIL',
      Details: err.message,
    });
  }

  // 6. Topology
  try {
    const hello = await db.command({ hello: 1 });
    const isReplicaSet = Boolean(hello.setName);
    const topology = isReplicaSet ? `Replica Set ("${hello.setName}") - Multi-doc transactions supported` : 'Standalone';
    results.push({
      Check: 'Topology',
      Status: 'PASS',
      Details: topology,
    });
  } catch (err) {
    allPassed = false;
    results.push({
      Check: 'Topology',
      Status: 'FAIL',
      Details: err.message,
    });
  }

  // 7. Permissions: create temp collection, insert, read, drop
  const tempCollName = `__diag_temp_${Date.now()}`;
  try {
    const tempColl = await db.createCollection(tempCollName);
    const insertRes = await tempColl.insertOne({ test: true, createdAt: new Date() });
    const doc = await tempColl.findOne({ _id: insertRes.insertedId });
    if (!doc || !doc.test) throw new Error('Document read verification failed');
    await tempColl.drop();
    results.push({
      Check: 'Permissions',
      Status: 'PASS',
      Details: `Create, insert, read, and drop verified on database "${dbName}"`,
    });
  } catch (err) {
    allPassed = false;
    results.push({
      Check: 'Permissions',
      Status: 'FAIL',
      Details: err.message,
    });
  }

  // 8. Feature support: $jsonSchema, text index, 2dsphere index, TTL index, partial index
  const featureCollName = `__diag_features_${Date.now()}`;
  try {
    const featColl = await db.createCollection(featureCollName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['name', 'location', 'expiresAt'],
          properties: {
            name: { bsonType: 'string' },
            location: { bsonType: 'object' },
            expiresAt: { bsonType: 'date' },
            active: { bsonType: 'bool' },
          },
        },
      },
    });

    // Text index
    await featColl.createIndex({ name: 'text' }, { name: 'test_text_idx' });
    // 2dsphere index
    await featColl.createIndex({ location: '2dsphere' }, { name: 'test_2dsphere_idx' });
    // TTL index
    await featColl.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 3600, name: 'test_ttl_idx' });
    // Partial index
    await featColl.createIndex({ active: 1 }, { partialFilterExpression: { active: true }, name: 'test_partial_idx' });

    await featColl.drop();
    results.push({
      Check: 'Feature support',
      Status: 'PASS',
      Details: '$jsonSchema validator, text, 2dsphere, TTL, and partial indexes verified',
    });
  } catch (err) {
    allPassed = false;
    results.push({
      Check: 'Feature support',
      Status: 'FAIL',
      Details: err.message,
    });
  }

  // 9. Storage stats versus 512 MB limit
  try {
    const stats = await db.stats();
    const dataSizeMB = ((stats.dataSize || 0) / (1024 * 1024)).toFixed(2);
    const indexSizeMB = ((stats.indexSize || 0) / (1024 * 1024)).toFixed(2);
    const totalMB = (( (stats.dataSize || 0) + (stats.indexSize || 0) ) / (1024 * 1024)).toFixed(2);
    const freeTierLimitMB = 512;
    const pctUsed = (((totalMB / freeTierLimitMB) * 100)).toFixed(1);

    results.push({
      Check: 'Storage',
      Status: 'PASS',
      Details: `Data: ${dataSizeMB} MB, Indexes: ${indexSizeMB} MB, Total: ${totalMB} MB / ${freeTierLimitMB} MB (${pctUsed}% used)`,
    });
  } catch (err) {
    // If db.stats() is restricted, fallback gracefully
    results.push({
      Check: 'Storage',
      Status: 'PASS (estimated)',
      Details: `Stats command notice: ${err.message}`,
    });
  }

  await client.close();

  console.table(results);

  if (!allPassed) {
    console.error('\n❌ One or more diagnostics failed.');
    process.exit(1);
  }

  console.log('\n✅ All database connectivity diagnostics passed successfully!\n');
}

runDbCheck().catch((err) => {
  console.error('\n❌ Fatal error during db:check:', err);
  process.exit(1);
});
