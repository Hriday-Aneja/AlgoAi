import { Router } from 'express';
import { requireAuth, withAuth } from '../utils/auth';
import {
  getTodayBossesController,
  submitBossBattleController,
} from '../controllers/boss.controller';

const router = Router();

/**
 * @route   GET /api/boss/today
 * @desc    Get today's boss assignments for the authenticated user
 * @access  Private
 */
router.get('/today', requireAuth, withAuth(getTodayBossesController));

/**
 * @route   POST /api/boss/submit
 * @desc    Submit code for a boss battle assignment
 * @access  Private
 */
router.post('/submit', requireAuth, withAuth(submitBossBattleController));

export default router;