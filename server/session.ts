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
  
  // Configure session middleware
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        sameSite: 'lax'
      }
    })
  );
}