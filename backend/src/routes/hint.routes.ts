import { Router } from "express";
import { requestHint } from "../controllers/hint.controller";
import { requireAuth, withAuth } from "../utils/auth";

const router = Router();

/**
 * @route   POST /api/hints
 * @desc    Generate progressive hint when user is stuck
 * @access  Private
 */
router.post("/", requireAuth, withAuth(requestHint));

export default router;
