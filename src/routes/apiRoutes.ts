import { Router } from 'express';
import gameRoutes from './gameRoutes';
import userRoutes from './userRoutes';
import problemRoutes from './problemRoutes';

const router = Router();

// Mount route modules
router.use('/games', gameRoutes);
router.use('/users', userRoutes);
router.use('/problems', problemRoutes);

export default router;