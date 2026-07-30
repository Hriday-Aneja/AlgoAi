import { Router } from "express";
import {
  completeOnboardingDay,
  getOnboardingRoadmap,
  getOnboardingRoadmapDay,
  getOnboardingRoadmapMeta,
  submitOnboarding,
  updateOnboarding,
} from "../controllers/onboarding.controller";
import { optionalAuth, requireAuth, withAuth } from "../utils/auth";

const router = Router();

/**
 * @route   POST /api/onboarding
 * @desc    Save onboarding profile and generate personalized roadmap
 * @access  Public (for guest onboarding) / Private (for authenticated users)
 */
router.post("/", optionalAuth, withAuth(submitOnboarding));

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
router.get("/", optionalAuth, withAuth(getOnboardingRoadmap));

/**
 * @route   GET /api/onboarding/meta
 * @desc    Fetch roadmap progress metadata only
 * @access  Public/Private
 */
router.get("/meta", optionalAuth, withAuth(getOnboardingRoadmapMeta));

/**
 * @route   GET /api/onboarding/days/:day
 * @desc    Fetch a single roadmap day if unlocked
 * @access  Public/Private
 */
router.get("/days/:day", optionalAuth, withAuth(getOnboardingRoadmapDay));

/**
 * @route   PATCH /api/onboarding/days/:day/complete
 * @desc    Mark a roadmap day as completed
 * @access  Private
 */
router.patch("/days/:day/complete", requireAuth, withAuth(completeOnboardingDay));

export default router;
