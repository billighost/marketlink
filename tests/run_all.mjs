import { runGuestSuite } from './01_guest.mjs';
import { runAuthSuite } from './02_auth.mjs';
import { runCustomerSuite } from './03_customer.mjs';
import { runLayoutSuite } from './04_layout.mjs';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       MARKETLINK STAGE 6 HEADLESS PLAYWRIGHT SUITE           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();
  const summary = {};

  try {
    console.log('Starting Test Suite 1: Guest Pages & Public API...');
    const guestRes = await runGuestSuite();
    summary.guest = guestRes;

    console.log('\nStarting Test Suite 2: Authentication Flows...');
    const authRes = await runAuthSuite();
    summary.auth = authRes;

    console.log('\nStarting Test Suite 3: Customer App End-to-End...');
    const customerRes = await runCustomerSuite();
    summary.customer = customerRes;

    console.log('\nStarting Test Suite 4: Layout & Responsiveness...');
    const layoutRes = await runLayoutSuite();
    summary.layout = layoutRes;

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    const allPassed = summary.guest.passed && summary.auth.passed && summary.customer.passed;

    console.log('\n===============================================================');
    console.log('📊 FINAL STAGE 6 VERIFICATION SUMMARY');
    console.log('===============================================================');
    console.log(`Suite 1 (Guest Pages & Leaflet Maps): ${summary.guest.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Suite 2 (Authentication & Sessions):  ${summary.auth.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Suite 3 (Customer App End-to-End):    ${summary.customer.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Suite 4 (Layout & Responsiveness):    ${summary.layout.passed ? '✅ PASS (0 findings)' : `⚠️ ${summary.layout.totalIssues} findings`}`);
    console.log(`Total Execution Time: ${totalDuration}s`);
    console.log('===============================================================');

    if (!allPassed) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Test Runner Failure:', err);
    process.exit(1);
  }
}

main();
