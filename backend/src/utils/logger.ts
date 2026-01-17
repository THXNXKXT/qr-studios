/**
 * Logger Utility for Backend
 * 
 * Environment-aware logging for QR Studios Backend
 * In production, debug logs are suppressed
 * All logs are prefixed for easy filtering
 */

import { env } from '../config/env';

const isDevelopment = env.NODE_ENV === 'development';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
    prefix?: string;
    showTimestamp?: boolean;
}

class Logger {
    private prefix: string;
    private showTimestamp: boolean;

    constructor(options: LoggerOptions = {}) {
        this.prefix = options.prefix || '[Backend]';
        this.showTimestamp = options.showTimestamp ?? true;
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = this.showTimestamp ? `[${new Date().toISOString()}] ` : '';
        const levelTag = `[${level.toUpperCase()}]`;
        return `${timestamp}${this.prefix} ${levelTag} ${message}`;
    }

    /**
     * Debug logs - only shown in development
     */
    debug(message: string, ...args: unknown[]): void {
        if (isDevelopment) {
            console.log(this.formatMessage('debug', message), ...args);
        }
    }

    /**
     * Info logs - only shown in development
     */
    info(message: string, ...args: unknown[]): void {
        if (isDevelopment) {
            console.info(this.formatMessage('info', message), ...args);
        }
    }

    /**
     * Warning logs - always shown
     */
    warn(message: string, ...args: unknown[]): void {
        console.warn(this.formatMessage('warn', message), ...args);
    }

    /**
     * Error logs - always shown
     */
    error(message: string, error?: unknown): void {
        console.error(this.formatMessage('error', message), error);
    }

    /**
     * Create a child logger with a different prefix
     */
    child(prefix: string): Logger {
        return new Logger({
            prefix: `${this.prefix}${prefix}`,
            showTimestamp: this.showTimestamp
        });
    }
}

// Default loggers for different modules
export const logger = new Logger({ prefix: '[Backend]' });
export const authLogger = new Logger({ prefix: '[Auth]' });
export const dbLogger = new Logger({ prefix: '[DB]' });
export const stripeLogger = new Logger({ prefix: '[Stripe]' });
export const r2Logger = new Logger({ prefix: '[R2]' });
export const emailLogger = new Logger({ prefix: '[Email]' });

// Export class for custom loggers
export { Logger };

// Utility function for simple debug logging
export function debugLog(message: string, ...args: unknown[]): void {
    if (isDevelopment) {
        console.log(`[DEBUG] ${message}`, ...args);
    }
}
