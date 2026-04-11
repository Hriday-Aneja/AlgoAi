import { Router } from 'express';
import { getUserRecommendations } from '../controllers/recommendation.controller';

const router = Router();

/**
 * @route   GET /api/recommendations/:userId
 * @desc    Get personalised DSA problem recommendations for a user
 * @query   ?limit=N  (optional, max 10)
 * @access  Private (add auth middleware here when ready)
 */
router.get('/:userId', getUserRecommendations);

export default router;
