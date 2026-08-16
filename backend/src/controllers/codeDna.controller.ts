import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { getCodeDnaStats } from '../services/codeDna.service';

export const getCodeDna = async (
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

    const stats = await getCodeDnaStats(userId);

    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
  }
};