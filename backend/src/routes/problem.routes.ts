import { Router } from 'express';
import {
  fetchAllProblems,
  fetchProblemById,
} from "../controllers/problem.controller";

const router = Router();

router.get('/', fetchAllProblems);
router.get("/:id", fetchProblemById);

export default router;
