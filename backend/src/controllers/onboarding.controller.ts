import { NextFunction, Response } from "express";
import { ZodError } from "zod";
import {
  createOrUpdateOnboardingRoadmap,
  completeRoadmapDay,
  fetchRoadmap,
} from "../services/onboarding.service";
import {
  completeDaySchema,
  onboardingSchema,
} from "../validators/onboarding.validator";
import { AuthenticatedRequest } from "../types/express";

export const submitOnboarding = async (
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

    const payload = onboardingSchema.parse(req.body);
    const result = await createOrUpdateOnboardingRoadmap(userId, payload);

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

export const updateOnboarding = async (
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

    const payload = onboardingSchema.parse(req.body);
    const result = await createOrUpdateOnboardingRoadmap(userId, payload);

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

export const getOnboardingRoadmap = async (
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

    const roadmap = await fetchRoadmap(userId);

    res.status(200).json({
      success: true,
      roadmap,
    });
  } catch (error) {
    next(error);
  }
};

export const completeOnboardingDay = async (
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

    const day = Number(req.params.day);
    const parsed = completeDaySchema.parse({ day });

    await completeRoadmapDay(userId, parsed.day);

    res.status(200).json({
      success: true,
      message: "Roadmap day marked as completed.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: "error",
        message: "Invalid day parameter.",
        errors: error.flatten(),
      });
      return;
    }

    next(error);
  }
};
