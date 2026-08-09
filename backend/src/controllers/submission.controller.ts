import { NextFunction, Response } from "express";
import { ZodError } from "zod";
import { createSubmission } from "../repositories/submission.repository";
import { getSubmissionsForUserLastNDays } from "../repositories/submission.repository";
import { submissionRequestSchema } from "../validators/submission.validator";
import { AuthenticatedRequest } from "../types/express";

export const recordSubmission = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized.",
      });
      return;
    }

    const payload = submissionRequestSchema.parse(req.body);
    const submission = await createSubmission(
      userId,
      payload.problemId,
      payload.status,
    );

    res.status(201).json({
      success: true,
      submission,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: "error",
        message: "Validation failed.",
        errors: error.flatten(),
      });
      return;
    }

    next(error);
  }
};

export const getSubmissionActivity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const submissions = await getSubmissionsForUserLastNDays(userId, 30);

    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
};