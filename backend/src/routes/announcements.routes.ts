import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { announcementsController } from '../controllers/announcements.controller';
import { idParamSchema } from '../schemas';

const announcements = new Hono();

announcements.get('/', announcementsController.getActive);
announcements.get('/:id', zValidator('param', idParamSchema), announcementsController.getById);

export default announcements;
