/**
 * Cursor Manager Module
 * Handles cursor encoding and decoding for pagination
 */

import { Logger } from "@/lib/utils/logger";

/**
 * Cursor data structure
 */
export interface CursorData {
  normalizedName: string;
  id: string;
}

/**
 * Encode cursor data to base64 string
 * @param data - Cursor data containing normalizedName and id
 * @returns Base64 encoded cursor string
 */
export function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

/**
 * Decode cursor string to cursor data
 * @param cursor - Base64 encoded cursor string
 * @returns Decoded cursor data or null if invalid
 */
export function decodeCursor(cursor: string): CursorData | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
  } catch (e) {
    Logger.error("Failed to decode cursor", e);
    return null;
  }
}
