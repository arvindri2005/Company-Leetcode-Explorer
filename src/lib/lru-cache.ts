import { Logger } from "@/lib/logger";
import { createHash } from "crypto";

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class SimpleLRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxEntries: number;
  private ttl: number;

  /**
   * @param maxEntries - Maximum number of entries in the cache.
   * @param ttl - Time to live in milliseconds (default: 1 hour).
   */
  constructor(maxEntries: number = 100, ttl: number = 3600000) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.ttl = ttl;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh LRU order: delete and re-set
    this.cache.delete(key);
    this.cache.set(key, entry);
    Logger.debug(`Cache hit for key: ${key}`);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
          this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
    Logger.debug(`Cache set for key: ${key}`);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiry) {
        this.cache.delete(key);
        return false;
    }
    return true;
  }
  
  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  /**
   * Generates a cache key from an input object.
   * Sorts object keys to ensure consistent hashing.
   */
  generateKey(input: any): string {
    const sortKeys = (obj: any): any => {
      // Handle primitives (string, number, boolean, null, undefined)
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      // Handle Arrays: recursively sort items
      if (Array.isArray(obj)) {
        return obj.map(sortKeys);
      }

      // Handle Objects: sort keys and recursively sort values
      const sortedKeys = Object.keys(obj).sort();
      const result: any = {};
      sortedKeys.forEach(key => {
        const val = obj[key];
        // Only assign if not undefined (mimic JSON.stringify behavior for object props)
        // Actually, if we assign undefined to a key, JSON.stringify(result) later will just omit it.
        // So it is safe to assign.
        result[key] = sortKeys(val);
      });
      return result;
    };

    return createHash("sha256").update(JSON.stringify(sortKeys(input))).digest("hex");
  }
}
