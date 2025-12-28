
import fs from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Loads environment variables from .env.local and .env files manually
 * because standalone scripts don't automatically load them.
 */
export function loadEnv() {
  const envFiles = [".env.local", ".env"];

  for (const file of envFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      content.split("\n").forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^['"]|['"]$/g, ""); // Remove quotes
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  }
}

/**
 * Calculates SHA-256 checksum of a string or object
 */
export function calculateChecksum(data: any): string {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return crypto.createHash("sha256").update(str).digest("hex");
}

/**
 * Ensures the backup directory exists
 */
export function ensureBackupDir(dirPath: string = "backups") {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}
