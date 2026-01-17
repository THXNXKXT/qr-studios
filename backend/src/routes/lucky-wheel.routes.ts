import { Hono } from 'hono';
import { authRefreshRateLimit, authSessionRateLimit, luckyWheelRateLimit } from '../middleware/rate-limit.middleware';
import { luckyWheelController } from '../controllers/lucky-wheel.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = new Hono();

// Public/Authenticated routes
router.get('/status', luckyWheelController.getStatus);
router.get('/rewards', luckyWheelController.getActiveRewards);
router.post('/spin', authMiddleware, luckyWheelRateLimit, luckyWheelController.spin);
router.get('/history', authMiddleware, luckyWheelController.getUserHistory);

// Admin routes
router.get('/admin/rewards', authMiddleware, adminMiddleware, luckyWheelController.getAllRewards);
router.post('/admin/rewards', authMiddleware, adminMiddleware, luckyWheelController.createReward);
router.patch('/admin/rewards/:id', authMiddleware, adminMiddleware, luckyWheelController.updateReward);
router.delete('/admin/rewards/:id', authMiddleware, adminMiddleware, luckyWheelController.deleteReward);

export default router;
