// File: src/lib/rateLimit.ts
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryRateLimitMap = new Map<string, RateLimitRecord>();

/**
 * In-Memory Rate Limiter
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes default
): { allowed: boolean; remainingAttempts: number; retryAfterMinutes?: number } {
  const now = Date.now();
  const record = memoryRateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    memoryRateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remainingAttempts: limit - 1 };
  }

  if (record.count >= limit) {
    const remainingMs = record.resetAt - now;
    const retryAfterMinutes = Math.ceil(remainingMs / (1000 * 60));
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMinutes,
    };
  }

  record.count += 1;
  memoryRateLimitMap.set(identifier, record);

  return {
    allowed: true,
    remainingAttempts: limit - record.count,
  };
}

export function resetRateLimit(identifier: string): void {
  memoryRateLimitMap.delete(identifier);
}

/**
 * Database-backed rate limit helper for persistent lockout across restarts
 */
export async function recordFailedAttempt(ipAddress: string): Promise<{ remainingAttempts: number; isLocked: boolean }> {
  try {
    const now = new Date();
    const records = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.ipAddress, ipAddress));

    if (records.length === 0) {
      await db.insert(loginAttempts).values({
        ipAddress,
        attemptCount: 1,
        lastAttemptAt: now,
      });
      return { remainingAttempts: 4, isLocked: false };
    }

    const record = records[0];
    const newCount = record.attemptCount + 1;

    if (newCount >= 5) {
      const lockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
      await db
        .update(loginAttempts)
        .set({
          attemptCount: newCount,
          lastAttemptAt: now,
          lockedUntil,
        })
        .where(eq(loginAttempts.ipAddress, ipAddress));
      return { remainingAttempts: 0, isLocked: true };
    }

    await db
      .update(loginAttempts)
      .set({
        attemptCount: newCount,
        lastAttemptAt: now,
      })
      .where(eq(loginAttempts.ipAddress, ipAddress));

    return { remainingAttempts: 5 - newCount, isLocked: false };
  } catch (error) {
    console.error("Record failed attempt error:", error);
    return { remainingAttempts: 0, isLocked: false };
  }
}

export async function resetFailedAttempts(ipAddress: string): Promise<void> {
  try {
    await db
      .update(loginAttempts)
      .set({
        attemptCount: 0,
        lockedUntil: null,
      })
      .where(eq(loginAttempts.ipAddress, ipAddress));
    resetRateLimit(ipAddress);
  } catch (error) {
    console.error("Reset failed attempts error:", error);
  }
}
