/**
 * Farmer pickup slots and closures route controller.
 * Exposes GET /slots, PUT /slots/closures, and DELETE /slots/closures/:date.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { requireNotSuspendedFarmer } from '../../../middleware/requireApprovedFarmer.js';
import {
  rejectUnknownFields,
  validateString,
  assertValid,
} from '../../../utils/validate.js';
import { listFarmerSlots, addSlotClosures, removeSlotClosure } from './slots.service.js';
import { AppError } from '../../../utils/errors.js';

export const farmerSlotsRouter = Router();

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/farmer/slots?days=14
 * Lists upcoming slots with order counts, capacity, and closure status.
 */
farmerSlotsRouter.get(
  '/',
  requireAuth,
  requireRole('farmer'),
  async (req, res, next) => {
    try {
      const days = Math.min(Math.max(parseInt(req.query.days, 10) || 14, 1), 60);
      const slots = await listFarmerSlots(req.user.id, { days });
      res.json({ data: slots });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/farmer/slots/closures
 * Sets closed dates in slotOverrides.
 */
farmerSlotsRouter.put(
  '/closures',
  requireAuth,
  requireRole('farmer'),
  requireNotSuspendedFarmer,
  async (req, res, next) => {
    try {
      rejectUnknownFields(req.body, ['dates', 'reason']);

      const details = [];
      if (!Array.isArray(req.body.dates) || req.body.dates.length === 0) {
        details.push({ field: 'dates', message: 'dates must be a non-empty array of YYYY-MM-DD dates.' });
      } else {
        for (let i = 0; i < req.body.dates.length; i++) {
          const d = req.body.dates[i];
          if (typeof d !== 'string' || !DATE_REGEX.test(d)) {
            details.push({ field: `dates[${i}]`, message: 'Each date must be a valid YYYY-MM-DD string.' });
          }
        }
      }

      let reason = '';
      if (req.body.reason !== undefined) {
        reason = validateString(req.body.reason, 'reason', details, { required: false, min: 0, max: 200 }) || '';
      }

      assertValid(details);

      const slotOverrides = await addSlotClosures(req.user.id, req.body.dates, reason);
      res.json({ data: { slotOverrides } });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/farmer/slots/closures/:date
 * Reopens a closed slot date.
 */
farmerSlotsRouter.delete(
  '/closures/:date',
  requireAuth,
  requireRole('farmer'),
  requireNotSuspendedFarmer,
  async (req, res, next) => {
    try {
      const date = req.params.date;
      if (!date || !DATE_REGEX.test(date)) {
        throw AppError.unprocessable([
          { field: 'date', message: 'Param date must be a valid YYYY-MM-DD string.' },
        ]);
      }

      const slotOverrides = await removeSlotClosure(req.user.id, date);
      res.json({ data: { slotOverrides } });
    } catch (err) {
      next(err);
    }
  }
);
