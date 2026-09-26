# MarketLink AI Assistant Architecture & Gemini Integration

**Document Version:** 1.0  
**Date Checked:** September 26, 2026  
**Sources:** Google AI Studio Documentation (aistudio.google.com, ai.google.dev), Generative Language API Specifications, BenchLM Quota Tracking.

---

## 1. Section 0 Research Findings: Models, Endpoints & Free-Tier Quotas

### Recommended Models
* **Primary Model: `gemini-2.5-flash`**
  * **Role:** Primary workhorse for high-speed, fact-grounded customer queries with native function calling.
  * **Free-Tier Limits:** ~10 Requests Per Minute (RPM), ~250,000 Tokens Per Minute (TPM), ~500 Requests Per Day (RPD).
  * **Target Latency:** Sub-second time-to-first-token (TTFT) on warm streams.
* **Fallback Model: `gemini-2.0-flash-lite` (or `gemini-2.0-flash`)**
  * **Role:** Lightweight, low-overhead fallback when the primary model experiences transient capacity limits or separate model quota saturation.
  * **Free-Tier Limits:** 15 Requests Per Minute (RPM), 1,000,000 Tokens Per Minute (TPM), 1,500 Requests Per Day (RPD).

### API Endpoint Shape & Streaming Architecture
* **Endpoint Architecture:**
  * **Standard Generation:** `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}`
  * **Server-Sent Events Streaming:** `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={apiKey}`
* **Decision on Client vs. SDK:**
  * MarketLink implements a purpose-built, zero-overhead REST client using native Node.js global `fetch` and `ReadableStream`.
  * **Justification:** Avoids heavy third-party SDK version churn, provides immediate native control over `AbortController` timeouts, exact HTTP 429 / 401 / 403 error status code extraction, clean SSE chunk parsing, and direct header flushes without SDK abstraction overhead.

---

## 2. Multi-Key Rotation Architecture (`keyPool.js`)

MarketLink supports arbitrary comma-separated Gemini API keys configured via `GEMINI_API_KEYS`.
Because Google AI Studio allocates free-tier quotas on a per-project basis, multiple keys across distinct projects or accounts offer combined operational headroom.

### Rotation Mechanics
1. **Round-Robin Selection:** Requests cycle sequentially across available keys rather than concentrating load on index 0.
2. **Local Sliding Window Throttling:** Each key tracks request timestamps over the last 60 seconds. If a key reaches `GEMINI_RPM_PER_KEY` (default: 10), the pool proactively selects the next available key *before* Gemini triggers a 429 response.
3. **HTTP 429 Rate-Limit Handling:** If Gemini returns a 429 (`RESOURCE_EXHAUSTED`), the key is flagged with exponential backoff + jitter:
   $$\text{cooldown} = \min(2^{\text{errors}} \times 1000, 60000)\text{ ms} \pm 20\%$$
   The request is immediately retried on the next available key in the pool (up to `pool.length` attempts).
4. **Non-Transient Key Failures (401/403):** If a key is invalid or revoked, it enters an extended 1-hour cooldown with a masked warning log.
5. **Masking & Security:** Keys are **never** logged in cleartext. Masking displays only the first 4 and last 4 characters (`AQ.A...enzA` or `AIza...1234`) accompanied by the key index.

---

## 3. Strict Data Grounding & Tool Definitions

The assistant is strictly constrained from fabricating prices, opening hours, farmer attendees, or order details. All domain facts must be retrieved via deterministic service calls.

### Tool Declarations

| Tool Name | Arguments | Backend Service Function | Scoping & Privacy |
|---|---|---|---|
| `search_products` | `query?`, `category?`, `day?`, `maxPriceCents?`, `limit<=5` | `products.service.js` query filter | Public listed products |
| `get_product` | `productId` | `products.service.js` findById | Public listed product |
| `find_farmers` | `query?`, `category?`, `market?`, `day?`, `limit<=5` | `farmers.service.js` query filter | Public active stalls |
| `get_farmer` | `farmerId` | `farmers.service.js` findById | Public stall schedule & cutoff |
| `get_market_hours`| `marketId?`, `marketName?` | `markets.service.js` findById / search | Public market schedule (cached 60s) |
| `whats_fresh` | `day?`, `category?`, `limit<=6` | `products.service.js` seasonal/bestseller | Public active catalog items |
| `get_my_orders` | *(no user-provided arguments)* | `orders.service.js` customer orders | **Enforced server-side to `req.user.id`** |
| `get_cutoff` | `farmerId` or `farmerName` | `utils/slots.js` + farmer cutoff | Public cutoff timing calculation |

### System Instruction (Verbatim)
```
You are MarketLink's assistant. Answer only using the tools provided — never invent prices, stock, farmer names, hours, or order details. If a tool returns nothing relevant, say you don't have that information and suggest browsing. Keep replies to 1–3 short, warm sentences, sentence case, no markdown headers, no emoji. Always say 'Customer' and 'Farmer', never 'buyer'/'vendor'. Never discuss anything unrelated to MarketLink (no general chit-chat beyond a brief greeting), and refuse politely if asked to do something outside shopping at MarketLink (e.g. write code, discuss other topics) with: 'I can only help with MarketLink — markets, farmers, products and your orders.'
```

---

## 4. Transparent Fallback Strategy

If:
1. `ASSISTANT_ENABLED=false` in environment configuration, OR
2. `GEMINI_API_KEYS` is empty or undefined, OR
3. All keys in the pool are rate-limited or cooling down (`ASSISTANT_BUSY`),

The request seamlessly routes to the deterministic rule-based matcher (`intents.js`). The customer receives a prompt, relevant answer without receiving an error screen.

---

## 5. Configuration & Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEYS` | String (comma-separated) | `""` | Pool of Gemini API keys |
| `GEMINI_MODEL` | String | `gemini-2.5-flash` | Default Gemini model |
| `GEMINI_FALLBACK_MODEL` | String | `gemini-2.0-flash-lite` | Secondary fallback model |
| `GEMINI_RPM_PER_KEY` | Integer | `10` | Local pre-throttling limit per key |
| `GEMINI_TIMEOUT_MS` | Integer | `12000` | AbortController request timeout |
| `ASSISTANT_MAX_TOKENS` | Integer | `400` | Max generated tokens per turn |
| `ASSISTANT_ENABLED` | Boolean | `true` | Master flag for Gemini assistant |
