import { Router } from 'express';
import {
  getMistakeAnalysis,
  getTopicPerformance,
  getWeakPatterns,
  getTimeEfficiencyIssues,
  getAIData,
} from '../controllers/mistake.controller';

const router = Router();

/**
 * @route   GET /api/mistakes/:userId
 * @desc    Get comprehensive mistake pattern analysis
 * @query   minAttempts (optional) - Only consider topics with N+ attempts
 * @access  Private
 */
router.get('/:userId', getMistakeAnalysis);

/**
 * @route   GET /api/mistakes/:userId/topics
 * @desc    Get detailed performance metrics per topic
 * @access  Private
 */
router.get('/:userId/topics', getTopicPerformance);

/**
 * @route   GET /api/mistakes/:userId/weak-patterns
 * @desc    Get topics with low solve rates (<70%)
 * @query   minAttempts (optional) - Default: 2
 * @access  Private
 */
router.get('/:userId/weak-patterns', getWeakPatterns);

/**
 * @route   GET /api/mistakes/:userId/time-efficiency
 * @desc    Identify topics solved but with inefficient time
 * @access  Private
 */
router.get('/:userId/time-efficiency', getTimeEfficiencyIssues);

/**
 * @route   GET /api/mistakes/:userId/ai-data
 * @desc    Get structured data for AI/ML model integration
 * @access  Private
 */
router.get('/:userId/ai-data', getAIData);

export default router;
