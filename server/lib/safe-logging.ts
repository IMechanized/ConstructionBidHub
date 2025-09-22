/**
 * Safe Logging Utilities
 * Provides functions to safely log information while redacting sensitive data
 */

// List of sensitive field names to redact
const SENSITIVE_FIELDS = [
  'password', 'confirmPassword', 'currentPassword', 'newPassword',
  'client_secret', 'clientSecret',
  'token', 'accessToken', 'refreshToken', 'apiKey', 'api_key',
  'secret', 'privateKey', 'private_key',
  'authorization', 'set-cookie', 'cookie', 'session', 'csrf',
  'id_token', 'refresh_token', 'access_token',
  'creditCard', 'ssn', 'socialSecurityNumber',
  'verificationToken', 'resetToken'
];

// List of fields that should be partially masked (like emails)
const MASKABLE_FIELDS = ['email', 'username', 'phoneNumber', 'phone'];

/**
 * Masks an email address for safe logging
 * Example: john.doe@example.com -> j***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '[invalid_email]';
  
  const [username, domain] = email.split('@');
  if (!username || !domain) return '[invalid_email]';
  
  if (username.length <= 1) return `${username}***@${domain}`;
  return `${username[0]}***@${domain}`;
}

/**
 * Masks a string value for logging
 */
export function maskString(value: string, showStart = 1, showEnd = 0): string {
  if (!value || typeof value !== 'string') return '[redacted]';
  
  if (value.length <= showStart + showEnd) {
    return '[redacted]';
  }
  
  const start = value.substring(0, showStart);
  const end = showEnd > 0 ? value.substring(value.length - showEnd) : '';
  const middle = '*'.repeat(Math.max(3, value.length - showStart - showEnd));
  
  return start + middle + end;
}

/**
 * Recursively sanitizes an object by removing or masking sensitive fields
 */
export function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 10) return '[max_depth_reached]'; // Prevent infinite recursion
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Completely redact sensitive fields
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      }
      // Mask email-like fields
      else if (MASKABLE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        if (typeof value === 'string' && value.includes('@')) {
          sanitized[key] = maskEmail(value);
        } else if (typeof value === 'string') {
          sanitized[key] = maskString(value, 2, 0);
        } else {
          sanitized[key] = sanitizeObject(value, depth + 1);
        }
      }
      // Recursively sanitize nested objects
      else {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * Safe console.log that automatically sanitizes sensitive data
 */
export function safeLog(message: string, data?: any): void {
  if (data !== undefined) {
    console.log(message, sanitizeObject(data));
  } else {
    console.log(message);
  }
}

/**
 * Safe console.error that automatically sanitizes sensitive data
 */
export function safeError(message: string, error?: any): void {
  if (error !== undefined) {
    // For error objects, preserve the message and stack but sanitize other properties
    if (error instanceof Error) {
      const sanitizedError = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...sanitizeObject({ ...error })
      };
      console.error(message, sanitizedError);
    } else {
      console.error(message, sanitizeObject(error));
    }
  } else {
    console.error(message);
  }
}

/**
 * Creates a safe user identifier for logging (shows ID but masks sensitive info)
 */
export function createUserLogId(user: any): string {
  if (!user) return '[no_user]';
  
  const id = user.id || user.userId || 'unknown';
  if (user.email) {
    return `${id}(${maskEmail(user.email)})`;
  }
  return `${id}`;
}

/**
 * Sanitizes API response data for logging
 */
export function sanitizeApiResponse(response: any): any {
  // Don't log responses that are too large
  const responseStr = JSON.stringify(response);
  if (responseStr.length > 2000) {
    return { '[response]': '[too_large_to_log]', size: responseStr.length };
  }
  
  return sanitizeObject(response);
}