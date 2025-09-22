import { Router } from 'express';
import { createGame } from '../controllers/gameController';

const router = Router();

router.post('/games', createGame);

export default router;