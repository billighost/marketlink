<<<<<<< HEAD
import { Router } from 'express';import {  rejectUnknownFields,  validateString,  assertValid,} from '../../utils/validate.js';import { processAssistantMessage } from './assistant.service.js';import { defineRoutes } from '../../utils/defineRoutes.js';export const assistantRouter = Router();defineRoutes(  assistantRouter,  'assistant',  [    {      method: 'post',      path: '/message',      auth: 'customer',      limiter: 'assistant',      summary: 'Natural language shopping assistant messaging',      body: 'assistantMessage',      handler: async (req, res) => {        rejectUnknownFields(req.body, ['text', 'history']);        const details = [];        const text = validateString(req.body.text, 'text', details, {          required: true,          min: 1,          max: 300,        });        let history = [];        if (req.body.history !== undefined) {          if (!Array.isArray(req.body.history)) {            details.push({ field: 'history', message: 'history must be an array.' });          } else {            history = req.body.history.slice(-4);          }        }        assertValid(details);        const result = await processAssistantMessage({          text,          history,          user: req.user,        });        res.status(200).json({          data: result,        });      },    },  ],  { basePath: '/api/assistant' });
=======
/**
 * Assistant routing layer.
 * Exposes POST /assistant/message with optional Server-Sent Events (SSE) streaming,
 * protected by assistantRateLimiter and customer role authentication.
 * Exposes GET /admin/assistant/status for Admin-only masked key pool status inspection.
 */

import { Router } from 'express';
import {
  rejectUnknownFields,
  validateString,
  assertValid,
} from '../../utils/validate.js';
import { processAssistantMessage } from './assistant.service.js';
import { defaultKeyPool } from './keyPool.js';
import { defineRoutes } from '../../utils/defineRoutes.js';

export const assistantRouter = Router();
export const adminAssistantRouter = Router();

defineRoutes(
  assistantRouter,
  'assistant',
  [
    {
      method: 'post',
      path: '/message',
      auth: 'customer',
      limiter: 'assistant',
      summary: 'Natural language shopping assistant messaging with optional streaming (?stream=1)',
      body: 'assistantMessage',
      handler: async (req, res) => {
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

        const isStreaming =
          req.query.stream === '1' ||
          req.query.stream === 'true' ||
          (req.headers.accept && req.headers.accept.includes('text/event-stream'));

        if (!isStreaming) {
          // Standard JSON response
          const result = await processAssistantMessage({
            text,
            history,
            user: req.user,
          });

          return res.status(200).json({
            data: result,
          });
        }

        // Server-Sent Events (SSE) Streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        if (typeof res.flushHeaders === 'function') {
          res.flushHeaders();
        }

        const clientAbort = new AbortController();
        req.on('close', () => {
          clientAbort.abort();
        });

        const onChunk = ({ textChunk }) => {
          if (res.writableEnded) return;
          res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
        };

        try {
          const result = await processAssistantMessage({
            text,
            history,
            user: req.user,
            onChunk,
            signal: clientAbort.signal,
          });

          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ done: true, ...result })}\n\n`);
            res.end();
          }
        } catch (streamErr) {
          if (!res.writableEnded) {
            res.write(
              `data: ${JSON.stringify({
                error: {
                  code: streamErr.code || 'ASSISTANT_ERROR',
                  message: streamErr.message || 'Stream terminated unexpectedly.',
                },
              })}\n\n`
            );
            res.end();
          }
        }
      },
    },
  ],
  { basePath: '/api/assistant' }
);

// Admin-only health & status router for Gemini key rotation pool
defineRoutes(
  adminAssistantRouter,
  'adminAssistant',
  [
    {
      method: 'get',
      path: '/status',
      auth: 'admin',
      summary: 'Get masked Gemini API key pool health and quota status',
      handler: async (req, res) => {
        const poolStatus = defaultKeyPool.getStatus();
        res.status(200).json({
          data: poolStatus,
        });
      },
    },
  ],
  { basePath: '/api/admin/assistant' }
);
>>>>>>> bc73418815cde522512fe21a2af884eee3163165
