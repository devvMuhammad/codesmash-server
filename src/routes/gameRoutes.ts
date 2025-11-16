import { Router } from 'express';
import { createGame, getGameById, joinGame, getLiveBattles, getOpenChallenges } from '../controllers/gameController';

const router = Router();

router.post('/', createGame);
router.post('/join', joinGame);
router.get('/live', getLiveBattles);
router.get('/open', getOpenChallenges);
router.get('/:gameId', getGameById);

export default router;