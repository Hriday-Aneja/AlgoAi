import { Router } from 'express';
import { getAdvancedRecommendations } from '../controllers/advanced-recommendation.controller';

const router = Router();

/**
 * @route   GET /api/advanced-recommendations/:userId
 * @desc    Get dynamic DSA problem recommendations based on user performance analysis
 * @access  Private (add auth middleware here when ready)
 */
router.get('/:userId', getAdvancedRecommendations);

export default router;