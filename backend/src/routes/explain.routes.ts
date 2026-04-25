import { Router } from 'express';
import { explainCode } from '../controllers/codeExplainer.controller';

const router = Router();

/**
 * @route   POST /api/explain
 * @desc    Explain code line-by-line using Groq AI
 * @access  Public (temporarily for development)
 */
router.post('/', explainCode);

export default router;
