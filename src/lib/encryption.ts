import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  // Derive a 32-byte key using scrypt
  return crypto.scryptSync(key, "seo-automation-salt", 32);
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Returns a base64-encoded string containing: IV + AuthTag + Ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine IV + AuthTag + Ciphertext
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "hex"),
  ]);

  return combined.toString("base64");
}

/**
 * Decrypt a base64-encoded encrypted string
 */
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, "base64");

  // Extract IV, AuthTag, and Ciphertext
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Hash a string using SHA-256 (one-way, for comparisons)
 */
export function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Generate a secure random API key
 */
export function generateApiKey(prefix = "sk"): string {
  const randomPart = crypto.randomBytes(24).toString("base64url");
  return `${prefix}_${randomPart}`;
}

/**
 * Mask a key for display (e.g., "sk_abc...xyz")
 */
export function maskKey(key: string): string {
  if (key.length <= 10) return "***";
  return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
}
