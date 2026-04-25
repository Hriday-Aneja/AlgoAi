import { Router } from "express";
import { register, login, getProfile } from "../controllers/auth.controller";
import { requireAuth } from "../utils/auth";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", requireAuth, getProfile);

export default router;