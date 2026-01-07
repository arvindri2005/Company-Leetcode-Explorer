import { SimpleLRUCache } from "@/lib/lru-cache";

// Export the class from here as well for backward compatibility if needed, 
// though direct import from lib is preferred.
export { SimpleLRUCache };

// Export a singleton instance for problem insights and company strategy
export const problemInsightsCache = new SimpleLRUCache<any>(50, 24 * 3600000); // 24 hours
export const companyStrategyCache = new SimpleLRUCache<any>(20, 24 * 3600000); // 24 hours
