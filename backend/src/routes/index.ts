import { Router } from "express";
import healthRoutes from "./health.routes";
import progressRoutes from "./progress.routes";
import weakTopicRoutes from "./weakTopic.routes";
import recommendationRoutes from "./recommendation.routes";
import aiFeedbackRoutes from "./aiFeedback.routes";
import onboardingRoutes from "./onboarding.routes";
import hintRoutes from "./hint.routes";

const router = Router();

// ─── Mount route groups ───────────────────────────────────────────────────────
router.use("/health", healthRoutes);
router.use("/progress", progressRoutes);
router.use("/weak-topics", weakTopicRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/ai-feedback", aiFeedbackRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/hints", hintRoutes);

// Add more routes here as the API grows:
// router.use('/auth',          authRoutes);
// router.use('/users',         userRoutes);
// router.use('/courses',       courseRoutes);

export default router;
