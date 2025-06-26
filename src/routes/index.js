import express from 'express';
import userRoutes from './user.routes';
import paymentRoutes from './payment.routes';
import transactionRoutes from './transaction.routes';
import bonusRoutes from './bonus.routes';
import prizesRoutes from './prizes.routes';
import { verifyToken } from '../middleware/auth';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/payments', paymentRoutes);
router.use('/transactions', verifyToken, transactionRoutes);
router.use('/bonus', verifyToken, bonusRoutes);
router.use('/prizes', prizesRoutes);

export default router;
