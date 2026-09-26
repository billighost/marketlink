<<<<<<< HEAD
import { Router } from 'express';import { requireNotSuspendedFarmer } from '../../../middleware/requireApprovedFarmer.js';import {  rejectUnknownFields,  validateString,  validateInteger,  validateNumber,  assertValid,} from '../../../utils/validate.js';import { OPERATING_DAYS } from '../../../constants.js';import { getFarmerProfile, updateFarmerProfile } from './farmerProfile.service.js';import { AppError } from '../../../utils/errors.js';import { defineRoutes } from '../../../utils/defineRoutes.js';export const farmerProfileRouter = Router();const ALLOWED_PROFILE_FIELDS = [  'stallName',  'contactPerson',  'phone',  'specialty',  'story',  'since',  'address',  'location',  'marketIds',  'operatingDays',  'pickupWindows',  'cutoffMinutesBefore',  'maxOrdersPerSlot',  'imageUrl',  'imagePublicId',  'stallNumber',];const routes = [  {    method: 'get',    path: '/',    auth: 'farmer',    summary: 'Retrieves own farmer stall profile',    handler: async (req, res, next) => {      try {        const profile = await getFarmerProfile(req.user.id);        res.json({ data: profile });      } catch (err) {        next(err);      }    },  },  {    method: 'patch',    path: '/',    auth: 'farmer',    middlewares: [requireNotSuspendedFarmer],    summary: 'Updates permitted stall profile fields',    body: 'farmerProfile',    handler: async (req, res, next) => {      try {        rejectUnknownFields(req.body, ALLOWED_PROFILE_FIELDS);        const details = [];        const updates = {};        if (Object.keys(req.body).length === 0) {          throw AppError.unprocessable([], 'At least one field must be provided to update.');        }        if (req.body.stallName !== undefined) {          updates.stallName = validateString(req.body.stallName, 'stallName', details, {            required: true,            min: 2,            max: 80,          });        }        if (req.body.contactPerson !== undefined) {          updates.contactPerson = validateString(req.body.contactPerson, 'contactPerson', details, {            required: true,            min: 2,            max: 80,          });        }        if (req.body.phone !== undefined) {          updates.phone = validateString(req.body.phone, 'phone', details, {            required: true,            min: 7,            max: 30,          });        }        if (req.body.specialty !== undefined) {          updates.specialty = validateString(req.body.specialty, 'specialty', details, {            required: false,            min: 0,            max: 120,          });        }        if (req.body.story !== undefined) {          updates.story = validateString(req.body.story, 'story', details, {            required: false,            min: 0,            max: 600,          });        }        if (req.body.since !== undefined) {          const currentYear = new Date().getFullYear();          updates.since = validateInteger(req.body.since, 'since', details, {            required: true,            min: 1900,            max: currentYear,          });        }        if (req.body.address !== undefined) {          updates.address = validateString(req.body.address, 'address', details, {            required: true,            min: 5,            max: 200,          });        }        if (req.body.stallNumber !== undefined) {          updates.stallNumber = validateString(req.body.stallNumber, 'stallNumber', details, {            required: false,            min: 1,            max: 30,          });        }        if (req.body.location !== undefined) {          if (!req.body.location || typeof req.body.location !== 'object' || Array.isArray(req.body.location)) {            details.push({ field: 'location', message: 'location must be an object with lat and lng.' });          } else {            const lat = validateNumber(req.body.location.lat, 'location.lat', details, {              required: true,              min: -90,              max: 90,            });            const lng = validateNumber(req.body.location.lng, 'location.lng', details, {              required: true,              min: -180,              max: 180,            });            if (lat !== undefined && lng !== undefined) {              updates.location = { lat, lng };            }          }        }        if (req.body.marketIds !== undefined) {          if (!Array.isArray(req.body.marketIds)) {            details.push({ field: 'marketIds', message: 'marketIds must be an array.' });          } else if (req.body.marketIds.length > 5) {            details.push({ field: 'marketIds', message: 'You can attend at most 5 markets.' });          } else {            updates.marketIds = req.body.marketIds;          }        }        if (req.body.operatingDays !== undefined) {          if (!Array.isArray(req.body.operatingDays)) {            details.push({ field: 'operatingDays', message: 'operatingDays must be an array.' });          } else {            const invalidDays = req.body.operatingDays.filter((d) => !OPERATING_DAYS.includes(d));            if (invalidDays.length > 0) {              details.push({                field: 'operatingDays',                message: `Invalid operating days: ${invalidDays.join(', ')}.`,              });            } else {              updates.operatingDays = [...new Set(req.body.operatingDays)];            }          }        }        if (req.body.pickupWindows !== undefined) {          if (!Array.isArray(req.body.pickupWindows)) {            details.push({ field: 'pickupWindows', message: 'pickupWindows must be an array.' });          } else {            updates.pickupWindows = req.body.pickupWindows;          }        }        if (req.body.cutoffMinutesBefore !== undefined) {          updates.cutoffMinutesBefore = validateInteger(            req.body.cutoffMinutesBefore,            'cutoffMinutesBefore',            details,            { required: true, min: 30, max: 4320 }          );        }        if (req.body.maxOrdersPerSlot !== undefined) {          updates.maxOrdersPerSlot = validateInteger(            req.body.maxOrdersPerSlot,            'maxOrdersPerSlot',            details,            { required: true, min: 1, max: 200 }          );        }        if (req.body.imageUrl !== undefined) {          if (req.body.imageUrl !== null && typeof req.body.imageUrl !== 'string') {            details.push({ field: 'imageUrl', message: 'imageUrl must be a string or null.' });          } else {            updates.imageUrl = req.body.imageUrl;          }        }        if (req.body.imagePublicId !== undefined) {          if (req.body.imagePublicId !== null && typeof req.body.imagePublicId !== 'string') {            details.push({ field: 'imagePublicId', message: 'imagePublicId must be a string or null.' });          } else {            updates.imagePublicId = req.body.imagePublicId;          }        }        assertValid(details);        const profile = await updateFarmerProfile(req.user.id, updates);        res.json({ data: profile });      } catch (err) {        next(err);      }    },  },];defineRoutes(farmerProfileRouter, 'farmerProfile', routes, { basePath: '/api/farmer/profile' });
=======
/**
 * Farmer profile route controller.
 * Exposes GET /profile and PATCH /profile for authenticated farmers.
 */

import { Router } from 'express';
import { requireNotSuspendedFarmer } from '../../../middleware/requireApprovedFarmer.js';
import {
  rejectUnknownFields,
  validateString,
  validateInteger,
  validateNumber,
  assertValid,
} from '../../../utils/validate.js';
import { OPERATING_DAYS } from '../../../constants.js';
import { getFarmerProfile, updateFarmerProfile } from './farmerProfile.service.js';
import { AppError } from '../../../utils/errors.js';
import { defineRoutes } from '../../../utils/defineRoutes.js';

export const farmerProfileRouter = Router();

const ALLOWED_PROFILE_FIELDS = [
  'stallName',
  'contactPerson',
  'phone',
  'specialty',
  'story',
  'since',
  'address',
  'location',
  'marketIds',
  'operatingDays',
  'pickupWindows',
  'cutoffMinutesBefore',
  'maxOrdersPerSlot',
  'imageUrl',
  'imagePublicId',
  'stallNumber',
];

const routes = [
  // GET /api/farmer/profile
  {
    method: 'get',
    path: '/',
    auth: 'farmer',
    summary: 'Retrieves own farmer stall profile',
    handler: async (req, res, next) => {
      try {
        const profile = await getFarmerProfile(req.user.id);
        res.json({ data: profile });
      } catch (err) {
        next(err);
      }
    },
  },

  // PATCH /api/farmer/profile
  {
    method: 'patch',
    path: '/',
    auth: 'farmer',
    middlewares: [requireNotSuspendedFarmer],
    summary: 'Updates permitted stall profile fields',
    body: 'farmerProfile',
    handler: async (req, res, next) => {
      try {
        rejectUnknownFields(req.body, ALLOWED_PROFILE_FIELDS);

        const details = [];
        const updates = {};

        if (Object.keys(req.body).length === 0) {
          throw AppError.unprocessable([], 'At least one field must be provided to update.');
        }

        if (req.body.stallName !== undefined) {
          updates.stallName = validateString(req.body.stallName, 'stallName', details, {
            required: true,
            min: 2,
            max: 80,
          });
        }

        if (req.body.contactPerson !== undefined) {
          updates.contactPerson = validateString(req.body.contactPerson, 'contactPerson', details, {
            required: true,
            min: 2,
            max: 80,
          });
        }

        if (req.body.phone !== undefined) {
          updates.phone = validateString(req.body.phone, 'phone', details, {
            required: true,
            min: 7,
            max: 30,
          });
        }

        if (req.body.specialty !== undefined) {
          updates.specialty = validateString(req.body.specialty, 'specialty', details, {
            required: false,
            min: 0,
            max: 120,
          });
        }

        if (req.body.story !== undefined) {
          updates.story = validateString(req.body.story, 'story', details, {
            required: false,
            min: 0,
            max: 600,
          });
        }

        if (req.body.since !== undefined) {
          const currentYear = new Date().getFullYear();
          updates.since = validateInteger(req.body.since, 'since', details, {
            required: true,
            min: 1900,
            max: currentYear,
          });
        }

        if (req.body.address !== undefined) {
          updates.address = validateString(req.body.address, 'address', details, {
            required: false,
            min: 0,
            max: 200,
          }) || '';
        }

        if (req.body.stallNumber !== undefined) {
          updates.stallNumber = validateString(req.body.stallNumber, 'stallNumber', details, {
            required: false,
            min: 1,
            max: 30,
          });
        }

        if (req.body.location !== undefined) {
          if (!req.body.location || typeof req.body.location !== 'object' || Array.isArray(req.body.location)) {
            details.push({ field: 'location', message: 'location must be an object with lat and lng.' });
          } else {
            const lat = validateNumber(req.body.location.lat, 'location.lat', details, {
              required: true,
              min: -90,
              max: 90,
            });
            const lng = validateNumber(req.body.location.lng, 'location.lng', details, {
              required: true,
              min: -180,
              max: 180,
            });
            if (lat !== undefined && lng !== undefined) {
              updates.location = { lat, lng };
            }
          }
        }

        if (req.body.marketIds !== undefined) {
          if (!Array.isArray(req.body.marketIds)) {
            details.push({ field: 'marketIds', message: 'marketIds must be an array.' });
          } else if (req.body.marketIds.length > 5) {
            details.push({ field: 'marketIds', message: 'You can attend at most 5 markets.' });
          } else {
            updates.marketIds = req.body.marketIds;
          }
        }

        if (req.body.operatingDays !== undefined) {
          if (!Array.isArray(req.body.operatingDays)) {
            details.push({ field: 'operatingDays', message: 'operatingDays must be an array.' });
          } else {
            const invalidDays = req.body.operatingDays.filter((d) => !OPERATING_DAYS.includes(d));
            if (invalidDays.length > 0) {
              details.push({
                field: 'operatingDays',
                message: `Invalid operating days: ${invalidDays.join(', ')}.`,
              });
            } else {
              updates.operatingDays = [...new Set(req.body.operatingDays)];
            }
          }
        }

        if (req.body.pickupWindows !== undefined) {
          if (!Array.isArray(req.body.pickupWindows)) {
            details.push({ field: 'pickupWindows', message: 'pickupWindows must be an array.' });
          } else {
            updates.pickupWindows = req.body.pickupWindows;
          }
        }

        if (req.body.cutoffMinutesBefore !== undefined) {
          updates.cutoffMinutesBefore = validateInteger(
            req.body.cutoffMinutesBefore,
            'cutoffMinutesBefore',
            details,
            { required: true, min: 30, max: 4320 }
          );
        }

        if (req.body.maxOrdersPerSlot !== undefined) {
          updates.maxOrdersPerSlot = validateInteger(
            req.body.maxOrdersPerSlot,
            'maxOrdersPerSlot',
            details,
            { required: true, min: 1, max: 200 }
          );
        }

        if (req.body.imageUrl !== undefined) {
          if (req.body.imageUrl !== null && typeof req.body.imageUrl !== 'string') {
            details.push({ field: 'imageUrl', message: 'imageUrl must be a string or null.' });
          } else {
            updates.imageUrl = req.body.imageUrl;
          }
        }

        if (req.body.imagePublicId !== undefined) {
          if (req.body.imagePublicId !== null && typeof req.body.imagePublicId !== 'string') {
            details.push({ field: 'imagePublicId', message: 'imagePublicId must be a string or null.' });
          } else {
            updates.imagePublicId = req.body.imagePublicId;
          }
        }

        assertValid(details);

        const profile = await updateFarmerProfile(req.user.id, updates);
        res.json({ data: profile });
      } catch (err) {
        next(err);
      }
    },
  },
];

defineRoutes(farmerProfileRouter, 'farmerProfile', routes, { basePath: '/api/farmer/profile' });
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
