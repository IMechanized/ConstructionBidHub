import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, passwordResetSchema } from "@shared/schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "./lib/email";
import { createVerificationToken, verifyEmailToken, createPasswordResetToken, verifyPasswordResetToken, consumePasswordResetToken } from "./lib/tokens";

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

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || process.env.REPL_ID || 'development_secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: app.get("env") === "production",
      httpOnly: true,
      sameSite: app.get("env") === "production" ? "strict" : "lax",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email: string, password: string, done: any) => {
        try {
          console.log(`[Auth] Login attempt with email:`, email);
          const user = await storage.getUserByUsername(email);

          if (!user) {
            console.log(`[Auth] No user found for email: ${email}`);
            return done(null, false, { message: "Invalid email or password" });
          }

          console.log(`[Auth] User found, verifying password`);
          const isValidPassword = await comparePasswords(password, user.password);

          if (!isValidPassword) {
            console.log(`[Auth] Invalid password for email: ${email}`);
            return done(null, false, { message: "Invalid email or password" });
          }

          console.log(`[Auth] Login successful for email: ${email}`);
          return done(null, user);
        } catch (error) {
          console.error(`[Auth] Error during authentication:`, error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log(`[Auth] Serializing user: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`[Auth] Deserializing user: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`[Auth] No user found during deserialization for id: ${id}`);
        return done(null, false);
      }
      console.log(`[Auth] User deserialized successfully: ${id}`);
      done(null, user);
    } catch (error) {
      console.error(`[Auth] Error during deserialization:`, error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log(`[Auth] Registration attempt for email: ${req.body.email}`);
      const existingUser = await storage.getUserByUsername(req.body.email);
      if (existingUser) {
        console.log(`[Auth] Registration failed - email already exists: ${req.body.email}`);
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      console.log(`[Auth] Password hashed for new registration`);

      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        emailVerified: false,  // Set email as unverified
      });
      
      console.log(`[Auth] User created successfully, id: ${user.id}`);
      
      // Generate and send verification email
      try {
        const token = await createVerificationToken(user.id);
        const emailSent = await sendVerificationEmail(user.email, token, user.companyName);
        
        if (emailSent) {
          console.log(`[Auth] Verification email sent to: ${user.email}`);
        } else {
          console.error(`[Auth] Failed to send verification email to: ${user.email}`);
        }
      } catch (emailError) {
        console.error(`[Auth] Error sending verification email:`, emailError);
        // Continue despite email error - user is still created
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error(`[Auth] Error during login after registration:`, err);
          return next(err);
        }
        res.status(201).json(user);
      });
    } catch (error) {
      console.error(`[Auth] Error during registration:`, error);
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log(`[Auth] Login request received with body:`, req.body);

    if (!req.body.email || !req.body.password) {
      console.log(`[Auth] Missing credentials in request`);
      return res.status(400).json({ message: "Email and password are required" });
    }

    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        console.error(`[Auth] Error during authentication:`, err);
        return next(err);
      }
      if (!user) {
        console.log(`[Auth] Authentication failed: ${info?.message}`);
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) {
          console.error(`[Auth] Error during login:`, err);
          return next(err);
        }
        console.log(`[Auth] Login successful for user: ${user.id}`);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log(`[Auth] Logout request received`);
    req.logout((err) => {
      if (err) {
        console.error(`[Auth] Error during logout:`, err);
        return next(err);
      }
      console.log(`[Auth] Logout successful`);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log(`[Auth] Unauthorized access attempt to /api/user`);
      return res.sendStatus(401);
    }
    console.log(`[Auth] User data retrieved for id: ${req.user.id}`);
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
      
      console.log(`[Auth] Email verification attempt with token: ${token.slice(0, 10)}...`);
      const userId = await verifyEmailToken(token);
      
      if (!userId) {
        console.log(`[Auth] Email verification failed - invalid or expired token`);
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }
      
      console.log(`[Auth] Email verified successfully for user: ${userId}`);
      
      // If user is already logged in, update the session
      if (req.isAuthenticated() && req.user.id === userId) {
        const updatedUser = await storage.getUser(userId);
        if (updatedUser) {
          req.login(updatedUser, (err) => {
            if (err) {
              console.error(`[Auth] Error updating user session after verification:`, err);
            }
          });
        }
      }
      
      return res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
      console.error(`[Auth] Error during email verification:`, error);
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
      
      console.log(`[Auth] Resending verification email to user: ${user.id}`);
      const token = await createVerificationToken(user.id);
      const emailSent = await sendVerificationEmail(user.email, token, user.companyName);
      
      if (emailSent) {
        console.log(`[Auth] Verification email resent to: ${user.email}`);
        return res.status(200).json({ message: "Verification email sent successfully" });
      } else {
        console.error(`[Auth] Failed to resend verification email to: ${user.email}`);
        return res.status(500).json({ message: "Failed to send verification email" });
      }
    } catch (error) {
      console.error(`[Auth] Error resending verification email:`, error);
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
      
      console.log(`[Auth] Password reset requested for email: ${email}`);
      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        // Don't reveal if email exists or not for security reasons
        console.log(`[Auth] Password reset requested for non-existent email: ${email}`);
        return res.status(200).json({ message: "If your email is registered, you will receive a password reset link" });
      }
      
      const token = await createPasswordResetToken(user.id);
      const emailSent = await sendPasswordResetEmail(user.email, token, user.companyName);
      
      if (emailSent) {
        console.log(`[Auth] Password reset email sent to: ${user.email}`);
        return res.status(200).json({ message: "Password reset email sent successfully" });
      } else {
        console.error(`[Auth] Failed to send password reset email to: ${user.email}`);
        return res.status(500).json({ message: "Failed to send password reset email" });
      }
    } catch (error) {
      console.error(`[Auth] Error during password reset request:`, error);
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
      
      console.log(`[Auth] Verifying password reset token: ${token.slice(0, 10)}...`);
      const userId = await verifyPasswordResetToken(token);
      
      if (!userId) {
        console.log(`[Auth] Invalid or expired password reset token`);
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      console.log(`[Auth] Valid password reset token for user: ${userId}`);
      return res.status(200).json({ message: "Valid reset token", token });
    } catch (error) {
      console.error(`[Auth] Error verifying reset token:`, error);
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
      
      console.log(`[Auth] Resetting password with token: ${token.slice(0, 10)}...`);
      const userId = await verifyPasswordResetToken(token);
      
      if (!userId) {
        console.log(`[Auth] Password reset failed - invalid or expired token`);
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Update password
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(userId, { password: hashedPassword });
      
      // Consume the token
      await consumePasswordResetToken(userId);
      
      console.log(`[Auth] Password reset successful for user: ${userId}`);
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error(`[Auth] Error during password reset:`, error);
      return res.status(500).json({ message: "An error occurred during password reset" });
    }
  });
}