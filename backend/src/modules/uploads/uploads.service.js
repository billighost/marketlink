/**
 * Image upload service.
 * Validates buffer payload, magic bytes, dimensions, and securely saves with randomized hex names.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';

/**
 * Inspects buffer headers to detect image MIME type and file extension.
 *
 * @param {Buffer} buf
 * @returns {{ mime: string, ext: string } | null}
 */
export function detectImageType(buf) {
  if (!buf || buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: '.png' };
  }

  // WebP: RIFF ???? WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: '.webp' };
  }

  return null;
}

/**
 * Inspects image buffer to parse width and height.
 *
 * @param {Buffer} buf
 * @param {string} mime
 * @returns {{ width: number, height: number } | null}
 */
export function parseDimensions(buf, mime) {
  try {
    if (mime === 'image/png' && buf.length >= 24) {
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      return { width, height };
    }

    if (mime === 'image/jpeg') {
      let offset = 2;
      while (offset < buf.length - 8) {
        if (buf[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = buf[offset + 1];
        // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2)
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          const height = buf.readUInt16BE(offset + 5);
          const width = buf.readUInt16BE(offset + 7);
          return { width, height };
        }
        const length = buf.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }

    if (mime === 'image/webp' && buf.length >= 30) {
      const chunk = buf.toString('ascii', 12, 16);
      if (chunk === 'VP8 ' && buf.length >= 30) {
        if (buf[23] === 0x9d && buf[24] === 0x01 && buf[25] === 0x2a) {
          const width = buf.readUInt16LE(26) & 0x3fff;
          const height = buf.readUInt16LE(28) & 0x3fff;
          return { width, height };
        }
      } else if (chunk === 'VP8L' && buf.length >= 26) {
        const b1 = buf[21];
        const b2 = buf[22];
        const b3 = buf[23];
        const b4 = buf[24];
        const width = 1 + (((b2 & 0x3f) << 8) | b1);
        const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        return { width, height };
      } else if (chunk === 'VP8X' && buf.length >= 30) {
        const width = 1 + buf.readUIntLE(24, 3);
        const height = 1 + buf.readUIntLE(27, 3);
        return { width, height };
      }
    }
  } catch {
    // Dimension parse error can be ignored if format is valid
  }
  return null;
}

/**
 * Validates, writes, and returns the public URL for an uploaded image.
 *
 * @param {Buffer} buffer
 * @param {string} [declaredContentType]
 * @returns {Promise<string>} - Public path '/uploads/<name>'
 */
export async function saveUploadedImage(buffer, declaredContentType) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError(422, 'INVALID_IMAGE', 'Upload payload is empty or invalid.');
  }

  if (buffer.length > 1048576) {
    throw new AppError(413, 'PAYLOAD_TOO_LARGE', 'Image exceeds 1MB limit.');
  }

  const detected = detectImageType(buffer);
  if (!detected) {
    throw new AppError(422, 'INVALID_IMAGE', 'Only JPEG, PNG, and WebP images are supported.');
  }

  if (declaredContentType) {
    const cleanHeader = declaredContentType.split(';')[0].trim().toLowerCase();
    if (cleanHeader !== detected.mime) {
      throw new AppError(422, 'INVALID_IMAGE', `Image format ${detected.mime} does not match Content-Type header ${cleanHeader}.`);
    }
  }

  // Dimension check (50x50 to 4000x4000)
  const dims = parseDimensions(buffer, detected.mime);
  if (dims) {
    if (dims.width < 50 || dims.width > 4000 || dims.height < 50 || dims.height > 4000) {
      throw new AppError(422, 'INVALID_IMAGE', `Image dimensions (${dims.width}x${dims.height}) must be between 50x50 and 4000x4000 pixels.`);
    }
  }

  const filename = crypto.randomBytes(16).toString('hex') + detected.ext;
  const targetPath = path.join(env.UPLOAD_DIR, filename);

  await fs.promises.writeFile(targetPath, buffer, { flag: 'wx' });

  return `/uploads/${filename}`;
}
