/**
 * Централизованная система логирования
 * Логирует важные операции с контекстом и timestamp
 */

export type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Форматирует log сообщение с timestamp и контекстом
   */
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const parts = [
      `[${timestamp}]`,
      `[${level.toUpperCase()}]`,
    ];

    if (context?.userId) {
      parts.push(`[User: ${context.userId.slice(0, 8)}...]`);
    }

    if (context?.operation) {
      parts.push(`[Op: ${context.operation}]`);
    }

    parts.push(message);

    if (context?.metadata && Object.keys(context.metadata).length > 0) {
      // Фильтруем sensitive данные
      const safeMetadata = this.sanitizeMetadata(context.metadata);
      parts.push(JSON.stringify(safeMetadata));
    }

    return parts.join(' ');
  }

  /**
   * Удаляет sensitive данные из metadata
   */
  private sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sensitive = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (sensitive.some(s => lowerKey.includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * INFO: Обычные операции (успешные запросы, состояния)
   */
  info(message: string, context?: LogContext) {
    const formatted = this.format('info', message, context);
    console.log(formatted);
  }

  /**
   * WARN: Предупреждения (deprecated функции, неоптимальные использования)
   */
  warn(message: string, context?: LogContext) {
    const formatted = this.format('warn', message, context);
    console.warn(formatted);
  }

  /**
   * ERROR: Ошибки (failed операции, exceptions)
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const formatted = this.format('error', message, context);

    if (error instanceof Error) {
      console.error(formatted, {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      });
    } else if (error) {
      console.error(formatted, error);
    } else {
      console.error(formatted);
    }
  }

  /**
   * Логирование аутентификации
   */
  auth(action: 'login' | 'logout' | 'failed', context?: LogContext) {
    this.info(`Authentication: ${action}`, {
      ...context,
      operation: 'auth',
    });
  }

  /**
   * Логирование операций администратора
   */
  admin(action: string, context?: LogContext) {
    this.info(`Admin action: ${action}`, {
      ...context,
      operation: 'admin',
    });
  }

  /**
   * Логирование API запросов
   */
  api(endpoint: string, method: string, status: number, context?: LogContext) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this[level](`API ${method} ${endpoint} - ${status}`, {
      ...context,
      operation: 'api',
      metadata: {
        ...(context?.metadata || {}),
        status,
        method,
        endpoint,
      },
    });
  }

  /**
   * Логирование безопасности
   */
  security(event: string, context?: LogContext) {
    this.warn(`Security event: ${event}`, {
      ...context,
      operation: 'security',
    });
  }

  /**
   * Логирование производительности
   */
  performance(operation: string, durationMs: number, context?: LogContext) {
    const level = durationMs > 1000 ? 'warn' : 'info';
    this[level](`Performance: ${operation} took ${durationMs}ms`, {
      ...context,
      operation: 'performance',
      metadata: {
        ...(context?.metadata || {}),
        durationMs,
      },
    });
  }
}

// Singleton instance
export const logger = new Logger();
