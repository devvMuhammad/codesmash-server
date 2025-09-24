import { Router } from 'express';
import { createGame, getGameById } from '../controllers/gameController';

const router = Router();

router.post('/', createGame);
router.get('/:gameId', getGameById);

export default router;