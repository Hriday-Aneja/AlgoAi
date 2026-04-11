/**
 * ========================================================================
 * STREAK INTEGRATION EXAMPLE
 * ========================================================================
 *
 * This file shows the EXACT changes needed to integrate streak tracking
 * with the progress system.
 *
 * Copy this code into your progress.controller.ts file to enable
 * automatic streak updates when users solve problems.
 * ========================================================================
 */

// ─── ADD THIS IMPORT AT THE TOP OF progress.controller.ts ──────────────

import { Request, Response, NextFunction } from 'express';
import { validateCreateProgress } from '../utils/progressValidator';
import {
  upsertProgress,
  getProgressByUser,
} from '../services/progress.service';
import { updateStreakOnProblemSolved } from '../services/streak.service'; // ← ADD THIS
import { CreateProgressDto } from '../types/progress.types';

// ─── REPLACE THE createOrUpdateProgress FUNCTION ──────────────────────

/**
 * Add or update a user's problem progress.
 * Also updates their streak if they solved the problem.
 *
 * Body: CreateProgressDto
 * Query: timezone (optional, e.g. 'America/New_York')
 * Returns 201 on create, 200 on update.
 */
export const createOrUpdateProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Validate
    const { valid, errors } = validateCreateProgress(req.body);

    if (!valid) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed.',
        errors,
      });
      return;
    }

    // 2. Upsert progress record
    const dto = req.body as CreateProgressDto;
    const result = await upsertProgress(dto);

    // ─── NEW: Update streak if problem was solved ──────────────────────
    // Only update streak if status is 'solved', not just 'attempted'
    if (dto.status === 'solved') {
      try {
        const timezone = (req.query.timezone as string) || 'UTC';
        await updateStreakOnProblemSolved({
          user_id: dto.user_id,
          timezone,
        });
      } catch (streakError) {
        // Log the error but don't fail the entire request
        // Streak is nice-to-have, but progress must be saved
        console.error('Warning: Streak update failed', {
          userId: dto.user_id,
          error: streakError,
        });
      }
    }
    // ──────────────────────────────────────────────────────────────────

    // 3. Respond
    res.status(201).json({
      status: 'success',
      message: 'Progress saved.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve all progress records for a given user.
 *
 * Params: userId (string)
 * Returns an array (empty [] if the user has no records yet).
 */
export const getUserProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    // Basic param guard
    if (!userId || userId.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        message: 'userId URL parameter is required.',
      });
      return;
    }

    const records = await getProgressByUser(userId);

    res.status(200).json({
      status: 'success',
      count: records.length,
      data: records,
    });
  } catch (err) {
    next(err);
  }
};

// ========================================================================
// Alternative approach: Move to service layer for cleaner separation
// ========================================================================
//
// If you prefer to keep controllers thin, add this to progress.service.ts:
//
// import { updateStreakOnProblemSolved } from './streak.service';
//
// export const upsertProgressWithStreak = async (
//   dto: CreateProgressDto,
//   timezone?: string
// ): Promise<UserProgress> => {
//   const progress = await upsertProgress(dto);
//
//   // Update streak if problem was solved
//   if (dto.status === 'solved') {
//     try {
//       await updateStreakOnProblemSolved({
//         user_id: dto.user_id,
//         timezone: timezone || 'UTC',
//       });
//     } catch (err) {
//       console.error('Streak update failed:', err);
//       // Don't throw; streak updates are non-critical
//     }
//   }
//
//   return progress;
// };
//
// Then in the controller:
//
// const result = await upsertProgressWithStreak(
//   dto,
//   req.query.timezone as string
// );
//
// ========================================================================
