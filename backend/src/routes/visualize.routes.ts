import { Router } from "express";
import { visualizeCode } from "../controllers/visualize.controller";
import { requireAuth, withAuth } from "../utils/auth";

const router = Router();

/**
 * @route   POST /api/visualize
 * @desc    Execute and visualize code step-by-step
 * @access  Private
 */
router.post("/", requireAuth, withAuth(visualizeCode));

export default router;
