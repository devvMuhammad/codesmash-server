import { Router } from 'express';
import { getUserChallenges } from '../controllers/userController';

const router = Router();

router.get('/:userId/challenges', getUserChallenges);

export default router;