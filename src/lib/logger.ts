/**
 * Logger Utility
 * 
 * Environment-aware logging for QR Studios Frontend
 * In production, only warnings and errors are logged
 * In development, all logs are shown
 */

const isDevelopment = process.env.NODE_ENV === 'development';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
    prefix?: string;
    showTimestamp?: boolean;
}

class Logger {
    private prefix: string;
    private showTimestamp: boolean;

    constructor(options: LoggerOptions = {}) {
        this.prefix = options.prefix || '[App]';
        this.showTimestamp = options.showTimestamp ?? false;
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = this.showTimestamp ? `[${new Date().toISOString()}] ` : '';
        return `${timestamp}${this.prefix} ${message}`;
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
    error(message: string, ...args: unknown[]): void {
        console.error(this.formatMessage('error', message), ...args);
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
export const logger = new Logger({ prefix: '[App]' });
export const authLogger = new Logger({ prefix: '[Auth]' });
export const apiLogger = new Logger({ prefix: '[API]' });
export const cartLogger = new Logger({ prefix: '[Cart]' });
export const checkoutLogger = new Logger({ prefix: '[Checkout]' });

// Export class for custom loggers
export { Logger };

// Utility function for simple debug logging
export function debugLog(message: string, ...args: unknown[]): void {
    if (isDevelopment) {
        console.log(message, ...args);
    }
}

// Factory function to create custom loggers
export function createLogger(prefix: string): Logger {
    return new Logger({ prefix: `[${prefix}]` });
}
