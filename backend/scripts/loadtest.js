#!/usr/bin/env node
/**
 * Standalone High-Throughput Load Testing Generator.
 * Zero external packages: built using Node.js native http.Agent with HTTP keep-alive.
 *
 * Usage:
 *   node scripts/loadtest.js                                # Runs all scenarios with default 50 workers, 10s per scenario
 *   node scripts/loadtest.js --concurrency 25 --duration 5  # Quick smoke benchmark
 *   node scripts/loadtest.js --scenario mixed               # Run specific scenario
 *   node scripts/loadtest.js --json                         # Machine-readable output
 */

import http from 'node:http';
import { URL } from 'node:url';

// Parse command line arguments
const args = process.argv.slice(2);
function getArg(flag, defaultVal) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }
  return defaultVal;
}

const CONCURRENCY = parseInt(getArg('--concurrency', '20'), 10);
const DURATION_SEC = parseInt(getArg('--duration', '10'), 10);
const TARGET_SCENARIO = getArg('--scenario', 'all');
const BASE_URL = getArg('--url', process.env.BASE_URL || 'http://localhost:4000/api');
const IS_JSON = args.includes('--json');

// High performance HTTP Agent with Keep-Alive
const agent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: CONCURRENCY * 2,
  maxFreeSockets: CONCURRENCY,
  timeout: 10000,
});

/**
 * Executes an HTTP request with keep-alive agent and measures exact latency.
 */
function makeRequest(urlStr, options = {}) {
  return new Promise((resolve) => {
    const url = new URL(urlStr);
    const start = process.hrtime.bigint();

    const reqOpts = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        Connection: 'keep-alive',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      agent,
    };

    if (options.body) {
      reqOpts.headers['Content-Type'] = 'application/json';
      reqOpts.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = http.request(reqOpts, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const latencyMs = Number(end - start) / 1_000_000;
        resolve({
          status: res.statusCode,
          latencyMs,
          body: data,
          ok: res.statusCode >= 200 && res.statusCode < 400,
        });
      });
    });

    req.on('error', (err) => {
      const end = process.hrtime.bigint();
      const latencyMs = Number(end - start) / 1_000_000;
      resolve({
        status: 0,
        latencyMs,
        error: err.message,
        ok: false,
      });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Obtains authentication tokens for Customer, Farmer, and Admin roles.
 */
async function authenticateUsers() {
  const logins = [
    { email: 'george@example.com', pass: 'market123', role: 'customer' },
    { email: 'riverbend@example.com', pass: 'market123', role: 'farmer' },
    { email: 'admin@marketlink.test', pass: 'Admin12345', role: 'admin' },
  ];

  const tokens = {};

  for (const item of logins) {
    const res = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: item.email, password: item.pass }),
    });

    if (res.ok) {
      try {
        const json = JSON.parse(res.body);
        tokens[item.role] = json.data.accessToken;
      } catch {
        tokens[item.role] = null;
      }
    }
  }

  return tokens;
}

/**
 * Computes statistics (rps, p50, p95, p99, error rate) from latency array.
 */
function computeStats(latencies, errors, durationSec) {
  if (latencies.length === 0) {
    return { count: 0, rps: 0, p50: 0, p95: 0, p99: 0, errorRate: 100 };
  }

  latencies.sort((a, b) => a - b);
  const total = latencies.length + errors;
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = Number((latencies.length / durationSec).toFixed(1));
  const errorRate = Number(((errors / (total || 1)) * 100).toFixed(2));

  return {
    totalRequests: total,
    successful: latencies.length,
    rps,
    p50: Number(p50.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    p99: Number(p99.toFixed(2)),
    errorRate,
  };
}

/**
 * Runs a single load test scenario under configured concurrency and duration.
 */
async function runScenario(name, targetFn, durationSec, concurrency) {
  const latencies = [];
  let errors = 0;
  let activeWorkers = 0;
  let isRunning = true;

  const deadline = Date.now() + durationSec * 1000;

  async function worker() {
    activeWorkers++;
    while (isRunning && Date.now() < deadline) {
      try {
        const res = await targetFn();
        if (res && res.ok) {
          latencies.push(res.latencyMs);
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }
    activeWorkers--;
  }

  // Spawn concurrency workers
  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(worker());
  }

  await Promise.all(promises);
  isRunning = false;

  return computeStats(latencies, errors, durationSec);
}

// Main execution
async function main() {
  if (!IS_JSON) {
    console.log('\n========================================================================================');
    console.log(`⚡ MarketLink Load Test Benchmark [${BASE_URL}]`);
    console.log(`   Workers: ${CONCURRENCY} | Duration per scenario: ${DURATION_SEC}s | Scenario: ${TARGET_SCENARIO}`);
    console.log('========================================================================================\n');
    console.log('⏳ Authenticating test roles...');
  }

  const tokens = await authenticateUsers();
  const customerHeader = tokens.customer ? { Authorization: `Bearer ${tokens.customer}` } : {};
  const farmerHeader = tokens.farmer ? { Authorization: `Bearer ${tokens.farmer}` } : {};
  const adminHeader = tokens.admin ? { Authorization: `Bearer ${tokens.admin}` } : {};

  // Fetch sample product ID and farmer ID for parameterized scenarios
  let sampleProductId = '6ab5e73959453417a34133c0';
  let sampleFarmerId = '6ab5e73759453417a3413387';

  try {
    const prodRes = await makeRequest(`${BASE_URL}/products?limit=1`, { headers: customerHeader });
    if (prodRes.ok) {
      const pJson = JSON.parse(prodRes.body);
      if (pJson.data && pJson.data[0]) {
        sampleProductId = pJson.data[0].id;
        sampleFarmerId = pJson.data[0].farmerId || sampleFarmerId;
      }
    }
  } catch {}

  const scenarios = {
    // 1. Catalog reads
    'products_list': () => makeRequest(`${BASE_URL}/products?limit=20&sort=popular`, { headers: customerHeader }),
    'products_search': () => makeRequest(`${BASE_URL}/products?q=tom`, { headers: customerHeader }),
    'product_detail': () => makeRequest(`${BASE_URL}/products/${sampleProductId}`, { headers: customerHeader }),
    'farmers_list': () => makeRequest(`${BASE_URL}/farmers?sort=rating`, { headers: customerHeader }),
    'markets_geo': () => makeRequest(`${BASE_URL}/markets?lat=40.735&lng=-74.172&radiusKm=25`, { headers: customerHeader }),
    'search_suggestions': () => makeRequest(`${BASE_URL}/search/suggestions?q=to`, { headers: customerHeader }),
    'feed_batch': () => makeRequest(`${BASE_URL}/feed`, { headers: customerHeader }),
    'orders_list': () => makeRequest(`${BASE_URL}/orders?tab=active&limit=10`, { headers: customerHeader }),
    'cart_quote': () =>
      makeRequest(`${BASE_URL}/cart/quote`, {
        method: 'POST',
        headers: customerHeader,
        body: JSON.stringify({
          groups: [
            {
              farmerId: sampleFarmerId,
              items: [{ productId: sampleProductId, quantity: 1 }],
            },
          ],
        }),
      }),
    'farmer_orders': () => makeRequest(`${BASE_URL}/farmer/orders?tab=today`, { headers: farmerHeader }),
    'farmer_insights': () => makeRequest(`${BASE_URL}/farmer/insights?range=30d`, { headers: farmerHeader }),
    'admin_overview': () => makeRequest(`${BASE_URL}/admin/overview`, { headers: adminHeader }),
    'admin_reports': () => makeRequest(`${BASE_URL}/admin/reports/summary?range=30d`, { headers: adminHeader }),
    'auth_login': () =>
      makeRequest(`${BASE_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'george@example.com', password: 'market123' }),
      }),
    // Mixed scenario: 70% reads, 20% quotes, 10% auth
    'mixed': () => {
      const r = Math.random();
      if (r < 0.35) return makeRequest(`${BASE_URL}/products?limit=20`, { headers: customerHeader });
      if (r < 0.55) return makeRequest(`${BASE_URL}/feed`, { headers: customerHeader });
      if (r < 0.70) return makeRequest(`${BASE_URL}/search/suggestions?q=to`, { headers: customerHeader });
      if (r < 0.90) {
        return makeRequest(`${BASE_URL}/cart/quote`, {
          method: 'POST',
          headers: customerHeader,
          body: JSON.stringify({ groups: [] }),
        });
      }
      return makeRequest(`${BASE_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'george@example.com', password: 'market123' }),
      });
    },
  };

  const results = {};
  const activeScenarios =
    TARGET_SCENARIO === 'all'
      ? Object.keys(scenarios)
      : scenarios[TARGET_SCENARIO]
      ? [TARGET_SCENARIO]
      : ['mixed'];

  for (const name of activeScenarios) {
    if (!IS_JSON) process.stdout.write(`  Running scenario: [${name.padEnd(20)}] ... `);
    const stats = await runScenario(name, scenarios[name], DURATION_SEC, CONCURRENCY);
    results[name] = stats;
    if (!IS_JSON) {
      console.log(`RPS: ${String(stats.rps).padStart(6)} | p50: ${String(stats.p50).padStart(6)}ms | p95: ${String(stats.p95).padStart(6)}ms | p99: ${String(stats.p99).padStart(6)}ms | Err: ${stats.errorRate}%`);
    }
  }

  if (IS_JSON) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('\n========================================================================================');
    console.log('📊 Load Test Summary Table:');
    console.log('========================================================================================');
    const tableData = Object.entries(results).map(([sc, st]) => ({
      Scenario: sc,
      RPS: st.rps,
      'p50 (ms)': st.p50,
      'p95 (ms)': st.p95,
      'p99 (ms)': st.p99,
      'Error %': `${st.errorRate}%`,
    }));
    console.table(tableData);
    console.log('');
  }

  agent.destroy();
}

main().catch((err) => {
  console.error('Fatal load test error:', err);
  process.exit(1);
});
