import { Router } from 'express';
import { getAIFeedback } from '../controllers/aiFeedback.controller';

const router = Router();

/**
 * @route   POST /api/ai-feedback
 * @desc    Generate AI-powered personalized feedback and study plan
 * @access  Private (add auth middleware here when ready)
 */
router.post('/', getAIFeedback);

export default router;