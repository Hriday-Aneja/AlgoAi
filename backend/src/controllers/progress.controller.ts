import { Request, Response, NextFunction } from 'express';
import { validateCreateProgress } from '../utils/progressValidator';
import { upsertProgress, getProgressByUser } from '../services/progress.service';
import { CreateProgressDto } from '../types/progress.types';

// ─── POST /api/progress ───────────────────────────────────────────────────────

/**
 * Add or update a user's problem progress.
 *
 * Body: CreateProgressDto
 * Returns 201 on create, 200 on update (Supabase upsert returns the final row).
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

    // 2. Delegate to service
    const dto = req.body as CreateProgressDto;
    const result = await upsertProgress(dto);

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

// ─── GET /api/progress/:userId ─────────────────────────────────────────────────

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
