/**
 * Metrics Middleware
 * 
 * Tracks HTTP request/response metrics for Prometheus.
 */

import type { Context, Next } from 'hono';
import { metricsService } from '../services/metrics.service';

/**
 * Middleware to track HTTP request metrics
 */
export const metricsMiddleware = async (c: Context, next: Next) => {
    const startTime = Date.now();

    await next();

    const duration = Date.now() - startTime;
    const status = c.res.status;
    const method = c.req.method;
    const path = c.req.path;

    metricsService.trackRequest(method, path, status, duration);
};

/**
 * Handler for /metrics endpoint (Prometheus scraping)
 */
export const metricsHandler = (c: Context) => {
    const metrics = metricsService.getMetrics();
    return new Response(metrics, {
        headers: {
            'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        },
    });
};
