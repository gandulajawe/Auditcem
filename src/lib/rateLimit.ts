import { db } from "@/db";
import { loginAttempts } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function checkRateLimit(ipAddress: string): Promise<{ allowed: boolean; remainingAttempts: number; retryAfterMinutes?: number }> {
  try {
    const records = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.ipAddress, ipAddress));

    if (records.length === 0) {
      return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
    }

    const record = records[0];
    const now = new Date();

    if (record.lockedUntil && new Date(record.lockedUntil) > now) {
      const remainingMs = new Date(record.lockedUntil).getTime() - now.getTime();
      const remainingMins = Math.ceil(remainingMs / (1000 * 60));
      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterMinutes: remainingMins,
      };
    }

    // Lockout expired, reset if needed
    if (record.lockedUntil && new Date(record.lockedUntil) <= now) {
      await db
        .update(loginAttempts)
        .set({ attemptCount: 0, lockedUntil: null, lastAttemptAt: now })
        .where(eq(loginAttempts.ipAddress, ipAddress));
      return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
    }

    const remaining = MAX_FAILED_ATTEMPTS - record.attemptCount;
    return {
      allowed: remaining > 0,
      remainingAttempts: Math.max(0, remaining),
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }
}

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
      return { remainingAttempts: MAX_FAILED_ATTEMPTS - 1, isLocked: false };
    }

    const record = records[0];
    const newCount = record.attemptCount + 1;

    if (newCount >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
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

    return { remainingAttempts: MAX_FAILED_ATTEMPTS - newCount, isLocked: false };
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
