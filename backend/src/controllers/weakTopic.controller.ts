import { Request, Response, NextFunction } from 'express';
import { getWeakTopics } from '../services/weakTopic.service';

// ─── GET /api/weak-topics/:userId ─────────────────────────────────────────────

/**
 * Returns a sorted list of weak DSA topics for a given user.
 * Weak = accuracy < 60% OR avg_time > 20 min.
 * Sorted weakest-first (high severity → low accuracy → high avg_time).
 * Gracefully handles empty data and errors.
 */
export const getUserWeakTopics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    console.log('[getUserWeakTopics] Request for userId:', userId);

    if (!userId || userId.trim().length === 0) {
      console.warn('[getUserWeakTopics] Missing or empty userId');
      res.status(400).json({
        status: 'error',
        message: 'userId URL parameter is required.',
      });
      return;
    }

    const trimmedUserId = userId.trim();
    const weakTopics = await getWeakTopics(trimmedUserId);

    console.log('[getUserWeakTopics] Retrieved', weakTopics.length, 'weak topics for user:', trimmedUserId);

    res.status(200).json({
      status:  'success',
      user_id: trimmedUserId,
      count:   weakTopics.length,
      data:    weakTopics,
    });
  } catch (err) {
    console.error('[getUserWeakTopics] Controller error:', err);
    next(err);
  }
};
