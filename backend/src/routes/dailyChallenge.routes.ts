import { Router } from 'express';
import { getDailyChallengeHandler, completeDailyChallengeHandler } from '../controllers/dailyChallenge.controller';

const router = Router();

/**
 * @route   GET /api/daily-challenge
 * @desc    Get today's daily challenge and completion status
 * @access  Private (requires auth)
 */
router.get('/', getDailyChallengeHandler as any);

/**
 * @route   POST /api/daily-challenge/complete
 * @desc    Mark today's challenge as completed
 * @access  Private (requires auth)
 */
router.post('/complete', completeDailyChallengeHandler as any);

export default router;