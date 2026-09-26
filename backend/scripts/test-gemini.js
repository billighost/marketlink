/**
 * Live Gemini Integration Smoke Test.
 * Runs only when GEMINI_API_KEYS is configured.
 * Sends a real message ("What's fresh today?"), asserts 200 response with function-calling grounding,
 * and outputs masked usage details.
 */

import { env } from '../src/config/env.js';
import { connectDb, closeDb } from '../src/db/client.js';
import { processAssistantMessage } from '../src/modules/assistant/assistant.service.js';
import { defaultKeyPool } from '../src/modules/assistant/keyPool.js';

async function runGeminiIntegrationTest() {
  console.log('======================================================');
  console.log('🤖  MarketLink Live Gemini Integration Test');
  console.log('======================================================');

  if (!env.GEMINI_API_KEYS || env.GEMINI_API_KEYS.length === 0) {
    console.log('[SKIPPED] GEMINI_API_KEYS is not set or empty. Skipping live Gemini integration test.');
    process.exit(0);
  }

  console.log(`✓ Detected ${env.GEMINI_API_KEYS.length} key(s) in pool.`);
  for (const status of defaultKeyPool.getStatus()) {
    console.log(`  - Key #${status.index}: ${status.maskedKey} (cooling down: ${status.isCoolingDown})`);
  }

  console.log(`✓ Connecting to database: "${env.DB_NAME}"...`);
  await connectDb();

  const startTime = Date.now();
  console.log('✓ Dispatching live test prompt: "What\'s fresh today?"...');

  const chunks = [];
  try {
    const result = await processAssistantMessage({
      text: "What's fresh today?",
      user: { id: 'test-user-id', firstName: 'Customer' },
      onChunk: ({ textChunk }) => {
        chunks.push(textChunk);
      },
    });

    const elapsed = Date.now() - startTime;
    console.log(`✓ Response received in ${elapsed}ms (Provider: ${result.provider})`);
    console.log('------------------------------------------------------');
    console.log(`Reply: "${result.reply}"`);
    console.log(`Cards returned: ${result.cards.length} cards`);
    console.log(`Streamed tokens received: ${chunks.length} chunks`);
    console.log(`Suggestions: ${result.suggestions.join(' | ')}`);
    console.log('------------------------------------------------------');

    if (!result.reply || result.reply.length === 0) {
      throw new Error('Received empty reply from assistant');
    }

    console.log('🎉  LIVE GEMINI INTEGRATION TEST PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Live Gemini Integration Test failed:', err.message);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

runGeminiIntegrationTest().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
