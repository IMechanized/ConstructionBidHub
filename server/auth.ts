import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
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
      { usernameField: 'companyName' },
      async (companyName: string, password: string, done: any) => {
        try {
          console.log(`[Auth] Login attempt with payload:`, { companyName });
          const user = await storage.getUserByUsername(companyName);

          if (!user) {
            console.log(`[Auth] No user found for company: ${companyName}`);
            return done(null, false, { message: "Invalid company name or password" });
          }

          console.log(`[Auth] User found, verifying password`);
          const isValidPassword = await comparePasswords(password, user.password);

          if (!isValidPassword) {
            console.log(`[Auth] Invalid password for company: ${companyName}`);
            return done(null, false, { message: "Invalid company name or password" });
          }

          console.log(`[Auth] Login successful for company: ${companyName}`);
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
      console.log(`[Auth] Registration attempt for company: ${req.body.companyName}`);
      const existingUser = await storage.getUserByUsername(req.body.companyName);
      if (existingUser) {
        console.log(`[Auth] Registration failed - company already exists: ${req.body.companyName}`);
        return res.status(400).json({ message: "Company name already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      console.log(`[Auth] Password hashed for new registration`);

      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      console.log(`[Auth] User created successfully, id: ${user.id}`);
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

    if (!req.body.companyName || !req.body.password) {
      console.log(`[Auth] Missing credentials in request`);
      return res.status(400).json({ message: "Company name and password are required" });
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
}