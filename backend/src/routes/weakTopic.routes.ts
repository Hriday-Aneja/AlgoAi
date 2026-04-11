import { Router } from 'express';
import { getUserWeakTopics } from '../controllers/weakTopic.controller';

const router = Router();

/**
 * @route   GET /api/weak-topics/:userId
 * @desc    Get sorted weak DSA topics for a user
 * @access  Private (add auth middleware here when ready)
 */
router.get('/:userId', getUserWeakTopics);

export default router;
