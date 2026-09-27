# MarketLink Database Documentation

## 1. Overview
MarketLink uses MongoDB Atlas with native driver connectivity (`backend/src/db/client.js`), strict schema validation rules (`moderate` level), and indexes on query and sort fields.

---

## 2. Collections & Schemas

### 2.1 `products`
Stores catalog products offered by market vendors.
- `_id`: ObjectId
- `farmerId`: ObjectId (references `farmers._id`)
- `name`: String
- `description`: String
- `price`: Number / Int (in pence or cents)
- `unit`: Enum (`'each' | 'bunch' | 'bag' | 'kg' | 'g' | 'lb' | 'oz' | 'pint' | 'quart' | 'pack' | 'jar' | 'loaf' | 'dozen' | 'half-dozen' | 'tub' | 'fillet'`)
- `categorySlug`: String
- `tags`: Array of Strings
- `inventory`: Number
- `availability`: Enum (`'in_stock' | 'low_stock' | 'out_of_stock' | 'seasonal'`)
- `imageUrl`: String | null (canonical Cloudinary URL, e.g. `https://res.cloudinary.com/.../marketlink/products/...`)
- `imagePublicId`: String | null (e.g. `marketlink/products/...`)
- `createdAt`: Date
- `updatedAt`: Date

Indexes:
- `{ farmerId: 1, categorySlug: 1 }`
- `{ categorySlug: 1, availability: 1 }`
- `{ name: 'text', description: 'text' }`

---

### 2.2 `farmers`
Stores market vendors / stall operators.
- `_id`: ObjectId
- `userId`: ObjectId (references `users._id`)
- `stallName`: String
- `contactPerson`: String
- `phone`: String
- `email`: String
- `specialty`: String
- `story`: String
- `since`: Number (year)
- `stallNumber`: String
- `marketIds`: Array of ObjectIds
- `operatingDays`: Array of Strings
- `pickupWindows`: Array of Objects
- `address`: String
- `listingEnabled`: Boolean
- `ratingAvg`: Double / Number
- `ratingCount`: Number
- `imageUrl`: String | null (backward-compatible stall banner URL)
- `imagePublicId`: String | null
- `logoUrl`: String | null (Cloudinary stall signboard / logo image, canonical 1:1)
- `logoPublicId`: String | null
- `bannerUrl`: String | null (Cloudinary wide stall-scene banner image, canonical 16:9)
- `bannerPublicId`: String | null
- `createdAt`: Date
- `updatedAt`: Date

---

### 2.3 `markets`
Stores community farmers markets.
- `_id`: ObjectId
- `name`: String
- `slug`: String
- `address`: String
- `location`: GeoJSON Point Object
- `schedule`: Array of Objects
- `timezone`: String
- `facilities`: Array of Strings
- `status`: Enum (`'active' | 'seasonal' | 'upcoming' | 'closed'`)
- `bannerUrl`: String | null (Cloudinary wide market-scene banner image, canonical 16:9)
- `bannerPublicId`: String | null
- `createdAt`: Date
- `updatedAt`: Date

---

### 2.4 `imageGenJobs`
Stores offline AI image generation jobs and progress tracking.
- `_id`: ObjectId
- `entityType`: Enum (`'product' | 'farmer-logo' | 'farmer-banner' | 'market'`)
- `entityId`: ObjectId (target entity document ID)
- `status`: Enum (`'pending' | 'generated' | 'done' | 'failed' | 'skipped'`)
- `promptUsed`: String | null
- `generationMode`: Enum (`'agent' | 'api' | null`)
- `localFilePath`: String | null (local staging path before Cloudinary upload)
- `cloudinaryPublicId`: String | null
- `cloudinaryUrl`: String | null
- `attempts`: Number
- `lastError`: String | Object | null
- `generatedAt`: Date | null
- `uploadedAt`: Date | null
- `createdAt`: Date | null
- `updatedAt`: Date

Indexes:
- `{ entityType: 1, status: 1 }` (`idx_imageGenJobs_entityType_status`)
- `{ entityType: 1, entityId: 1 }` (unique, `idx_imageGenJobs_entityType_entityId_unique`)
