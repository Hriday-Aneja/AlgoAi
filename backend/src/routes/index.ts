import { Router } from "express";
import healthRoutes from "./health.routes";
import progressRoutes from "./progress.routes";
import weakTopicRoutes from "./weakTopic.routes";
import recommendationRoutes from "./recommendation.routes";
import aiFeedbackRoutes from "./aiFeedback.routes";
import onboardingRoutes from "./onboarding.routes";
import hintRoutes from "./hint.routes";
import visualizeRoutes from "./visualize.routes";
<<<<<<< HEAD
import streakRoutes from "./streak.routes";
=======
import revisionRoutes from "./revision.routes";
import bossRoutes from "./boss.routes";
import chatRoutes from "./chat.routes";
>>>>>>> 9d205bc (backend more features)

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
<<<<<<< HEAD
router.use("/streak", streakRoutes);
=======
router.use("/revision", revisionRoutes);
router.use("/boss", bossRoutes);
router.use("/chat", chatRoutes);
>>>>>>> 9d205bc (backend more features)

// Add more routes here as the API grows:
// router.use('/auth',          authRoutes);
// router.use('/users',         userRoutes);
// router.use('/courses',       courseRoutes);

export default router;
