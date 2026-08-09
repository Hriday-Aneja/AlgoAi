import { NextFunction, Response } from "express";
import {
  startInterview as startInterviewService,
  sendInterviewMessage as sendInterviewMessageService,
} from "../services/interview.service";
import { AuthenticatedRequest } from "../types/express";

export const startInterview = async (
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

    const { topic, difficulty, language } = req.body;

    if (!topic || !difficulty || !language) {
      res.status(400).json({
        status: "error",
        message: "topic, difficulty and language are required.",
      });
      return;
    }

    const result = await startInterviewService({
      topic,
      difficulty,
      language,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const sendInterviewMessage = async (
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

    const { history, user_message } = req.body;

    if (!history || !user_message) {
      res.status(400).json({
        status: "error",
        message: "history and user_message are required.",
      });
      return;
    }

    const result = await sendInterviewMessageService({
      history,
      userMessage: user_message,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};