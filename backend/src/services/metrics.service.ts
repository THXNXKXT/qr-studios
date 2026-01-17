/**
 * Metrics Service
 * 
 * Prometheus-compatible metrics for production monitoring.
 * Tracks HTTP requests, response times, and business metrics.
 */

import { env } from '../config/env';

// Metric types
interface Counter {
    name: string;
    help: string;
    labels: string[];
    values: Map<string, number>;
}

interface Histogram {
    name: string;
    help: string;
    labels: string[];
    buckets: number[];
    values: Map<string, { count: number; sum: number; buckets: Map<number, number> }>;
}

interface Gauge {
    name: string;
    help: string;
    labels: string[];
    values: Map<string, number>;
}

class MetricsService {
    private counters: Map<string, Counter> = new Map();
    private histograms: Map<string, Histogram> = new Map();
    private gauges: Map<string, Gauge> = new Map();
    private startTime: number = Date.now();

    constructor() {
        // Initialize default metrics
        this.createCounter('http_requests_total', 'Total HTTP requests', ['method', 'path', 'status']);
        this.createHistogram('http_request_duration_seconds', 'HTTP request duration in seconds', ['method', 'path'], [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]);
        this.createCounter('http_errors_total', 'Total HTTP errors', ['method', 'path', 'error_type']);

        // Business metrics
        this.createCounter('orders_total', 'Total orders created', ['status', 'payment_method']);
        this.createCounter('payments_total', 'Total payments processed', ['method', 'status']);
        this.createGauge('active_users', 'Number of active users', []);
        this.createCounter('licenses_issued_total', 'Total licenses issued', ['product_category']);
        this.createCounter('promo_codes_used_total', 'Total promo codes used', ['code']);
        this.createCounter('cache_hits_total', 'Total cache hits', ['operation']);
        this.createCounter('cache_misses_total', 'Total cache misses', ['operation']);
    }

    // Counter methods
    createCounter(name: string, help: string, labels: string[]): void {
        this.counters.set(name, { name, help, labels, values: new Map() });
    }

    incCounter(name: string, labels: Record<string, string> = {}, value: number = 1): void {
        const counter = this.counters.get(name);
        if (!counter) return;

        const key = this.labelsToKey(labels);
        const current = counter.values.get(key) || 0;
        counter.values.set(key, current + value);
    }

    // Histogram methods
    createHistogram(name: string, help: string, labels: string[], buckets: number[]): void {
        this.histograms.set(name, { name, help, labels, buckets, values: new Map() });
    }

    observeHistogram(name: string, labels: Record<string, string>, value: number): void {
        const histogram = this.histograms.get(name);
        if (!histogram) return;

        const key = this.labelsToKey(labels);
        let entry = histogram.values.get(key);
        if (!entry) {
            entry = { count: 0, sum: 0, buckets: new Map() };
            histogram.buckets.forEach(b => entry!.buckets.set(b, 0));
            histogram.values.set(key, entry);
        }

        entry.count++;
        entry.sum += value;
        histogram.buckets.forEach(bucket => {
            if (value <= bucket) {
                entry!.buckets.set(bucket, (entry!.buckets.get(bucket) || 0) + 1);
            }
        });
    }

    // Gauge methods
    createGauge(name: string, help: string, labels: string[]): void {
        this.gauges.set(name, { name, help, labels, values: new Map() });
    }

    setGauge(name: string, labels: Record<string, string> = {}, value: number): void {
        const gauge = this.gauges.get(name);
        if (!gauge) return;
        gauge.values.set(this.labelsToKey(labels), value);
    }

    incGauge(name: string, labels: Record<string, string> = {}, value: number = 1): void {
        const gauge = this.gauges.get(name);
        if (!gauge) return;
        const key = this.labelsToKey(labels);
        gauge.values.set(key, (gauge.values.get(key) || 0) + value);
    }

    decGauge(name: string, labels: Record<string, string> = {}, value: number = 1): void {
        this.incGauge(name, labels, -value);
    }

    // Helper to convert labels to a unique key
    private labelsToKey(labels: Record<string, string>): string {
        return Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}="${v}"`)
            .join(',');
    }

    // Format labels for Prometheus output
    private formatLabels(key: string): string {
        return key ? `{${key}}` : '';
    }

    // Generate Prometheus-compatible output
    getMetrics(): string {
        const lines: string[] = [];
        const uptimeSeconds = (Date.now() - this.startTime) / 1000;

        // Add process metrics
        lines.push('# HELP process_uptime_seconds Process uptime in seconds');
        lines.push('# TYPE process_uptime_seconds gauge');
        lines.push(`process_uptime_seconds ${uptimeSeconds}`);
        lines.push('');

        // Memory metrics
        const memoryUsage = process.memoryUsage();
        lines.push('# HELP process_heap_bytes Process heap size in bytes');
        lines.push('# TYPE process_heap_bytes gauge');
        lines.push(`process_heap_bytes{type="used"} ${memoryUsage.heapUsed}`);
        lines.push(`process_heap_bytes{type="total"} ${memoryUsage.heapTotal}`);
        lines.push('');

        // Counters
        for (const counter of this.counters.values()) {
            lines.push(`# HELP ${counter.name} ${counter.help}`);
            lines.push(`# TYPE ${counter.name} counter`);
            for (const [key, value] of counter.values) {
                lines.push(`${counter.name}${this.formatLabels(key)} ${value}`);
            }
            lines.push('');
        }

        // Histograms
        for (const histogram of this.histograms.values()) {
            lines.push(`# HELP ${histogram.name} ${histogram.help}`);
            lines.push(`# TYPE ${histogram.name} histogram`);
            for (const [key, entry] of histogram.values) {
                const labelStr = key ? `${key},` : '';
                for (const [bucket, count] of entry.buckets) {
                    lines.push(`${histogram.name}_bucket{${labelStr}le="${bucket}"} ${count}`);
                }
                lines.push(`${histogram.name}_bucket{${labelStr}le="+Inf"} ${entry.count}`);
                lines.push(`${histogram.name}_sum{${key}} ${entry.sum}`);
                lines.push(`${histogram.name}_count{${key}} ${entry.count}`);
            }
            lines.push('');
        }

        // Gauges
        for (const gauge of this.gauges.values()) {
            lines.push(`# HELP ${gauge.name} ${gauge.help}`);
            lines.push(`# TYPE ${gauge.name} gauge`);
            for (const [key, value] of gauge.values) {
                lines.push(`${gauge.name}${this.formatLabels(key)} ${value}`);
            }
            lines.push('');
        }

        return lines.join('\n');
    }

    // Track HTTP request
    trackRequest(method: string, path: string, status: number, durationMs: number): void {
        // Normalize path to avoid high cardinality (replace IDs with :id)
        const normalizedPath = path
            .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
            .replace(/\/\d+/g, '/:id');

        this.incCounter('http_requests_total', { method, path: normalizedPath, status: String(status) });
        this.observeHistogram('http_request_duration_seconds', { method, path: normalizedPath }, durationMs / 1000);

        if (status >= 400) {
            const errorType = status >= 500 ? 'server_error' : 'client_error';
            this.incCounter('http_errors_total', { method, path: normalizedPath, error_type: errorType });
        }
    }

    // Business metric helpers
    trackOrder(status: string, paymentMethod: string): void {
        this.incCounter('orders_total', { status, payment_method: paymentMethod });
    }

    trackPayment(method: string, status: string): void {
        this.incCounter('payments_total', { method, status });
    }

    trackLicenseIssued(productCategory: string): void {
        this.incCounter('licenses_issued_total', { product_category: productCategory });
    }

    trackPromoCodeUsed(code: string): void {
        this.incCounter('promo_codes_used_total', { code });
    }

    trackCacheHit(operation: string): void {
        this.incCounter('cache_hits_total', { operation });
    }

    trackCacheMiss(operation: string): void {
        this.incCounter('cache_misses_total', { operation });
    }
}

// Singleton instance
export const metricsService = new MetricsService();
