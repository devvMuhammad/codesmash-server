import { Router } from 'express';
import { getUserChallenges, getLeaderboard, getUserProfile } from '../controllers/userController';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/:userId/profile', getUserProfile);
router.get('/:userId/challenges', getUserChallenges);

export default router;