import { Router } from 'express';
import {
  createOrUpdateProgress,
  getUserProgress,
} from '../controllers/progress.controller';

const router = Router();

/**
 * @route   POST /api/progress
 * @desc    Add or update a user's problem progress
 * @access  Private (add auth middleware here when ready)
 */
router.post('/', createOrUpdateProgress);

/**
 * @route   GET /api/progress/:userId
 * @desc    Get all progress records for a specific user
 * @access  Private
 */
router.get('/:userId', getUserProgress);

export default router;
