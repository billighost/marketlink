#!/usr/bin/env node
/**
 * Route Inventory Script.
 * Introspects declarative route manifest registered across all modules.
 * Usage:
 *   node scripts/routes.js         # Prints human-readable table
 *   node scripts/routes.js --json  # Outputs machine-readable JSON array
 */

import { createApp } from '../src/app.js';
import { getRouteManifest } from '../src/utils/defineRoutes.js';

// Instantiate app to trigger route registration across all routers
createApp();

const manifest = getRouteManifest();

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(manifest, null, 2));
  process.exit(0);
}

console.log('\n========================================================================================');
console.log(`📋  MarketLink API Route Inventory (${manifest.length} registered routes)`);
console.log('========================================================================================\n');

// Format as clean columns
const rows = manifest.map((r) => ({
  Method: r.method,
  Path: r.fullPath,
  Auth: r.auth,
  Roles: r.roles.join(', ') || '-',
  Limiter: r.limiter,
  Module: r.module,
  Summary: r.summary,
}));

console.table(rows);
console.log(`Total Routes: ${manifest.length}\n`);
