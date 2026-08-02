import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "crucible_session";
const SESSION_DURATION_HOURS = 24;

export function getAppPassword(): string {
  return process.env.APP_PASSWORD || "crucible2026";
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Safe for Edge Runtime without relying on Node.js modules like crypto.timingSafeEqual.
 */
export function verifyPassword(inputPassword: string): boolean {
  const expected = getAppPassword();
  const a = inputPassword;
  const b = expected;

  let mismatch = a.length === b.length ? 0 : 1;
  const len = Math.max(a.length, b.length);

  for (let i = 0; i < len; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }

  return mismatch === 0;
}

// Generate a signed HMAC token using Web Crypto API
async function getCryptoKey(): Promise<CryptoKey> {
  const secret = getAppPassword();
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

// Web API base64url helper functions safe for Edge Runtime
function base64urlEncode(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binString = "";
  for (let i = 0; i < bytes.length; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(base64url: string): string {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

export async function createSessionToken(): Promise<string> {
  const payload = {
    auth: true,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000,
  };
  const jsonStr = JSON.stringify(payload);
  const base64Payload = base64urlEncode(jsonStr);

  const key = await getCryptoKey();
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(base64Payload)
  );

  const hexSignature = bufferToHex(signatureBuffer);
  return `${base64Payload}.${hexSignature}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [base64Payload, hexSignature] = parts;

  try {
    const key = await getCryptoKey();
    const encoder = new TextEncoder();
    const signatureBuffer = hexToBuffer(hexSignature);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      encoder.encode(base64Payload)
    );

    if (!isValid) return false;

    const jsonStr = base64urlDecode(base64Payload);
    const payload = JSON.parse(jsonStr);

    if (!payload.exp || Date.now() > payload.exp) {
      return false;
    }

    return payload.auth === true;
  } catch (error) {
    console.error("Token verification error:", error);
    return false;
  }
}

export async function setSessionCookie() {
  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_HOURS * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return await verifySessionToken(token);
}
