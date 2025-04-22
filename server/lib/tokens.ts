/**
 * Token utilities for email verification and password reset
 */
import { randomBytes } from "crypto";
import { storage } from "../storage";

// Constants for token expiration
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Generate a random token for email verification or password reset
 * @returns Random token string
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create and store an email verification token for a user
 * @param userId User ID
 * @returns The generated verification token
 */
export async function createVerificationToken(userId: number): Promise<string> {
  const token = generateToken();
  const expiryDate = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);
  
  await storage.updateUser(userId, {
    verificationToken: token,
    verificationTokenExpiry: expiryDate,
  });
  
  return token;
}

/**
 * Create and store a password reset token for a user
 * @param userId User ID
 * @returns The generated reset token
 */
export async function createPasswordResetToken(userId: number): Promise<string> {
  const token = generateToken();
  const expiryDate = new Date(Date.now() + RESET_TOKEN_EXPIRY);
  
  await storage.updateUser(userId, {
    resetToken: token,
    resetTokenExpiry: expiryDate,
  });
  
  return token;
}

/**
 * Verify and consume a verification token
 * @param token The verification token to verify
 * @returns The user ID if token is valid, null otherwise
 */
export async function verifyEmailToken(token: string): Promise<number | null> {
  const user = await storage.getUserByVerificationToken(token);
  
  if (!user) {
    return null;
  }
  
  const tokenExpiry = user.verificationTokenExpiry;
  if (!tokenExpiry || new Date(tokenExpiry) < new Date()) {
    return null; // Token has expired
  }
  
  // Mark email as verified and clear the token
  await storage.updateUser(user.id, {
    emailVerified: true,
    verificationToken: null,
    verificationTokenExpiry: null,
  });
  
  return user.id;
}

/**
 * Verify a password reset token
 * @param token The reset token to verify
 * @returns The user ID if token is valid, null otherwise
 */
export async function verifyPasswordResetToken(token: string): Promise<number | null> {
  const user = await storage.getUserByResetToken(token);
  
  if (!user) {
    return null;
  }
  
  const tokenExpiry = user.resetTokenExpiry;
  if (!tokenExpiry || new Date(tokenExpiry) < new Date()) {
    return null; // Token has expired
  }
  
  return user.id;
}

/**
 * Consume a password reset token after password has been reset
 * @param userId User ID
 */
export async function consumePasswordResetToken(userId: number): Promise<void> {
  await storage.updateUser(userId, {
    resetToken: null,
    resetTokenExpiry: null,
  });
}