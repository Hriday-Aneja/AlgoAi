import { NextFunction, Response } from "express";
import { ZodError } from "zod";
import { generateSmartHint } from "../services/hint.service";
import { hintRequestSchema } from "../validators/hint.validator";
import { AuthenticatedRequest } from "../types/express";

export const requestHint = async (
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

    const payload = hintRequestSchema.parse(req.body);
    const result = await generateSmartHint(userId, payload.problemId);

    if (!result.success) {
      res.status(200).json(result);
      return;
    }

    res.status(200).json(result);
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
