// File: src/lib/rateLimit.ts
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface RateLimitCheckResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMinutes?: number;
}

/**
 * Note: Extracting the IP address from the x-forwarded-for header is safe and reliable
 * when deployed behind a trusted reverse proxy (e.g., Vercel / Cloudflare) which sanitizes incoming headers.
 */

/**
 * Database-backed rate limit checker (Persistent across serverless cold starts / multi-instance functions)
 */
export async function checkDatabaseRateLimit(
  ipAddress: string,
  maxAttempts: number = 5,
  lockoutMinutes: number = 15
): Promise<RateLimitCheckResult> {
  try {
    const now = new Date();
    const records = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.ipAddress, ipAddress));

    if (records.length === 0) {
      return { allowed: true, remainingAttempts: maxAttempts };
    }

    const record = records[0];

    // Check if account is currently locked
    if (record.lockedUntil) {
      const lockedUntilDate = new Date(record.lockedUntil);
      if (lockedUntilDate > now) {
        const remainingMs = lockedUntilDate.getTime() - now.getTime();
        const retryAfterMinutes = Math.max(1, Math.ceil(remainingMs / (1000 * 60)));
        return {
          allowed: false,
          remainingAttempts: 0,
          retryAfterMinutes,
        };
      } else {
        // Lockout expired -> reset attempts
        await db
          .update(loginAttempts)
          .set({
            attemptCount: 0,
            lockedUntil: null,
            lastAttemptAt: now,
          })
          .where(eq(loginAttempts.ipAddress, ipAddress));
        return { allowed: true, remainingAttempts: maxAttempts };
      }
    }

    if (record.attemptCount >= maxAttempts) {
      const lockedUntil = new Date(now.getTime() + lockoutMinutes * 60 * 1000);
      await db
        .update(loginAttempts)
        .set({
          lockedUntil,
          lastAttemptAt: now,
        })
        .where(eq(loginAttempts.ipAddress, ipAddress));
      return { allowed: false, remainingAttempts: 0, retryAfterMinutes: lockoutMinutes };
    }

    return {
      allowed: true,
      remainingAttempts: Math.max(0, maxAttempts - record.attemptCount),
    };
  } catch (error) {
    console.error("checkDatabaseRateLimit error:", error);
    return { allowed: true, remainingAttempts: maxAttempts };
  }
}

export async function recordFailedAttempt(
  ipAddress: string,
  maxAttempts: number = 5,
  lockoutMinutes: number = 15
): Promise<{ remainingAttempts: number; isLocked: boolean }> {
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
      return { remainingAttempts: maxAttempts - 1, isLocked: false };
    }

    const record = records[0];
    const newCount = record.attemptCount + 1;

    if (newCount >= maxAttempts) {
      const lockedUntil = new Date(now.getTime() + lockoutMinutes * 60 * 1000);
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

    return { remainingAttempts: maxAttempts - newCount, isLocked: false };
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
  } catch (error) {
    console.error("Reset failed attempts error:", error);
  }
}
