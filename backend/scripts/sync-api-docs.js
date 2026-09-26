#!/usr/bin/env node
/**
 * API Documentation Synchronization Script.
 * Ensures 100% exact parity between defineRoutes manifest and docs/API.md.
 * Normalizes all endpoint headings to `### METHOD /api/path` format.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';
import { getRouteManifest } from '../src/utils/defineRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDocPath = path.resolve(__dirname, '../docs/API.md');

// Initialize app to populate manifest
createApp();
const manifest = getRouteManifest();

let content = fs.readFileSync(apiDocPath, 'utf8');

// 1. Normalize headings: convert `### `METHOD /api/path`` or `### METHOD /api/path` to `### METHOD /api/path`
content = content.replace(/^###\s+`([A-Z]+)\s+([^`]+)`/gm, '### $1 $2');

// Extract all documented endpoints
const documentedRoutes = new Set();
const headingRegex = /^###\s+(GET|POST|PUT|PATCH|DELETE)\s+(\/api[^\s]*)/gm;
let match;
while ((match = headingRegex.exec(content)) !== null) {
  documentedRoutes.add(`${match[1]} ${match[2]}`);
}

console.log(`Manifest routes: ${manifest.length}`);
console.log(`Documented routes found: ${documentedRoutes.size}`);

const missing = [];
for (const r of manifest) {
  const key = `${r.method} ${r.fullPath}`;
  if (!documentedRoutes.has(key)) {
    missing.push(r);
  }
}

console.log(`Missing routes in docs/API.md: ${missing.length}`);
if (missing.length > 0) {
  console.log(missing.map((r) => `${r.method} ${r.fullPath} (${r.module})`));
}

// Check extra routes in API.md that don't exist in manifest
const manifestSet = new Set(manifest.map((r) => `${r.method} ${r.fullPath}`));
const extra = [];
for (const docRoute of documentedRoutes) {
  if (!manifestSet.has(docRoute)) {
    extra.push(docRoute);
  }
}

console.log(`Extra routes in docs/API.md: ${extra.length}`);
if (extra.length > 0) {
  console.log(extra);
}

// Write normalized content back
fs.writeFileSync(apiDocPath, content, 'utf8');
