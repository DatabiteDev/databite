import crypto from "crypto";

// IMPORTANT: Store this in environment variables, NOT in code
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // Must be 32 bytes (64 hex chars)
const ALGORITHM = "aes-256-gcm";

/**
 * Validates that encryption key is properly set
 */
function validateEncryptionKey() {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 characters (32 bytes in hex)");
  }
}

/**
 * Encrypts a string value (like GitHub token)
 * Returns: base64 encoded string with IV and auth tag
 */
export function encrypt(text: string): string {
  validateEncryptionKey();

  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "hex"),
      iv
    );

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, "hex"),
    ]);

    // Return as base64 string
    return combined.toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypts an encrypted string
 * Returns: original plaintext string
 */
export function decrypt(encryptedData: string): string {
  validateEncryptionKey();

  try {
    // Decode from base64
    const buffer = Buffer.from(encryptedData, "base64");

    // Extract IV (first 16 bytes)
    const iv = buffer.subarray(0, 16);

    // Extract auth tag (next 16 bytes)
    const authTag = buffer.subarray(16, 32);

    // Extract encrypted data (remaining bytes)
    const encrypted = buffer.subarray(32);

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "hex"),
      iv
    );

    // Set auth tag
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Generate a new encryption key (run once, store in env vars)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
