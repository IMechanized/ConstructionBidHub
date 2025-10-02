/**
 * Error sanitization and handling utilities
 * Ensures safe error messages in production while preserving debug info in development
 */

import { Response } from 'express';

const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEV === 'true';

/**
 * Sanitized error response interface
 */
interface ErrorResponse {
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * Sanitize error for client response
 * In production: Returns ONLY generic message, NO stack traces or details
 * In development: Returns error message and stack for debugging
 */
export function sanitizeError(error: unknown, fallbackMessage: string = 'An error occurred'): ErrorResponse {
  if (isDevelopment) {
    // Development: Return error message and stack only (no raw error object)
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack
      };
    }
    return {
      message: String(error || fallbackMessage)
    };
  }

  // Production: Return ONLY the generic message, nothing else
  return {
    message: fallbackMessage
  };
}

/**
 * Sensitive field names that should be redacted from logs
 */
const SENSITIVE_LOG_FIELDS = [
  'password', 'secret', 'token', 'key', 'authorization',
  'cookie', 'session', 'credential', 'apikey', 'api_key',
  'private', 'ssn', 'creditcard', 'cvv'
];

/**
 * Deep sanitize object for logging - redacts sensitive fields
 */
function deepSanitize(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[max_depth]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item, depth + 1));
  }
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_LOG_FIELDS.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = deepSanitize(value, depth + 1);
      }
    }
    return sanitized;
  }
  return String(obj);
}

/**
 * Sanitize error for server-side logging
 * Removes sensitive fields from ALL error types
 */
function sanitizeForLogging(error: unknown): unknown {
  if (error instanceof Error) {
    // For Error objects: extract only safe fields and sanitize any custom properties
    const baseError = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
    
    // If Error has custom enumerable properties, sanitize them
    const customProps: Record<string, unknown> = {};
    for (const key of Object.keys(error)) {
      if (!['name', 'message', 'stack'].includes(key)) {
        customProps[key] = deepSanitize((error as any)[key]);
      }
    }
    
    return Object.keys(customProps).length > 0 
      ? { ...baseError, ...customProps }
      : baseError;
  }
  
  // For non-Error objects: deep sanitize to remove sensitive fields
  return deepSanitize(error);
}

/**
 * Send sanitized error response
 * Logs sanitized error server-side, sends safe message to client
 */
export function sendErrorResponse(
  res: Response,
  error: unknown,
  statusCode: number,
  userMessage: string,
  logContext?: string
): void {
  // Log sanitized error server-side (no raw error objects)
  const context = logContext ? `[${logContext}]` : '';
  const safeError = sanitizeForLogging(error);
  console.error(`${context} Error:`, safeError);

  // Send sanitized response to client
  const sanitized = sanitizeError(error, userMessage);
  res.status(statusCode).json(sanitized);
}

/**
 * Common error response messages (safe for production)
 */
export const ErrorMessages = {
  // Authentication & Authorization
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  INVALID_CREDENTIALS: 'Invalid email or password',
  
  // Generic
  INTERNAL_ERROR: 'An internal error occurred',
  BAD_REQUEST: 'Invalid request',
  NOT_FOUND: 'Resource not found',
  
  // Operations
  UPLOAD_FAILED: 'Failed to upload file',
  FETCH_FAILED: 'Failed to retrieve data',
  CREATE_FAILED: 'Failed to create resource',
  UPDATE_FAILED: 'Failed to update resource',
  DELETE_FAILED: 'Failed to delete resource',
  
  // Validation
  VALIDATION_FAILED: 'Validation failed',
  INVALID_INPUT: 'Invalid input provided',
};

/**
 * Check if error is a validation error with safe message
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof Error) {
    // Common validation error patterns that are safe to expose
    const safePatterns = [
      /required/i,
      /invalid/i,
      /must be/i,
      /cannot be/i,
      /already exists/i,
    ];
    return safePatterns.some(pattern => pattern.test(error.message));
  }
  return false;
}

/**
 * Get safe error message for validation errors
 * Returns the actual validation message if safe, otherwise a generic message
 */
export function getSafeValidationMessage(error: unknown): string {
  if (isDevelopment) {
    return error instanceof Error ? error.message : ErrorMessages.VALIDATION_FAILED;
  }
  
  // In production, only return the message if it's a known safe validation error
  if (isValidationError(error) && error instanceof Error) {
    return error.message;
  }
  
  return ErrorMessages.VALIDATION_FAILED;
}
