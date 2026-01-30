import { SimpleLRUCache } from "@/shared/lib/utils/lru-cache";

// Export the class from here as well for backward compatibility if needed, 
// though direct import from lib is preferred.
export { SimpleLRUCache };

// Export a singleton instance for problem insights and company strategy
export const problemInsightsCache = new SimpleLRUCache<unknown>(50, 24 * 3600000); // 24 hours
export const companyStrategyCache = new SimpleLRUCache<unknown>(20, 24 * 3600000); // 24 hours
export const flashcardsCache = new SimpleLRUCache<unknown>(50, 7 * 24 * 3600000); // 7 days






