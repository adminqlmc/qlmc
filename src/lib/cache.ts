/**
 * Caching utilities for chatbot queries
 * Uses LRU cache for in-memory storage
 */

import { LRUCache } from 'lru-cache';

interface CachedAnswer {
  answer: string;
  sources: string[];
  passages: string[];
  confidence: number;
  method: 'semantic' | 'keyword';
  timestamp: number;
}

// In-memory cache for frequent queries
// Max 500 entries, TTL 30 minutes
const queryCache = new LRUCache<string, CachedAnswer>({
  max: 500,
  ttl: 1000 * 60 * 30, // 30 minutes
  updateAgeOnGet: true, // Refresh TTL on access
});

/**
 * Get cached answer for a query
 */
export function getCachedAnswer(query: string, role: string): CachedAnswer | null {
  const key = generateCacheKey(query, role);
  const cached = queryCache.get(key);
  
  if (cached) {
    console.log(`[Cache] Hit for query: "${query.substring(0, 50)}..."`);
  }
  
  return cached || null;
}

/**
 * Set cached answer for a query
 */
export function setCachedAnswer(
  query: string,
  role: string,
  answer: CachedAnswer
): void {
  const key = generateCacheKey(query, role);
  queryCache.set(key, {
    ...answer,
    timestamp: Date.now(),
  });
  console.log(`[Cache] Stored answer for query: "${query.substring(0, 50)}..."`);
}

/**
 * Clear cache for a specific role or all cache
 */
export function clearCache(role?: string): void {
  if (role) {
    // Clear only entries for this role
    const keysToDelete: string[] = [];
    for (const key of queryCache.keys()) {
      if (key.startsWith(`${role}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => queryCache.delete(key));
    console.log(`[Cache] Cleared ${keysToDelete.length} entries for role: ${role}`);
  } else {
    // Clear all cache
    queryCache.clear();
    console.log('[Cache] Cleared all cache entries');
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: queryCache.size,
    maxSize: queryCache.max,
    hitRate: 0, // Would need to track hits/misses
  };
}

/**
 * Generate cache key from query and role
 */
function generateCacheKey(query: string, role: string): string {
  // Normalize query: lowercase, trim, remove extra spaces
  const normalized = query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  
  return `${role}:${normalized}`;
}

/**
 * Check if query should be cached
 * Skip caching for very short or very long queries
 */
export function shouldCache(query: string): boolean {
  const length = query.trim().length;
  return length >= 5 && length <= 500;
}

