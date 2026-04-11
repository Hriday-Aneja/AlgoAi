import { Router } from 'express';
import {
  getUserStreak,
  updateStreak,
  adminResetStreak,
} from '../controllers/streak.controller';

const router = Router();

/**
 * @route   GET /api/streak/:userId
 * @desc    Get current and longest streak for a user
 * @access  Public
 */
router.get('/:userId', getUserStreak);

/**
 * @route   POST /api/streak/:userId/update
 * @desc    Update streak when user solves a problem
 * @query   timezone (optional) - e.g. 'America/New_York'
 * @access  Private (should verify user matches :userId)
 */
router.post('/:userId/update', updateStreak);

/**
 * @route   POST /api/streak/:userId/reset
 * @desc    Admin reset streak for a user
 * @access  Admin only (add auth middleware)
 */
router.post('/:userId/reset', adminResetStreak);

export default router;
