import { Router } from "express";
import healthRoutes from "./health.routes";
import progressRoutes from "./progress.routes";
import weakTopicRoutes from "./weakTopic.routes";
import recommendationRoutes from "./recommendation.routes";
import aiFeedbackRoutes from "./aiFeedback.routes";
import onboardingRoutes from "./onboarding.routes";
import hintRoutes from "./hint.routes";
import visualizeRoutes from "./visualize.routes";
import streakRoutes from "./streak.routes";
import revisionRoutes from "./revision.routes";
import bossRoutes from "./boss.routes";
import chatRoutes from "./chat.routes";
<<<<<<< HEAD
=======
import mistakeRoutes from "./mistake.routes";
>>>>>>> 4579b5a5a4d9412654ec91f2b0d4c1db2257b6ef

const router = Router();

// ─── Mount route groups ───────────────────────────────────────────────────────
router.use("/health", healthRoutes);
router.use("/progress", progressRoutes);
router.use("/weak-topics", weakTopicRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/ai-feedback", aiFeedbackRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/hints", hintRoutes);
router.use("/visualize", visualizeRoutes);
router.use("/streak", streakRoutes);
router.use("/revision", revisionRoutes);
router.use("/boss", bossRoutes);
router.use("/chat", chatRoutes);
<<<<<<< HEAD
=======
router.use("/mistakes", mistakeRoutes);
>>>>>>> 4579b5a5a4d9412654ec91f2b0d4c1db2257b6ef

// Add more routes here as the API grows:
// router.use('/auth',          authRoutes);
// router.use('/users',         userRoutes);
// router.use('/courses',       courseRoutes);

export default router;
