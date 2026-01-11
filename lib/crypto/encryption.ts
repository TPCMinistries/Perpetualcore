/**
 * Centralized encryption utilities for secure credential storage
 *
 * Used for encrypting:
 * - API keys (Resend, SendGrid, etc.)
 * - OAuth tokens
 * - Other sensitive credentials
 *
 * Requires ENCRYPTION_KEY environment variable (min 32 characters)
 */

import * as crypto from "crypto";

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-key-change-in-production";

const ALGORITHM = "aes-256-cbc";
const SALT = "perpetual-core-salt"; // Consistent salt for key derivation

/**
 * Encrypt a string value for secure storage
 * Returns format: iv:encryptedData (hex encoded)
 */
export function encryptSecret(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, SALT, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt an encrypted string
 * Expects format: iv:encryptedData (hex encoded)
 */
export function decryptSecret(encryptedText: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, SALT, 32);
  const parts = encryptedText.split(":");

  if (parts.length !== 2) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if the encryption key is properly configured
 */
export function isEncryptionConfigured(): boolean {
  return (
    !!process.env.ENCRYPTION_KEY &&
    process.env.ENCRYPTION_KEY.length >= 32 &&
    process.env.ENCRYPTION_KEY !== "default-key-change-in-production"
  );
}

/**
 * Generate a random encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a value using SHA-256 (one-way, for verification)
 */
export function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Timing-safe comparison of two strings
 */
export function secureCompare(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
