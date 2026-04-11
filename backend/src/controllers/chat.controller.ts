import { Request, Response, NextFunction } from 'express';
import { processChatMessage, streamChatMessage } from '../services/chat.service';
import { ChatRequest } from '../types/chat.types';

// ─────────────────────────────────────────────────────────────
// POST /api/chat
// Standard (non-streaming) — kept for backwards compatibility
// ─────────────────────────────────────────────────────────────
export const chatWithAI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, userId, problemId }: ChatRequest = req.body;

    if (!message || message.trim().length === 0) {
      res.status(400).json({ status: 'error', message: 'message is required.' });
      return;
    }

    // userId is optional — defaults to 'anonymous' in service
    const reply = await processChatMessage({
      message: message.trim(),
      userId: userId || 'anonymous',
      problemId,
    });

    res.status(200).json({ reply });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/chat/stream
// Real-time streaming — used by the frontend Chatbot.tsx
// Returns Server-Sent Events (SSE)
// ─────────────────────────────────────────────────────────────
export const streamChatWithAI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, userId, problemId }: ChatRequest = req.body;

    if (!message || message.trim().length === 0) {
      res.status(400).json({ status: 'error', message: 'message is required.' });
      return;
    }

    // This function writes directly to res via SSE
    await streamChatMessage(
      {
        message: message.trim(),
        userId: userId || 'anonymous',
        problemId,
      },
      res
    );
  } catch (err) {
    // If headers already sent (stream started), just end it
    if (!res.headersSent) {
      next(err);
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
};
