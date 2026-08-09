import { Router } from "express";
import {
  startInterview,
  sendInterviewMessage,
} from "../controllers/interview.controller";
import { requireAuth, withAuth } from "../utils/auth";

const router = Router();

/**
 * @route   POST /api/interview/start
 * @desc    Start a new mock DSA interview session
 * @access  Private
 */
router.post("/start", requireAuth, withAuth(startInterview));

/**
 * @route   POST /api/interview/message
 * @desc    Send a candidate answer and get the interviewer's next reply
 * @access  Private
 */
router.post("/message", requireAuth, withAuth(sendInterviewMessage));

export default router;