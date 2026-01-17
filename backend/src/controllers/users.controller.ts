import type { Context } from 'hono';
import { usersService } from '../services/users.service';
import { success } from '../utils/response';
import { idParamSchema, updateProfileSchema } from '../schemas';

import { storageService } from '../services/storage.service';
import { nanoid } from 'nanoid';
import { BadRequestError } from '../utils/errors';

export const usersController = {
  async getProfile(c: Context) {
    const user = c.get('user');
    const profile = await usersService.getUserProfile(user.id);
    return success(c, profile);
  },

  async updateProfile(c: Context) {
    const user = c.get('user');
    const { avatar } = updateProfileSchema.parse(await c.req.json());

    const updated = await usersService.updateUserProfile(user.id, {
      avatar,
    });

    return success(c, updated, 'Profile updated successfully');
  },

  async getBalance(c: Context) {
    const user = c.get('user');
    const balance = await usersService.getUserBalance(user.id);
    return success(c, balance);
  },

  async getOrders(c: Context) {
    const user = c.get('user');
    const orders = await usersService.getUserOrders(user.id);
    return success(c, orders);
  },

  async getLicenses(c: Context) {
    const user = c.get('user');
    const licenses = await usersService.getUserLicenses(user.id);
    return success(c, licenses);
  },

  async getNotifications(c: Context) {
    const user = c.get('user');
    const notifications = await usersService.getUserNotifications(user.id);
    return success(c, notifications);
  },

  async getUnreadNotificationsCount(c: Context) {
    const user = c.get('user');
    const result = await usersService.getUnreadNotificationsCount(user.id);
    return success(c, result);
  },

  async getTransactions(c: Context) {
    const user = c.get('user');
    const transactions = await usersService.getTransactionHistory(user.id);
    return success(c, transactions);
  },

  async markNotificationAsRead(c: Context) {
    const user = c.get('user');
    const { id } = idParamSchema.parse(c.req.param());

    const notification = await usersService.markNotificationAsRead(user.id, id);
    return success(c, notification, 'Notification marked as read');
  },

  async markAllNotificationsAsRead(c: Context) {
    const user = c.get('user');
    await usersService.markAllNotificationsAsRead(user.id);
    return success(c, null, 'All notifications marked as read');
  },

  async getDashboardStats(c: Context) {
    const user = c.get('user');
    const result = await usersService.getUserDashboardStats(user.id);
    return success(c, result);
  },

  async uploadAvatar(c: Context) {
    const user = c.get('user');
    const body = await c.req.parseBody();
    const file = body['file'] as File;

    if (!file) {
      throw new BadRequestError('No file uploaded');
    }

    if (!file.type.startsWith('image/')) {
      throw new BadRequestError('Only image files are allowed');
    }

    const extension = file.name.split('.').pop();
    const fileName = `${user.id}-${nanoid(8)}.${extension}`;
    const key = `avatars/${fileName}`;

    const buffer = await file.arrayBuffer();
    const publicUrl = await storageService.uploadFile(key, new Uint8Array(buffer), file.type);

    // Update user profile with new avatar URL
    await usersService.updateUserProfile(user.id, { avatar: publicUrl });

    return success(c, {
      url: publicUrl,
      key: key,
    }, 'Avatar uploaded successfully');
  },
};
