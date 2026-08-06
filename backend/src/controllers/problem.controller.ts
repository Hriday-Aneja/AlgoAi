import { Request, Response, NextFunction } from 'express';
import {
  getAllProblems,
  getProblemById,
} from "../repositories/problem.repository";

export const fetchAllProblems = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const problems = await getAllProblems();

    res.status(200).json({
      status: "success",
      count: problems.length,
      data: problems,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchProblemById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const problem = await getProblemById(id);

    if (!problem) {
      res.status(404).json({
        status: "error",
        message: "Problem not found",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: problem,
    });
  } catch (error) {
    next(error);
  }
};