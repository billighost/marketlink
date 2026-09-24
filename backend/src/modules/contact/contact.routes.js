/**
 * Contact routing layer.
 * Validates guest contact form submissions and passes them to the contact service.
 */

import { Router } from 'express';
import { contactRateLimiter } from '../../middleware/rateLimits.js';
import {
  rejectUnknownFields,
  validateString,
  validateEmail,
  validateEnum,
  assertValid,
} from '../../utils/validate.js';
import { CONTACT_TOPICS } from '../../constants.js';
import { createContactMessage } from './contact.service.js';

export const contactRouter = Router();

// POST /contact - Submit support / inquiry message
contactRouter.post('/', contactRateLimiter, async (req, res) => {
  const allowed = ['name', 'email', 'topic', 'message'];
  rejectUnknownFields(req.body, allowed);

  const details = [];
  const name = validateString(req.body.name, 'name', details, { required: true, min: 2, max: 100 });
  const email = validateEmail(req.body.email, 'email', details, true);
  const topic = validateEnum(req.body.topic, CONTACT_TOPICS, 'topic', details, true);
  const message = validateString(req.body.message, 'message', details, { required: true, min: 5, max: 2000 });

  assertValid(details);

  await createContactMessage({
    name,
    email,
    topic,
    message,
    ip: req.ip,
  });

  res.status(201).json({
    data: {
      message: "Thank you for reaching out! We've received your message and will respond shortly.",
    },
  });
});
