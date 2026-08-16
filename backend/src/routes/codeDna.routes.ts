import { Router } from "express";
import { getCodeDna } from "../controllers/codeDna.controller";
import { requireAuth, withAuth } from "../utils/auth";

const router = Router();

/**
 * @route   GET /api/code-dna
 * @desc    Aggregated real-data stats powering the Code DNA Behaviour/Suggestions tabs
 * @access  Private
 */
router.get("/", requireAuth, withAuth(getCodeDna));

export default router;