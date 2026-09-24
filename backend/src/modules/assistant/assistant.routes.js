/**
 * Assistant routing layer.
 * Exposes POST /assistant/message protected by assistantRateLimiter and customer role authentication.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { assistantRateLimiter } from '../../middleware/rateLimits.js';
import { ROLES } from '../../constants.js';
import {
  rejectUnknownFields,
  validateString,
  assertValid,
} from '../../utils/validate.js';
import { processAssistantMessage } from './assistant.service.js';

export const assistantRouter = Router();

// POST /assistant/message (Customer only, 30 per min per user)
assistantRouter.post(
  '/message',
  assistantRateLimiter,
  requireAuth,
  requireRole(ROLES.CUSTOMER),
  async (req, res) => {
    rejectUnknownFields(req.body, ['text', 'history']);
    const details = [];

    const text = validateString(req.body.text, 'text', details, {
      required: true,
      min: 1,
      max: 300,
    });

    let history = [];
    if (req.body.history !== undefined) {
      if (!Array.isArray(req.body.history)) {
        details.push({ field: 'history', message: 'history must be an array.' });
      } else {
        history = req.body.history.slice(-4);
      }
    }

    assertValid(details);

    const result = await processAssistantMessage({
      text,
      history,
      user: req.user,
    });

    res.status(200).json({
      data: result,
    });
  }
);
