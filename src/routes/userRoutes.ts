import { Router } from 'express';
import { getUserChallenges, getLeaderboard } from '../controllers/userController';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/:userId/challenges', getUserChallenges);

export default router;