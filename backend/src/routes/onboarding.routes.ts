import { Router } from "express";
import {
  completeOnboardingDay,
  getOnboardingRoadmap,
  submitOnboarding,
  updateOnboarding,
} from "../controllers/onboarding.controller";
import { requireAuth, withAuth } from "../utils/auth";

const router = Router();

/**
 * @route   POST /api/onboarding
 * @desc    Save onboarding profile and generate personalized roadmap
 * @access  Private
 */
router.post("/", requireAuth, withAuth(submitOnboarding));

/**
 * @route   PUT /api/onboarding
 * @desc    Update onboarding profile and regenerate personalized roadmap
 * @access  Private
 */
router.put("/", requireAuth, withAuth(updateOnboarding));

/**
 * @route   GET /api/onboarding
 * @desc    Fetch previously generated roadmap for the logged in user
 * @access  Private
 */
router.get("/", requireAuth, withAuth(getOnboardingRoadmap));

/**
 * @route   PATCH /api/onboarding/days/:day/complete
 * @desc    Mark a roadmap day as completed
 * @access  Private
 */
router.patch("/days/:day/complete", requireAuth, withAuth(completeOnboardingDay));

export default router;
