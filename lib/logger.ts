"use server";

/**
 * Structured Logger for DealPig
 * Provides consistent logging throughout the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  module?: string;
  data?: Record<string, any>;
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
}

// Configure log level based on environment
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
};

/**
 * Determines if a log message should be processed based on configured level
 */
async function shouldLog(level: LogLevel): Promise<boolean> {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

/**
 * Format error object for logging
 */
async function formatError(error: any): Promise<LogEntry['error']> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  
  return {
    message: String(error)
  };
}

/**
 * Core logging function
 */
async function logMessage(level: LogLevel, message: string, moduleOrData?: string | Record<string, any>, data?: Record<string, any>): Promise<void> {
  if (!(await shouldLog(level))) return;
  
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };
  
  // Handle flexible parameter order
  if (typeof moduleOrData === 'string') {
    entry.module = moduleOrData;
    if (data) entry.data = data;
  } else if (moduleOrData) {
    entry.data = moduleOrData;
  }
  
  // Output log based on environment
  const output = JSON.stringify(entry);
  
  switch (level) {
    case 'debug':
      console.debug(output);
      break;
    case 'info':
      console.log(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'error':
    case 'fatal':
      console.error(output);
      break;
  }
}

/**
 * Log debug message
 */
export async function debug(message: string, moduleOrData?: string | Record<string, any>, data?: Record<string, any>): Promise<void> {
  await logMessage('debug', message, moduleOrData, data);
}

/**
 * Log info message
 */
export async function info(message: string, moduleOrData?: string | Record<string, any>, data?: Record<string, any>): Promise<void> {
  await logMessage('info', message, moduleOrData, data);
}

/**
 * Log warning message
 */
export async function warn(message: string, moduleOrData?: string | Record<string, any>, data?: Record<string, any>): Promise<void> {
  await logMessage('warn', message, moduleOrData, data);
}

/**
 * Log error message
 */
export async function error(message: string, errorOrModule?: Error | string, moduleOrData?: string | Record<string, any>, data?: Record<string, any>): Promise<void> {
  const entry: LogEntry = {
    level: 'error',
    message,
    timestamp: new Date().toISOString()
  };
  
  // Handle different parameter combinations
  if (errorOrModule instanceof Error) {
    entry.error = await formatError(errorOrModule);
    
    if (typeof moduleOrData === 'string') {
      entry.module = moduleOrData;
      if (data) entry.data = data;
    } else if (moduleOrData) {
      entry.data = moduleOrData;
    }
  } else if (typeof errorOrModule === 'string') {
    entry.module = errorOrModule;
    
    if (moduleOrData && typeof moduleOrData !== 'string') {
      entry.data = moduleOrData;
    }
  } else if (errorOrModule) {
    entry.data = errorOrModule as Record<string, any>;
  }
  
  console.error(JSON.stringify(entry));
}

/**
 * Log fatal error message
 */
export async function fatal(message: string, error?: Error, moduleOrData?: string | Record<string, any>, data?: Record<string, any>): Promise<void> {
  const entry: LogEntry = {
    level: 'fatal',
    message,
    timestamp: new Date().toISOString()
  };
  
  if (error) {
    entry.error = await formatError(error);
  }
  
  if (typeof moduleOrData === 'string') {
    entry.module = moduleOrData;
    if (data) entry.data = data;
  } else if (moduleOrData) {
    entry.data = moduleOrData;
  }
  
  console.error(JSON.stringify(entry));
}

// Export an async function that returns the logger object
export default async function getLogger() {
  return {
    debug,
    info,
    warn,
    error,
    fatal
  } as const;
}