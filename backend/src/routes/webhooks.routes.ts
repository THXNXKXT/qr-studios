import { Hono } from 'hono';
import { webhooksController } from '../controllers/webhooks.controller';

const webhooks = new Hono();

webhooks.post('/stripe', webhooksController.handleStripe);

export default webhooks;
