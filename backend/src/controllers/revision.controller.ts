import { Request, Response, NextFunction } from 'express';
import { getProblemsToRevise } from '../services/revision.service';

// ─── GET /api/revision/:userId ────────────────────────────────────────────────

/**
 * Returns a list of problems that need revision for a given user.
 * Includes spaced repetition, low accuracy topics, and previously failed problems.
 */
export const getUserRevisionProblems = async (
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

    const problemsToRevise = await getProblemsToRevise(userId.trim());

    res.status(200).json({
      status: 'success',
      user_id: userId.trim(),
      count: problemsToRevise.length,
      data: {
        problemsToRevise,
      },
    });
  } catch (err) {
    next(err);
  }
};