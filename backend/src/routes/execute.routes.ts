import { Router } from "express";
import { proxyExecute, proxyRuntimes } from "../controllers/execute.controller";

const router = Router();

/**
 * @route   POST /api/execute
 * @desc    Execute code via backend JDoodle integration
 * @access  Public
 */
router.post("/", proxyExecute);

/**
 * @route   GET /api/execute/runtimes
 * @desc    Get available JDoodle runtimes
 * @access  Public
 */
router.get("/runtimes", proxyRuntimes);

export default router;
