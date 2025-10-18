import { Router } from 'express';
import { submitCode, runCode } from '../controllers/problemController';

const router = Router();

router.post('/:problemId/run', runCode);
router.post('/:problemId/submit', submitCode);

export default router;
