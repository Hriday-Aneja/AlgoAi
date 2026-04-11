import { Router } from 'express';
import {
  startBossBattleController,
  submitBossBattleController,
  getBossResultController,
} from '../controllers/boss.controller';

const router = Router();

/**
 * @route   POST /api/boss/start
 * @desc    Start a new boss battle session
 * @access  Private (add auth middleware here when ready)
 */
router.post('/start', startBossBattleController);

/**
 * @route   POST /api/boss/submit
 * @desc    Submit answers for a boss battle session
 * @access  Private (add auth middleware here when ready)
 */
router.post('/submit', submitBossBattleController);

/**
 * @route   GET /api/boss/result/:userId
 * @desc    Get the most recent boss battle result for a user
 * @access  Private (add auth middleware here when ready)
 */
router.get('/result/:userId', getBossResultController);

export default router;