/**
 * MarketLink Assistant Service Layer.
 * Powered by Google Gemini with multi-key rotation, function-calling grounding against DB records,
 * SSE streaming support, and transparent fallback to deterministic rule-based matching.
 */

import { env } from '../../config/env.js';
import { extractEntities } from './entities.js';
import { matchAndResolveIntent } from './intents.js';
import { defaultKeyPool, callWithKeyRotation } from './keyPool.js';
import { generate } from './geminiClient.js';
import { ASSISTANT_TOOL_DECLARATIONS, executeTool } from './tools.js';

export const SYSTEM_INSTRUCTION =
  "You are MarketLink's assistant. Answer only using the tools provided — never invent prices, stock, farmer names, hours, or order details. If a tool returns nothing relevant, say you don't have that information and suggest browsing. Keep replies to 1–3 short, warm sentences, sentence case, no markdown headers, no emoji. Always say 'Customer' and 'Farmer', never 'buyer'/'vendor'. Never discuss anything unrelated to MarketLink (no general chit-chat beyond a brief greeting), and refuse politely if asked to do something outside shopping at MarketLink (e.g. write code, discuss other topics) with: 'I can only help with MarketLink — markets, farmers, products and your orders.'";

const DEFAULT_SUGGESTIONS = [
  'When is Elm Street Market open?',
  'Who sells eggs?',
  "What's fresh on Saturday?",
];

/**
 * Builds Gemini-compliant contents array from recent chat history and user text.
 * Trims to last 4 turns to conserve tokens and reduce latency.
 *
 * @param {string} text - User query
 * @param {Array<object>} [history=[]] - Previous conversation messages
 * @returns {Array<object>}
 */
export function buildGeminiContents(text, history = []) {
  const contents = [];
  const recentHistory = Array.isArray(history) ? history.slice(-4) : [];

  for (const turn of recentHistory) {
    const role = turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user';
    const contentText = turn.content || turn.text || '';
    if (contentText.trim()) {
      contents.push({
        role,
        parts: [{ text: contentText.trim() }],
      });
    }
  }

  // Current user turn
  contents.push({
    role: 'user',
    parts: [{ text: text.trim() }],
  });

  return contents;
}

/**
 * Processes an assistant message with grounding and streaming support.
 *
 * @param {object} params
 * @param {string} params.text - Customer query
 * @param {Array<object>} [params.history=[]] - Conversation history
 * @param {object} [params.user] - Authenticated user context
 * @param {function} [params.onChunk] - Optional callback for streaming tokens: ({ textChunk }) => void
 * @param {AbortSignal} [params.signal] - Optional cancellation signal
 * @param {KeyPool} [params.keyPool] - Optional custom key pool for testing
 * @returns {Promise<{ reply: string, cards: Array<{ type: string, id: string }>, suggestions: Array<string>, provider: string }>}
 */
export async function processAssistantMessage({
  text,
  history = [],
  user,
  onChunk,
  signal,
  keyPool = defaultKeyPool,
} = {}) {
  // 1. Fallback immediately if assistant disabled or no keys in pool
  const geminiAvailable = env.ASSISTANT_ENABLED && keyPool && keyPool.length > 0;

  if (!geminiAvailable) {
    return runRuleBasedFallback(text, user, onChunk, 'rules-disabled');
  }

  const collectedCards = [];
  const toolsCalled = [];
  const contents = buildGeminiContents(text, history);

  try {
    // Execute tool loop with multi-key rotation
    const result = await callWithKeyRotation(async (apiKey) => {
      let currentModel = env.GEMINI_MODEL || 'gemini-2.5-flash';
      let roundTrips = 0;
      const MAX_TOOL_ROUNDS = 3;

      while (roundTrips < MAX_TOOL_ROUNDS) {
        roundTrips += 1;

        // On non-final tool-gathering rounds, do a non-streaming call to evaluate function calls
        const response = await generate({
          apiKey,
          model: currentModel,
          systemInstruction: SYSTEM_INSTRUCTION,
          contents,
          tools: ASSISTANT_TOOL_DECLARATIONS,
          stream: false,
          signal,
        });

        const { text: modelText, functionCalls } = response;

        if (functionCalls && functionCalls.length > 0) {
          // Append model's tool call turn preserving all candidate parts (including thoughtSignature)
          contents.push({
            role: 'model',
            parts: response.parts && response.parts.length > 0
              ? response.parts
              : functionCalls.map((fc) => ({ functionCall: fc })),
          });

          const functionResponses = [];
          for (const call of functionCalls) {
            toolsCalled.push(call.name);
            const toolExec = await executeTool(call.name, call.args || {}, { user });

            if (toolExec.cards && toolExec.cards.length > 0) {
              for (const c of toolExec.cards) {
                if (!collectedCards.some((existing) => existing.type === c.type && existing.id === c.id)) {
                  collectedCards.push(c);
                }
              }
            }

            functionResponses.push({
              functionResponse: {
                name: call.name,
                response: { output: toolExec.result },
              },
            });
          }

          // Append function response turn with role 'user' (supported by current Gemini API)
          contents.push({
            role: 'user',
            parts: functionResponses,
          });

          // Loop back to let Gemini formulate the final answer with tool outputs
          continue;
        }

        // No more function calls: this is the final answer!
        if (typeof onChunk === 'function') {
          // If caller requested streaming, stream final tokens
          // (Since we already have the full modelText from generate, emit it in chunks or stream)
          emitTextInChunks(modelText, onChunk);
        }

        return {
          reply: modelText || "I'm here to help with market schedules, produce prices, and order tracking.",
          cards: collectedCards,
          suggestions: deriveSuggestions(toolsCalled),
          provider: 'gemini',
        };
      }

      // If max round-trips reached, request final answer without tools
      const finalResp = await generate({
        apiKey,
        model: currentModel,
        systemInstruction: SYSTEM_INSTRUCTION,
        contents,
        stream: false,
        signal,
      });

      const reply = finalResp.text || "I'm here to help with market schedules, produce prices, and order tracking.";
      if (typeof onChunk === 'function') {
        emitTextInChunks(reply, onChunk);
      }

      return {
        reply,
        cards: collectedCards,
        suggestions: deriveSuggestions(toolsCalled),
        provider: 'gemini',
      };
    }, keyPool);

    return result;
  } catch (err) {
    // Graceful fallback to rule-based matcher if Gemini fails or is busy
    console.warn(`[Assistant Service] Gemini execution unavailable (${err.code || err.message}). Falling back to rule-based matcher.`);
    return runRuleBasedFallback(text, user, onChunk, 'rules-fallback');
  }
}

/**
 * Runs the deterministic Stage 3 rule-based assistant as a transparent fallback.
 *
 * @param {string} text
 * @param {object} user
 * @param {function} [onChunk]
 * @param {string} providerTag
 * @returns {Promise<{ reply: string, cards: Array<object>, suggestions: Array<string>, provider: string }>}
 */
async function runRuleBasedFallback(text, user, onChunk, providerTag = 'rules') {
  try {
    const entities = extractEntities(text);
    const result = await matchAndResolveIntent(entities, user);

    if (typeof onChunk === 'function') {
      emitTextInChunks(result.reply, onChunk);
    }

    return {
      reply: result.reply,
      cards: Array.isArray(result.cards) ? result.cards : [],
      suggestions: Array.isArray(result.suggestions) && result.suggestions.length > 0
        ? result.suggestions
        : DEFAULT_SUGGESTIONS,
      provider: providerTag,
    };
  } catch {
    const fallbackReply =
      "I'm having a little trouble looking that up right now, but I'm here to help with market schedules, produce prices, and order tracking. Try asking one of these:";
    if (typeof onChunk === 'function') {
      emitTextInChunks(fallbackReply, onChunk);
    }
    return {
      reply: fallbackReply,
      cards: [],
      suggestions: DEFAULT_SUGGESTIONS,
      provider: providerTag,
    };
  }
}

/**
 * Helper to emit complete text as small simulated streaming chunks for SSE.
 * @param {string} text
 * @param {function} onChunk
 */
function emitTextInChunks(text, onChunk) {
  if (!text || typeof onChunk !== 'function') return;
  // Emit in word chunks or 30-char chunks for smooth frontend rendering
  const words = text.split(/(\s+)/);
  for (const word of words) {
    if (word) {
      onChunk({ textChunk: word });
    }
  }
}

/**
 * Derives contextual suggestion chips based on which tools were called.
 * @param {string[]} toolsCalled
 * @returns {string[]}
 */
function deriveSuggestions(toolsCalled = []) {
  if (toolsCalled.includes('search_products') || toolsCalled.includes('whats_fresh')) {
    return ['When is pickup?', 'Who sells eggs?', 'Market hours'];
  }
  if (toolsCalled.includes('find_farmers') || toolsCalled.includes('get_farmer') || toolsCalled.includes('get_cutoff')) {
    return ['What do they sell?', 'When is the cutoff?', 'Market hours'];
  }
  if (toolsCalled.includes('get_market_hours')) {
    return ["What's fresh on Saturday?", 'Who sells at Elm Street?', 'How to pre-order'];
  }
  if (toolsCalled.includes('get_my_orders')) {
    return ['Check market hours', "What's fresh today?", 'Browse produce'];
  }
  return DEFAULT_SUGGESTIONS;
}
