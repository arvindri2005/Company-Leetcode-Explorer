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

  /**
   * Generates a cache key from an input object.
   * Sorts object keys to ensure consistent hashing.
   */
  generateKey(input: any): string {
    const sortedStringify = (obj: any): string => {
        if (typeof obj !== 'object' || obj === null) {
            return JSON.stringify(obj);
        }
        if (Array.isArray(obj)) {
            return JSON.stringify(obj.map(item => JSON.parse(sortedStringify(item))));
        }
        const sortedKeys = Object.keys(obj).sort();
        const result: any = {};
        sortedKeys.forEach(key => {
            result[key] = JSON.parse(sortedStringify(obj[key]));
        });
        return JSON.stringify(result);
    };

    return createHash("sha256").update(sortedStringify(input)).digest("hex");
  }
}

// Export a singleton instance for problem insights and company strategy
export const problemInsightsCache = new SimpleLRUCache<any>(50, 24 * 3600000); // 24 hours
export const companyStrategyCache = new SimpleLRUCache<any>(20, 24 * 3600000); // 24 hours
export const flashcardsCache = new SimpleLRUCache<any>(50, 7 * 24 * 3600000); // 7 days
