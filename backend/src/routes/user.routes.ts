import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getUserProgress,
  saveUserProgress,
  updateUserStats,
  getUserAnalytics
} from '../controllers/user.controller';

const router = Router();

/**
 * @route   GET /api/user/progress
 * @desc    Get user's overall progress data
 * @access  Private
 */
router.get('/progress', authenticateToken, getUserProgress);

/**
 * @route   POST /api/user/progress
 * @desc    Save user's overall progress data
 * @access  Private
 */
router.post('/progress', authenticateToken, saveUserProgress);

/**
 * @route   PUT /api/user/stats
 * @desc    Update user statistics (questions solved, streak, etc.)
 * @access  Private
 */
router.put('/stats', authenticateToken, updateUserStats);

/**
 * @route   GET /api/user/analytics
 * @desc    Get user's analytics data
 * @access  Private
 */
router.get('/analytics', authenticateToken, getUserAnalytics);

export default router;