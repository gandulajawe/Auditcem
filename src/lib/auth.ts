// File: src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { scrypt as scryptCallback, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const SESSION_COOKIE_NAME = "crucible_session";
const scrypt = promisify(scryptCallback);

// JWT_SECRET and APP_PASSWORD must be provided via environment variables.
// There is intentionally NO hardcoded fallback: a fallback that matches
// .env.example would be a publicly known skeleton key for every deployment
// that forgets to set real secrets.
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Environment variable ${name} is required and must be set to a unique, secret value. ` +
        `Refusing to start with an insecure default.`
    );
  }
  return value;
}

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(getRequiredEnv("JWT_SECRET"));
}

function constantTimeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // timingSafeEqual requires equal-length buffers; pad the shorter one so the
  // comparison itself doesn't leak length information via an early throw,
  // while still guaranteeing a mismatch when lengths differ.
  const len = Math.max(bufA.length, bufB.length, 1);
  const paddedA = Buffer.concat([bufA], len);
  const paddedB = Buffer.concat([bufB], len);
  const lengthsMatch = bufA.length === bufB.length;
  return timingSafeEqual(paddedA, paddedB) && lengthsMatch;
}

const SCRYPT_KEYLEN = 64;

/**
 * Hashes a password with scrypt using a random per-user salt.
 * Output format: "scrypt:<saltHex>:<hashHex>" so verification can recover
 * the salt used at hash time (no static/shared salt anywhere).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, SCRYPT_KEYLEN)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

// Legacy format check: the old implementation stored a bare 64-char hex
// SHA-256 digest with no prefix. We detect that shape so existing rows can
// still log in and get transparently upgraded to scrypt (see login route).
function isLegacySha256Hash(stored: string): boolean {
  return /^[a-f0-9]{64}$/i.test(stored);
}

async function legacySha256Hash(password: string, legacySalt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + legacySalt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(inputPassword: string, storedHash?: string): Promise<boolean> {
  if (!storedHash) {
    // No stored hash at all (e.g. corrupted/unmigrated row). There is no
    // shared-password skeleton-key fallback — deny by default.
    return false;
  }

  if (storedHash.startsWith("scrypt:")) {
    const [, saltHex, hashHex] = storedHash.split(":");
    if (!saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, "hex");
    const derivedKey = (await scrypt(inputPassword, salt, SCRYPT_KEYLEN)) as Buffer;
    return constantTimeCompare(derivedKey.toString("hex"), hashHex);
  }

  if (isLegacySha256Hash(storedHash)) {
    // Best-effort compatibility with rows hashed by the old SHA-256 scheme.
    // The legacy scheme salted with JWT_SECRET (or APP_PASSWORD) — still
    // required env vars now, just no longer with an insecure default.
    const legacySalt = process.env.JWT_SECRET || process.env.APP_PASSWORD || "";
    const computed = await legacySha256Hash(inputPassword, legacySalt);
    return constantTimeCompare(computed, storedHash);
  }

  return false;
}

export async function setSessionCookie(
  payload: { userId?: number; email?: string; name?: string } = { name: "Auditor" }
): Promise<string> {
  const token = await new SignJWT({ ...payload, auth: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());

  const cookieStore = await cookies();
  const isVercelHttps = process.env.VERCEL === "1";
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isVercelHttps,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });

  return token;
}

export async function verifySession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return await verifySession(token);
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null && session.auth === true;
}

export async function verifySessionToken(token?: string): Promise<boolean> {
  const session = await verifySession(token);
  return session !== null && session.auth === true;
}
