import { Request, Response, NextFunction } from 'express';
import { getWeakTopics } from '../services/weakTopic.service';

// ─── GET /api/weak-topics/:userId ─────────────────────────────────────────────

/**
 * Returns a sorted list of weak DSA topics for a given user.
 * Weak = accuracy < 60% OR avg_time > 20 min.
 * Sorted weakest-first (high severity → low accuracy → high avg_time).
 */
export const getUserWeakTopics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'userId URL parameter is required.',
      });
      return;
    }

    const weakTopics = await getWeakTopics(userId.trim());

    res.status(200).json({
      status:  'success',
      user_id: userId.trim(),
      count:   weakTopics.length,
      data:    weakTopics,
    });
  } catch (err) {
    next(err);
  }
};
