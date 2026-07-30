import { Request, Response, NextFunction } from 'express';
import { validateCreateProgress } from '../utils/progressValidator';
import { upsertProgress, getProgressByUser } from '../services/progress.service';
import { CreateProgressDto } from '../types/progress.types';

const getRequestUserId = (req: Request): string | undefined => {
  return (req as any).user?.id;
};

// ─── POST /api/progress ───────────────────────────────────────────────────────

/**
 * Add or update a user's problem progress.
 *
 * Body: CreateProgressDto
 * Returns 201 on create, 200 on update.
 */
export const createOrUpdateProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { valid, errors } = validateCreateProgress(req.body);

    if (!valid) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed.',
        errors,
      });
      return;
    }

    const authUserId = getRequestUserId(req);
    const dto = req.body as CreateProgressDto;
    const userId = authUserId || dto.user_id;

    if (!userId) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required when saving progress.',
      });
      return;
    }

    const result = await upsertProgress({ ...dto, user_id: userId });

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
    const requestedUserId = req.params.userId?.trim();
    const authUserId = getRequestUserId(req);
    const userId = requestedUserId || authUserId;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'userId URL parameter is required.',
      });
      return;
    }

    if (authUserId && requestedUserId && authUserId !== requestedUserId) {
      res.status(403).json({
        status: 'error',
        message: 'Forbidden: userId does not match authenticated user.',
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
