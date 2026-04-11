import { Request, Response, NextFunction } from 'express';
import { generateAIFeedback } from '../services/aiFeedback.service';
import { AIFeedbackInput } from '../types/aiFeedback.types';

// ─── POST /api/ai-feedback ───────────────────────────────────────────────────

/**
 * Generates AI-powered personalized feedback and study plan.
 */
export const getAIFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, weakTopics, recentActivity }: AIFeedbackInput = req.body;

    // Validate input
    if (!userId || !weakTopics || !recentActivity) {
      res.status(400).json({
        status: 'error',
        message: 'userId, weakTopics, and recentActivity are required.',
      });
      return;
    }

    if (!Array.isArray(weakTopics) || !Array.isArray(recentActivity)) {
      res.status(400).json({
        status: 'error',
        message: 'weakTopics and recentActivity must be arrays.',
      });
      return;
    }

    const feedback = await generateAIFeedback({ userId, weakTopics, recentActivity });

    res.status(200).json({
      status: 'success',
      data: feedback,
    });
  } catch (err) {
    next(err);
  }
};