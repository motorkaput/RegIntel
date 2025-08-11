import { randomUUID } from 'crypto';

export interface LogContext {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, any>;
  error?: Error;
}

class Logger {
  private logLevel: string;

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= currentLevelIndex;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'jwt',
      'session'
    ];

    const sanitized = { ...data };

    // Redact sensitive fields
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }

      // Hash email addresses for privacy
      if (key.toLowerCase().includes('email') && typeof sanitized[key] === 'string') {
        const email = sanitized[key] as string;
        if (email.includes('@')) {
          const [local, domain] = email.split('@');
          sanitized[key] = `${local.substring(0, 2)}***@${domain}`;
        }
      }
    });

    return sanitized;
  }

  private formatLog(context: LogContext): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: context.level.toUpperCase(),
      service: 'permeate-enterprise',
      message: context.message,
      ...(context.requestId && { requestId: context.requestId }),
      ...(context.tenantId && { tenantId: context.tenantId }),
      ...(context.userId && { userId: context.userId }),
      ...(context.data && { data: this.sanitizeData(context.data) }),
      ...(context.error && {
        error: {
          name: context.error.name,
          message: context.error.message,
          stack: context.error.stack
        }
      })
    };

    if (process.env.NODE_ENV === 'development') {
      // Pretty format for development
      return `[${timestamp}] ${context.level.toUpperCase()}: ${context.message}${
        context.data ? '\n' + JSON.stringify(logEntry.data, null, 2) : ''
      }${context.error ? '\n' + context.error.stack : ''}`;
    } else {
      // JSON format for production
      return JSON.stringify(logEntry);
    }
  }

  private log(context: LogContext): void {
    if (!this.shouldLog(context.level)) return;

    const formattedLog = this.formatLog(context);

    switch (context.level) {
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
        console.error(formattedLog);
        break;
    }
  }

  debug(message: string, data?: Record<string, any>, requestId?: string): void {
    this.log({ level: 'debug', message, data, requestId });
  }

  info(message: string, data?: Record<string, any>, requestId?: string): void {
    this.log({ level: 'info', message, data, requestId });
  }

  warn(message: string, data?: Record<string, any>, requestId?: string): void {
    this.log({ level: 'warn', message, data, requestId });
  }

  error(message: string, error?: Error, data?: Record<string, any>, requestId?: string): void {
    this.log({ level: 'error', message, error, data, requestId });
  }

  // Context-aware logging methods
  withContext(context: { requestId?: string; tenantId?: string; userId?: string }) {
    return {
      debug: (message: string, data?: Record<string, any>) =>
        this.log({ level: 'debug', message, data, ...context }),
      info: (message: string, data?: Record<string, any>) =>
        this.log({ level: 'info', message, data, ...context }),
      warn: (message: string, data?: Record<string, any>) =>
        this.log({ level: 'warn', message, data, ...context }),
      error: (message: string, error?: Error, data?: Record<string, any>) =>
        this.log({ level: 'error', message, error, data, ...context })
    };
  }
}

export const logger = new Logger();

// Request ID generation utility
export function generateRequestId(): string {
  return randomUUID();
}