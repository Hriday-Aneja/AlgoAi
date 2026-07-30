import { Router } from 'express';
import { fetchAllProblems } from '../controllers/problem.controller';

const router = Router();

router.get('/', fetchAllProblems);

export default router;
