import crypto from 'crypto';

/**
 * Generate and cache the session secret for consistent use across the application
 * This ensures WebSocket authentication and session middleware use the same secret
 */
let _sessionSecret: string | null = null;

export function getSessionSecret(): string {
  if (!_sessionSecret) {
    _sessionSecret = process.env.SESSION_SECRET || process.env.REPL_ID || crypto.randomBytes(32).toString('hex');
    console.log('[SessionConfig] Session secret initialized');
  }
  return _sessionSecret;
}