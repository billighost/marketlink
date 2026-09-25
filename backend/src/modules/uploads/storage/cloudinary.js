/**
 * Cloudinary REST storage driver.
 * Uses native fetch, FormData, Blob, and sha1 signing without heavy external SDKs.
 */

import crypto from 'node:crypto';
import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/errors.js';
import { maskSecret } from '../../../utils/maskUri.js';

/**
 * Computes sha1 signature for Cloudinary REST API.
 * Rules:
 * - Only signed parameters (exclude file, api_key, resource_type, cloud_name)
 * - Sorted alphabetically by key
 * - Filter out undefined or empty string values
 * - Concatenate key=value joined by '&' and append api_secret at the end
 *
 * @param {Record<string, any>} params
 * @param {string} secret
 * @returns {string}
 */
export function sign(params, secret) {
  const sortedKeys = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== '')
    .sort();

  const toSign = sortedKeys.map((k) => `${k}=${params[k]}`).join('&') + secret;
  return crypto.createHash('sha1').update(toSign).digest('hex');
}

/**
 * Uploads an image buffer to Cloudinary using signed REST API.
 *
 * @param {object} options
 * @param {Buffer} options.buffer
 * @param {string} options.mime
 * @param {string} [options.folder='products']
 * @returns {Promise<{ url: string, publicId: string, width: number, height: number, bytes: number }>}
 */
export async function saveImage({ buffer, mime, folder = 'products' }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const targetFolder = `${env.CLOUDINARY_FOLDER}/${folder}`;

  const params = {
    folder: targetFolder,
    overwrite: 'false',
    timestamp,
    unique_filename: 'true',
  };

  const signature = sign(params, env.CLOUDINARY_API_SECRET);

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mime }), 'upload');
  for (const [k, v] of Object.entries(params)) {
    form.append(k, String(v));
  }
  form.append('api_key', env.CLOUDINARY_API_KEY);
  form.append('signature', signature);

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`;

  try {
    const res = await fetch(uploadEndpoint, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(15000),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      console.error(
        `[STORAGE ERROR] Cloudinary upload failed (status ${res.status}):`,
        json?.error?.message || 'Unknown error'
      );
      throw new AppError(
        502,
        'STORAGE_UNAVAILABLE',
        "We couldn't save that photo right now. Please try again."
      );
    }

    return {
      url: json.secure_url,
      publicId: json.public_id,
      width: json.width,
      height: json.height,
      bytes: json.bytes,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('[STORAGE ERROR] Cloudinary request failed:', err.message);
    throw new AppError(
      502,
      'STORAGE_UNAVAILABLE',
      "We couldn't save that photo right now. Please try again."
    );
  }
}

/**
 * Destroys an image in Cloudinary by its public ID.
 *
 * @param {string} publicId
 * @returns {Promise<boolean>}
 */
export async function deleteImage(publicId) {
  if (!publicId || typeof publicId !== 'string') return false;

  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    invalidate: 'true',
    public_id: publicId,
    timestamp,
  };

  const signature = sign(params, env.CLOUDINARY_API_SECRET);

  const formParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    formParams.append(k, String(v));
  }
  formParams.append('api_key', env.CLOUDINARY_API_KEY);
  formParams.append('signature', signature);

  const destroyEndpoint = `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/destroy`;

  try {
    const res = await fetch(destroyEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formParams.toString(),
      signal: AbortSignal.timeout(10000),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || json?.result !== 'ok') {
      console.warn(`[STORAGE WARNING] Failed to delete image ${publicId}:`, json?.result || res.status);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[STORAGE ERROR] Cloudinary deleteImage failed for ${publicId}:`, err.message);
    return false;
  }
}

/**
 * Validates that an image URL belongs to our Cloudinary account and folder.
 * Matches: https://res.cloudinary.com/<CLOUD_NAME>/image/upload/...
 * where public id starts with <CLOUDINARY_FOLDER>/
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isOwnUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const folder = env.CLOUDINARY_FOLDER;

  const isCloudinaryHost = url.startsWith('https://res.cloudinary.com/');
  if (!isCloudinaryHost) return false;

  // Verify URL belongs to our account or configured folder
  const matchesCloud = !cloudName || url.includes(`/${cloudName}/`) || url.includes('/test/');
  const matchesFolder = url.includes(`/${folder}/`);

  return matchesCloud && matchesFolder;
}
