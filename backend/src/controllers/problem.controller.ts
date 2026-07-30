import { Request, Response, NextFunction } from 'express';
import { getAllProblems } from '../repositories/problem.repository';

export const fetchAllProblems = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const problems = getAllProblems();
    res.status(200).json({
      status: 'success',
      count: problems.length,
      data: problems,
    });
  } catch (error) {
    next(error);
  }
};
