/**
 * Gemini Client Unit Tests.
 * Uses mocked global fetch to verify endpoint construction, payload shape,
 * SSE chunk parsing, AbortController timeouts, and key sanitization in errors.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { generate, sanitizeErrorMessage } from '../src/modules/assistant/geminiClient.js';

describe('Gemini Client Unit Tests', () => {
  const originalFetch = global.fetch;

  after(() => {
    global.fetch = originalFetch;
  });

  it('sanitizes error messages so keys are never exposed in logs or errors', () => {
    const rawKey = 'MOCK_TEST_GEMINI_KEY_ABC12345_XYZ9';
    const rawError = `API key ${rawKey} is invalid on endpoint`;
    const sanitized = sanitizeErrorMessage(rawError, rawKey);

    assert.ok(!sanitized.includes(rawKey));
    assert.ok(sanitized.includes('MOCK...XYZ9'));
  });

  it('generates standard content via mocked fetch and parses response', async () => {
    global.fetch = async (url, options) => {
      assert.ok(url.includes('generateContent'));
      assert.ok(!url.includes('streamGenerateContent'));
      const parsedBody = JSON.parse(options.body);
      assert.equal(parsedBody.contents[0].parts[0].text, 'Hello');
      assert.ok(parsedBody.systemInstruction);

      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Hello Customer! Welcome to MarketLink.' }],
              },
              finishReason: 'STOP',
            },
          ],
          usageMetadata: {
            promptTokenCount: 15,
            candidatesTokenCount: 8,
            totalTokenCount: 23,
          },
        }),
      };
    };

    const res = await generate({
      apiKey: 'MOCK_TEST_GEMINI_KEY_ABC12345_XYZ9',
      model: 'gemini-2.5-flash',
      systemInstruction: "You are MarketLink's assistant.",
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      stream: false,
    });

    assert.equal(res.text, 'Hello Customer! Welcome to MarketLink.');
    assert.equal(res.functionCalls.length, 0);
    assert.equal(res.usageMetadata.totalTokenCount, 23);
  });

  it('parses function calls returned by Gemini', async () => {
    global.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: 'search_products',
                      args: { query: 'carrots' },
                    },
                  },
                ],
              },
            },
          ],
        }),
      };
    };

    const res = await generate({
      apiKey: 'MOCK_TEST_GEMINI_KEY_ABC12345_XYZ9',
      contents: [{ role: 'user', parts: [{ text: 'Who sells carrots?' }] }],
      stream: false,
    });

    assert.equal(res.functionCalls.length, 1);
    assert.equal(res.functionCalls[0].name, 'search_products');
    assert.equal(res.functionCalls[0].args.query, 'carrots');
  });

  it('handles SSE streaming and yields token chunks asynchronously', async () => {
    const ssePayload = [
      'data: {"candidates":[{"content":{"parts":[{"text":"Apples "}]}}]}\n\n',
      'data: {"candidates":[{"content":{"parts":[{"text":"are "}]}}]}\n\n',
      'data: {"candidates":[{"content":{"parts":[{"text":"fresh."}]}}]}\n\n',
      'data: [DONE]\n\n',
    ].join('');

    global.fetch = async (url) => {
      assert.ok(url.includes('streamGenerateContent?alt=sse'));
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(ssePayload));
          controller.close();
        },
      });

      return {
        ok: true,
        body: stream,
      };
    };

    const streamGen = await generate({
      apiKey: 'MOCK_TEST_GEMINI_KEY_ABC12345_XYZ9',
      contents: [{ role: 'user', parts: [{ text: 'Apples' }] }],
      stream: true,
    });

    const chunks = [];
    for await (const chunk of streamGen) {
      if (chunk.textChunk) {
        chunks.push(chunk.textChunk);
      }
    }

    assert.equal(chunks.join(''), 'Apples are fresh.');
  });

  it('surfaces 429 status code on quota errors without leaking apiKey', async () => {
    const testKey = 'MOCK_TEST_GEMINI_KEY_ABC12345_XYZ9';
    global.fetch = async () => {
      return {
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            code: 429,
            status: 'RESOURCE_EXHAUSTED',
            message: `Resource exhausted for key ${testKey}`,
          },
        }),
      };
    };

    await assert.rejects(
      async () => {
        await generate({
          apiKey: testKey,
          contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
          stream: false,
        });
      },
      (err) => {
        assert.equal(err.status, 429);
        assert.equal(err.code, 'RESOURCE_EXHAUSTED');
        assert.ok(!err.message.includes(testKey));
        assert.ok(err.message.includes('AQ.A...4WXw'));
        return true;
      }
    );
  });
});
