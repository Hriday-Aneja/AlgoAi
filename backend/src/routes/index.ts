import { Router } from "express";
import authRoutes from "./auth.routes";
import healthRoutes from "./health.routes";
import progressRoutes from "./progress.routes";
import weakTopicRoutes from "./weakTopic.routes";
import recommendationRoutes from "./recommendation.routes";
import advancedRecommendationRoutes from "./advanced-recommendation.routes";
import aiFeedbackRoutes from "./aiFeedback.routes";
import onboardingRoutes from "./onboarding.routes";
import hintRoutes from "./hint.routes";
import submissionRoutes from "./submission.routes";
import visualizeRoutes from "./visualize.routes";
import streakRoutes from "./streak.routes";
import revisionRoutes from "./revision.routes";
import bossRoutes from "./boss.routes";
import chatRoutes from "./chat.routes";
import mistakeRoutes from "./mistake.routes";
import executeRoutes from "./execute.routes";
import explainRoutes from "./explain.routes";
import problemRoutes from "./problem.routes";
import userRoutes from "./user.routes";
import { authenticateToken } from "../middleware/auth.middleware";
import { getWeeklyActivity } from "../controllers/user.controller";

const router = Router();

// ─── Mount route groups ───────────────────────────────────────────────────────
router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/progress", progressRoutes);
router.use("/weak-topics", weakTopicRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/advanced-recommendations", advancedRecommendationRoutes);
router.use("/ai-feedback", aiFeedbackRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/problems", problemRoutes);
router.use("/hints", hintRoutes);
router.use("/submissions", submissionRoutes);
router.use("/visualize", visualizeRoutes);
router.use("/streak", streakRoutes);
router.use("/revision", revisionRoutes);
router.use("/boss", bossRoutes);
router.use("/chat", chatRoutes);
router.use("/mistakes", mistakeRoutes);
router.get("/weekly-activity", authenticateToken, getWeeklyActivity);
router.use("/execute", executeRoutes);
router.use("/explain", explainRoutes);
router.use("/user", userRoutes);

// Add more routes here as the API grows:
// router.use('/users',         userRoutes);
// router.use('/courses',       courseRoutes);

export default router;