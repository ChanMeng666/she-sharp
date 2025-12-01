/**
 * Redis Caching Layer for AI Matching System
 * Uses Upstash Redis for serverless-compatible caching
 */

import { Redis } from '@upstash/redis';
import type { AIMatchResponse } from './types';

// Initialize Redis client (lazy initialization for environments without Redis)
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    console.warn('Redis not configured: UPSTASH_REDIS_URL or UPSTASH_REDIS_TOKEN missing');
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
  MATCH: 3600,              // 1 hour for individual match results
  MENTOR_PROFILES: 300,     // 5 minutes for mentor profiles list
  QUEUE_POSITIONS: 60,      // 1 minute for queue positions
  STATS: 120,               // 2 minutes for statistics
};

// Cache key prefixes
const CACHE_PREFIX = {
  MATCH: 'match',
  MENTOR_PROFILES: 'mentor_profiles',
  QUEUE: 'queue',
  STATS: 'stats',
};

/**
 * Get cached AI match result
 */
export async function getCachedAIMatch(
  mentorId: number,
  menteeId: number
): Promise<AIMatchResponse | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const key = `${CACHE_PREFIX.MATCH}:${mentorId}:${menteeId}`;
    const cached = await client.get<AIMatchResponse>(key);
    return cached;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set cached AI match result
 */
export async function setCachedAIMatch(
  mentorId: number,
  menteeId: number,
  result: AIMatchResponse
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const key = `${CACHE_PREFIX.MATCH}:${mentorId}:${menteeId}`;
    await client.set(key, result, { ex: CACHE_TTL.MATCH });
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * Get cached available mentor profiles
 */
export async function getCachedMentorProfiles<T>(): Promise<T[] | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const key = `${CACHE_PREFIX.MENTOR_PROFILES}:available`;
    const cached = await client.get<T[]>(key);
    return cached;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set cached available mentor profiles
 */
export async function setCachedMentorProfiles<T>(profiles: T[]): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const key = `${CACHE_PREFIX.MENTOR_PROFILES}:available`;
    await client.set(key, profiles, { ex: CACHE_TTL.MENTOR_PROFILES });
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * Get cached queue positions
 */
export async function getCachedQueuePositions(): Promise<Map<number, number> | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const key = `${CACHE_PREFIX.QUEUE}:positions`;
    const cached = await client.get<Record<number, number>>(key);
    if (!cached) return null;
    return new Map(Object.entries(cached).map(([k, v]) => [parseInt(k), v]));
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set cached queue positions
 */
export async function setCachedQueuePositions(positions: Map<number, number>): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const key = `${CACHE_PREFIX.QUEUE}:positions`;
    const obj = Object.fromEntries(positions);
    await client.set(key, obj, { ex: CACHE_TTL.QUEUE_POSITIONS });
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * Get cached matching statistics
 */
export async function getCachedMatchingStats<T>(): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const key = `${CACHE_PREFIX.STATS}:matching`;
    const cached = await client.get<T>(key);
    return cached;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set cached matching statistics
 */
export async function setCachedMatchingStats<T>(stats: T): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const key = `${CACHE_PREFIX.STATS}:matching`;
    await client.set(key, stats, { ex: CACHE_TTL.STATS });
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * Invalidate match cache for a specific user
 * Called when user profile is updated
 */
export async function invalidateUserMatchCache(userId: number): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    // Get all keys matching patterns with this user ID
    const pattern1 = `${CACHE_PREFIX.MATCH}:${userId}:*`;
    const pattern2 = `${CACHE_PREFIX.MATCH}:*:${userId}`;

    const keys1 = await client.keys(pattern1);
    const keys2 = await client.keys(pattern2);
    const allKeys = [...new Set([...keys1, ...keys2])];

    if (allKeys.length > 0) {
      await client.del(...allKeys);
    }

    // Also invalidate mentor profiles cache if mentor
    await client.del(`${CACHE_PREFIX.MENTOR_PROFILES}:available`);
  } catch (error) {
    console.error('Redis invalidate error:', error);
  }
}

/**
 * Invalidate all match caches
 * Called after batch matching or significant data changes
 */
export async function invalidateAllMatchCaches(): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const pattern = `${CACHE_PREFIX.MATCH}:*`;
    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(...keys);
    }

    // Also invalidate related caches
    await client.del(`${CACHE_PREFIX.MENTOR_PROFILES}:available`);
    await client.del(`${CACHE_PREFIX.QUEUE}:positions`);
    await client.del(`${CACHE_PREFIX.STATS}:matching`);
  } catch (error) {
    console.error('Redis invalidate all error:', error);
  }
}

/**
 * Invalidate queue position cache
 */
export async function invalidateQueueCache(): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(`${CACHE_PREFIX.QUEUE}:positions`);
  } catch (error) {
    console.error('Redis invalidate queue error:', error);
  }
}

/**
 * Invalidate statistics cache
 */
export async function invalidateStatsCache(): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.del(`${CACHE_PREFIX.STATS}:matching`);
  } catch (error) {
    console.error('Redis invalidate stats error:', error);
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return getRedis() !== null;
}

/**
 * Get cache statistics (for monitoring)
 */
export async function getCacheInfo(): Promise<{
  available: boolean;
  matchCacheCount?: number;
}> {
  const client = getRedis();
  if (!client) {
    return { available: false };
  }

  try {
    const matchKeys = await client.keys(`${CACHE_PREFIX.MATCH}:*`);
    return {
      available: true,
      matchCacheCount: matchKeys.length,
    };
  } catch (error) {
    console.error('Redis info error:', error);
    return { available: false };
  }
}
