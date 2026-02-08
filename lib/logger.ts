/**
 * Simple logging utility for the application
 * In production, this could be extended to send logs to a service like Sentry
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: string
  error?: unknown
  timestamp: Date
}

const isDevelopment = process.env.NODE_ENV === 'development'

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }
  return String(error)
}

function log(level: LogLevel, message: string, context?: string, error?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    context,
    error,
    timestamp: new Date()
  }

  // In development, log to console
  if (isDevelopment) {
    const prefix = context ? `[${context}]` : ''
    switch (level) {
      case 'debug':
        console.debug(`${prefix} ${message}`, error || '')
        break
      case 'info':
        console.info(`${prefix} ${message}`, error || '')
        break
      case 'warn':
        console.warn(`${prefix} ${message}`, error || '')
        break
      case 'error':
        console.error(`${prefix} ${message}`, error || '')
        break
    }
  }

  // In production, we could send to an error tracking service
  // e.g., Sentry, LogRocket, etc.
  if (!isDevelopment && level === 'error') {
    // Future: Send to error tracking service
    // sentry.captureException(error)
  }
}

export const logger = {
  debug: (message: string, context?: string) => log('debug', message, context),
  info: (message: string, context?: string) => log('info', message, context),
  warn: (message: string, context?: string, error?: unknown) => log('warn', message, context, error),
  error: (message: string, context?: string, error?: unknown) => log('error', message, context, error),
}

export default logger
