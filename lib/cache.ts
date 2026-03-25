import "server-only";

import { createHash } from "node:crypto";

import { redis } from "@/lib/redis";

const CACHE_PREFIX = "academy-next";

function getScopedCacheKey(key: string) {
  return `${CACHE_PREFIX}:${key}`;
}

function getVersionKey(namespace: string) {
  return getScopedCacheKey(`cache-version:${namespace}`);
}

export async function getCacheValue<T>(key: string) {
  if (!redis) {
    return null;
  }

  try {
    return await redis.get<T>(getScopedCacheKey(key));
  } catch (error) {
    console.error("[getCacheValue]", error);
    return null;
  }
}

export async function setCacheValue<T>(
  key: string,
  value: T,
  ttlSeconds: number,
) {
  if (!redis) {
    return;
  }

  try {
    await redis.set(getScopedCacheKey(key), value, { ex: ttlSeconds });
  } catch (error) {
    console.error("[setCacheValue]", error);
  }
}

export async function deleteCacheValue(key: string) {
  if (!redis) {
    return;
  }

  try {
    await redis.del(getScopedCacheKey(key));
  } catch (error) {
    console.error("[deleteCacheValue]", error);
  }
}

export async function getCacheVersion(namespace: string) {
  if (!redis) {
    return 1;
  }

  try {
    const value = await redis.get<number>(getVersionKey(namespace));

    return typeof value === "number" && Number.isFinite(value) ? value : 1;
  } catch (error) {
    console.error("[getCacheVersion]", error);
    return 1;
  }
}

export async function bumpCacheVersion(namespace: string) {
  if (!redis) {
    return 1;
  }

  try {
    return await redis.incr(getVersionKey(namespace));
  } catch (error) {
    console.error("[bumpCacheVersion]", error);
    return 1;
  }
}

export function hashCacheKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
