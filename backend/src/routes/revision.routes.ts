import { Router } from 'express';
import { getUserRevisionProblems } from '../controllers/revision.controller';

const router = Router();

/**
 * @route   GET /api/revision/:userId
 * @desc    Get problems that need revision for a user
 * @access  Private (add auth middleware here when ready)
 */
router.get('/:userId', getUserRevisionProblems);

export default router;