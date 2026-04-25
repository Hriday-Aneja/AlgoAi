import { NextFunction, Response } from "express";
import { ZodError } from "zod";
import { visualizeCodeExecution } from "../services/visualize.service";
import { visualizeRequestSchema } from "../validators/visualize.validator";
import { AuthenticatedRequest } from "../types/express";

export const visualizeCode = async (
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

    const payload = visualizeRequestSchema.parse(req.body);
    const result = await visualizeCodeExecution({
      userId,
      code: payload.code,
      language: payload.language,
      input: payload.input,
    });

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
