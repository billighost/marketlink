/**
 * Image upload routes.
 * Exposes POST /farmer/uploads/image with raw body streaming and magic-byte validation.
 */

import express, { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { requireApprovedFarmer } from '../../middleware/requireApprovedFarmer.js';
import { saveUploadedImage } from './uploads.service.js';
import { AppError } from '../../utils/errors.js';

export const uploadsRouter = Router();

// Raw body parser mounted specifically for this route
const rawParser = express.raw({
  type: ['image/jpeg', 'image/png', 'image/webp', '*/*'],
  limit: '1048577', // 1MB + 1 byte so our service or parser can cleanly throw 413
});

/**
 * POST /api/farmer/uploads/image
 * Accepts binary image payload and returns public URL.
 */
uploadsRouter.post(
  '/image',
  requireAuth,
  requireRole('farmer'),
  requireApprovedFarmer,
  rawParser,
  async (req, res, next) => {
    try {
      const buffer = req.body;
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new AppError(422, 'INVALID_IMAGE', 'Upload payload is empty or invalid.');
      }

      if (buffer.length > 1048576) {
        throw new AppError(413, 'PAYLOAD_TOO_LARGE', 'Image exceeds 1MB limit.');
      }

      const contentType = req.headers['content-type'] || '';
      const imageUrl = await saveUploadedImage(buffer, contentType);

      res.status(201).json({
        data: { imageUrl },
      });
    } catch (err) {
      next(err);
    }
  }
);
