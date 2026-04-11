import { Request, Response, NextFunction } from 'express';
import { getDailyChallenge, hasUserCompletedToday, completeDailyChallenge } from '../services/dailyChallenge.service';

/**
 * GET /api/daily-challenge
 * Returns today's daily challenge and completion status for the authenticated user.
 */
export const getDailyChallengeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const today = new Date();
    const challenge = await getDailyChallenge(today);
    const completed = await hasUserCompletedToday(userId, today);

    res.status(200).json({
      status: 'success',
      data: {
        challenge,
        completed,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/daily-challenge/complete
 * Marks today's challenge as completed for the authenticated user.
 */
export const completeDailyChallengeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Unauthorized',
      });
      return;
    }

    const today = new Date();
    await completeDailyChallenge(userId, today);

    res.status(200).json({
      status: 'success',
      message: 'Daily challenge completed!',
    });
  } catch (err) {
    next(err);
  }
};