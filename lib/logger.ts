type LogLevel = 'info' | 'warn' | 'error';
type LogContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(process.env.NODE_ENV !== 'production' && error.stack ? { stack: error.stack } : {})
    };
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;

    return {
      name:
        typeof record.name === 'string'
          ? record.name
          : typeof error.constructor?.name === 'string'
            ? error.constructor.name
            : 'Error',
      message: typeof record.message === 'string' ? record.message : String(error),
      ...(process.env.NODE_ENV !== 'production' && typeof record.stack === 'string'
        ? { stack: record.stack }
        : {})
    };
  }

  return {
    value: typeof error === 'string' ? error : String(error)
  };
}

function write(level: LogLevel, event: string, context: LogContext) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context
  });

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logInfo(event: string, context: LogContext = {}) {
  write('info', event, context);
}

export function logWarn(event: string, context: LogContext = {}) {
  write('warn', event, context);
}

export function logError(event: string, error: unknown, context: LogContext = {}) {
  write('error', event, {
    ...context,
    error: serializeError(error)
  });
}
