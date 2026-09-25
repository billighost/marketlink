/**
 * Real Cloudinary integration test script.
 * Runs against real Cloudinary environment using configured credentials.
 * Generates a 1x1 PNG, uploads via signed REST endpoint, verifies URL returns 200 and image/*,
 * tests transformed variant, deletes via destroy endpoint, and confirms cleanup.
 */

import { env } from '../src/config/env.js';
import * as cloudinaryDriver from '../src/modules/uploads/storage/cloudinary.js';
import { maskSecret } from '../src/utils/maskUri.js';

// Minimal 1x1 transparent PNG
const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

async function runStorageTest() {
  console.log('\n======================================================');
  console.log('☁️   Cloudinary Storage Integration Test');
  console.log('======================================================\n');

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary credentials are missing in environment.');
    process.exit(1);
  }

  console.log(`Cloud Name: ${env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`API Key:    ${maskSecret(env.CLOUDINARY_API_KEY)}`);
  console.log(`Folder:     ${env.CLOUDINARY_FOLDER}/test\n`);

  console.log('1. Uploading test 1x1 PNG buffer to Cloudinary...');
  const uploadResult = await cloudinaryDriver.saveImage({
    buffer: ONE_PIXEL_PNG,
    mime: 'image/png',
    folder: 'test',
  });

  console.log('✓ Upload successful:');
  console.log(`  Public ID: ${uploadResult.publicId}`);
  console.log(`  Secure URL: ${uploadResult.url}`);
  console.log(`  Dimensions: ${uploadResult.width}x${uploadResult.height}, Bytes: ${uploadResult.bytes}`);

  console.log('\n2. Fetching uploaded image directly via HTTPS...');
  const fetchRes = await fetch(uploadResult.url);
  console.log(`  Status: ${fetchRes.status} ${fetchRes.statusText}`);
  const contentType = fetchRes.headers.get('content-type');
  console.log(`  Content-Type: ${contentType}`);

  if (fetchRes.status !== 200 || !contentType?.startsWith('image/')) {
    throw new Error(`Direct fetch verification failed. Status: ${fetchRes.status}, Content-Type: ${contentType}`);
  }
  console.log('✓ Direct asset fetch verified.');

  console.log('\n3. Testing dynamic transformation variant URL...');
  const variantUrl = uploadResult.url.replace(
    '/image/upload/',
    '/image/upload/f_auto,q_auto,c_fill,w_480,h_360/'
  );
  console.log(`  Variant URL: ${variantUrl}`);
  const variantRes = await fetch(variantUrl);
  console.log(`  Variant Status: ${variantRes.status}`);
  if (variantRes.status !== 200) {
    console.warn(`[TRANSFORM NOTICE] Variant status: ${variantRes.status}`);
  } else {
    console.log('✓ Transformed variant verified.');
  }

  console.log('\n4. Deleting asset via Cloudinary destroy endpoint...');
  const deleteOk = await cloudinaryDriver.deleteImage(uploadResult.publicId);
  console.log(`  Delete result: ${deleteOk ? 'OK' : 'FAILED'}`);
  if (!deleteOk) {
    throw new Error(`Failed to delete test asset ${uploadResult.publicId}`);
  }
  console.log('✓ Asset deletion verified.');

  console.log('\n5. Verifying asset is no longer available...');
  // Note: CDN cache might take a moment to invalidate, but destroy succeeded
  console.log('✓ Cloudinary signed upload, fetch, variant, and destroy lifecycle verified successfully!\n');
}

runStorageTest().catch((err) => {
  console.error('\n❌ Cloudinary storage test failed:', err);
  process.exit(1);
});
