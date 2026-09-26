# MarketLink: AI Image Generation Architecture & Operational Guide

> Documentary food and farmers-market photography pipeline for seeded catalog entities (Products, Farmers, Markets).
> Implements a dual-phase execution model: **Agent-Generated First (Phase 1)** using Antigravity IDE built-in tool capabilities with zero API keys, and **API-Key Direct Mode (Phase 2)** with automatic key rotation and quota backoff.

---

## 1. Prompt Templates (Verbatim)

### 1.1 Shared Photorealism Constraints (Applied to Every Image)

```
Style: photographed with a mirrorless camera, 50mm or 85mm lens, natural outdoor morning light,
soft shadows, shallow depth of field with a gently blurred background. Documentary food/market
photography style — think a real farmers market vendor's own photo, not a commercial studio shoot.

Must include (to avoid the "AI-generated" look): slightly imperfect arrangement (not perfectly
symmetrical), natural surface texture and minor blemishes where realistic (dirt on root vegetables,
uneven crumb on bread, condensation on jars), realistic material physics (wicker actually looks
woven, wood actually looks grained, no melting or warping edges), a believable surface underneath
(rustic wooden table, woven basket, market stall crate, or checked cloth) rather than a blank
studio background, natural colour grading (warm, slightly muted, not oversaturated candy colours).

Must avoid: any readable text, labels, price tags, or signage unless explicitly part of THIS
specific prompt (see the sign exception below) — text is where image models fail most visibly,
so default to none; plastic-looking or waxy skin/surfaces; unnaturally perfect symmetry or
repetition; floating or physically incorrect shadows; watermarks, logos, or camera UI overlays;
any real, identifiable brand, trademark, or logo; any depiction of a real, identifiable person;
human hands or faces in the frame at all (a common source of anatomical errors — keep people out
of frame entirely); gore or anything unappetising on meat/fish (keep it simple and tasteful: whole
or filleted on ice or butcher paper, no violence framing); oversharpened or "3D render" looking edges.

Aspect ratio: aim for {ASPECT_RATIO}. If your output doesn't land on that exact ratio, that's fine —
the companion upload step will centre-crop/pad it to the canonical size, so don't distort the
image trying to force it.
```

### 1.2 Products Template (`4:3`)
Canonical size: `1024x768`.
```
A photograph of {name}: {description}. Unit sold: {unit}. Presentation: {category presentation note}. {shared photorealism block, aspect ratio 4:3}.
```

Category presentation notes:
- **Vegetables**: `loose or in a wicker basket/crate, maybe a little dirt still on roots, on a wooden stall table`
- **Fruit**: `in a wooden crate or paper bag, a couple pieces out of the container for scale`
- **Bakery**: `on a wire cooling rack or wooden board, natural flour dusting, visible crumb/crust texture`
- **Dairy & Eggs**: `eggs in an open carton or milk/cheese on a wooden board with a checked cloth`
- **Honey & Jam**: `glass jar, warm light catching the contents, a wooden dipper or spoon beside it, no visible label text`
- **Herbs & Flowers**: `small bunches tied with plain twine, laid on a wooden surface`
- **Meat & Fish**: `simply presented on butcher paper or ice, tasteful and clean, no gore`

### 1.3 Farmers Templates

#### Farmer Logo / Stall Sign (`1:1`)
Canonical size: `800x800`.
```
A photograph of a small, rustic hand-painted wooden signboard (or chalkboard) reading only '{stallName}', propped at a farmers market stall. Hand-painted or chalk-written lettering, a little uneven and characterful — imperfect hand-lettering is authentic here, not a flaw. {specialty} is suggested by a few small real props resting near the sign (e.g. a basket of relevant produce), but the sign and its lettering are the focus. {shared photorealism block, aspect ratio 1:1}.
```

#### Farmer Stall Banner (`16:9`)
Canonical size: `1600x900`.
```
A wide photograph of {stallName}'s market stall: a table or stand displaying {specialty}, styled to suggest '{one short story detail}'. No readable signage needs to be in focus for this shot — the produce and stall setup are the focus. {shared photorealism block, aspect ratio 16:9}.
```

### 1.4 Markets Template (`16:9`)
Canonical size: `1600x900`.
```
A wide photograph of a small local farmers market called '{name}': a row of stalls with awnings, {facilities mentioned naturally if relevant, e.g. 'a paved walkway, people-free for this shot'}, morning light, a lively but uncrowded feel. Generic, archetypal small-town market scene — not a real, identifiable location. Keep people out of frame entirely. {shared photorealism block, aspect ratio 16:9}.
```

---

## 2. Phase Execution Order & Resumption Instructions

### Phase Order (Strict Dependency)
1. **Products**: All catalog products must have real photos before vendor stalls begin.
2. **Farmer Logos**: 1:1 authentic hand-painted signboard photos.
3. **Farmer Banners**: 16:9 wide stall-scene photos.
4. **Market Banners**: 16:9 wide community market photos.

### How to Resume / Switch Modes
- **To continue Phase 1 (Agent-generated mode):**
  Tell the agent: `"continue"`
  The agent queries `imageGenJobs` for the next batch of pending items, generates them using its built-in capability (~12 per batch session), crops to canonical dimensions, uploads to Cloudinary, updates MongoDB, and reports progress.

- **To switch to Phase 2 (Direct Gemini API mode):**
  Ensure `GEMINI_API_KEYS` is configured in `backend/.env`, then tell the agent:
  `"now use the API keys"`
  The agent triggers `backend/scripts/generate-catalog-images-api.js --force-api`, which rotates through the provided keys, streams binary images, and invokes the companion upload pipeline.

---

## 3. Phase 2 Research Findings (September 2026)

### 3.1 Model Names & Status
- **Current Active Models**: `gemini-3.1-flash-image` (balanced speed & fidelity) and `gemini-2.5-flash-image`.
- **Legacy Models**: The standalone `imagen-3.0-generate-002` and older Imagen endpoints have been migrated to the unified Gemini multimodal series.
- **Endpoint Pattern**: Uses the standard Google Generative AI REST API endpoint:
  `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key={API_KEY}`

### 3.2 Request Structure & Aspect Ratios
- **Configuration**:
  ```json
  {
    "contents": [
      {
        "role": "user",
        "parts": [{ "text": "<PROMPT>" }]
      }
    ],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"],
      "imageConfig": {
        "aspectRatio": "4:3"
      }
    }
  }
  ```
- **Supported Aspect Ratios**: `1:1`, `4:3`, `3:4`, `16:9`, `9:16`, `3:2`, `2:3`.
- **Response Format**: Arrives as inline base64 string under `candidates[0].content.parts[].inlineData.data` with `mimeType` (`image/png` or `image/jpeg`).

### 3.3 Rate Limits & Rotation Strategy
- **Limits**: Free tier projects are typically limited by Images per Minute (IPM) (~2-5 IPM) and Daily Requests (RPD). Paid tiers offer 10-15+ IPM.
- **Round-Robin Rotation**: Implemented in `KeyRotator` class in `generate-catalog-images-api.js`.
- **Quota Handling**: On HTTP 429 (`RESOURCE_EXHAUSTED`), the script halts cleanly without hammering retries.

---

## 4. Schema & Database Additions

### 4.1 Collection: `imageGenJobs`
Stores job state for idempotent tracking and resume:
- `_id`: ObjectId
- `entityType`: `'product' | 'farmer-logo' | 'farmer-banner' | 'market'`
- `entityId`: ObjectId (target document ID)
- `status`: `'pending' | 'generated' | 'done' | 'failed' | 'skipped'`
- `promptUsed`: String
- `generationMode`: `'agent' | 'api'`
- `localFilePath`: String (temporary staging path)
- `cloudinaryPublicId`: String
- `cloudinaryUrl`: String
- `attempts`: Integer
- `lastError`: String | Object | null
- `generatedAt`: Date | null
- `uploadedAt`: Date | null
- `createdAt`: Date
- `updatedAt`: Date

Indexes:
- `{ entityType: 1, status: 1 }`
- `{ entityType: 1, entityId: 1 }` (unique)

### 4.2 Entity Schema Additions
- **`products`**: Reuses existing `imageUrl`, `imagePublicId`.
- **`farmers`**: Added `logoUrl`, `logoPublicId`, `bannerUrl`, `bannerPublicId`, with `imageUrl` maintained as backward-compatible fallback pointing to `bannerUrl`.
- **`markets`**: Added `bannerUrl`, `bannerPublicId`.

### 4.3 Front-End Integration
- **`ProductCard` & `ProductDetail`**: Renders `product.imageUrl` in fixed 4:3 aspect-ratio tile, `loading="lazy"`, object-fit cover, with automatic `onError` fallback to the existing `Illustration`.
- **`FarmerDetail`**: Renders `farmer.bannerUrl` in a 16:9 container and `farmer.logoUrl` in the avatar circle, with fallback to stall illustration.
- **`MarketDetail`**: Renders `market.bannerUrl` in a 16:9 container with graceful fallback.
