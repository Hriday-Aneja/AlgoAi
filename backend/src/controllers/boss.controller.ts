import { Response, NextFunction } from 'express';
import {
  getTodayBosses,
  submitBossBattle as submitBossBattleService,
} from '../services/boss.service';
import { AuthenticatedRequest } from '../types/express';
import { BossSubmitRequest } from '../types/boss.types';

export const getTodayBossesController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized.' });
      return;
    }

    const result = await getTodayBosses(userId);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const submitBossBattleController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized.' });
      return;
    }

    const { bossAssignmentId, code, language, testOnly }: BossSubmitRequest = req.body;

    if (!bossAssignmentId || !code || !language) {
      res.status(400).json({ status: 'error', message: 'bossAssignmentId, code, and language are required.' });
      return;
    }

    const result = await submitBossBattleService(userId, bossAssignmentId, {
      code,
      language,
      testOnly,
    });

    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};