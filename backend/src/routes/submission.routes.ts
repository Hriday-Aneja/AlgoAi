import { Router } from "express";
import { recordSubmission, getSubmissionActivity } from "../controllers/submission.controller";
import { requireAuth, withAuth } from "../utils/auth";

const router = Router();

/**
 * @route   POST /api/submissions
 * @desc    Record a run/submit attempt (passed or failed) for stuck-detection
 * @access  Private
 */
router.post("/", requireAuth, withAuth(recordSubmission));

/**
 * @route   GET /api/submissions/activity
 * @desc    Get raw submission records for the last 30 days for the authenticated user
 * @access  Private
 */
router.get("/activity", requireAuth, withAuth(getSubmissionActivity));

export default router;