import { Router } from "express";
import {
  startInterview,
  sendInterviewMessage,
  getInterviewFeedback,
} from "../controllers/interview.controller";
import { requireAuth, withAuth } from "../utils/auth";

const router = Router();

/**
 * @route   POST /api/interview/start
 * @desc    Start a new personality-driven mock DSA interview session
 * @access  Private
 */
router.post("/start", requireAuth, withAuth(startInterview));

/**
 * @route   POST /api/interview/message
 * @desc    Send a candidate answer/code and get the interviewer's evaluation + next reply
 * @access  Private
 */
router.post("/message", requireAuth, withAuth(sendInterviewMessage));

/**
 * @route   POST /api/interview/feedback
 * @desc    Get final AI-generated feedback and strengths/weaknesses for a completed interview
 * @access  Private
 */
router.post("/feedback", requireAuth, withAuth(getInterviewFeedback));

export default router;