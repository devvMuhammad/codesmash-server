import { Router } from 'express';
import gameRoutes from './gameRoutes';
import userRoutes from './userRoutes';
import problemRoutes from './problemRoutes';
import feedbackRoutes from './feedbackRoutes';

const router = Router();

// Mount route modules
router.use('/games', gameRoutes);
router.use('/users', userRoutes);
router.use('/problems', problemRoutes);
router.use('/feedback', feedbackRoutes);

export default router;