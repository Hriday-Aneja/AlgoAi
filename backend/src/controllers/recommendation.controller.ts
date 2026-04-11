import { Request, Response, NextFunction } from 'express';
import { getRecommendations } from '../services/recommendation.service';

const MAX_LIMIT = 10;

// ─── GET /api/recommendations/:userId ─────────────────────────────────────────

/**
 * Returns up to 10 personalised problem recommendations based on the user's
 * weak topics. Sorted: high-weakness topics first, then easy → medium → hard.
 */
export const getUserRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim().length === 0) {
      res.status(400).json({
        status:  'error',
        message: 'userId URL parameter is required.',
      });
      return;
    }

    // Optional ?limit= query param, clamped to MAX_LIMIT
    const rawLimit  = parseInt(req.query['limit'] as string, 10);
    const limit     = !isNaN(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : MAX_LIMIT;

    const { recommendations, strategyName, weakTopicCount } =
      await getRecommendations(userId.trim(), limit);

    res.status(200).json({
      status:           'success',
      user_id:          userId.trim(),
      strategy:         strategyName,
      weak_topic_count: weakTopicCount,
      count:            recommendations.length,
      data:             recommendations,
    });
  } catch (err) {
    next(err);
  }
};
