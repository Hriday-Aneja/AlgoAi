import { Request, Response, NextFunction } from 'express';
import {
  analyzeMistakePatterns,
  getTopicStatistics,
  detectWeakPatterns,
  detectTimeEfficiencyIssues,
  getAIReadyMistakeData,
} from '../services/mistake.service';
import { MistakeAnalysisQuery } from '../types/mistake.types';

// ─── GET /api/mistakes/:userId ────────────────────────────────────────────────

/**
 * Main endpoint: Comprehensive mistake pattern analysis.
 *
 * Returns:
 * {
 *   userId,
 *   analysisDate,
 *   weakPatterns: [],    // Topics with low solve rates
 *   frequentMistakes: [], // Problems user struggled with
 *   suggestions: [],      // Actionable recommendations
 *   summary: { ... }     // Overall statistics
 * }
 *
 * Query parameters (optional):
 *   - minAttempts: Minimum attempts threshold (default: 1)
 */
export const getMistakeAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { minAttempts } = req.query;

    if (!userId || userId.trim() === '') {
      res.status(400).json({
        status: 'error',
        message: 'userId is required.',
      });
      return;
    }

    const query: MistakeAnalysisQuery = {
      minAttempts: minAttempts ? parseInt(minAttempts as string) : 1,
    };

    const analysis = await analyzeMistakePatterns(userId, query);

    res.status(200).json({
      status: 'success',
      data: analysis,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/mistakes/:userId/topics ──────────────────────────────────────────

/**
 * Get detailed topic performance statistics for a user.
 *
 * Returns array of topics with their metrics:
 * {
 *   topic,
 *   totalAttempts,
 *   solvedCount,
 *   attemptedCount,
 *   solveRate,
 *   averageTimeTaken,
 *   maxTimeTaken
 * }
 */
export const getTopicPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim() === '') {
      res.status(400).json({
        status: 'error',
        message: 'userId is required.',
      });
      return;
    }

    const stats = await getTopicStatistics(userId);

    res.status(200).json({
      status: 'success',
      count: stats.length,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/mistakes/:userId/weak-patterns ──────────────────────────────────

/**
 * Get only weak patterns (topics with solve rate < 70%).
 *
 * Query parameters (optional):
 *   - minAttempts: Minimum attempts to consider (default: 2)
 *
 * Returns: [ { topic, solveRate, totalAttempts, message }, ... ]
 */
export const getWeakPatterns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { minAttempts } = req.query;

    if (!userId || userId.trim() === '') {
      res.status(400).json({
        status: 'error',
        message: 'userId is required.',
      });
      return;
    }

    const threshold = minAttempts ? parseInt(minAttempts as string) : 2;
    const patterns = await detectWeakPatterns(userId, threshold);

    res.status(200).json({
      status: 'success',
      count: patterns.length,
      data: patterns,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/mistakes/:userId/time-efficiency ──────────────────────────────────

/**
 * Analyze time efficiency on solved problems.
 * Identifies topics where user solves but takes too long.
 *
 * Returns: [ { topic, message, ... }, ... ]
 */
export const getTimeEfficiencyIssues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim() === '') {
      res.status(400).json({
        status: 'error',
        message: 'userId is required.',
      });
      return;
    }

    const issues = await detectTimeEfficiencyIssues(userId);

    res.status(200).json({
      status: 'success',
      count: issues.length,
      data: issues,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/mistakes/:userId/ai-data ────────────────────────────────────────

/**
 * Get structured data for AI/ML model integration.
 * This endpoint is designed to be stable across future AI upgrades.
 * Format: { metrics, context, timestamp, ... }
 *
 * Useful for:
 *   - ML models predicting where user will struggle
 *   - LLMs generating personalized recommendations
 *   - Analytics on learning patterns
 */
export const getAIData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId || userId.trim() === '') {
      res.status(400).json({
        status: 'error',
        message: 'userId is required.',
      });
      return;
    }

    const aiData = await getAIReadyMistakeData(userId);

    res.status(200).json({
      status: 'success',
      data: aiData,
    });
  } catch (err) {
    next(err);
  }
};
