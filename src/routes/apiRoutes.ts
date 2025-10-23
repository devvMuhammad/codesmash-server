import { Router } from 'express';
import gameRoutes from './gameRoutes';
import userRoutes from './userRoutes';

const router = Router();

// Mount route modules
router.use('/games', gameRoutes);
router.use('/users', userRoutes);

export default router;