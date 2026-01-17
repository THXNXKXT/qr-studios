import { Hono } from 'hono';
import { statsController } from '../controllers/stats.controller';

const stats = new Hono();

stats.get('/', statsController.getPublicStats);
stats.get('', statsController.getPublicStats);

export default stats;
