import crypto from 'crypto';

/**
 * Generate and cache the session secret for consistent use across the application
 * This ensures WebSocket authentication and session middleware use the same secret
 */
let _sessionSecret: string | null = null;

export function getSessionSecret(): string {
  if (!_sessionSecret) {
    // Fail-safe: Assume production unless explicitly in development
    // This prevents accidental insecure deployments when NODE_ENV is not set
    const isDevelopment = 
      process.env.NODE_ENV === 'development' || 
      process.env.DEV === 'true';
    
    if (!isDevelopment) {
      // Production or uncertain environment: SESSION_SECRET is REQUIRED
      if (!process.env.SESSION_SECRET) {
        const error = `
╔════════════════════════════════════════════════════════════════╗
║ CRITICAL SECURITY ERROR: Missing SESSION_SECRET                ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║ SESSION_SECRET environment variable is required in production ║
║                                                                ║
║ This secret is used to sign and verify session cookies.       ║
║ Without it, your application's authentication is not secure.  ║
║                                                                ║
║ To fix this:                                                   ║
║ 1. Generate a secure random secret:                           ║
║    openssl rand -hex 32                                        ║
║                                                                ║
║ 2. Set it as an environment variable:                          ║
║    SESSION_SECRET=<your-generated-secret>                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`;
        console.error(error);
        throw new Error('SESSION_SECRET is required in production');
      }
      _sessionSecret = process.env.SESSION_SECRET;
      console.log('[SessionConfig] Production mode: Session secret loaded from SESSION_SECRET');
    } else {
      // Development mode: allow fallbacks for convenience
      _sessionSecret = process.env.SESSION_SECRET || process.env.REPL_ID || crypto.randomBytes(32).toString('hex');
      if (process.env.SESSION_SECRET) {
        console.log('[SessionConfig] Development mode: Using SESSION_SECRET');
      } else if (process.env.REPL_ID) {
        console.log('[SessionConfig] Development mode: Using REPL_ID as session secret');
      } else {
        console.log('[SessionConfig] Development mode: Using randomly generated session secret');
      }
    }
  }
  return _sessionSecret;
}