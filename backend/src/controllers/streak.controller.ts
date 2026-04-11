import { Request, Response, NextFunction } from 'express';
import {
  getStreak,
  updateStreakOnProblemSolved,
  resetStreak,
} from '../services/streak.service';
import { UpdateStreakDto, StreakResponse } from '../types/streak.types';

// ─── GET /api/streak/:userId ──────────────────────────────────────────────────

/**
 * Retrieve the current streak for a user.
 *
 * Response:
 * {
 *   currentStreak: number,
 *   longestStreak: number,
 *   lastActiveDate: string (ISO format)
 * }
 */
export const getUserStreak = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim() === '') {
      res.status(400).json({
        status: 'error',
        message: 'userId is required.',
      });
      return;
    }

    const streak = await getStreak(userId);

    const response: StreakResponse = {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
    };

    res.status(200).json({
      status: 'success',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/streak/:userId/update ──────────────────────────────────────────

/**
 * Update the streak when a user solves a problem.
 *
 * Query params (optional):
 *   - timezone: e.g. 'America/New_York' (defaults to UTC)
 *
 * Returns the updated streak info and whether it was incremented.
 */
export const updateStreak = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { timezone } = req.query;

    if (!userId || userId.trim() === '') {
      res.status(400).json({
        status: 'error',
        message: 'userId is required.',
      });
      return;
    }

    const dto: UpdateStreakDto = {
      user_id: userId,
      timezone: (timezone as string) || 'UTC',
    };

    const result = await updateStreakOnProblemSolved(dto);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
        lastActiveDate: result.lastActiveDate,
        streakIncremented: result.streakIncremented,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/streak/:userId/reset ────────────────────────────────────────────

/**
 * Reset a user's streak (admin action or manual reset).
 *
 * Resets currentStreak to 0 but preserves longestStreak record.
 */
export const adminResetStreak = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim() === '') {
      res.status(400).json({
        status: 'error',
        message: 'userId is required.',
      });
      return;
    }

    // TODO: Add auth middleware to verify admin role
    // if (!isAdmin(req.user)) {
    //   res.status(403).json({ status: 'error', message: 'Forbidden' });
    //   return;
    // }

    const streak = await resetStreak(userId);

    res.status(200).json({
      status: 'success',
      message: 'Streak reset successfully.',
      data: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActiveDate: streak.lastActiveDate,
      },
    });
  } catch (err) {
    next(err);
  }
};
