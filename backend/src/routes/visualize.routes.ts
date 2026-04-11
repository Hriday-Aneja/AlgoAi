import { Router } from "express";
import { visualizeCode } from "../controllers/visualize.controller";
import { requireAuth } from "../utils/auth";

const router = Router();

/**
 * @route   POST /api/visualize
 * @desc    Execute and visualize code step-by-step
 * @access  Private
 */
router.post("/", requireAuth, visualizeCode);

export default router;
