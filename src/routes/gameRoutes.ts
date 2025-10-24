import { Router } from 'express';
import { createGame, getGameById, joinGame } from '../controllers/gameController';

const router = Router();

router.post('/', createGame);
router.post('/join', joinGame);
router.get('/:gameId', getGameById);

export default router;