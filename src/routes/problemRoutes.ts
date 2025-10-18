import { Router } from 'express';
import { submitCode, runCode } from '../controllers/problemController';
import { submitCodeLimiter, runCodeLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/:problemId/run', runCodeLimiter, runCode);
router.post('/:problemId/submit', submitCodeLimiter, submitCode);

export default router;
