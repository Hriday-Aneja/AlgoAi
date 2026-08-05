import { Router } from "express";
import { recordSubmission } from "../controllers/submission.controller";
import { requireAuth, withAuth } from "../utils/auth";

const router = Router();

/**
 * @route   POST /api/submissions
 * @desc    Record a run/submit attempt (passed or failed) for stuck-detection
 * @access  Private
 */
router.post("/", requireAuth, withAuth(recordSubmission));

export default router;