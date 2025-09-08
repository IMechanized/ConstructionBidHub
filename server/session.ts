import session from 'express-session';
import { type Express } from 'express';
import { storage } from './storage';
import crypto from 'crypto';

/**
 * Configure and create session middleware for the application
 * @param app Express application instance
 */
export function createSession(app: Express) {
  // Generate a strong session secret
  const sessionSecret = process.env.SESSION_SECRET || process.env.REPL_ID || crypto.randomBytes(32).toString('hex');
  
  console.log('[Session] Initializing session configuration...');
  
  // Create session configuration with consistent settings
  const sessionConfig: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours - consistent timeout
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax' // Use lax for better compatibility
    }
  };

  // Handle production-specific settings
  if (process.env.NODE_ENV === 'production') {
    console.log('[Session] Configuring for production environment');
    
    // Trust the proxy in production environments like Vercel
    app.set('trust proxy', 1);
    
    // Set secure flag for HTTPS
    sessionConfig.cookie!.secure = true;
    
    // Log Vercel URL if detected
    if (process.env.VERCEL_URL) {
      console.log(`[Session] Detected Vercel deployment URL: ${process.env.VERCEL_URL}`);
    }
  } else {
    console.log('[Session] Configuring for development environment');
  }

  // Log session configuration for debugging
  console.log('[Session] Configuration:', {
    maxAge: sessionConfig.cookie?.maxAge,
    secure: sessionConfig.cookie?.secure,
    sameSite: sessionConfig.cookie?.sameSite,
    httpOnly: sessionConfig.cookie?.httpOnly
  });

  // Apply session middleware
  app.use(session(sessionConfig));
  console.log('[Session] Session middleware initialized successfully');
}