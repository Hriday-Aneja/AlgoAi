import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createOrUpdateProgress,
  getUserProgress,
} from '../controllers/progress.controller';

const router = Router();

/**
 * @route   POST /api/progress
 * @desc    Add or update a user's problem progress
 * @access  Private
 */
router.post('/', authenticateToken, createOrUpdateProgress);

/**
 * @route   GET /api/progress/:userId
 * @desc    Get all progress records for a specific user
 * @access  Private
 */
router.get('/:userId', authenticateToken, getUserProgress);

export default router;
