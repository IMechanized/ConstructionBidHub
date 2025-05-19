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
  const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
  
  // Create session configuration with domain-aware settings
  const sessionConfig: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
  };

  // Handle Vercel-specific settings for production
  if (process.env.NODE_ENV === 'production') {
    // Make sure secure cookies work properly with sameSite=none
    sessionConfig.cookie!.secure = true;
    
    // Set domain for Vercel deployments if available
    if (process.env.VERCEL_URL) {
      console.log(`Detected Vercel deployment URL: ${process.env.VERCEL_URL}`);
    }
    
    // Trust the proxy in production environments like Vercel
    app.set('trust proxy', 1);
  }

  // Apply session middleware
  app.use(session(sessionConfig));
}