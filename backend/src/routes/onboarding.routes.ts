import { Router } from "express";
import {
  completeOnboardingDay,
  getOnboardingRoadmap,
  submitOnboarding,
} from "../controllers/onboarding.controller";
import { requireAuth } from "../utils/auth";

const router = Router();

/**
 * @route   POST /api/onboarding
 * @desc    Save onboarding profile and generate personalized roadmap
 * @access  Private
 */
router.post("/", requireAuth, submitOnboarding);

/**
 * @route   GET /api/onboarding
 * @desc    Fetch previously generated roadmap for the logged in user
 * @access  Private
 */
router.get("/", requireAuth, getOnboardingRoadmap);

/**
 * @route   PATCH /api/onboarding/days/:day/complete
 * @desc    Mark a roadmap day as completed
 * @access  Private
 */
router.patch("/days/:day/complete", requireAuth, completeOnboardingDay);

export default router;
