import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "@/lib/redis";

export type RateLimitPolicy =
  | "login"
  | "register"
  | "commentCreate"
  | "commentReaction"
  | "ratingWrite";

const limiters = redis
  ? {
      login: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        analytics: true,
        prefix: "academy-next:login",
      }),
      register: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        analytics: true,
        prefix: "academy-next:register",
      }),
      commentCreate: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
        prefix: "academy-next:comment-create",
      }),
      commentReaction: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        analytics: true,
        prefix: "academy-next:comment-reaction",
      }),
      ratingWrite: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        analytics: true,
        prefix: "academy-next:rating-write",
      }),
    }
  : null;

export async function rateLimit(policy: RateLimitPolicy, identifier: string) {
  if (!limiters) {
    return {
      success: true,
      limit: Number.MAX_SAFE_INTEGER,
      remaining: Number.MAX_SAFE_INTEGER,
      reset: Date.now(),
      pending: Promise.resolve(undefined),
    };
  }

  try {
    return await limiters[policy].limit(identifier);
  } catch (error) {
    console.error("[rateLimit]", error);

    return {
      success: true,
      limit: Number.MAX_SAFE_INTEGER,
      remaining: Number.MAX_SAFE_INTEGER,
      reset: Date.now(),
      pending: Promise.resolve(undefined),
    };
  }
}

export function drainRateLimit(result: { pending: Promise<unknown> }) {
  void result.pending.catch(() => {
    return undefined;
  });
}

export function getRetryAfterSeconds(reset: number) {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}
