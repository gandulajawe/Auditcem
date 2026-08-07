// File: src/lib/sanitize.ts
import sanitizeHtml from "sanitize-html";

/**
 * Sanitizes input data to prevent XSS attacks.
 *
 * Uses sanitize-html (a real HTML parser built on htmlparser2) instead of
 * hand-written regexes. Every field sanitized here (finding descriptions,
 * root cause, action plans, etc.) is meant to be plain text, so we configure
 * it to strip ALL tags and attributes — output is text content only, with no
 * HTML surviving at all. This closes bypasses that regex-based stripping is
 * prone to (nested or obfuscated markup, unusual attribute spacing/casing,
 * HTML entity tricks, malformed-but-browser-tolerant tag soup), because
 * sanitize-html actually parses the markup rather than pattern-matching
 * text.
 *
 * Note: we previously used isomorphic-dompurify, but its server-side path
 * depends on jsdom, whose dependency chain (html-encoding-sniffer ->
 * @exodus/bytes) ships a pure-ESM module that Node can't require()
 * regardless of bundler — it crashed every API route that sanitized input
 * when deployed to Vercel. sanitize-html achieves the same "parse and strip
 * everything" behavior without any jsdom/DOM dependency.
 */
export function sanitizeString(input: string, maxLength: number = 2000): string {
  if (typeof input !== "string") return "";

  let sanitized = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  })
    // With no allowed tags/attributes, sanitize-html returns text content
    // only, but we still strip stray null bytes and normalize whitespace
    // defensively.
    .replace(/\0/g, "")
    .trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

export function sanitizeInput(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    return sanitizeString(data);
  }

  if (typeof data === "number" || typeof data === "boolean") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeInput(item));
  }

  if (typeof data === "object") {
    const sanitizedObj: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      sanitizedObj[key] = sanitizeInput(data[key]);
    }
    return sanitizedObj;
  }

  return data;
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  return sanitizeInput(obj) as T;
}