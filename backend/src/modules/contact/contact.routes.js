<<<<<<< HEAD
import { Router } from 'express';import {  rejectUnknownFields,  validateString,  validateEmail,  validateEnum,  assertValid,} from '../../utils/validate.js';import { CONTACT_TOPICS } from '../../constants.js';import { createContactMessage } from './contact.service.js';import { defineRoutes } from '../../utils/defineRoutes.js';export const contactRouter = Router();defineRoutes(  contactRouter,  'contact',  [    {      method: 'post',      path: '/',      auth: 'public',      limiter: 'contact',      summary: 'Submit support or inquiry message',      body: 'createContactMessage',      handler: async (req, res) => {        const allowed = ['name', 'email', 'topic', 'message'];        rejectUnknownFields(req.body, allowed);        const details = [];        const name = validateString(req.body.name, 'name', details, { required: true, min: 2, max: 100 });        const email = validateEmail(req.body.email, 'email', details, true);        const topic = validateEnum(req.body.topic, CONTACT_TOPICS, 'topic', details, true);        const message = validateString(req.body.message, 'message', details, { required: true, min: 5, max: 2000 });        assertValid(details);        await createContactMessage({          name,          email,          topic,          message,          ip: req.ip,        });        res.status(201).json({          data: {            message: "Thank you for reaching out! We've received your message and will respond shortly.",          },        });      },    },  ],  { basePath: '/api/contact' });
=======
/**
 * Contact routing layer.
 * Validates guest contact form submissions and passes them to the contact service.
 */

import { Router } from 'express';
import {
  rejectUnknownFields,
  validateString,
  validateEmail,
  validateEnum,
  assertValid,
} from '../../utils/validate.js';
import { CONTACT_TOPICS } from '../../constants.js';
import { createContactMessage } from './contact.service.js';
import { defineRoutes } from '../../utils/defineRoutes.js';
import { mailer } from '../../utils/mailer.js';

export const contactRouter = Router();

defineRoutes(
  contactRouter,
  'contact',
  [
    {
      method: 'post',
      path: '/',
      auth: 'public',
      limiter: 'contact',
      summary: 'Submit support or inquiry message',
      body: 'createContactMessage',
      handler: async (req, res) => {
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

        // Fire-and-forget contact acknowledgment email
        mailer.sendContactAck(email, { name, email, topic, message })
          .catch((err) => console.warn('[CONTACT] Mailer warning (contact_ack):', err.message));

        res.status(201).json({
          data: {
            message: "Thank you for reaching out! We've received your message and will respond shortly.",
          },
        });
      },
    },
  ],
  { basePath: '/api/contact' }
);
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
