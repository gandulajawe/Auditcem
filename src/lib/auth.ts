// File: src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "crucible_session";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.APP_PASSWORD || "crucible_jwt_secret_key_32_bytes_long";
  return new TextEncoder().encode(secret);
}

function constantTimeCompare(a: string, b: string): boolean {
  let mismatch = a.length === b.length ? 0 : 1;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const secret = process.env.JWT_SECRET || "crucible_secret";
  const data = encoder.encode(password + secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(inputPassword: string, storedHash?: string): Promise<boolean> {
  if (storedHash) {
    const computed = await hashPassword(inputPassword);
    return constantTimeCompare(computed, storedHash);
  }
  const expected = process.env.APP_PASSWORD || "crucible2026";
  return constantTimeCompare(inputPassword, expected);
}

export async function setSessionCookie(
  payload: { userId?: number; email?: string; name?: string; role?: string } = { role: "admin", name: "Auditor" }
): Promise<string> {
  const token = await new SignJWT({ ...payload, auth: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
