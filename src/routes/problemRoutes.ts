import { Router } from 'express';
import { submitCode } from '../controllers/problemController';

const router = Router();

router.post('/:problemId/submit', submitCode);

export default router;
