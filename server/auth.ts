import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import { User as SelectUser, passwordResetSchema, insertUserSchema } from "../shared/schema.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "./lib/email.js";
import { createVerificationToken, verifyEmailToken, createPasswordResetToken, verifyPasswordResetToken, consumePasswordResetToken } from "./lib/tokens.js";
import { safeLog, safeError, createUserLogId, maskEmail } from "./lib/safe-logging.js";
import rateLimit from "express-rate-limit";
import { logFailedLogin, logSuccessfulLogin, logRateLimitHit } from "./lib/security-audit.js";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Rate limiters for authentication endpoints to prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitHit('/api/login', req);
    res.status(429).json({ 
      message: "Too many login attempts from this IP, please try again after 15 minutes" 
    });
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration requests per hour
  message: "Too many accounts created from this IP, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logRateLimitHit('/api/register', req);
    res.status(429).json({ 
      message: "Too many accounts created from this IP, please try again after an hour" 
    });
  },
});

export function setupAuth(app: Express) {
  console.log('[Auth] Initializing Passport authentication...');
  
  // Initialize Passport middleware
  // Note: Session middleware should be set up before calling this function
  app.use(passport.initialize());
  app.use(passport.session());
  
  console.log('[Auth] Passport middleware initialized successfully');

  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passReqToCallback: true },
      async (req: Request, email: string, password: string, done: any) => {
        try {
          safeLog(`[Auth] Login attempt with email: ${maskEmail(email)}`);
          const user = await storage.getUserByUsername(email);

          if (!user) {
            logFailedLogin(email, 'User not found', req);
            return done(null, false, { message: "Invalid email or password" });
          }

          console.log(`[Auth] User found, verifying password`);
          const isValidPassword = await comparePasswords(password, user.password);

          if (!isValidPassword) {
            logFailedLogin(email, 'Invalid password', req);
            return done(null, false, { message: "Invalid email or password" });
          }

          logSuccessfulLogin(user.id, email, req);
          return done(null, user);
        } catch (error) {
          safeError(`[Auth] Error during authentication:`, error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    safeLog(`[Auth] Serializing user: ${createUserLogId(user)}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      safeLog(`[Auth] Deserializing user: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        safeLog(`[Auth] No user found during deserialization for id: ${id}`);
        return done(null, false);
      }
      safeLog(`[Auth] User deserialized successfully: ${id}`);
      done(null, user);
    } catch (error) {
      safeError(`[Auth] Error during deserialization:`, error);
      done(error);
    }
  });

  app.post("/api/register", registerLimiter, async (req, res, next) => {
    try {
      safeLog(`[Auth] Registration attempt for email: ${maskEmail(req.body.email)}`);
      
      // Validate request body against schema
      const validationResult = insertUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        safeLog(`[Auth] Registration validation failed:`, validationResult.error.issues);
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      
      const existingUser = await storage.getUserByUsername(req.body.email);
      if (existingUser) {
        safeLog(`[Auth] Registration failed - email already exists: ${maskEmail(req.body.email)}`);
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      safeLog(`[Auth] Password hashed for new registration`);

      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        emailVerified: false,  // Set email as unverified
      });
      
      safeLog(`[Auth] User created successfully, id: ${createUserLogId(user)}`);
      
      // Generate and send verification email
      try {
        const token = await createVerificationToken(user.id);
        const emailSent = await sendVerificationEmail(user.email, token, user.companyName);
        
        if (emailSent) {
          safeLog(`[Auth] Verification email sent to: ${maskEmail(user.email)}`);
        } else {
          safeError(`[Auth] Failed to send verification email to: ${maskEmail(user.email)}`);
        }
      } catch (emailError) {
        safeError(`[Auth] Error sending verification email:`, emailError);
        // Continue despite email error - user is still created
      }
      
      req.login(user, (err) => {
        if (err) {
          safeError(`[Auth] Error during login after registration:`, err);
          return next(err);
        }
        res.status(201).json(user);
      });
    } catch (error) {
      safeError(`[Auth] Error during registration:`, error);
      next(error);
    }
  });

  app.post("/api/login", loginLimiter, (req, res, next) => {
    safeLog(`[Auth] Login request received - email: ${req.body.email ? maskEmail(req.body.email) : 'missing'}`);

    if (!req.body.email || !req.body.password) {
      safeLog(`[Auth] Missing credentials in request`);
      return res.status(400).json({ message: "Email and password are required" });
    }

    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        safeError(`[Auth] Error during authentication:`, err);
        return next(err);
      }
      if (!user) {
        safeLog(`[Auth] Authentication failed: ${info?.message}`);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) {
          safeError(`[Auth] Error during login:`, err);
          return next(err);
        }
        safeLog(`[Auth] Login successful for user: ${createUserLogId(user)}`);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    safeLog(`[Auth] Logout request received`);
    req.logout((err) => {
      if (err) {
        safeError(`[Auth] Error during logout:`, err);
        return next(err);
      }
      safeLog(`[Auth] Logout successful`);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      safeLog(`[Auth] Unauthorized access attempt to /api/user`);
      return res.sendStatus(401);
    }
    safeLog(`[Auth] User data retrieved for id: ${req.user.id}`);
    res.json(req.user);
  });

  /**
   * Email Verification Endpoints
   */
  
  // Verify email with token
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid verification token" });
      }
      
      safeLog(`[Auth] Email verification attempt with token: ${token.slice(0, 8)}...`);
      const userId = await verifyEmailToken(token);
      
      if (!userId) {
        safeLog(`[Auth] Email verification failed - invalid or expired token`);
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      
      safeLog(`[Auth] Email verified successfully for user: ${userId}`);
      
      // If user is already logged in, update the session
      if (req.isAuthenticated() && req.user.id === userId) {
        const updatedUser = await storage.getUser(userId);
        if (updatedUser) {
          req.login(updatedUser, (err) => {
            if (err) {
              safeError(`[Auth] Error updating user session after verification:`, err);
            }
          });
        }
      }
      
      return res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
      safeError(`[Auth] Error during email verification:`, error);
      return res.status(500).json({ message: "An error occurred during email verification" });
    }
  });
  
  // Resend verification email
  app.post("/api/resend-verification", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Please log in to resend verification email" });
      }
      
      const user = req.user;
      
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      safeLog(`[Auth] Resending verification email to user: ${createUserLogId(user)}`);
      const token = await createVerificationToken(user.id);
      const emailSent = await sendVerificationEmail(user.email, token, user.companyName);
      
      if (emailSent) {
        safeLog(`[Auth] Verification email resent to: ${maskEmail(user.email)}`);
        return res.status(200).json({ message: "Verification email sent successfully" });
      } else {
        safeError(`[Auth] Failed to resend verification email to: ${maskEmail(user.email)}`);
        return res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      safeError(`[Auth] Error resending verification email:`, error);
      return res.status(500).json({ message: "An error occurred while resending the verification email" });
    }
  });
  
  /**
   * Password Reset Endpoints
   */
  
  // Request password reset
  app.post("/api/request-password-reset", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      safeLog(`[Auth] Password reset requested for email: ${maskEmail(email)}`);
      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        // Don't reveal if email exists or not for security reasons
        safeLog(`[Auth] Password reset requested for non-existent email: ${maskEmail(email)}`);
        return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
      }
      
      const token = await createPasswordResetToken(user.id);
      const emailSent = await sendPasswordResetEmail(user.email, token, user.companyName);
      
      if (emailSent) {
        safeLog(`[Auth] Password reset email sent to: ${maskEmail(user.email)}`);
        return res.status(200).json({ message: "Password reset email sent successfully" });
      } else {
        safeError(`[Auth] Failed to send password reset email to: ${maskEmail(user.email)}`);
        return res.status(500).json({ message: "Failed to send password reset email" });
      }
    } catch (error) {
      safeError(`[Auth] Error during password reset request:`, error);
      return res.status(500).json({ message: "An error occurred while processing your request" });
    }
  });
  
  // Verify password reset token
  app.get("/api/verify-reset-token", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Invalid reset token" });
      }
      
      safeLog(`[Auth] Verifying password reset token: ${token.slice(0, 8)}...`);
      const userId = await verifyPasswordResetToken(token);
      
      if (!userId) {
        safeLog(`[Auth] Invalid or expired password reset token`);
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      safeLog(`[Auth] Valid password reset token for user: ${userId}`);
      return res.status(200).json({ message: "Valid reset token", token });
    } catch (error) {
      safeError(`[Auth] Error verifying reset token:`, error);
      return res.status(500).json({ message: "An error occurred while verifying the reset token" });
    }
  });
  
  // Reset password with token
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password, confirmPassword } = req.body;
      
      if (!token || !password || !confirmPassword) {
        return res.status(400).json({ message: "Token, password, and confirmPassword are required" });
      }
      
      // Validate password
      const passwordValidation = passwordResetSchema.safeParse({ password, confirmPassword });
      if (!passwordValidation.success) {
        return res.status(400).json({ 
          message: "Password validation failed", 
          errors: passwordValidation.error.errors 
        });
      }
      
      safeLog(`[Auth] Resetting password with token: ${token.slice(0, 8)}...`);
      const userId = await verifyPasswordResetToken(token);
      
      if (!userId) {
        safeLog(`[Auth] Password reset failed - invalid or expired token`);
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Update password
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(userId, { password: hashedPassword });
      
      // Consume the token
      await consumePasswordResetToken(userId);
      
      safeLog(`[Auth] Password reset successful for user: ${userId}`);
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      safeError(`[Auth] Error during password reset:`, error);
      return res.status(500).json({ message: "An error occurred during password reset" });
    }
  });
}