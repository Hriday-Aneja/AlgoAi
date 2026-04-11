import { Request, Response, NextFunction } from 'express';
import { processChatMessage } from '../services/chat.service';
import { ChatRequest } from '../types/chat.types';

// ─── POST /api/chat ───────────────────────────────────────────────────────────

/**
 * Processes a chat message and returns an AI-powered response.
 * Includes user context (weak topics, recent progress) for personalized help.
 */
export const chatWithAI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, userId, problemId }: ChatRequest = req.body;

    // Validate input
    if (!message || !userId) {
      res.status(400).json({
        status: 'error',
        message: 'message and userId are required.',
      });
      return;
    }

    if (message.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'message cannot be empty.',
      });
      return;
    }

    // Process the chat message
    const reply = await processChatMessage({ message: message.trim(), userId, problemId });

    res.status(200).json({
      status: 'success',
      data: {
        reply,
      },
    });
  } catch (err) {
    next(err);
  }
};