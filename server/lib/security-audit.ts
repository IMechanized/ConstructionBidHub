/**
 * Security audit logging utilities
 * Provides standardized logging for security-relevant events
 */

import { Request } from 'express';
import { safeLog } from './safe-logging.js';

/**
 * Log failed login attempt
 */
export function logFailedLogin(email: string, reason: string, req: Request): void {
  safeLog(`[SecurityAudit] Failed login attempt`, {
    email,
    reason,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
}

/**
 * Log successful login
 */
export function logSuccessfulLogin(userId: number, email: string, req: Request): void {
  safeLog(`[SecurityAudit] Successful login`, {
    userId,
    email,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
}

/**
 * Log authorization failure (403)
 */
export function logAuthorizationFailure(
  userId: number | undefined,
  resource: string,
  action: string,
  req: Request
): void {
  safeLog(`[SecurityAudit] Authorization failure`, {
    userId: userId || 'unauthenticated',
    resource,
    action,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
}

/**
 * Log authentication failure (401)
 */
export function logAuthenticationFailure(
  resource: string,
  req: Request
): void {
  safeLog(`[SecurityAudit] Authentication required`, {
    resource,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
}

/**
 * Log rate limit hit
 */
export function logRateLimitHit(
  endpoint: string,
  req: Request
): void {
  safeLog(`[SecurityAudit] Rate limit exceeded`, {
    endpoint,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
}

/**
 * Log account lockout
 */
export function logAccountLockout(
  userId: number,
  email: string,
  reason: string
): void {
  safeLog(`[SecurityAudit] Account locked`, {
    userId,
    email,
    reason,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log security event (generic)
 */
export function logSecurityEvent(
  eventType: string,
  details: Record<string, unknown>
): void {
  safeLog(`[SecurityAudit] ${eventType}`, {
    ...details,
    timestamp: new Date().toISOString()
  });
}
