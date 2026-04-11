import { Router } from 'express';
import { chatWithAI, streamChatWithAI } from '../controllers/chat.controller';

const router = Router();

/**
 * @route  POST /api/chat
 * @desc   Standard chat response (full reply at once)
 * @body   { message: string, userId?: string, problemId?: string }
 */
router.post('/', chatWithAI);

/**
 * @route  POST /api/chat/stream
 * @desc   Streaming chat response via Server-Sent Events (SSE)
 * @body   { message: string, userId?: string, problemId?: string }
 *
 * Frontend reads this as a stream:
 *   const res = await fetch('/api/chat/stream', { method: 'POST', body: ... })
 *   const reader = res.body.getReader()
 *   // each chunk: data: {"text":"..."}\n\n
 *   // end signal: data: [DONE]\n\n
 */
router.post('/stream', streamChatWithAI);

export default router;
