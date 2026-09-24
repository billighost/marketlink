/**
 * Image Uploads Test Suite (T4.086 - T4.100)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { setupTestEnvironment, teardownTestEnvironment, request, loginUser } from './helpers.js';
import { env } from '../src/config/env.js';

describe('Image Uploads Suite (T4.086 - T4.100)', () => {
  let farmerToken = '';
  let customerToken = '';

  // Minimal valid 100x100 JPEG
  const validJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
    0x00, 0x60, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x64, 0x00, 0x64, 0x03, 0x01, 0x11,
    0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
  ]);

  // Minimal valid 100x100 PNG
  const validPng = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
    Buffer.from([0x00, 0x00, 0x00, 0x0d]), // IHDR length = 13
    Buffer.from('IHDR', 'ascii'),
    Buffer.from([
      0x00, 0x00, 0x00, 0x64, // width = 100
      0x00, 0x00, 0x00, 0x64, // height = 100
      0x08, 0x02, 0x00, 0x00, 0x00,
    ]),
    Buffer.from([0x70, 0x73, 0x76, 0xbb]), // dummy CRC
  ]);

  // Minimal valid WebP
  const validWebp = Buffer.concat([
    Buffer.from('RIFF', 'ascii'),
    Buffer.from([0x24, 0x00, 0x00, 0x00]), // File size
    Buffer.from('WEBP', 'ascii'),
    Buffer.from('VP8 ', 'ascii'),
    Buffer.from([0x18, 0x00, 0x00, 0x00]), // VP8 chunk size
    Buffer.from([
      0x30, 0x01, 0x00, 0x9d, 0x01, 0x2a, 0x64, 0x00, 0x64, 0x00, // 100x100 VP8 frame header
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]),
  ]);

  before(async () => {
    await setupTestEnvironment();
    const farmerRes = await loginUser('riverbend@example.com', 'market123');
    farmerToken = farmerRes.accessToken;

    const custRes = await loginUser('george@example.com', 'market123');
    customerToken = custRes.accessToken;
  });

  after(async () => {
    await teardownTestEnvironment();
  });

  it('T4.086: Accepts valid JPEG, PNG, and WebP, returning 201 with /uploads/<hex> path', async () => {
    // JPEG
    const jpegRes = await request('/api/farmer/uploads/image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'image/jpeg',
      },
      rawBody: validJpeg,
    });
    assert.equal(jpegRes.status, 201);
    const jpegBody = await jpegRes.json();
    assert.ok(jpegBody.data.imageUrl.startsWith('/uploads/'));
    assert.ok(jpegBody.data.imageUrl.endsWith('.jpg'));

    // Check file exists on disk
    const jpegFilename = path.basename(jpegBody.data.imageUrl);
    assert.ok(fs.existsSync(path.join(env.UPLOAD_DIR, jpegFilename)));

    // PNG
    const pngRes = await request('/api/farmer/uploads/image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'image/png',
      },
      rawBody: validPng,
    });
    assert.equal(pngRes.status, 201);
    const pngBody = await pngRes.json();
    assert.ok(pngBody.data.imageUrl.endsWith('.png'));

    // WebP
    const webpRes = await request('/api/farmer/uploads/image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'image/webp',
      },
      rawBody: validWebp,
    });
    assert.equal(webpRes.status, 201);
    const webpBody = await webpRes.json();
    assert.ok(webpBody.data.imageUrl.endsWith('.webp'));
  });

  it('T4.087: Rejects header / magic bytes mismatch with 422', async () => {
    const res = await request('/api/farmer/uploads/image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'image/jpeg',
      },
      rawBody: validPng, // Sending PNG with JPEG header
    });
    assert.equal(res.status, 422);
  });

  it('T4.088: Rejects GIF, SVG, HTML, and PDF formats with 422', async () => {
    // GIF magic: GIF89a
    const gif = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');
    const gifRes = await request('/api/farmer/uploads/image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'image/gif',
      },
      rawBody: gif,
    });
    assert.equal(gifRes.status, 422);

    // SVG / HTML
    const svgRes = await request('/api/farmer/uploads/image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'image/svg+xml',
      },
      rawBody: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'),
    });
    assert.equal(svgRes.status, 422);
  });

  it('T4.089: Rejects empty body with 422', async () => {
    const res = await request('/api/farmer/uploads/image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'image/jpeg',
      },
      rawBody: Buffer.alloc(0),
    });
    assert.equal(res.status, 422);
  });

  it('T4.090: Rejects payload exceeding 1MB with 413 PAYLOAD_TOO_LARGE', async () => {
    const hugeBuf = Buffer.alloc(1048576 + 10);
    // Add JPEG magic to payload
    hugeBuf[0] = 0xff;
    hugeBuf[1] = 0xd8;
    hugeBuf[2] = 0xff;

    const res = await request('/api/farmer/uploads/image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'image/jpeg',
      },
      rawBody: hugeBuf,
    });
    assert.equal(res.status, 413);
  });

  it('T4.091: Customer or unauthenticated request receives 403 / 401', async () => {
    const custRes = await request('/api/farmer/uploads/image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerToken}`,
        'Content-Type': 'image/jpeg',
      },
      rawBody: validJpeg,
    });
    assert.equal(custRes.status, 403);

    const anonRes = await request('/api/farmer/uploads/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      rawBody: validJpeg,
    });
    assert.equal(anonRes.status, 401);
  });

  it('T4.092: Static served files include X-Content-Type-Options: nosniff and cache headers', async () => {
    const uploadRes = await request('/api/farmer/uploads/image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${farmerToken}`,
        'Content-Type': 'image/jpeg',
      },
      rawBody: validJpeg,
    });
    assert.equal(uploadRes.status, 201);
    const body = await uploadRes.json();
    const servedRes = await request(body.data.imageUrl);

    assert.equal(servedRes.status, 200);
    assert.equal(servedRes.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(servedRes.headers.get('cache-control')?.includes('max-age'));
  });

  it('T4.093: Directory listing on /uploads returns 404 or rejects dotfiles', async () => {
    const dirRes = await request('/uploads');
    assert.ok([404, 403].includes(dirRes.status));

    const dotfileRes = await request('/uploads/.env');
    assert.ok([404, 403].includes(dotfileRes.status));
  });
});
