import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { env } from './config/env';

// Import existing routes to wrap them or just the types for documentation
// Note: For full OpenAPI support, we should ideally use OpenAPIHono for all routes.
// But for now, we can create a documentation app that describes the API.

const app = new OpenAPIHono();

// Swagger UI configuration
app.get('/ui', swaggerUI({ url: '/doc' }));

// OpenAPI Documentation
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'QR Studios API',
    description: 'API Documentation for QR Studios Store & License System',
  },
  servers: [
    {
      url: env.API_URL,
      description: 'Current Environment',
    },
  ],
});

export default app;
