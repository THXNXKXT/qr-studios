import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { usersController } from '../controllers/users.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { updateProfileSchema, idParamSchema } from '../schemas';

const users = new Hono();

users.use('*', authMiddleware);

users.get('/profile', usersController.getProfile);
users.post('/avatar', usersController.uploadAvatar);
users.patch('/profile', zValidator('json', updateProfileSchema), usersController.updateProfile);
users.get('/balance', usersController.getBalance);
users.get('/stats', usersController.getDashboardStats);
users.get('/orders', usersController.getOrders);
users.get('/licenses', usersController.getLicenses);
users.get('/notifications', usersController.getNotifications);
users.get('/notifications/unread-count', usersController.getUnreadNotificationsCount);
users.get('/transactions', usersController.getTransactions);
users.patch('/notifications/:id/read', zValidator('param', idParamSchema), usersController.markNotificationAsRead);
users.post('/notifications/read-all', usersController.markAllNotificationsAsRead);

export default users;
