import { Request, Response, NextFunction } from 'express';
import { generateRecommendations } from '../services/advanced-recommendation.service';

/**
 * GET /api/advanced-recommendations/:userId
 * Returns dynamic problem recommendations based on user performance analysis
 */
export const getAdvancedRecommendations = async (
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

    const recommendations = await generateRecommendations(userId.trim());

    if (!recommendations) {
      res.status(200).json({
        status: 'success',
        message: 'No recommendations available. User may need to attempt more problems.',
        data: null,
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: recommendations,
    });
  } catch (err) {
    console.error('Advanced recommendations error:', err);
    next(err);
  }
};