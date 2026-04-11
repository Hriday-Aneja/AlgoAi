import { Router } from 'express';
import { chatWithAI } from '../controllers/chat.controller';

const router = Router();

/**
 * @route   POST /api/chat
 * @desc    Send a message to the AI DSA tutor
 * @access  Private (add auth middleware here when ready)
 */
router.post('/', chatWithAI);

export default router;