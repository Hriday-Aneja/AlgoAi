import { Request, Response, NextFunction } from 'express';
import {
  startBossBattle,
  submitBossBattle,
  getBossResult,
} from '../services/boss.service';
import {
  StartBossBattleRequest,
  SubmitBossBattleRequest,
} from '../types/boss.types';

// ─── POST /api/boss/start ─────────────────────────────────────────────────────

/**
 * Starts a new boss battle session and returns problems to solve.
 */
export const startBossBattleController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, difficulty, problemCount }: StartBossBattleRequest = req.body;

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'userId is required.',
      });
      return;
    }

    const result = await startBossBattle({
      userId,
      difficulty: difficulty || 'medium',
      problemCount: problemCount || 5,
    });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/boss/submit ────────────────────────────────────────────────────

/**
 * Submits answers for a boss battle session and returns the result.
 */
export const submitBossBattleController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId, answers }: SubmitBossBattleRequest = req.body;

    if (!sessionId || !answers || !Array.isArray(answers)) {
      res.status(400).json({
        status: 'error',
        message: 'sessionId and answers array are required.',
      });
      return;
    }

    const result = await submitBossBattle({ sessionId, answers });

    res.status(200).json({
      status: 'success',
      data: {
        result,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/boss/result/:userId ─────────────────────────────────────────────

/**
 * Gets the most recent boss battle result for a user.
 */
export const getBossResultController = async (
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

    const result = await getBossResult(userId.trim());

    res.status(200).json({
      status: 'success',
      user_id: userId.trim(),
      data: result,
    });
  } catch (err) {
    next(err);
  }
};